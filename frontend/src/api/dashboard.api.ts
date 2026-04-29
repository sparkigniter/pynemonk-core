import { get } from './base.api';

export const getDashboardData = async () => {
    const data = await get<any>('/school/dashboard');
    return data;
};
