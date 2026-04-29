import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Use the same session key as the main app for shared login state
const SESSION_KEY = 'eduerp_session';

api.interceptors.request.use((config) => {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
            const session = JSON.parse(raw);
            if (session.accessToken) {
                config.headers.Authorization = `Bearer ${session.accessToken}`;
            }
        }
    } catch (e) {
        console.error('Failed to parse session', e);
    }
    return config;
});

export const request = async <T>(url: string, options: any = {}): Promise<T> => {
    const response = await api({
        url,
        ...options,
        data: options.body ? JSON.parse(options.body) : undefined,
    });
    return response.data.data ?? response.data;
};
