import { get } from './base.api';

export const getDashboardData = async (days: string = '7') => {
    const data = await get<any>(`/school/dashboard?days=${days}`);
    return data;
};
