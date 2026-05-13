import { get, post } from './base.api';

export interface SystemMetric {
    totalTenants: number;
    totalUsers: number;
    totalStudents: number;
    totalStaff: number;
    systemHealth: string;
    activeModules: string[];
    kpis: { name: string, value: number, unit: string }[];
    activityData: { name: string, logins: number, transactions: number }[];
}

export const getSystemMetrics = () => get<SystemMetric>('/school/system/metrics');
export const getSystemLogs = (limit: number = 200) => get<string[]>(`/school/system/logs?limit=${limit}`);
export const clearSystemLogs = () => post('/school/system/logs/clear', {});
