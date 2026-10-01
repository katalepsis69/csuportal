-- 0007: authorization hardening (2026-09-30 audit register)
--
-- 1) profiles: column-scoped UPDATE (kills self-promotion via role column)
-- 2) handle_new_user: signup metadata no longer decides roles (hardcode student)
-- 3) evaluation_comments insert: bind section/semester to the evaluation row
-- 4) evaluation_answers insert: evaluation window must still be open
-- 5) rpc_submit_evaluation: reject invalid/duplicate answers outright instead of
--    silently dropping them; cap signature payload size
-- 6) semesters: partial unique index so two rows can never both be is_current
-- 7) rpc_receipt_for: narrow SECURITY DEFINER read for the public verify page,
--    so that route no longer needs the service-role key
-- 8) admin_audit: minimal audit trail for admin mutations

-- ── 1. profiles column scoping ──────────────────────────────────────────────
-- Row policies (id = auth.uid()) also allowed writing the role column.
-- Staff promotion is now explicit operator SQL:
--   update public.profiles set role = 'faculty' where id = '<uuid>';
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- ── 2. signup cannot mint staff roles ───────────────────────────────────────
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, student_no)
  values (
    new.id,
    'student',
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    nullif(new.raw_user_meta_data->>'student_no', '')
  );
  return new;
end $$;

-- ── 3. comments: attribution bound to the evaluation ────────────────────────
drop policy if exists comments_student_insert on public.evaluation_comments;
create policy comments_student_insert on public.evaluation_comments
  for insert to authenticated
  with check (
    exists (
      select 1 from public.evaluations e
      where e.id = evaluation_comments.evaluation_id
        and e.student_id = (select auth.uid())
        and e.section_subject_id = evaluation_comments.section_subject_id
        and e.semester_id = evaluation_comments.semester_id
    )
  );

-- ── 4. answers: the evaluation window must still be open ────────────────────
drop policy if exists answers_student_insert on public.evaluation_answers;
create policy answers_student_insert on public.evaluation_answers
  for insert to authenticated
  with check (
    exists (
      select 1 from public.evaluations e
      join public.section_subjects ss on ss.id = e.section_subject_id
      join public.semesters s on s.id = e.semester_id
      where e.id = evaluation_answers.evaluation_id
        and e.student_id = (select auth.uid())
        and public.sem_is_open(s)
    )
  );

-- ── 5. submit rpc: strict answers + signature cap ───────────────────────────
create or replace function public.rpc_submit_evaluation(
  p_section_subject_id uuid,
  p_anonymous boolean,
  p_comment text,
  p_sentiment public.sentiment_label,
  p_sentiment_score numeric,
  p_signature jsonb,
  p_answers jsonb,
  p_payload_hash text default null
)
returns jsonb
language plpgsql volatile set search_path = ''
as $$
declare
  v_enrollment public.enrollments;
  v_semester public.semesters;
  v_eval public.evaluations;
  v_count int;
begin
  -- ponytail: 64KB jsonb ceiling; the zod boundary caps strokes at 200, this
  -- guards the direct-API path. Raise if legitimate signatures ever need more.
  if pg_column_size(p_signature) > 65536 then
    return jsonb_build_object('ok', false, 'error', 'signature_too_large');
  end if;

  if length(coalesce(p_comment, '')) > 2000 then
    return jsonb_build_object('ok', false, 'error', 'comment_too_long');
  end if;

  select * into v_enrollment
  from public.enrollments
  where student_id = auth.uid() and section_subject_id = p_section_subject_id;

  if v_enrollment.id is null then
    return jsonb_build_object('ok', false, 'error', 'not_enrolled');
  end if;

  select s.* into v_semester
  from public.semesters s
  join public.section_subjects ss on ss.semester_id = s.id
  where ss.id = p_section_subject_id;

  if v_semester.id is null or not public.sem_is_open(v_semester) then
    return jsonb_build_object('ok', false, 'error', 'period_closed');
  end if;

  select count(*) into v_count
  from public.evaluations
  where student_id = auth.uid() and section_subject_id = p_section_subject_id;

  if v_count > 0 then
    return jsonb_build_object('ok', false, 'error', 'already_submitted');
  end if;

  -- strict answers: reject instead of silently dropping (audit P17)
  if exists (
    select 1 from jsonb_array_elements(p_answers) a
    where not coalesce(a->>'rating', '') ~ '^[1-5]$'
       or not exists (
            select 1 from public.questions q
            where q.id = (a->>'question_id')::uuid and q.active
          )
  ) then
    return jsonb_build_object('ok', false, 'error', 'invalid_answers');
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_answers) a
    group by a->>'question_id'
    having count(*) > 1
  ) then
    return jsonb_build_object('ok', false, 'error', 'duplicate_answers');
  end if;

  insert into public.evaluations (
    enrollment_id, student_id, section_subject_id, semester_id,
    anonymous, signature_points, payload_hash
  ) values (
    v_enrollment.id, auth.uid(), p_section_subject_id, v_semester.id,
    p_anonymous, p_signature, nullif(p_payload_hash, '')
  )
  returning * into v_eval;

  if nullif(btrim(coalesce(p_comment, '')), '') is not null then
    insert into public.evaluation_comments
      (evaluation_id, section_subject_id, semester_id, comment,
       sentiment_label, sentiment_score, submitted_at)
    values
      (v_eval.id, p_section_subject_id, v_semester.id, btrim(p_comment),
       coalesce(p_sentiment, 'neutral'), coalesce(p_sentiment_score, 0), now());
  end if;

  insert into public.evaluation_answers (evaluation_id, question_id, rating)
  select v_eval.id,
         (a->>'question_id')::uuid,
         (a->>'rating')::int
  from jsonb_array_elements(p_answers) a;

  if not exists (select 1 from public.evaluation_answers where evaluation_id = v_eval.id) then
    raise exception 'no valid answers';
  end if;

  delete from public.drafts
  where student_id = auth.uid() and section_subject_id = p_section_subject_id;

  return jsonb_build_object('ok', true, 'evaluation_id', v_eval.id);
end $$;
grant execute on function public.rpc_submit_evaluation(uuid, boolean, text, public.sentiment_label, numeric, jsonb, jsonb, text) to authenticated;

-- ── 6. one current semester, enforced ───────────────────────────────────────
-- De-dupe first (keep the row the dashboard would have picked), then enforce.
with ranked as (
  select id, row_number() over (order by academic_year desc, term desc) as rn
  from public.semesters
  where is_current
)
update public.semesters s
set is_current = false
from ranked r
where s.id = r.id and r.rn > 1;

create unique index if not exists semesters_one_current_idx
  on public.semesters (is_current)
  where is_current;

-- ── 7. narrow public receipt lookup (verify page drops service-role) ───────
create or replace function public.rpc_receipt_for(p_evaluation_id uuid)
returns table (
  id uuid,
  payload_hash text,
  submitted_at timestamptz,
  section_subject_id uuid,
  semester_id uuid
)
language sql stable security definer set search_path = ''
as $$
  select e.id, e.payload_hash, e.submitted_at, e.section_subject_id, e.semester_id
  from public.evaluations e
  where e.id = p_evaluation_id
$$;
revoke execute on function public.rpc_receipt_for(uuid) from service_role;
grant execute on function public.rpc_receipt_for(uuid) to anon, authenticated;

-- ── 8. admin audit trail ────────────────────────────────────────────────────
create table if not exists public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null default auth.uid(),
  action text not null,
  details jsonb not null default '{}',
  error text,
  created_at timestamptz not null default now()
);

alter table public.admin_audit enable row level security;
revoke all on public.admin_audit from anon;

create policy admin_audit_insert on public.admin_audit
  for insert to authenticated
  with check ((select private.current_role()) = 'admin');
create policy admin_audit_select on public.admin_audit
  for select to authenticated
  using ((select private.current_role()) = 'admin');

create index if not exists admin_audit_created_at_idx
  on public.admin_audit (created_at desc);
