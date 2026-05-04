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
    school_slug?: string;
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

export interface TenantInfo {
    id: number;
    uuid: string;
    name: string;
    slug: string;
}

export interface TenantListResponse {
    status: 'MULTIPLE_TENANTS';
    tenants: TenantInfo[];
}

export type LoginResult = TokenResponse | TenantListResponse;

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
export async function login(payload: LoginPayload): Promise<LoginResult> {
    return post<LoginResult>('/api/v1/auth/login', payload);
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

/** GET /api/v1/auth/my-tenants */
export async function getMyTenants(token: string): Promise<TenantInfo[]> {
    const res = await fetch(`${BASE_URL}/api/v1/auth/my-tenants`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    return json.data ?? json;
}

// ── OAuth2 Management ────────────────────────────────────────────────────────

export interface OauthClient {
    id: number;
    name: string;
    description: string;
    client_id: string;
    client_secret?: string;
    created_at: string;
}

export interface OauthScope {
    id: number;
    value: string;
    description: string;
}

export interface OauthRole {
    id: number;
    name: string;
    slug: string;
    description: string;
    is_system: boolean;
}

export interface RoleScope {
    id: number;
    role_id: number;
    scope_id: number;
    granted: boolean;
    scope_value: string;
}

export async function getRoles(token: string): Promise<OauthRole[]> {
    const res = await fetch(`${BASE_URL}/api/v1/oauth2/role`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    return json.data ?? json;
}

export async function getRoleScopes(token: string): Promise<RoleScope[]> {
    const res = await fetch(`${BASE_URL}/api/v1/oauth2/role-scope`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    return json.data ?? json;
}

export async function assignRoleScope(token: string, roleId: number, scopeId: number): Promise<void> {
    await post<void>('/api/v1/oauth2/role-scope', { role_id: roleId, scope_id: scopeId }, token);
}

export async function removeRoleScope(token: string, roleId: number, scopeId: number, clientId?: string): Promise<void> {
    let url = `${BASE_URL}/api/v1/oauth2/role-scope/${roleId}/${scopeId}`;
    if (clientId) url += `?clientId=${clientId}`;
    
    const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to remove scope');
}

export async function getClients(token: string): Promise<OauthClient[]> {
    const res = await fetch(`${BASE_URL}/api/v1/oauth2/client`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    return json.data ?? json;
}

export async function getScopes(token: string): Promise<OauthScope[]> {
    const res = await fetch(`${BASE_URL}/api/v1/oauth2/scope`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    return json.data ?? json;
}

export async function getTenants(token: string): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/api/v1/tenant`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    return json.data ?? json;
}

export async function createClient(token: string, payload: any): Promise<OauthClient> {
    return post<OauthClient>('/api/v1/oauth2/client', payload, token);
}

export async function createScope(token: string, payload: any): Promise<OauthScope> {
    return post<OauthScope>('/api/v1/oauth2/scope', payload, token);
}

export async function createRole(token: string, payload: { name: string, slug: string, description: string, tenant_id?: number }): Promise<OauthRole> {
    return post<OauthRole>('/api/v1/oauth2/role', payload, token);
}

export async function assignClientScope(token: string, clientId: number, scopeId: number): Promise<void> {
    await post<void>('/api/v1/oauth2/client-scope', { client_id: clientId, scope_id: scopeId }, token);
}

export async function syncRoleTemplate(token: string, roleId: number, clientId?: string): Promise<any> {
    return post<any>(`/api/v1/oauth2/role/${roleId}/sync-template`, { clientId }, token);
}

export async function bulkGrantRoleScopes(token: string, roleId: number, clientId?: string): Promise<any> {
    return post<any>('/api/v1/oauth2/role-scope/bulk-grant', { roleId, clientId }, token);
}

export async function bulkRevokeRoleScopes(token: string, roleId: number, clientId?: string): Promise<any> {
    return post<any>('/api/v1/oauth2/role-scope/bulk-revoke', { roleId, clientId }, token);
}
