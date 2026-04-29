import { request, getBaseURL, getAuthHeaders } from './base.api';

export interface IntegrationManifest {
    name: string;
    slug: string;
    description: string;
    version: string;
    supportedActions: string[];
    isEnabled?: boolean;
    uiPlacements?: Array<{
        location: 'sidebar' | 'student_profile' | 'student_list' | 'staff_profile' | 'dashboard' | 'settings' | 'exam_overview' | 'marks_entry';
        label: string;
        path?: string;
        action?: string;
        icon?: string;
        group?: 'academic' | 'people' | 'operations' | 'reports';
        permissions?: string[];
    }>;
    exports?: Array<{
        action: string;
        label: string;
        description?: string;
        mimeType?: string;
        extension?: string;
        columns?: Array<{ key: string; header: string; width?: number }>;
    }>;
}

export interface IntegrationHealth {
    total: number;
    mapped: number;
    unmapped: number;
    validationErrors: Array<{
        entityId: number;
        entityName: string;
        message: string;
        field?: string;
    }>;
}

export async function getAvailableIntegrations(tenantId?: number): Promise<IntegrationManifest[]> {
    const url = tenantId
        ? `/school/integrations/available?tenantId=${tenantId}`
        : '/school/integrations/available';
    return request<IntegrationManifest[]>(url);
}

export async function getIntegrationHealth(systemSlug: string, tenantId?: number): Promise<IntegrationHealth> {
    const url = tenantId
        ? `/school/integrations/${systemSlug}/actions/health_check?tenantId=${tenantId}`
        : `/school/integrations/${systemSlug}/actions/health_check`;
    return request<IntegrationHealth>(url);
}

export async function toggleIntegration(systemSlug: string, isEnabled: boolean, tenantId?: number): Promise<any> {
    return request<any>(`/school/integrations/${systemSlug}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ isEnabled, tenantId }),
    });
}

/**
 * Download a file export from a plugin action.
 * Handles binary (Excel / CSV) responses by triggering a browser download.
 *
 * @param systemSlug  e.g. "karnataka-sats"
 * @param action      e.g. "export_students"
 * @param params      Additional query params (tenantId, filters…)
 * @param filename    Suggested download filename (overrides server's suggestion)
 */
export async function downloadIntegrationExport(
    systemSlug: string,
    action: string,
    params: Record<string, any> = {},
    filename?: string,
): Promise<void> {
    const { tenantId, ...rest } = params;
    const query = new URLSearchParams(rest as any);
    if (tenantId) query.append('tenantId', tenantId.toString());

    const url = `${getBaseURL()}/school/integrations/${systemSlug}/actions/${action}?${query.toString()}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Export failed');
    }

    // Detect filename from Content-Disposition header if not overridden
    const disposition = response.headers.get('content-disposition') ?? '';
    const serverFilename = disposition.match(/filename="?([^";\n]+)"?/)?.[1];
    const finalFilename = filename ?? serverFilename ?? `${systemSlug}_${action}.xlsx`;

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = finalFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
}

/** Legacy JSON export — kept for backward compat, prefer downloadIntegrationExport */
export async function exportIntegrationData(systemSlug: string, entityType: string, params: any = {}): Promise<any[]> {
    const { tenantId, ...rest } = params;
    const query = new URLSearchParams({ entityType, ...rest });
    if (tenantId) query.append('tenantId', tenantId.toString());
    return request<any[]>(`/school/integrations/${systemSlug}/actions/export_students?${query.toString()}`);
}
