-- 0002: fix answers_faculty_select policy
-- Postgres applies the inner table's RLS inside policy subqueries, and faculty
-- have (by design) no direct select on evaluations — so the original policy's
-- `exists (select 1 from evaluations ...)` always returned false for faculty.
-- Standard fix: SECURITY DEFINER ownership check (runs as table owner, keeps
-- auth.uid() semantics).

create or replace function public.is_faculty_of_eval(p_eval_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.evaluations e
    join public.section_subjects ss on ss.id = e.section_subject_id
    where e.id = p_eval_id and ss.faculty_id = auth.uid()
  )
$$;

grant execute on function public.is_faculty_of_eval(uuid) to authenticated;

drop policy if exists answers_faculty_select on public.evaluation_answers;
create policy answers_faculty_select on public.evaluation_answers
  for select to authenticated
  using (public.is_faculty_of_eval(evaluation_answers.evaluation_id));
