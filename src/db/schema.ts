import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'dean', 'faculty', 'student']);
export const termEnum = pgEnum('semester_term', ['1st', '2nd', 'midyear']);
export const sentimentEnum = pgEnum('sentiment_label', ['positive', 'neutral', 'negative']);

export const programs = pgTable('programs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
});

export const sections = pgTable(
  'sections',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id),
    yearLevel: integer('year_level').notNull(),
    name: text('name').notNull(),
  },
  (t) => [unique('sections_unique').on(t.programId, t.yearLevel, t.name)],
);

export const semesters = pgTable(
  'semesters',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    academicYear: text('academic_year').notNull(),
    term: termEnum('term').notNull(),
    isCurrent: boolean('is_current').notNull().default(false),
    isOpen: boolean('is_open').notNull().default(false),
    opensAt: timestamp('opens_at', { withTimezone: true }),
    closesAt: timestamp('closes_at', { withTimezone: true }),
  },
  (t) => [unique('semesters_unique').on(t.academicYear, t.term)],
);

export const subjects = pgTable('subjects', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
});

/** One row per auth user. Created by the handle_new_user() trigger on signup. */
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // = auth.users.id (FK enforced by trigger flow, not in schema)
  role: roleEnum('role').notNull().default('student'),
  fullName: text('full_name').notNull().default(''),
  studentNo: text('student_no').unique(),
  programId: uuid('program_id').references(() => programs.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  text: text('text').notNull(),
  category: text('category').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

/** Faculty assigned to teach a subject in a section for a semester. */
export const sectionSubjects = pgTable(
  'section_subjects',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sections.id),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id),
    semesterId: uuid('semester_id')
      .notNull()
      .references(() => semesters.id),
    facultyId: uuid('faculty_id')
      .notNull()
      .references(() => profiles.id),
  },
  (t) => [unique('section_subjects_unique').on(t.sectionId, t.subjectId, t.semesterId)],
);

export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    studentId: uuid('student_id')
      .notNull()
      .references(() => profiles.id),
    sectionSubjectId: uuid('section_subject_id')
      .notNull()
      .references(() => sectionSubjects.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('enrollments_unique').on(t.studentId, t.sectionSubjectId)],
);

export const evaluations = pgTable(
  'evaluations',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => enrollments.id)
      .unique(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => profiles.id),
    sectionSubjectId: uuid('section_subject_id')
      .notNull()
      .references(() => sectionSubjects.id),
    semesterId: uuid('semester_id')
      .notNull()
      .references(() => semesters.id),
    anonymous: boolean('anonymous').notNull().default(true),
    comment: text('comment'),
    sentimentLabel: sentimentEnum('sentiment_label'),
    sentimentScore: numeric('sentiment_score', { precision: 4, scale: 3 }),
    /** Array of strokes; each stroke is an array of normalized {x,y} points (0..1). */
    signaturePoints: jsonb('signature_points').notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('evaluations_unique').on(t.studentId, t.sectionSubjectId)],
);

export const evaluationAnswers = pgTable(
  'evaluation_answers',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    evaluationId: uuid('evaluation_id')
      .notNull()
      .references(() => evaluations.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id),
    rating: integer('rating').notNull(),
  },
  (t) => [unique('evaluation_answers_unique').on(t.evaluationId, t.questionId)],
);
