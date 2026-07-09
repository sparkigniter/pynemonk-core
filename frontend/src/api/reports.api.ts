import { request } from './base.api';

export interface ReportJob {
    id: number;
    tenant_id: number;
    user_id: number;
    report_type: string;
    format: string;
    filters: any;
    password?: string;
    email_dispatch?: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    file_path?: string;
    error_message?: string;
    created_at: string;
    updated_at: string;
}

export interface ReportTemplate {
    id: number;
    tenant_id: number;
    report_type: string;
    name: string;
    template_html: string;
    template_css?: string;
    config: any;
    is_default: boolean;
}

export const reportsApi = {
    /**
     * Expose templates list
     */
    getTemplates: (reportType?: string) =>
        request<ReportTemplate[]>(`/reports/templates${reportType ? `?reportType=${reportType}` : ''}`),

    /**
     * Create or edit a template
     */
    saveTemplate: (data: Partial<ReportTemplate>) =>
        request<ReportTemplate>('/reports/templates', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Trigger offline background report job
     */
    triggerJob: (data: {
        reportType: string;
        format: string;
        filters?: any;
        password?: string;
        emailDispatch?: string;
    }) =>
        request<{ success: boolean; message: string; data: { jobId: number; status: string; createdAt: string } }>(
            '/reports/jobs',
            {
                method: 'POST',
                body: JSON.stringify(data),
            }
        ).then(res => res.data),

    /**
     * List offline jobs
     */
    getJobsList: () =>
        request<ReportJob[]>('/reports/jobs'),

    /**
     * Fetch status of specific offline job
     */
    getJobStatus: (id: number) =>
        request<ReportJob>(`/reports/jobs/${id}`),
};
