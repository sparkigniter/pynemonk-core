import { request } from './base.api';

export const getSystemStats = async () => {
    return request<any>('/system/stats');
};
