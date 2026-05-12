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
    classroom_section?: string;
    enrollment_year_id?: number;
    logs?: any[];
    documents?: any[];
    avatar_url?: string;
    fee_status?: 'paid' | 'unpaid' | 'partial' | 'overdue';
    classroom_id?: number;
    outstanding_balance?: number;
}

export async function getStudentList(params?: {
    page?: number;
    limit?: number;
    search?: string;
    classroom_id?: number;
    academic_year_id?: number;
    gender?: string;
    blood_group?: string;
    religion?: string;
    nationality?: string;
    grade_id?: number;
    unenrolled?: boolean;
}): Promise<PaginatedResponse<Student>> {
    const query = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') query.append(key, value.toString());
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

export async function getStudentPerformance(studentId: number): Promise<any[]> {
    return request<any[]>(`/school/exams/performance/${studentId}`);
}

export async function getStudentAttendanceStats(studentId: number): Promise<any> {
    return request<any>(`/school/attendance/stats/${studentId}`);
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

export async function enrollStudent(studentId: number, data: { classroom_id: number; academic_year_id: number; roll_number?: string }): Promise<any> {
    return request<any>(`/school/students/${studentId}/enroll`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// Workflow API
export async function startAdmissionWorkflow(data: any): Promise<any> {
    return request<any>('/school/admissions/workflow/start', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateAdmissionWorkflow(id: number, data: { stage: string; data: any; next_stage?: string }): Promise<any> {
    return request<any>(`/school/admissions/workflow/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function finalizeAdmissionWorkflow(id: number): Promise<any> {
    return request<any>(`/school/admissions/workflow/${id}/finalize`, {
        method: 'POST',
    });
}

export async function listAdmissionApplications(): Promise<any[]> {
    return request<any[]>('/school/admissions/applications');
}

export async function getAdmissionApplication(id: number): Promise<any> {
    return request<any>(`/school/admissions/workflow/${id}`);
}

export async function addGuardian(studentId: number, data: any): Promise<any> {
    return request<any>(`/school/students/${studentId}/guardians`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
