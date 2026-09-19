-- 0006: v2 light-stack revision
-- 1) Derived open state: manual_override ?? (now between opens_at and closes_at)
-- 2) Anonymity structural: comments split out of `evaluations` (which carries
--    student_id) into `evaluation_comments` - a table with NO student column,
--    RLS deny-all reads, text reachable only through owner-rights views
--    (faculty, self-scoped) and dean-gated RPCs.
-- 3) Cron sweep deleted: drafts are private, tiny, overwritten on reopen.

-- ── semesters: manual override + derived open state ──────────────────────────

alter table public.semesters add column if not exists manual_override text
  check (manual_override in ('open', 'closed'));

create or replace function public.sem_is_open(s public.semesters)
returns boolean language sql stable as $$
  select case
    when s.manual_override is not null then s.manual_override = 'open'
    when s.opens_at is null or s.closes_at is null then s.is_open  -- legacy rows without a window
    else now() >= s.opens_at and now() <= s.closes_at
  end;
$$;

-- ── identity-free comments ───────────────────────────────────────────────────

create table if not exists public.evaluation_comments (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  section_subject_id uuid not null references public.section_subjects(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  comment text not null,
  sentiment_label public.sentiment_label not null default 'neutral',
  sentiment_score numeric not null default 0,
  submitted_at timestamptz not null default now(),
  constraint evaluation_comments_unique unique (evaluation_id)
);

-- RLS enabled, insert-for-owner only, and NO select policy: nobody reads this
-- table directly. The identity join does not exist to leak.
alter table public.evaluation_comments enable row level security;
drop policy if exists comments_student_insert on public.evaluation_comments;
create policy comments_student_insert on public.evaluation_comments
  for insert to authenticated
  with check (
    exists (select 1 from public.evaluations e
            where e.id = evaluation_id and e.student_id = auth.uid())
  );

-- backfill, then strip the columns (view below is recreated first)
drop view if exists public.faculty_evaluations;  -- column types change -> drop + recreate
create or replace view public.faculty_evaluations as
select e.id,
       e.section_subject_id,
       e.semester_id,
       c.comment,
       c.sentiment_label,
       c.sentiment_score,
       coalesce(c.submitted_at, e.submitted_at) as submitted_at,
       sub.code as subject_code,
       sub.name as subject_name,
       sec.name as section_name
from public.evaluations e
join public.section_subjects ss on ss.id = e.section_subject_id
join public.subjects sub on sub.id = ss.subject_id
join public.sections sec on sec.id = ss.section_id
left join public.evaluation_comments c on c.evaluation_id = e.id
where ss.faculty_id = auth.uid();
grant select on public.faculty_evaluations to authenticated;

insert into public.evaluation_comments
  (evaluation_id, section_subject_id, semester_id, comment, sentiment_label, sentiment_score, submitted_at)
select e.id, e.section_subject_id, e.semester_id, btrim(e.comment),
       coalesce(e.sentiment_label, 'neutral'), coalesce(e.sentiment_score, 0),
       coalesce(e.submitted_at, now())
from public.evaluations e
where e.comment is not null and length(btrim(e.comment)) > 0
on conflict (evaluation_id) do nothing;

alter table public.evaluations
  drop column if exists comment,
  drop column if exists sentiment_label,
  drop column if exists sentiment_score;


-- student dashboard view: openness now derived
create or replace view public.student_evals as
select ss.id as section_subject_id,
       ss.semester_id,
       sub.code as subject_code,
       sub.name as subject_name,
       sec.name as section_name,
       sec.year_level,
       p.full_name as faculty_name,
       public.sem_is_open(s) as is_open,
       s.closes_at,
       e.id as evaluation_id
from public.enrollments en
join public.section_subjects ss on ss.id = en.section_subject_id
join public.subjects sub on sub.id = ss.subject_id
join public.sections sec on sec.id = ss.section_id
join public.profiles p on p.id = ss.faculty_id
join public.semesters s on s.id = ss.semester_id
left join public.evaluations e on e.enrollment_id = en.id
where en.student_id = auth.uid();
grant select on public.student_evals to authenticated;

-- labels-only projection (no text, no identity) for dean aggregates
create or replace view public.comment_labels as
select c.evaluation_id, c.section_subject_id, c.semester_id, c.sentiment_label
from public.evaluation_comments c;

-- ── rpc_submit_evaluation: derived period check + comment into its own table ──

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

  insert into public.evaluations (
    enrollment_id, student_id, section_subject_id, semester_id,
    anonymous, signature_points, payload_hash
  ) values (
    v_enrollment.id, auth.uid(), p_section_subject_id, v_semester.id,
    p_anonymous, p_signature, nullif(p_payload_hash, '')
  )
  returning * into v_eval;

  -- comment lives apart from identity: this table has no student column,
  -- so no join can ever leak who wrote it
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

-- ── dean/admin comment reads: gated, identity-free ──────────────────────────

create or replace function public.rpc_sentiment_report(p_semester_id uuid default null)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  with sid as (
    select coalesce(p_semester_id, (select id from public.semesters where is_current limit 1)) as id
  ),
  c as (
    select cm.comment, cm.sentiment_label, cm.sentiment_score, cm.submitted_at,
           p.full_name as faculty_name, sub.code as subject_code
    from public.evaluation_comments cm
    join public.section_subjects ss on ss.id = cm.section_subject_id
    join public.subjects sub on sub.id = ss.subject_id
    join public.profiles p on p.id = ss.faculty_id
    cross join sid
    where cm.semester_id = sid.id
  )
  select case
    when exists (select 1 from public.profiles pr
                 where pr.id = auth.uid() and pr.role in ('dean', 'admin')) then
      jsonb_build_object(
        'counts', (select jsonb_build_object(
            'positive', count(*) filter (where sentiment_label = 'positive'),
            'neutral',  count(*) filter (where sentiment_label = 'neutral'),
            'negative', count(*) filter (where sentiment_label = 'negative')
          ) from c),
        'comments', (select coalesce(jsonb_agg(row_to_json(t) order by t.submitted_at desc), '[]'::jsonb) from (
          select comment, sentiment_label as label, sentiment_score,
                 faculty_name, subject_code, submitted_at
          from c
        ) t)
      )
    else jsonb_build_object(
      'counts', jsonb_build_object('positive', 0, 'neutral', 0, 'negative', 0),
      'comments', '[]'::jsonb)
  end;
$$;
revoke execute on function public.rpc_sentiment_report(uuid) from public, anon;
grant execute on function public.rpc_sentiment_report(uuid) to authenticated;

-- history drill-down: definer + explicit dean/admin gate (was RLS-scoped)
create or replace function public.rpc_history(
  p_academic_year text default null,
  p_term public.semester_term default null,
  p_subject_id uuid default null,
  p_faculty_id uuid default null
)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select case
    when exists (select 1 from public.profiles pr
                 where pr.id = auth.uid() and pr.role in ('dean', 'admin')) then (
    select case
      when p_academic_year is null then (
        select coalesce(jsonb_agg(row_to_json(t) order by t.academic_year desc), '[]'::jsonb) from (
          select s.academic_year,
                 count(distinct e.id)::int as evals,
                 round(avg(a.rating)::numeric, 2)::float8 as avg_rating
          from public.semesters s
          left join public.evaluations e on e.semester_id = s.id
          left join public.evaluation_answers a on a.evaluation_id = e.id
          group by s.academic_year
        ) t)
      when p_term is null then (
        select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
          select s.id as semester_id, s.term,
                 count(distinct e.id)::int as evals,
                 round(avg(a.rating)::numeric, 2)::float8 as avg_rating
          from public.semesters s
          left join public.evaluations e on e.semester_id = s.id
          left join public.evaluation_answers a on a.evaluation_id = e.id
          where s.academic_year = p_academic_year
          group by s.id, s.term
        ) t)
      when p_subject_id is null then (
        select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
          select sub.id as subject_id, sub.code, sub.name,
                 count(distinct e.id)::int as evals,
                 round(avg(a.rating)::numeric, 2)::float8 as avg_rating
          from public.section_subjects ss
          join public.subjects sub on sub.id = ss.subject_id
          join public.semesters s on s.id = ss.semester_id
          left join public.evaluations e on e.section_subject_id = ss.id
          left join public.evaluation_answers a on a.evaluation_id = e.id
          where s.academic_year = p_academic_year and s.term = p_term
          group by sub.id, sub.code, sub.name
        ) t)
      when p_faculty_id is null then (
        select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
          select p.id as faculty_id, p.full_name, ss.id as section_subject_id,
                 sub.code, sec.name as section_name,
                 count(distinct e.id)::int as evals,
                 round(avg(a.rating)::numeric, 2)::float8 as avg_rating
          from public.section_subjects ss
          join public.subjects sub on sub.id = ss.subject_id
          join public.sections sec on sec.id = ss.section_id
          join public.profiles p on p.id = ss.faculty_id
          join public.semesters s on s.id = ss.semester_id
          left join public.evaluations e on e.section_subject_id = ss.id
          left join public.evaluation_answers a on a.evaluation_id = e.id
          where s.academic_year = p_academic_year and s.term = p_term
            and ss.subject_id = p_subject_id
          group by p.id, p.full_name, ss.id, sub.code, sec.name
        ) t)
      else (
        select jsonb_build_object(
          'per_question', (select coalesce(jsonb_agg(row_to_json(t) order by t.sort_order), '[]'::jsonb) from (
            select q.text, q.category, q.sort_order,
                   round(avg(a.rating)::numeric, 2)::float8 as avg_rating
            from public.evaluations e
            join public.evaluation_answers a on a.evaluation_id = e.id
            join public.questions q on q.id = a.question_id
            join public.section_subjects ss on ss.id = e.section_subject_id
            join public.semesters s on s.id = ss.semester_id
            where s.academic_year = p_academic_year and s.term = p_term
              and (p_subject_id is null or ss.subject_id = p_subject_id)
              and ss.faculty_id = p_faculty_id
            group by q.id
          ) t),
          'comments', (select coalesce(jsonb_agg(row_to_json(t) order by t.at desc), '[]'::jsonb) from (
            select c.comment, c.sentiment_label as label, c.submitted_at as at
            from public.evaluation_comments c
            join public.section_subjects ss on ss.id = c.section_subject_id
            join public.semesters s on s.id = c.semester_id
            where s.academic_year = p_academic_year and s.term = p_term
              and (p_subject_id is null or ss.subject_id = p_subject_id)
              and ss.faculty_id = p_faculty_id
          ) t)
        )
      )
    end)
    else '{}'::jsonb
  end;
$$;
revoke execute on function public.rpc_history(text, public.semester_term, uuid, uuid) from public, anon;
grant execute on function public.rpc_history(text, public.semester_term, uuid, uuid) to authenticated;

-- ── dean aggregates read the label-only view (no text, no identity) ──────────

create or replace function public.rpc_dean_overview(p_semester_id uuid default null)
returns jsonb language sql stable as $$
  with sid as (
    select coalesce(p_semester_id, (select id from public.semesters where is_current limit 1)) as id
  )
  select jsonb_build_object(
    'semester', (select to_jsonb(s) from public.semesters s cross join sid where s.id = sid.id),
    'participation', (select jsonb_build_object(
        'enrolled', (select count(distinct en.student_id)::int
                     from public.enrollments en
                     join public.section_subjects ss on ss.id = en.section_subject_id
                     cross join sid where ss.semester_id = sid.id),
        'submitted', (select count(distinct e.student_id)::int
                      from public.evaluations e cross join sid where e.semester_id = sid.id),
        'total_evals', (select count(*)::int
                        from public.evaluations e cross join sid where e.semester_id = sid.id)
      )),
    'faculty', (select coalesce(jsonb_agg(row_to_json(t) order by t.overall desc nulls last), '[]'::jsonb) from (
      select p.id, p.full_name,
             count(distinct ss.id)::int as loads,
             count(distinct e.id)::int as evals,
             round(avg(a.rating)::numeric, 2)::float8 as overall
      from public.profiles p
      cross join sid
      left join public.section_subjects ss on ss.faculty_id = p.id and ss.semester_id = sid.id
      left join public.evaluations e on e.section_subject_id = ss.id
      left join public.evaluation_answers a on a.evaluation_id = e.id
      where p.role = 'faculty'
      group by p.id, p.full_name
    ) t),
    'sentiment', (select jsonb_build_object(
        'positive', count(*) filter (where sentiment_label = 'positive'),
        'neutral',  count(*) filter (where sentiment_label = 'neutral'),
        'negative', count(*) filter (where sentiment_label = 'negative')
      ) from public.comment_labels l cross join sid where l.semester_id = sid.id),
    'per_criterion', (select coalesce(jsonb_agg(row_to_json(t) order by t.category), '[]'::jsonb) from (
      select q.category, round(avg(a.rating)::numeric, 2)::float8 as avg_rating
      from public.evaluations e
      join public.evaluation_answers a on a.evaluation_id = e.id
      join public.questions q on q.id = a.question_id
      cross join sid
      where e.semester_id = sid.id
      group by q.category
    ) t)
  );
$$;

create or replace function public.rpc_semester_trend()
returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(row_to_json(t) order by t.academic_year, t.term), '[]'::jsonb) from (
    select s.id as semester_id, s.academic_year, s.term, s.is_current,
           (select count(*)::int from public.evaluations e where e.semester_id = s.id) as evals,
           (select round(avg(a.rating)::numeric, 2)::float8
              from public.evaluations e
              join public.evaluation_answers a on a.evaluation_id = e.id
              where e.semester_id = s.id) as avg_rating,
           (select count(*)::int from public.comment_labels l
              where l.semester_id = s.id and l.sentiment_label = 'positive') as positive,
           (select count(*)::int from public.comment_labels l
              where l.semester_id = s.id and l.sentiment_label = 'neutral') as neutral,
           (select count(*)::int from public.comment_labels l
              where l.semester_id = s.id and l.sentiment_label = 'negative') as negative
    from public.semesters s
  ) t;
$$;

-- ── cron sweep deleted (decision 2: stale drafts are ignored, not swept) ─────
drop function if exists public.rpc_clear_stale_drafts();




revoke all on public.comment_labels from anon;
grant select on public.comment_labels to authenticated;
