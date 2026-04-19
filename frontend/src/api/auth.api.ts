/**
 * auth.api.ts
 * Thin typed wrapper around the pynemonk-core-auth endpoints.
 * Base URL is read from the Vite env variable VITE_AUTH_API_URL
 * (defaults to http://localhost:3000 for local dev).
 */

const BASE_URL = (import.meta as any).env?.VITE_AUTH_API_URL ?? 'http://localhost:3000';

// ── Types ────────────────────────────────────────────────────────────────────

export interface LoginPayload {
    email: string;
    password: string;
    client_id: string;
    client_secret: string;
    grant_type: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

export interface IntrospectResponse {
    active: boolean;
    sub?: string;
    email?: string;
    role_id?: number;
    client_id?: string;
    scope?: string | null;
    exp?: number;
}

export interface ApiError {
    success: false;
    message: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function post<T>(path: string, body: object, token?: string): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
        throw new Error((json as ApiError).message ?? `Request failed: ${res.status}`);
    }

    return json.data ?? json;
}

// ── Auth endpoints ────────────────────────────────────────────────────────────

/** POST /api/v1/auth/login */
export async function login(payload: LoginPayload): Promise<TokenResponse> {
    return post<TokenResponse>('/api/v1/auth/login', payload);
}

/** POST /api/v1/auth/refresh */
export async function refreshTokens(refreshToken: string, clientId: string, clientSecret: string): Promise<TokenResponse> {
    return post<TokenResponse>('/api/v1/auth/refresh', {
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
    });
}

/** POST /api/v1/auth/logout */
export async function logout(accessToken: string): Promise<void> {
    await post<void>('/api/v1/auth/logout', {}, accessToken);
}

/** POST /api/v1/auth/introspect */
export async function introspect(token: string): Promise<IntrospectResponse> {
    return post<IntrospectResponse>('/api/v1/auth/introspect', { token });
}
