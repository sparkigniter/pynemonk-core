import { request } from './base.api';

import type { PaginatedResponse } from './staff.api';

export interface Course {
    id: number;
    name: string;
    code: string;
    description: string;
    created_at: string;
}

export async function getCourseList(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
}): Promise<PaginatedResponse<Course>> {
    const query = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value) query.append(key, value.toString());
        });
    }
    return request<PaginatedResponse<Course>>(`/school/courses?${query.toString()}`);
}

export async function createCourse(data: Partial<Course>): Promise<Course> {
    return request<Course>('/school/courses', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
