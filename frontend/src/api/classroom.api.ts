import { request } from './base.api';

export interface Classroom {
    id: number;
    name: string;
    section: string;
    grade_id: number;
    capacity?: number;
}

export async function getClassrooms(gradeId?: number): Promise<Classroom[]> {
    const url = gradeId ? `/school/classrooms?grade_id=${gradeId}` : '/school/classrooms';
    return request<Classroom[]>(url);
}

export async function createClassroom(data: Partial<Classroom>): Promise<Classroom> {
    return request<Classroom>('/school/classrooms', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
