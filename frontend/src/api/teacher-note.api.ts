import { get, post, put } from './base.api';

export interface TeacherNote {
    id: number;
    classroom_id?: number;
    subject_id?: number;
    timetable_id?: number;
    note_date: string;
    content: string;
    is_completed: boolean;
    is_deleted?: boolean;
    created_at: string;
    updated_at: string;
    classroom_name?: string;
    subject_name?: string;
}

export const teacherNoteApi = {
    list: (params: { 
        startDate?: string; 
        endDate?: string; 
        classroomId?: number; 
        subjectId?: number; 
    }) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value) query.append(key, value.toString());
        });
        return get<TeacherNote[]>(`/school/teacher-notes?${query.toString()}`);
    },

    create: (data: Partial<TeacherNote>) => post<TeacherNote>('/school/teacher-notes', data),

    update: (id: number, data: Partial<TeacherNote>) => put<TeacherNote>(`/school/teacher-notes/${id}`, data),
};
