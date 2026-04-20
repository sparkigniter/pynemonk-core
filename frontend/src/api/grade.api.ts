import { request } from './base.api';

export interface Grade {
    id: number;
    name: string;
    slug: string;
    sequence_order: number;
    student_count?: number;
    subject_count?: number;
    classroom_count?: number;
}

export const getGrades = async (): Promise<Grade[]> => {
    return request<Grade[]>('/school/grades');
};

export const createGrade = async (data: Partial<Grade>): Promise<Grade> => {
    return request<Grade>('/school/grades', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateGrade = async (id: number, data: Partial<Grade>): Promise<Grade> => {
    return request<Grade>(`/school/grades/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const deleteGrade = async (id: number): Promise<void> => {
    await request(`/school/grades/${id}`, {
        method: 'DELETE',
    });
};
