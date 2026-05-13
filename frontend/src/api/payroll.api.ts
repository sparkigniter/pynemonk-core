import { get, post } from './base.api';

export interface SalaryStructure {
    id: number;
    staff_id: number;
    base_salary: number;
    allowances: any[];
    deductions: any[];
    payment_mode: string;
}

export interface Payslip {
    id: number;
    staff_id: number;
    month: number;
    year: number;
    net_salary: number;
    status: string;
    created_at: string;
}

export interface StaffPayrollDetails {
    structure: SalaryStructure | null;
    payslips: Payslip[];
}

export const saveSalaryStructure = (staffId: number, data: any) => post<SalaryStructure>(`/school/payroll/staff/${staffId}/structure`, data);
export const getStaffPayroll = (staffId: number) => get<StaffPayrollDetails>(`/school/payroll/staff/${staffId}`);
export const generatePayslip = (data: { staffId: number, month: number, year: number }) => post<Payslip>('/school/payroll/generate', data);
export const pay = (id: number) => post<Payslip>(`/school/payroll/${id}/pay`, {});
