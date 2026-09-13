-- 0004: drafts + evaluation payload hash (CETC-LSC rebrand feature pass)
--
-- Security self-review (per MASTER.md gate):
--  * drafts RLS: student-only, all ops, cached auth.uid()
--  * rpc_save_draft: enrollment check + comment ≤2000 + answers ≤20k chars
--  * rpc_submit_evaluation: unchanged checks + stores client payload_hash
--    (integrity marker, not a security control) + clears the draft
--  * rpc_clear_stale_drafts: security definer, cron-only (service role)

create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  section_subject_id uuid not null references public.section_subjects(id) on delete cascade,
  answers jsonb not null default '[]',
  comment text,
  anonymous boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (student_id, section_subject_id)
);

alter table public.drafts enable row level security;
revoke all on public.drafts from anon;

drop policy if exists drafts_student_all on public.drafts;
create policy drafts_student_all on public.drafts
  for all to authenticated
  using (student_id = (select auth.uid()))
  with check (student_id = (select auth.uid()));

create index if not exists drafts_student_id_idx on public.drafts (student_id);

alter table public.evaluations add column if not exists payload_hash text;

create or replace function public.rpc_save_draft(
  p_section_subject_id uuid,
  p_answers jsonb,
  p_comment text,
  p_anonymous boolean
)
returns jsonb
language plpgsql volatile set search_path = ''
as $$
begin
  if length(coalesce(p_comment, '')) > 2000 then
    return jsonb_build_object('ok', false, 'error', 'comment_too_long');
  end if;
  if length(coalesce(p_answers, '[]'::jsonb)::text) > 20000 then
    return jsonb_build_object('ok', false, 'error', 'payload_too_large');
  end if;
  if not exists (select 1 from public.enrollments e
                 where e.student_id = auth.uid()
                   and e.section_subject_id = p_section_subject_id) then
    return jsonb_build_object('ok', false, 'error', 'not_enrolled');
  end if;

  insert into public.drafts (student_id, section_subject_id, answers, comment, anonymous)
  values (auth.uid(), p_section_subject_id, coalesce(p_answers, '[]'::jsonb),
          p_comment, coalesce(p_anonymous, true))
  on conflict (student_id, section_subject_id)
  do update set answers = excluded.answers, comment = excluded.comment,
                anonymous = excluded.anonymous, updated_at = now();

  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.rpc_save_draft(uuid, jsonb, text, boolean) to authenticated;

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
  if length(p_comment) > 2000 then
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

  if v_semester.id is null or not v_semester.is_open
     or v_semester.closes_at is null or now() > v_semester.closes_at then
    return jsonb_build_object('ok', false, 'error', 'period_closed');
  end if;

  select count(*) into v_count
  from public.evaluations
  where student_id = auth.uid() and section_subject_id = p_section_subject_id;

  if v_count > 0 then
    return jsonb_build_object('ok', false, 'error', 'already_submitted');
  end if;

  insert into public.evaluations (
    enrollment_id, student_id, section_subject_id, semester_id,
    anonymous, comment, sentiment_label, sentiment_score, signature_points,
    payload_hash
  ) values (
    v_enrollment.id, auth.uid(), p_section_subject_id, v_semester.id,
    p_anonymous, nullif(trim(p_comment), ''),
    coalesce(p_sentiment, 'neutral'), coalesce(p_sentiment_score, 0), p_signature,
    nullif(p_payload_hash, '')
  )
  returning * into v_eval;

  insert into public.evaluation_answers (evaluation_id, question_id, rating)
  select v_eval.id,
         (a->>'question_id')::uuid,
         (a->>'rating')::int
  from jsonb_array_elements(p_answers) a
  where (a->>'rating')::int between 1 and 5
    and exists (select 1 from public.questions q
                where q.id = (a->>'question_id')::uuid and q.active);

  if not exists (select 1 from public.evaluation_answers where evaluation_id = v_eval.id) then
    raise exception 'no valid answers';
  end if;

  delete from public.drafts
  where student_id = auth.uid() and section_subject_id = p_section_subject_id;

  return jsonb_build_object('ok', true, 'evaluation_id', v_eval.id);
end $$;
grant execute on function public.rpc_submit_evaluation(uuid, boolean, text, public.sentiment_label, numeric, jsonb, jsonb, text) to authenticated;

-- cron: remove drafts whose eval period has closed (service-role only)
create or replace function public.rpc_clear_stale_drafts()
returns jsonb
language sql volatile security definer set search_path = ''
as $$
  with closed as (
    select ss.id
    from public.section_subjects ss
    join public.semesters s on s.id = ss.semester_id
    where not s.is_open or s.closes_at is null or s.closes_at < now()
  ),
  del as (
    delete from public.drafts d using closed c
    where d.section_subject_id = c.id
    returning 1
  )
  select jsonb_build_object('deleted', (select count(*) from del));
$$;
grant execute on function public.rpc_clear_stale_drafts() to service_role;
revoke execute on function public.rpc_clear_stale_drafts() from authenticated, anon;
