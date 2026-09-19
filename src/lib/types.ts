export type Term = '1st' | '2nd' | 'midyear';

export type Semester = {
  id: string;
  academic_year: string;
  term: Term;
  is_current: boolean;
  is_open: boolean;
  manual_override: string | null;
  opens_at: string | null;
  closes_at: string | null;
};

/** Open state is derived: manual override trumps, then the time window. */
export function semesterIsOpen(s: Pick<Semester, 'manual_override' | 'is_open' | 'opens_at' | 'closes_at'>): boolean {
  if (s.manual_override === 'open') return true;
  if (s.manual_override === 'closed') return false;
  if (!s.opens_at || !s.closes_at) return s.is_open; // legacy rows without a window
  const now = Date.now();
  return now >= new Date(s.opens_at).getTime() && now <= new Date(s.closes_at).getTime();
}

export type StudentSubject = {
  section_subject_id: string;
  subject_code: string;
  subject_name: string;
  section_name: string;
  faculty_name: string;
  is_open: boolean;
  closes_at: string | null;
  completed: boolean;
};

export type StudentDashboard = {
  current_semester: Semester | null;
  subjects: StudentSubject[];
  past: { semester_id: string; academic_year: string; term: string; completed: number; total: number }[];
};

export type SentimentCounts = { positive: number; neutral: number; negative: number };

export type PerQuestion = {
  id?: string;
  text: string;
  category: string;
  sort_order: number;
  avg_rating: number | null;
  responses: number;
};

export type PerSubject = {
  subject_code: string;
  subject_name: string;
  section_name: string;
  evals: number;
  avg_rating: number | null;
};

export type CommentRow = {
  comment: string;
  label: 'positive' | 'neutral' | 'negative' | null;
  at: string;
};

export type FacultyOverview = {
  per_question: PerQuestion[];
  per_subject: PerSubject[];
  sentiment: SentimentCounts;
  comments: CommentRow[];
  overall: number | null;
};

export type DeanFacultyRow = {
  id: string;
  full_name: string;
  loads: number;
  evals: number;
  overall: number | null;
};

export type DeanOverview = {
  semester: Semester | null;
  participation: { enrolled: number; submitted: number; total_evals: number };
  faculty: DeanFacultyRow[];
  sentiment: SentimentCounts;
  per_criterion: { category: string; avg_rating: number | null }[];
};

export type SentimentComment = {
  comment: string;
  label: string;
  sentiment_score: number;
  faculty_name: string;
  subject_code: string;
  submitted_at: string;
};

export type SentimentReport = {
  counts: SentimentCounts;
  comments: SentimentComment[];
};

export type TrendRow = {
  semester_id: string;
  academic_year: string;
  term: string;
  is_current: boolean;
  evals: number;
  avg_rating: number | null;
  positive: number;
  neutral: number;
  negative: number;
};

export type HistoryRow = Record<string, string | number | boolean | null>;
