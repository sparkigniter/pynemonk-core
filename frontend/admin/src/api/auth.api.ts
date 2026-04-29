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
