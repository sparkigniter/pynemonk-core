import { request } from './base.api';

import type { PaginatedResponse } from './staff.api';

export interface Student {
    id: number;
    user_id: number;
    admission_no: string;
    first_name: string;
    last_name: string;
    gender: string;
    date_of_birth: string;
    phone: string;
    address: string;
}

export async function getStudentList(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<PaginatedResponse<Student>> {
    const query = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value) query.append(key, value.toString());
        });
    }
    return request<PaginatedResponse<Student>>(`/school/students?${query.toString()}`);
}

export async function getStudentProfile(id: number): Promise<any> {
    return request<any>(`/school/students/${id}`);
}

export async function admitStudent(data: any): Promise<any> {
    return request<any>('/school/admissions', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
