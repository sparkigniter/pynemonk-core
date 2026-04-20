import { request } from './base.api';

export interface Staff {
    id: number;
    user_id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    designation: string;
    qualification: string;
    specialization: string;
}

export async function getStaffList(): Promise<Staff[]> {
    return request<Staff[]>('/school/staff');
}

export async function createStaff(data: Partial<Staff>): Promise<Staff> {
    return request<Staff>('/school/staff', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
