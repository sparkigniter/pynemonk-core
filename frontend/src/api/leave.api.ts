import { get, post } from './base.api';

export interface LeaveApplication {
    id: number;
    staff_id: number;
    leave_type_id: number;
    start_date: string;
    end_date: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    leave_type_name: string;
    first_name?: string;
    last_name?: string;
    created_at: string;
}

export interface LeaveType {
    id: number;
    name: string;
    description: string;
    is_paid: boolean;
    default_days: number;
}

export const applyLeave = (data: any) => post<LeaveApplication>('/school/leaves', data);
export const getMyLeaves = () => get<LeaveApplication[]>('/school/leaves/my');
export const getPendingLeaves = () => get<LeaveApplication[]>('/school/leaves/pending');
export const approveLeave = (id: number, remarks: string) => post<LeaveApplication>(`/school/leaves/${id}/approve`, { remarks });
export const rejectLeave = (id: number, remarks: string) => post<LeaveApplication>(`/school/leaves/${id}/reject`, { remarks });
export const getLeaveTypes = () => get<LeaveType[]>('/school/leaves/types');
export const createLeaveType = (data: any) => post<LeaveType>('/school/leaves/types', data);
