import { request } from './base.api';

export interface FeeHead {
    id: number;
    name: string;
    code: string;
    is_refundable: boolean;
    ledger_account_id?: number;
    account_name?: string;
}

export interface FeeStructure {
    id: number;
    name: string;
    total_amount: number;
    academic_year_id: number;
    item_count?: number;
}

export interface FeeDiscount {
    id: number;
    name: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    reason: string;
}

export async function getFeeHeads(): Promise<FeeHead[]> {
    return request<FeeHead[]>('/school/finance/heads');
}

export async function getFeeStructures(): Promise<FeeStructure[]> {
    return request<FeeStructure[]>('/school/finance/structures');
}

export async function getFeeDiscounts(): Promise<FeeDiscount[]> {
    return request<FeeDiscount[]>('/school/finance/discounts');
}

export async function getFeeCollections(): Promise<any[]> {
    return request<any[]>('/school/finance/collections');
}

export async function getFeeReceipts(): Promise<any[]> {
    return request<any[]>('/school/finance/receipts');
}

export async function getFeeFinanceStats(): Promise<any> {
    return request<any>('/school/finance/stats');
}

export async function recordFeePayment(data: { 
    installment_id: number, 
    amount: number, 
    payment_method?: string, 
    bank_account_id?: number, 
    reference?: string 
}): Promise<any> {
    return request<any>('/school/finance/payments', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function allocateFeeToStudent(data: { student_id: number, structure_id: number }): Promise<any> {
    return request<any>('/school/finance/allocations', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function createFeeHead(data: Partial<FeeHead>): Promise<FeeHead> {
    return request<FeeHead>('/school/finance/heads', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function createFeeStructure(data: any): Promise<FeeStructure> {
    return request<FeeStructure>('/school/finance/structures', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function updateFeeHead(id: number, data: Partial<FeeHead>): Promise<FeeHead> {
    return request<FeeHead>(`/school/finance/heads/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

export async function deleteFeeHead(id: number): Promise<void> {
    return request<void>(`/school/finance/heads/${id}`, {
        method: 'DELETE'
    });
}

export async function bulkAllocate(data: { student_ids: number[], fee_structure_id: number }): Promise<any> {
    return request<any>('/school/finance/bulk-allocate', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function getGradeFeeTemplates(): Promise<any[]> {
    return request<any[]>('/school/finance/grade-templates');
}

export async function saveGradeFeeTemplate(data: { grade_id: number, fee_structure_id: number, academic_year_id: number }): Promise<any> {
    return request<any>('/school/finance/grade-templates', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

