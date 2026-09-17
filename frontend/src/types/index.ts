export type UserRole = 'admin' | 'learner';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  department: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DocumentItem {
  id: number;
  title: string;
  filename: string;
  file_size_bytes: number;
  page_count: number;
  uploaded_by_id: number;
  created_at: string;
}

export interface DocumentDetail extends DocumentItem {
  extracted_text?: string;
  extracted_tables_json?: string;
  text_preview?: string;
}

export type ReviewStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'MODIFIED';

export interface QuestionLearner {
  id: number;
  quiz_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  competency_tag: string;
  difficulty: string;
  source_reference?: string;
}

export interface QuestionAdmin extends QuestionLearner {
  correct_option: string;
  explanation: string;
  review_status: ReviewStatus;
  reviewer_notes?: string;
  reviewed_by_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: number;
  title: string;
  description?: string;
  document_id?: number;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED';
  target_competency: string;
  time_limit_minutes: number;
  passing_percentage: number;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  total_questions: number;
  approved_questions: number;
  pending_questions: number;
}

export interface QuizDetailLearner extends Quiz {
  questions: QuestionLearner[];
}

export interface QuizDetailAdmin extends Quiz {
  questions: QuestionAdmin[];
}

export interface CompetencyScore {
  competency: string;
  total: number;
  correct: number;
  percentage: number;
  status: 'Mastered' | 'Competent' | 'Needs Revision';
}

export interface CourseRecommendation {
  course_id: string;
  title: string;
  provider: string;
  duration: string;
  competency: string;
  reason: string;
  url: string;
}

export interface AnswerResultDetail {
  question_id: number;
  question_text: string;
  selected_option: string;
  correct_option: string;
  is_correct: boolean;
  explanation: string;
  competency_tag: string;
  source_reference?: string;
}

export interface AssessmentResult {
  attempt_id: number;
  quiz_id: number;
  quiz_title: string;
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  time_spent_seconds: number;
  completed_at: string;
  competency_breakdown: CompetencyScore[];
  recommendations: CourseRecommendation[];
  detailed_answers: AnswerResultDetail[];
}

export interface AttemptSummary {
  id: number;
  quiz_id: number;
  quiz_title: string;
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  time_spent_seconds: number;
  completed_at: string;
}

export interface ChatMessageTurn {
  sender: 'user' | 'assistant';
  text: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  model?: string;
  isError?: boolean;
}

export interface ChatQueryRequest {
  message: string;
  history?: ChatMessageTurn[];
  user_name?: string;
  user_role?: string;
}

export interface ChatQueryResponse {
  reply: string;
  model: string;
  timestamp: string;
}

