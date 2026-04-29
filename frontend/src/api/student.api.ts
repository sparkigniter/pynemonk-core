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
    created_at?: string;
    blood_group?: string;
    religion?: string;
    mother_tongue?: string;
    nationality?: string;
    id_number?: string;
    previous_school?: string;
    medical_notes?: string;
    admission_date?: string;
    status?: 'active' | 'pending' | 'withdrawn';
    classroom_name?: string;
    logs?: any[];
    documents?: any[];
}

export async function getStudentList(params?: {
    page?: number;
    limit?: number;
    search?: string;
    classroom_id?: number;
    academic_year_id?: number;
}): Promise<PaginatedResponse<Student>> {
    const query = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value) query.append(key, value.toString());
        });
    }
    return request<PaginatedResponse<Student>>(`/school/students?${query.toString()}`);
}

export async function getStudentProfile(id: number): Promise<Student> {
    return request<Student>(`/school/students/${id}`);
}

export async function getMyStudentProfile(): Promise<Student> {
    return request<Student>(`/school/students/profile/me`);
}

export async function admitStudent(data: any): Promise<any> {
    return request<any>('/school/admissions', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function uploadDocument(studentId: number, data: { document_type: string; file_name: string; file_url: string }): Promise<any> {
    return request<any>(`/school/students/${studentId}/documents`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateStudentProfile(id: number, data: Partial<Student>): Promise<Student> {
    return request<Student>(`/school/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function getNextAdmissionNumber(): Promise<{ admission_no: string }> {
    return request<{ admission_no: string }>('/school/students/next-admission-number');
}

export async function getAdmissionSettings(): Promise<any> {
    return request<any>('/school/students/settings');
}

export async function updateAdmissionSettings(data: any): Promise<any> {
    return request<any>('/school/students/settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}
