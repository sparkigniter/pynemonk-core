export interface Account {
    id: number;
    tenant_id: number;
    code: string;
    name: string;
    account_type_id: number;
    parent_id: number | null;
    is_group: boolean;
    type_name: string;
    normal_balance: 'debit' | 'credit';
    balance?: string;
    raw_balance?: number;
}

export interface JournalItem {
    id: number;
    account_id: number;
    debit: number;
    credit: number;
    description: string;
}

export interface JournalEntry {
    id: number;
    entry_date: string;
    reference_no: string;
    description: string;
    status: string;
    items: JournalItem[];
}

const BASE_URL = (import.meta as any).env?.VITE_AUTH_API_URL ?? 'http://localhost:3000';
const API_PREFIX = '/api/v1/accounting';

const getAuthToken = () => {
    try {
        const session = localStorage.getItem('eduerp_session');
        if (!session) return null;
        const parsed = JSON.parse(session);
        return parsed.accessToken;
    } catch {
        return null;
    }
};

const fetchWithError = async (path: string, options?: RequestInit) => {
    const token = getAuthToken();
    const headers: any = {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
        ...options,
        headers,
    });

    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(`Invalid response from server: ${text.substring(0, 100)}...`);
    }

    if (!res.ok) {
        throw new Error(data.message || 'API request failed');
    }
    return data;
};

export const getCOA = async (): Promise<Account[]> => {
    const data = await fetchWithError(`/coa/chart`);
    return data.data;
};

export const getAccountTypes = async (): Promise<any[]> => {
    const data = await fetchWithError(`/coa/types`);
    return data.data;
};

export const createAccount = async (payload: any) => {
    const data = await fetchWithError(`/coa/accounts`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return data.data;
};

export const getJournals = async (): Promise<JournalEntry[]> => {
    const data = await fetchWithError(`/journals`);
    return data.data;
};

export const createJournal = async (payload: any) => {
    const data = await fetchWithError(`/journals`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return data.data;
};

export const getTrialBalance = async () => {
    const data = await fetchWithError(`/reports/trial-balance`);
    return data.data;
};

export const getProfitAndLoss = async (startDate?: string, endDate?: string) => {
    const query = (startDate && endDate) ? `?startDate=${startDate}&endDate=${endDate}` : '';
    const data = await fetchWithError(`/reports/profit-loss${query}`);
    return data.data;
};

export const getAccountingSummary = async () => {
    const data = await fetchWithError(`/reports/summary`);
    return data.data;
};

// Vendor (AP) APIs
export const getVendors = async (search?: string): Promise<any[]> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const data = await fetchWithError(`/vendors${query}`);
    return data.data;
};

export const createVendor = async (payload: any) => {
    const data = await fetchWithError(`/vendors`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return data.data;
};

export const getBills = async (): Promise<any[]> => {
    const data = await fetchWithError(`/bills`);
    return data.data;
};

export const createBill = async (payload: any) => {
    const data = await fetchWithError(`/bills`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return data.data;
};

export const recordBillPayment = async (payload: any) => {
    const data = await fetchWithError(`/bill-payments`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return data.data;
};

export const getBillPayments = async (): Promise<any[]> => {
    const data = await fetchWithError(`/bill-payments`);
    return data.data;
};

// Banking APIs
export const getBankAccounts = async (): Promise<any[]> => {
    const data = await fetchWithError(`/banking/accounts`);
    return data.data;
};

export const createBankAccount = async (payload: any) => {
    const data = await fetchWithError(`/banking/accounts`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return data.data;
};

export const getBankTransactions = async (): Promise<any[]> => {
    const data = await fetchWithError(`/banking/transactions`);
    return data.data;
};

// Automation & Mapping APIs
export const getSystemMappings = async (): Promise<any[]> => {
    const data = await fetchWithError(`/automation/mappings`);
    return data.data;
};

export const saveSystemMapping = async (payload: { mapping_key: string, account_id: number }) => {
    const data = await fetchWithError(`/automation/mappings`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return data.data;
};

// Payroll APIs
export const getSalaries = async (): Promise<any[]> => {
    const data = await fetchWithError(`/payroll/salaries`);
    return data.data;
};

export const paySalary = async (id: number) => {
    const data = await fetchWithError(`/payroll/pay/${id}`, {
        method: 'POST'
    });
    return data.data;
};

// AR / Student Fee APIs
export const getInvoices = async (params: { search?: string, status?: string } = {}): Promise<any[]> => {
    let query = '';
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (searchParams.toString()) query = `?${searchParams.toString()}`;

    const data = await fetchWithError(`/invoices${query}`);
    return data.data;
};

export const createInvoice = async (payload: any) => {
    const data = await fetchWithError(`/invoices`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return data.data;
};


export const getARSummary = async () => {
    const data = await fetchWithError(`/invoices/summary`);
    return data.data;
};

export const getPartners = async (type: string = 'customer', search?: string): Promise<any[]> => {
    let query = `?type=${type}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    const data = await fetchWithError(`/partners${query}`);
    return data.data;
};

export const createPartner = async (payload: any) => {
    const data = await fetchWithError(`/partners`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return data.data;
};

export const getAccountingSettings = async () => {
    const data = await fetchWithError(`/settings`);
    return data.data;
};

export const batchGenerateInvoices = async (installmentId: number) => {
    const data = await fetchWithError(`/fees/invoices/batch-generate`, {
        method: 'POST',
        body: JSON.stringify({ installment_id: installmentId })
    });
    return data.data;
};

export const getInstallments = async (): Promise<any[]> => {
    const data = await fetchWithError(`/fee-installments`);
    return data.data;
};

export const getInvoice = async (id: number): Promise<any> => {
    const data = await fetchWithError(`/invoices/${id}`);
    return data.data;
};

export const recordFeePayment = async (payload: any) => {
    const data = await fetchWithError(`/fee-payments`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return data.data;
};

export const updateAccountingSettings = async (payload: any) => {
    const data = await fetchWithError(`/settings`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return data.data;
};
