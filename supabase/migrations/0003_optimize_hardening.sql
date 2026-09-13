-- 0003: performance + security hardening (supabase-postgres-best-practices audit)
--
-- 1. FK + RLS-column indexes (Postgres does NOT auto-index FK columns)
-- 2. Policies rewritten with (select auth.uid()) — cached once per statement
--    instead of once per row
-- 3. Security-definer helpers moved to a private schema (not exposed via
--    PostgREST), search_path pinned to '', bodies fully qualified
-- 4. rpc_submit_evaluation: comment length guard
--
-- Order matters: policies depending on the helpers are dropped FIRST,
-- helpers are then moved, then everything is recreated.
--
-- NOTE: `force row level security` is deliberately NOT applied — the pg_dump
-- backup workflow connects as the table owner, and forcing RLS would deny it.

-- ═══ 1. drop helper-dependent policies ══════════════════════════

drop policy if exists profiles_update_admin on public.profiles;
drop policy if exists programs_admin on public.programs;
drop policy if exists sections_admin on public.sections;
drop policy if exists semesters_admin on public.semesters;
drop policy if exists subjects_admin on public.subjects;
drop policy if exists questions_admin on public.questions;
drop policy if exists section_subjects_admin on public.section_subjects;
drop policy if exists enrollments_dean on public.enrollments;
drop policy if exists enrollments_admin on public.enrollments;
drop policy if exists evaluations_dean_select on public.evaluations;
drop policy if exists answers_faculty_select on public.evaluation_answers;
drop policy if exists answers_dean_select on public.evaluation_answers;

-- ═══ 2. private schema + hardened helpers ═══════════════════════

create schema if not exists private;
revoke create on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.current_role()
returns public.role
language sql stable security definer set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;
grant execute on function private.current_role() to authenticated;

create or replace function private.is_faculty_of_eval(p_eval_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.evaluations e
    join public.section_subjects ss on ss.id = e.section_subject_id
    where e.id = p_eval_id and ss.faculty_id = (select auth.uid())
  )
$$;
grant execute on function private.is_faculty_of_eval(uuid) to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, student_no)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.role, 'student'),
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    nullif(new.raw_user_meta_data->>'student_no', '')
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

drop function if exists public.current_role();
drop function if exists public.is_faculty_of_eval(uuid);
drop function if exists public.handle_new_user();

-- ═══ 3. recreate dropped policies with cached auth.uid() ════════

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using ((select private.current_role()) = 'admin')
  with check ((select private.current_role()) = 'admin');

create policy programs_admin on public.programs for all to authenticated
  using ((select private.current_role()) = 'admin')
  with check ((select private.current_role()) = 'admin');

create policy sections_admin on public.sections for all to authenticated
  using ((select private.current_role()) = 'admin')
  with check ((select private.current_role()) = 'admin');

create policy semesters_admin on public.semesters for all to authenticated
  using ((select private.current_role()) = 'admin')
  with check ((select private.current_role()) = 'admin');

create policy subjects_admin on public.subjects for all to authenticated
  using ((select private.current_role()) = 'admin')
  with check ((select private.current_role()) = 'admin');

create policy questions_admin on public.questions for all to authenticated
  using ((select private.current_role()) = 'admin')
  with check ((select private.current_role()) = 'admin');

create policy section_subjects_admin on public.section_subjects for all to authenticated
  using ((select private.current_role()) = 'admin')
  with check ((select private.current_role()) = 'admin');

create policy enrollments_dean on public.enrollments
  for select to authenticated using ((select private.current_role()) in ('dean', 'admin'));
create policy enrollments_admin on public.enrollments
  for all to authenticated
  using ((select private.current_role()) = 'admin')
  with check ((select private.current_role()) = 'admin');

create policy evaluations_dean_select on public.evaluations
  for select to authenticated using ((select private.current_role()) in ('dean', 'admin'));

create policy answers_faculty_select on public.evaluation_answers
  for select to authenticated
  using ((select private.is_faculty_of_eval(evaluation_answers.evaluation_id)));
create policy answers_dean_select on public.evaluation_answers
  for select to authenticated using ((select private.current_role()) in ('dean', 'admin'));

-- ═══ 4. rewrite remaining policies with cached auth.uid() ═══════

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists enrollments_student on public.enrollments;
drop policy if exists enrollments_faculty on public.enrollments;
create policy enrollments_student on public.enrollments
  for select to authenticated using (student_id = (select auth.uid()));
create policy enrollments_faculty on public.enrollments
  for select to authenticated using (
    exists (select 1 from public.section_subjects ss
            where ss.id = enrollments.section_subject_id
              and ss.faculty_id = (select auth.uid()))
  );

drop policy if exists evaluations_student_select on public.evaluations;
drop policy if exists evaluations_student_insert on public.evaluations;
create policy evaluations_student_select on public.evaluations
  for select to authenticated using (student_id = (select auth.uid()));
create policy evaluations_student_insert on public.evaluations
  for insert to authenticated with check (
    student_id = (select auth.uid())
    and exists (select 1 from public.enrollments e
                where e.id = enrollment_id and e.student_id = (select auth.uid()))
  );

drop policy if exists answers_student_select on public.evaluation_answers;
drop policy if exists answers_student_insert on public.evaluation_answers;
create policy answers_student_select on public.evaluation_answers
  for select to authenticated using (
    exists (select 1 from public.evaluations e
            where e.id = evaluation_answers.evaluation_id
              and e.student_id = (select auth.uid()))
  );
create policy answers_student_insert on public.evaluation_answers
  for insert to authenticated with check (
    exists (select 1 from public.evaluations e
            where e.id = evaluation_id and e.student_id = (select auth.uid()))
  );

-- ═══ 5. indexes (FK columns + RLS filter columns) ═══════════════

create index if not exists enrollments_section_subject_id_idx
  on public.enrollments (section_subject_id);
create index if not exists evaluations_semester_id_idx
  on public.evaluations (semester_id);
create index if not exists evaluations_section_subject_id_idx
  on public.evaluations (section_subject_id);
create index if not exists section_subjects_semester_id_idx
  on public.section_subjects (semester_id);
create index if not exists section_subjects_faculty_id_idx
  on public.section_subjects (faculty_id);
create index if not exists section_subjects_section_id_idx
  on public.section_subjects (section_id);
create index if not exists section_subjects_subject_id_idx
  on public.section_subjects (subject_id);
create index if not exists sections_program_id_idx
  on public.sections (program_id);
create index if not exists profiles_program_id_idx
  on public.profiles (program_id);
create index if not exists questions_active_sort_idx
  on public.questions (sort_order) where active;

-- ═══ 6. pin search_path on rpc functions (bodies fully qualified) ══

alter function public.rpc_student_dashboard() set search_path = '';
alter function public.rpc_faculty_overview(uuid) set search_path = '';
alter function public.rpc_dean_overview(uuid) set search_path = '';
alter function public.rpc_history(text, public.semester_term, uuid, uuid) set search_path = '';
alter function public.rpc_semester_trend() set search_path = '';
alter function public.rpc_sentiment_report(uuid) set search_path = '';

-- comment length guard on submit
create or replace function public.rpc_submit_evaluation(
  p_section_subject_id uuid,
  p_anonymous boolean,
  p_comment text,
  p_sentiment public.sentiment_label,
  p_sentiment_score numeric,
  p_signature jsonb,
  p_answers jsonb
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
    anonymous, comment, sentiment_label, sentiment_score, signature_points
  ) values (
    v_enrollment.id, auth.uid(), p_section_subject_id, v_semester.id,
    p_anonymous, nullif(trim(p_comment), ''),
    coalesce(p_sentiment, 'neutral'), coalesce(p_sentiment_score, 0), p_signature
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

  return jsonb_build_object('ok', true, 'evaluation_id', v_eval.id);
end $$;
grant execute on function public.rpc_submit_evaluation(uuid, boolean, text, public.sentiment_label, numeric, jsonb, jsonb) to authenticated;
