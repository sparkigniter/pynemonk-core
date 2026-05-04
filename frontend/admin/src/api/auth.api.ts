import { request } from './base.api';

export interface OauthClient {
    id: number;
    client_id: string;
    client_name: string;
    grant_types: string[];
    redirect_uris: string[];
    is_active: boolean;
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
    tenant_id: number | null;
}

export interface RoleScope {
    role_id: number;
    scope_id: number;
    role_name?: string;
    scope_value?: string;
}

export async function getTenants(): Promise<any[]> {
    return request<any[]>('/tenant');
}

export async function getOAuthClients(): Promise<OauthClient[]> {
    return request<OauthClient[]>('/oauth2/client');
}

export async function getScopes(): Promise<OauthScope[]> {
    return request<OauthScope[]>('/oauth2/scope');
}

export async function createClient(payload: any): Promise<OauthClient> {
    return request<OauthClient>('/oauth2/client', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export async function updateClient(id: number, payload: any): Promise<OauthClient> {
    return request<OauthClient>(`/oauth2/client/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
}

export async function getRoles(clientId?: string): Promise<OauthRole[]> {
    const url = clientId ? `/oauth2/role?clientId=${clientId}` : '/oauth2/role';
    return request<OauthRole[]>(url);
}

export async function getRoleScopes(clientId?: string): Promise<RoleScope[]> {
    const url = clientId ? `/oauth2/role-scope?clientId=${clientId}` : '/oauth2/role-scope';
    return request<RoleScope[]>(url);
}

export async function assignRoleScope(roleId: number, scopeId: number, clientId?: string): Promise<void> {
    return request<void>('/oauth2/role-scope', {
        method: 'POST',
        body: JSON.stringify({ role_id: roleId, scope_id: scopeId, clientId })
    });
}

export async function removeRoleScope(roleId: number, scopeId: number, clientId?: string): Promise<void> {
    const url = clientId 
        ? `/oauth2/role-scope/${roleId}/${scopeId}?clientId=${clientId}` 
        : `/oauth2/role-scope/${roleId}/${scopeId}`;
    return request<void>(url, {
        method: 'DELETE'
    });
}

export async function syncRoleWithTemplate(roleId: number, clientId?: string): Promise<void> {
    return request<void>(`/oauth2/role/${roleId}/sync-template`, {
        method: 'POST',
        body: JSON.stringify({ clientId })
    });
}

export interface ClientScope {
    client_id: number;
    scope_id: number;
    scope_value?: string;
}

export async function getClientScopes(): Promise<ClientScope[]> {
    return request<ClientScope[]>('/oauth2/client-scope');
}

export async function assignClientScope(clientId: number, scopeId: number): Promise<void> {
    return request<void>('/oauth2/client-scope', {
        method: 'POST',
        body: JSON.stringify({ client_id: clientId, scope_id: scopeId })
    });
}

export async function removeClientScope(clientId: number, scopeId: number): Promise<void> {
    return request<void>(`/oauth2/client-scope/${clientId}/${scopeId}`, {
        method: 'DELETE'
    });
}

export async function syncClientWithRoleTemplate(clientId: number, roleSlug: string): Promise<void> {
    return request<void>(`/oauth2/client-scope/sync-template`, {
        method: 'POST',
        body: JSON.stringify({ clientId, roleSlug })
    });
}

export async function bulkGrantRoleScopes(roleId: number, clientId?: string): Promise<void> {
    return request<void>(`/oauth2/role-scope/bulk-grant`, {
        method: 'POST',
        body: JSON.stringify({ roleId, clientId })
    });
}

export async function bulkRevokeRoleScopes(roleId: number, clientId?: string): Promise<void> {
    return request<void>(`/oauth2/role-scope/bulk-revoke`, {
        method: 'POST',
        body: JSON.stringify({ roleId, clientId })
    });
}

export async function bulkGrantClientScopes(clientId: number): Promise<void> {
    return request<void>(`/oauth2/client-scope/bulk-grant`, {
        method: 'POST',
        body: JSON.stringify({ clientId })
    });
}

export async function bulkRevokeClientScopes(clientId: number): Promise<void> {
    return request<void>(`/oauth2/client-scope/bulk-revoke`, {
        method: 'POST',
        body: JSON.stringify({ clientId })
    });
}

export async function deprovisionClientWithRoleTemplate(clientId: number, roleSlug: string): Promise<void> {
    return request<void>(`/oauth2/client-scope/deprovision-template`, {
        method: 'POST',
        body: JSON.stringify({ clientId, roleSlug })
    });
}

export interface ClientRole {
    client_id: number;
    role_id: number;
    role_name?: string;
    role_slug?: string;
}

export async function getClientRoles(): Promise<ClientRole[]> {
    return request<ClientRole[]>('/oauth2/client-role');
}

export async function assignClientRole(clientId: number, roleId: number): Promise<void> {
    return request<void>('/oauth2/client-role', {
        method: 'POST',
        body: JSON.stringify({ client_id: clientId, role_id: roleId })
    });
}

export async function removeClientRole(clientId: number, roleId: number): Promise<void> {
    return request<void>(`/oauth2/client-role/${clientId}/${roleId}`, {
        method: 'DELETE'
    });
}
