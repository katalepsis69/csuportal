-- 0007: production hardening
-- 1) rpc_receipt_for: the public /verify route must not need the service-role
--    key. One SECURITY DEFINER function, four non-identifying columns, nothing else.
-- 2) semesters: exactly one current semester, enforced by the DB, not by two
--    sequential admin updates.
-- 3) evaluation_comments FK columns had no indexes (Postgres does not index FKs).

-- ── public receipt read ──────────────────────────────────────────────────────

create or replace function public.rpc_receipt_for(p_evaluation_id uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'evaluation_id',      e.id,
    'payload_hash',       e.payload_hash,
    'submitted_at',       e.submitted_at,
    'section_subject_id', e.section_subject_id,
    'semester_id',        e.semester_id
  )
  from public.evaluations e
  where e.id = p_evaluation_id;
$$;

-- Never callable by public/granted roles outside the two we need, and the
-- return shape is fixed to these five columns: no student id, no comment text.
revoke all on function public.rpc_receipt_for(uuid) from public;
grant execute on function public.rpc_receipt_for(uuid) to anon, authenticated;

-- ── one current semester ─────────────────────────────────────────────────────

create unique index if not exists semesters_single_current
  on public.semesters (is_current)
  where is_current;

-- ── missing indexes ──────────────────────────────────────────────────────────

create index if not exists evaluation_comments_section_subject_id_idx
  on public.evaluation_comments (section_subject_id);
create index if not exists evaluation_comments_semester_id_idx
  on public.evaluation_comments (semester_id);

-- ── rpc_history branch order ─────────────────────────────────────────────────
-- 0006 tested p_subject_id before p_faculty_id, so a call that asked for a
-- faculty's detail while leaving subject null got the SUBJECT LIST instead.
-- Detail now wins when a faculty is named; subject stays an optional filter.

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
      when p_faculty_id is not null then (
        select jsonb_build_object(
          'per_question', (select coalesce(jsonb_agg(row_to_json(t) order by t.sort_order), '[]'::jsonb) from (
            select q.text, q.category, q.sort_order,
                   round(avg(a.rating)::numeric, 2)::float8 as avg_rating,
                   count(a.id)::int as responses
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
      else (
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
    end)
    else '{}'::jsonb
  end;
$$;
revoke all on function public.rpc_history(text, public.semester_term, uuid, uuid) from public, anon;
grant execute on function public.rpc_history(text, public.semester_term, uuid, uuid) to authenticated;


-- ── student dashboard exposes the evaluation id ──────────────────────────────
-- The receipt page is keyed by evaluation id; without it a student cannot open
-- a receipt for a submission once the post-submit redirect has passed.

create or replace function public.rpc_student_dashboard()
returns jsonb language sql stable set search_path = '' as $$
  with cur as (
    select * from public.semesters where is_current
    order by academic_year desc, term desc limit 1
  )
  select jsonb_build_object(
    'current_semester', (select to_jsonb(cur) from cur),
    'subjects', (select coalesce(jsonb_agg(row_to_json(t) order by t.subject_code), '[]'::jsonb) from (
      select v.section_subject_id, v.subject_code, v.subject_name, v.section_name,
             v.faculty_name, v.is_open, v.closes_at, v.evaluation_id,
             v.evaluation_id is not null as completed
      from public.student_evals v cross join cur
      where v.semester_id = cur.id
    ) t),
    'past', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
      select v.semester_id, s.academic_year, s.term,
             count(*) filter (where v.evaluation_id is not null) as completed,
             count(*) as total
      from public.student_evals v
      join public.semesters s on s.id = v.semester_id
      cross join cur
      where v.semester_id <> cur.id
      group by v.semester_id, s.academic_year, s.term
    ) t)
  );
$$;
