/**
 * base.api.ts
 * Shared helper for authenticated requests to the school service.
 */

const BASE_URL = (import.meta as any).env?.VITE_SCHOOL_API_URL ?? 'http://localhost:3000/api/v1';

export function getBaseURL(): string {
    return BASE_URL;
}

export function getAuthHeaders(): Record<string, string> {
    const sessionRaw = localStorage.getItem('eduerp_session');
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const token = session?.accessToken;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const sessionRaw = localStorage.getItem('eduerp_session');
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const token = session?.accessToken;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    const json = await res.json();

    if (!res.ok) {
        throw new Error(json.message ?? `Request failed: ${res.status}`);
    }

    return json.data ?? json;
}

export async function get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' });
}

export async function post<T>(path: string, body: any): Promise<T> {
    return request<T>(path, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export async function put<T>(path: string, body: any): Promise<T> {
    return request<T>(path, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

export async function patch<T>(path: string, body: any): Promise<T> {
    return request<T>(path, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
}

export async function del<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' });
}
