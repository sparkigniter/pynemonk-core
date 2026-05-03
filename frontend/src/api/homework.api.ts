import { get, post, put, del } from './base.api';

export interface Homework {
    id: number;
    classroom_id: number;
    subject_id: number;
    staff_id: number;
    title: string;
    description: string;
    due_date: string;
    max_score: number;
    attachment_url?: string;
    classroom_name?: string;
    subject_name?: string;
    staff_name?: string;
    created_at: string;
}

export const homeworkApi = {
    list: (params: { classroomId?: number; subjectId?: number; staffId?: number }) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value) query.append(key, value.toString());
        });
        return get<Homework[]>(`/school/homework?${query.toString()}`);
    },

    create: (data: Partial<Homework>) => post<Homework>('/school/homework', data),

    update: (id: number, data: Partial<Homework>) => put<Homework>(`/school/homework/${id}`, data),

    delete: (id: number) => del(`/school/homework/${id}`)
};
