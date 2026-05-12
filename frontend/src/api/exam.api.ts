import { get, post, put, patch } from './base.api';

export interface ExamTerm {
  id: number;
  name: string;
  start_date?: string;
  end_date?: string;
}

export interface Exam {
  id: number;
  name: string;
  exam_type: 'periodic' | 'term' | 'annual';
  start_date: string;
  end_date: string;
  exam_term_id?: number;
  term_name?: string;
  is_published: boolean;
  results_published: boolean;
  progress_percentage?: number;
}

export interface ExamPaper {
  id: number;
  exam_id: number;
  subject_id: number;
  subject_name: string;
  subject_code: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room?: string;
  max_marks: number;
  passing_marks: number;
  supervisor_id?: number | null;
  user_period: boolean;
}

export interface ExamStudent {
  student_id: number;
  first_name: string;
  last_name: string;
  admission_no: string;
  classroom_name: string;
  classroom_section: string;
  is_excluded: boolean;
  exclusion_reason?: string;
}

export const examApi = {
  getTerms: (academicYearId?: number) =>
    get<ExamTerm[]>(`/school/exams/terms${academicYearId ? `?academic_year_id=${academicYearId}` : ''}`),

  createTerm: (data: Partial<ExamTerm>) =>
    post<ExamTerm>('/school/exams/terms', data),

  getExams: (academicYearId?: number, classroomId?: number) => {
    const params = new URLSearchParams();
    if (academicYearId) params.append('academic_year_id', academicYearId.toString());
    if (classroomId) params.append('classroom_id', classroomId.toString());
    const query = params.toString();
    return get<Exam[]>(`/school/exams${query ? `?${query}` : ''}`);
  },

  createExam: (data: Partial<Exam>) =>
    post<Exam>('/school/exams', data),

  getExamDetails: (id: number) =>
    get<Exam & { papers: ExamPaper[], invitations: any[], students: ExamStudent[] }>(`/school/exams/${id}`),

  addPaper: (examId: number, data: Partial<ExamPaper>) =>
    post<ExamPaper>(`/school/exams/${examId}/papers`, data),

  addInvitation: (examId: number, data: { grade_id?: number, classroom_id?: number, subject_id?: number }) =>
    post(`/school/exams/${examId}/invitations`, data),

  updateStudentStatus: (examId: number, studentId: number, data: { is_excluded: boolean, exclusion_reason?: string }) =>
    put(`/school/exams/${examId}/students/${studentId}`, data),

  getPaperStudents: (examId: number, paperId: number) =>
    get<any[]>(`/school/exams/${examId}/papers/${paperId}/students`),

  getPaginatedStudents: (examId: number, params: { 
    page: number, 
    limit: number, 
    search?: string, 
    status?: string,
    grade_id?: number,
    classroom_id?: number,
    subject_id?: number
  }) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value.toString());
      }
    });
    return get<{ data: ExamStudent[], pagination: any }>(`/school/exams/${examId}/students?${query.toString()}`);
  },

  saveMarks: (examId: number, paperId: number, data: any[]) =>
    post(`/school/exams/${examId}/papers/${paperId}/marks`, data),

  updateStatus: (examId: number, status: string) =>
    patch(`/school/exams/${examId}/status`, { status }),

  updateExam: (id: number, data: Partial<Exam>) =>
    put<Exam>(`/school/exams/${id}`, data),

  deletePaper: (examId: number, paperId: number) =>
    patch(`/school/exams/${examId}/papers/${paperId}/delete`, {}),
  
  getStats: () =>
    get<any>('/school/exams/stats'),

  getExamResults: (id: number) =>
    get<any>(`/school/exams/${id}/results`),
};
