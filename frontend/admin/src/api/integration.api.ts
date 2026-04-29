import { request } from './base.api';

export interface IntegrationManifest {
    name: string;
    slug: string;
    description: string;
    version: string;
    supportedActions: string[];
    isEnabled?: boolean;
}

export async function getAvailableIntegrations(tenantId?: number): Promise<IntegrationManifest[]> {
    const url = tenantId ? `/school/integrations/available?tenantId=${tenantId}` : '/school/integrations/available';
    return request<IntegrationManifest[]>(url);
}

export async function toggleIntegration(systemSlug: string, isEnabled: boolean, tenantId?: number): Promise<any> {
    return request<any>(`/school/integrations/${systemSlug}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ isEnabled, tenantId }),
    });
}
