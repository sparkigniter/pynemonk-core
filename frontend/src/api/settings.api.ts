import { get, put } from './base.api';

export const getSettings = async () => {
    try {
        const res = await get<any>('/school/settings');
        return res;
    } catch (err) {
        console.error('Failed to fetch settings:', err);
        return null;
    }
};

export const updateSettings = async (data: { attendance_mode?: 'DAILY' | 'PERIOD_WISE', admission_number_format?: string }) => {
    try {
        await put('/school/settings', data);
        return true;
    } catch (err) {
        console.error('Failed to update settings:', err);
        throw err;
    }
};
