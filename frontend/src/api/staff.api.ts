import { request } from './base.api';

export interface Staff {
    id: number;
    user_id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    gender: string;
    date_of_birth?: string;
    blood_group?: string;
    religion?: string;
    nationality?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    marital_status?: string;
    designation: string;
    qualification: string;
    specialization: string;
    experience_years?: number;
    joining_date?: string;
    status: 'active' | 'inactive' | 'on_leave';
    aadhaar_number?: string;
    pan_number?: string;
    bank_account_no?: string;
    bank_name?: string;
    ifsc_code?: string;
    avatar_url?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export async function getStaffList(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string; 
}): Promise<PaginatedResponse<Staff>> {
    const query = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value) query.append(key, value.toString());
        });
    }
    return request<PaginatedResponse<Staff>>(`/school/staff?${query.toString()}`);
}

export async function createStaff(data: Partial<Staff>): Promise<Staff> {
    return request<Staff>('/school/staff', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getStaffDetails(id: number): Promise<Staff> {
    return request<Staff>(`/school/staff/${id}`);
}

export async function getMyStaffProfile(): Promise<Staff> {
    return request<Staff>(`/school/staff/profile/me`);
}
