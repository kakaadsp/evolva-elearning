// Supabase Database Types
export type UserRole = "admin" | "guru" | "siswa";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Kelas {
  id: string;
  name: string;
  description?: string;
  subject: string;
  semester: string;
  academic_year: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  guru?: Profile;
  member_count?: number;
}

export interface KelasMember {
  id: string;
  kelas_id: string;
  user_id: string;
  role: "guru" | "siswa";
  joined_at: string;
  // Relations
  user?: Profile;
  kelas?: Kelas;
}

export interface ModulPembelajaran {
  id: string;
  kelas_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_available: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  kelas?: Kelas;
  materi_count?: number;
  lkpd_count?: number;
}

export interface Materi {
  id: string;
  modul_id: string;
  title: string;
  content: string; // Markdown + LaTeX
  order_index: number;
  is_available: boolean;
  content_type: "text" | "video" | "file";
  file_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LKPD {
  id: string;
  modul_id: string;
  title: string;
  description?: string;
  instructions: string; // Markdown + LaTeX
  questions: LKPDQuestion[];
  order_index: number;
  is_available: boolean;
  deadline?: string;
  max_score: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  modul?: ModulPembelajaran;
}

export interface LKPDQuestion {
  id: string;
  question_text: string; // Markdown + LaTeX
  question_type: "essay" | "short_answer" | "calculation";
  max_points: number;
  rubric_hint?: string;
}

export interface LKPDSubmission {
  id: string;
  lkpd_id: string;
  student_id: string;
  answers: LKPDAnswer[];
  submitted_at: string;
  status: "submitted" | "ai_grading" | "ai_graded" | "validated";
  ai_score?: number;
  ai_feedback?: AIFeedback;
  final_score?: number;
  teacher_notes?: string;
  validated_by?: string;
  validated_at?: string;
  // Relations
  student?: Profile;
  lkpd?: LKPD;
  validator?: Profile;
}

export interface LKPDAnswer {
  question_id: string;
  answer_text: string;
  ai_score?: number;
  ai_feedback?: string;
  teacher_score?: number;
}

export interface AIFeedback {
  total_score: number;
  max_score: number;
  percentage: number;
  overall_feedback: string;
  question_feedbacks: QuestionFeedback[];
  strengths: string[];
  improvements: string[];
  model_used: string;
  graded_at: string;
}

export interface QuestionFeedback {
  question_id: string;
  score: number;
  max_points: number;
  feedback: string;
}

export interface Kuis {
  id: string;
  kelas_id: string;
  title: string;
  description?: string;
  questions: KuisQuestion[];
  duration_minutes: number;
  is_available: boolean;
  start_time?: string;
  end_time?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface KuisQuestion {
  id: string;
  question_text: string; // Markdown + LaTeX
  question_type: "multiple_choice" | "true_false" | "short_answer";
  options?: string[];
  correct_answer: string;
  points: number;
}

export interface KuisSubmission {
  id: string;
  kuis_id: string;
  student_id: string;
  answers: Record<string, string>;
  score: number;
  max_score: number;
  submitted_at: string;
  time_taken_minutes: number;
}

export interface Pengumuman {
  id: string;
  kelas_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  author?: Profile;
}

export interface StudentProgress {
  student_id: string;
  kelas_id: string;
  modul_completed: number;
  modul_total: number;
  lkpd_completed: number;
  lkpd_total: number;
  average_score: number;
  last_activity?: string;
}

// API Response types
export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface GradeRequest {
  submission_id: string;
  lkpd_title: string;
  questions: LKPDQuestion[];
  answers: LKPDAnswer[];
  student_name: string;
}

export interface GradeResponse {
  success: boolean;
  feedback?: AIFeedback;
  error?: string;
}

// Dashboard Stats
export interface AdminStats {
  total_users: number;
  active_users: number;
  total_classes: number;
  active_classes: number;
  total_submissions: number;
  pending_grading: number;
}

export interface TeacherStats {
  my_classes: number;
  total_students: number;
  pending_submissions: number;
  avg_class_score: number;
  materials_published: number;
  lkpd_created: number;
}

export interface StudentStats {
  enrolled_classes: number;
  completed_lkpd: number;
  pending_lkpd: number;
  average_score: number;
  recent_activities: RecentActivity[];
}

export interface RecentActivity {
  id: string;
  type: "lkpd_submitted" | "kuis_completed" | "material_read" | "score_released";
  title: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
