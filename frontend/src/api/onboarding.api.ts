import { request } from './base.api';

export interface WorkflowInstance {
    id: number;
    target_name: string;
    target_id: number;
    status: string;
    current_step_id: number;
    template_name: string;
    steps: any[];
    created_at: string;
}

export const getPipeline = async (type?: string) => {
    return request<any>(`/school/workflow/pipeline${type ? `?type=${type}` : ''}`);
};

export const updateStep = async (instanceId: number, taskType: string, data: any) => {
    return request<any>('/school/workflow/update-step', {
        method: 'POST',
        body: JSON.stringify({ instanceId, taskType, data })
    });
};
