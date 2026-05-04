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

import type { PaginatedResponse } from './staff.api';

export const getGrades = async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    ignoreScope?: boolean;
}): Promise<PaginatedResponse<Grade>> => {
    const query = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value) query.append(key, value.toString());
        });
    }
    return request<PaginatedResponse<Grade>>(`/school/grades?${query.toString()}`);
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
