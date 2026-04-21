import { request } from './base.api';

export interface Subject {
    id: number;
    grade_id: number;
    grade_name?: string;
    name: string;
    code: string;
    description?: string;
    created_at: string;
}

export interface Assignment {
    id: number;
    staff_id: number;
    teacher_name: string;
    classroom_id: number;
    classroom_name: string;
    subject_id: number;
    subject_name: string;
    academic_year_id: number;
}

export async function getSubjectList(params?: { 
    grade_id?: number; 
    search?: string; 
}): Promise<Subject[]> {
    const query = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value) query.append(key, value.toString());
        });
    }
    return request<Subject[]>(`/school/subjects?${query.toString()}`);
}

export async function createSubject(data: Partial<Subject>): Promise<Subject> {
    return request<Subject>('/school/subjects', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function assignTeacher(data: {
    staff_id: number;
    classroom_id: number;
    subject_id: number;
    academic_year_id: number;
}): Promise<Assignment> {
    return request<Assignment>('/school/subjects/assign-teacher', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getAssignments(params?: {
    classroom_id?: number;
    subject_id?: number;
    staff_id?: number;
    academic_year_id?: number;
}): Promise<Assignment[]> {
    const query = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value) query.append(key, value.toString());
        });
    }
    return request<Assignment[]>(`/school/subjects/assignments?${query.toString()}`);
}
