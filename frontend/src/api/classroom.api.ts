import { request } from './base.api';
import type { PaginatedResponse } from './staff.api';

export interface Classroom {
    id: number;
    name: string;
    section: string;
    grade_id: number;
    grade_name?: string;
    capacity?: number;
    teacher_first_name?: string;
    teacher_last_name?: string;
}

export async function getClassrooms(params?: {
    grade_id?: number;
    academic_year_id?: number;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<PaginatedResponse<Classroom>> {
    const query = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value) query.append(key, value.toString());
        });
    }
    return request<PaginatedResponse<Classroom>>(`/school/classrooms?${query.toString()}`);
}

export async function createClassroom(data: Partial<Classroom>): Promise<Classroom> {
    return request<Classroom>('/school/classrooms', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
