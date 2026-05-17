/**
 * base.api.ts
 * Shared helper for authenticated requests to the school service.
 */

const BASE_URL = (import.meta as any).env?.VITE_SCHOOL_API_URL ?? (
    typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:3000/api/v1`
        : 'http://localhost:3000/api/v1'
);

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

// ── Refresh Token State Machine ──────────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
    refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
}

async function performTokenRefresh(): Promise<string | null> {
    try {
        const sessionRaw = localStorage.getItem('eduerp_session');
        if (!sessionRaw) return null;
        const session = JSON.parse(sessionRaw);
        const refreshToken = session?.refreshToken;
        if (!refreshToken) return null;

        const authUrl = (import.meta as any).env?.VITE_AUTH_API_URL ?? (
            typeof window !== 'undefined'
                ? `${window.location.protocol}//${window.location.hostname}:3000`
                : 'http://localhost:3000'
        );
        const clientId = (import.meta as any).env?.VITE_CLIENT_ID ?? 'frontend_client';
        const clientSecret = (import.meta as any).env?.VITE_CLIENT_SECRET ?? 'frontend_secret';

        const response = await fetch(`${authUrl}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret
            })
        });

        if (!response.ok) {
            throw new Error('Refresh token request failed');
        }

        const json = await response.json();
        const data = json.data ?? json;

        if (data.access_token) {
            const accessToken = data.access_token;
            const newRefreshToken = data.refresh_token || refreshToken;
            
            // Re-parse the payload to maintain the session user object
            const payload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            const user = {
                sub: payload.sub,
                email: payload.email,
                role_id: payload.role_id,
                roles: payload.roles || [],
                permissions: typeof payload.scope === 'string' ? payload.scope.split(' ') : [],
                tenant_id: payload.tenant_id,
                student_profile: payload.student_profile
            };

            const newSession = {
                accessToken,
                refreshToken: newRefreshToken,
                expiresAt: Date.now() + data.expires_in * 1000,
                user
            };

            localStorage.setItem('eduerp_session', JSON.stringify(newSession));
            return accessToken;
        }
        return null;
    } catch (err) {
        console.error('Auto token refresh failed:', err);
        localStorage.removeItem('eduerp_session');
        return null;
    }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const sessionRaw = localStorage.getItem('eduerp_session');
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    let token = session?.accessToken;

    // Proactively refresh if token expires in less than 10 seconds
    if (session && Date.now() >= session.expiresAt - 10000) {
        if (!isRefreshing) {
            isRefreshing = true;
            performTokenRefresh().then(newToken => {
                isRefreshing = false;
                if (newToken) {
                    onRefreshed(newToken);
                }
            });
        }

        token = await new Promise<string>((resolve) => {
            subscribeTokenRefresh((newToken) => {
                resolve(newToken);
            });
        });
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const academicYearId = localStorage.getItem('active_academic_year_id');
    if (academicYearId) {
        headers['x-academic-year-id'] = academicYearId;
    }

    let res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    // Reactively refresh on 401 Unauthorized response
    if (res.status === 401) {
        if (!isRefreshing) {
            isRefreshing = true;
            const newToken = await performTokenRefresh();
            isRefreshing = false;
            if (newToken) {
                onRefreshed(newToken);
                
                // Retry request with new token
                const retryHeaders = {
                    ...headers,
                    'Authorization': `Bearer ${newToken}`
                };
                res = await fetch(`${BASE_URL}${path}`, {
                    ...options,
                    headers: retryHeaders,
                });
            }
        } else {
            // Wait for active refresh
            const newToken = await new Promise<string>((resolve) => {
                subscribeTokenRefresh((t) => resolve(t));
            });
            const retryHeaders = {
                ...headers,
                'Authorization': `Bearer ${newToken}`
            };
            res = await fetch(`${BASE_URL}${path}`, {
                ...options,
                headers: retryHeaders,
            });
        }
    }

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
