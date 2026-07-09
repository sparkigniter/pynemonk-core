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

const BASE_URL = (import.meta as any).env?.VITE_AUTH_API_URL ?? (
    typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:3000`
        : 'http://localhost:3000'
);
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

const fetchReportWithError = async (path: string, options?: RequestInit) => {
    const token = getAuthToken();
    const headers: any = {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/api/v1${path}`, {
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
    const data = await fetchReportWithError(`/reports/generate/trial_balance?format=json`);
    return data.data;
};

export const getProfitAndLoss = async (startDate?: string, endDate?: string) => {
    const query = (startDate && endDate) ? `&startDate=${startDate}&endDate=${endDate}` : '';
    const response = await fetchReportWithError(`/reports/generate/profit_loss?format=json${query}`);
    if (response.data) {
        return {
            ...response.data,
            revenue: response.data.revenue_accounts || [],
            expenses: response.data.expense_accounts || [],
            netProfit: response.data.net_profit || 0
        };
    }
    return response.data;
};

export const getAccountingSummary = async () => {
    const data = await fetchReportWithError(`/reports/generate/summary?format=json`);
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

export const getTreasuryInventory = async (): Promise<any[]> => {
    const data = await fetchWithError(`/banking/treasury`);
    return data.data;
};

export const settleTreasuryFunds = async (payload: any) => {
    const data = await fetchWithError(`/banking/settle`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
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
export const getInvoices = async (params: { search?: string, status?: string, studentId?: number | string } = {}): Promise<any[]> => {
    let query = '';
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.studentId) searchParams.append('studentId', params.studentId.toString());
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

export const getBalanceSheet = async (date?: string) => {
    const query = date ? `&endDate=${date}` : '';
    const data = await fetchReportWithError(`/reports/generate/balance_sheet?format=json${query}`);
    return data.data;
};

export const getCashFlow = async (startDate?: string, endDate?: string) => {
    const query = (startDate && endDate) ? `&startDate=${startDate}&endDate=${endDate}` : '';
    const data = await fetchReportWithError(`/reports/generate/cash_flow?format=json${query}`);
    return data.data;
};

export const getARAging = async (params: { 
    sourceType?: string, 
    fromPartnerId?: number, 
    toPartnerId?: number, 
    isDetailed?: boolean,
    status?: string 
} = {}) => {
    const searchParams = new URLSearchParams();
    searchParams.append('format', 'json');
    searchParams.append('subType', 'ar');
    if (params.sourceType) searchParams.append('sourceType', params.sourceType);
    if (params.fromPartnerId) searchParams.append('fromPartnerId', params.fromPartnerId.toString());
    if (params.toPartnerId) searchParams.append('toPartnerId', params.toPartnerId.toString());
    if (params.isDetailed) searchParams.append('isDetailed', 'true');
    if (params.status) searchParams.append('status', params.status);
    
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const data = await fetchReportWithError(`/reports/generate/aging${query}`);
    return data.data;
};

export const getAPAging = async () => {
    const data = await fetchReportWithError(`/reports/generate/aging?format=json&subType=ap`);
    return data.data;
};

export const getFinancialTrends = async (): Promise<any[]> => {
    const data = await fetchReportWithError(`/reports/generate/trends?format=json`);
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

export const getInvoice = async (id: string | number): Promise<any> => {
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

// Fiscal Year Lifecycle APIs
export const getFiscalYears = async (): Promise<any[]> => {
    const data = await fetchWithError(`/fiscal-years`);
    return data.data;
};

export const createFiscalYear = async (payload: any) => {
    const data = await fetchWithError(`/fiscal-years`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return data.data;
};

export const closeFiscalYear = async (id: number) => {
    const data = await fetchWithError(`/fiscal-years/${id}/close`, {
        method: 'POST',
    });
    return data.data;
};

export const getReportTemplates = async (reportType?: string): Promise<any[]> => {
    const query = reportType ? `?reportType=${reportType}` : '';
    const data = await fetchReportWithError(`/reports/templates${query}`);
    return data.data;
};

// Payment APIs
export const getPaymentConfig = async (): Promise<any> => {
    const data = await fetchWithError(`/payments/config`);
    return data.data ?? data;
};

export const createCheckoutSession = async (payload: { invoiceId: number, amount: number }): Promise<any> => {
    const data = await fetchWithError(`/payments/checkout-session`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return data.data ?? data;
};

export const getPaymentTransactions = async (): Promise<any[]> => {
    const data = await fetchWithError(`/payments/transactions`);
    return data.data ?? data;
};

