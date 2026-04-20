import { request } from './base.api';

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

export async function getStudentList(): Promise<Student[]> {
    return request<Student[]>('/school/students');
}

export async function admitStudent(data: any): Promise<any> {
    return request<any>('/school/admissions', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
