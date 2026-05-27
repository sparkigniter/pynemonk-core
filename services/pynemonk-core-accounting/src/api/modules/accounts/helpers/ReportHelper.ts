import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

export interface ReportFilter {
    startDate?: Date;
    endDate?: Date;
    fiscalYearId?: number;
    accountingBasis?: 'cash' | 'accrual';
    gradeId?: number;
    classroomId?: number;
    showZeroBalance?: boolean;
    comparison?: 'none' | 'prior_period' | 'prior_year';
    sourceType?: string;
    fromPartnerId?: number;
    toPartnerId?: number;
    isDetailed?: boolean;
    status?: string;
}

@injectable()
export default class ReportHelper {
    constructor(@inject("DB") private db: Pool) {}

    /**
     * Helper to resolve dates from fiscal year or filters
     */
    private async resolveDates(tenantId: number, filter: ReportFilter) {
        let start = filter.startDate || new Date(new Date().getFullYear(), 0, 1);
        let end = filter.endDate || new Date();

        if (filter.fiscalYearId) {
            const res = await this.db.query(
                `SELECT start_date, end_date FROM accounting.fiscal_year WHERE id = $1 AND tenant_id = $2`,
                [filter.fiscalYearId, tenantId]
            );
            if (res.rows[0]) {
                start = new Date(res.rows[0].start_date);
                end = new Date(res.rows[0].end_date);
            }
        }
        return { start, end };
    }

    /**
     * Trial Balance: Aggregates current balance for every account.
     */
    public async getTrialBalance(tenantId: number, filter: ReportFilter = {}): Promise<any[]> {
        const { start, end } = await this.resolveDates(tenantId, filter);
        
        let conditions = `a.tenant_id = $1 AND a.is_deleted = FALSE`;
        const params: any[] = [tenantId, end];

        const query = `
            SELECT 
                a.id,
                a.code,
                a.name,
                t.name as type_name,
                COALESCE(SUM(ji.debit), 0) as total_debit,
                COALESCE(SUM(ji.credit), 0) as total_credit,
                CASE 
                    WHEN UPPER(t.normal_balance) = 'DEBIT' THEN COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0)
                    ELSE COALESCE(SUM(ji.credit), 0) - COALESCE(SUM(ji.debit), 0)
                END as balance
            FROM accounting.chart_of_accounts a
            JOIN accounting.account_type t ON a.account_type_id = t.id
            LEFT JOIN accounting.journal_item ji ON a.id = ji.account_id AND ji.tenant_id = a.tenant_id
            LEFT JOIN accounting.journal_entry je ON ji.journal_entry_id = je.id
            WHERE ${conditions}
              AND (je.entry_date <= $2 OR je.id IS NULL)
            GROUP BY a.id, a.code, a.name, t.name, t.normal_balance
            ${filter.showZeroBalance ? '' : 'HAVING SUM(ji.debit) != 0 OR SUM(ji.credit) != 0'}
            ORDER BY a.code ASC
        `;
        const res = await this.db.query(query, params);
        return res.rows;
    }

    /**
     * Profit & Loss: Summary of Revenue and Expenses.
     */
    public async getProfitAndLoss(tenantId: number, filter: ReportFilter = {}): Promise<any> {
        const { start, end } = await this.resolveDates(tenantId, filter);
        
        let conditions = `a.tenant_id = $1 AND t.name IN ('Revenue', 'Expense') AND je.entry_date BETWEEN $2 AND $3`;
        const params: any[] = [tenantId, start, end];

        // Add Grade/Classroom filters if provided (Join through Partner/Student)
        let joinClause = ``;
        if (filter.gradeId || filter.classroomId) {
            joinClause = `
                JOIN accounting.partner p ON ji.partner_id = p.id AND ji.partner_type = 'student'
                JOIN school.student_enrollment se ON p.external_ref_id = se.student_id AND se.status = 'active'
            `;
            if (filter.classroomId) {
                conditions += ` AND se.classroom_id = $${params.length + 1}`;
                params.push(filter.classroomId);
            } else if (filter.gradeId) {
                joinClause += ` JOIN school.classroom c ON se.classroom_id = c.id`;
                conditions += ` AND c.grade_id = $${params.length + 1}`;
                params.push(filter.gradeId);
            }
        }

        const query = `
            SELECT 
                a.id,
                t.name as category,
                a.name as account_name,
                a.code,
                COALESCE(SUM(ji.credit), 0) - COALESCE(SUM(ji.debit), 0) as balance
            FROM accounting.chart_of_accounts a
            JOIN accounting.account_type t ON a.account_type_id = t.id
            JOIN accounting.journal_item ji ON a.id = ji.account_id
            JOIN accounting.journal_entry je ON ji.journal_entry_id = je.id
            ${joinClause}
            WHERE ${conditions}
            GROUP BY a.id, t.name, a.name, a.code
            ORDER BY t.name DESC, a.code ASC
        `;
        const res = await this.db.query(query, params);
        
        const revenue = res.rows.filter(r => r.category === 'Revenue');
        const expenses = res.rows.filter(r => r.category === 'Expense');
        
        const totalRevenue = revenue.reduce((sum, r) => sum + parseFloat(r.balance), 0);
        const totalExpenses = expenses.reduce((sum, r) => sum + Math.abs(parseFloat(r.balance)), 0);

        return {
            revenue,
            expenses,
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            period: { start, end }
        };
    }

    /**
     * Financial Summary: Quick overview of key metrics.
     */
    public async getSummary(tenantId: number): Promise<any> {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const pl = await this.getProfitAndLoss(tenantId, { startDate: startOfMonth, endDate: new Date() });
        
        const cashQuery = `
            SELECT COALESCE(SUM(
                CASE 
                    WHEN LOWER(t.normal_balance) = 'debit' THEN ji.debit - ji.credit
                    ELSE ji.credit - ji.debit
                END
            ), 0) as balance
            FROM accounting.chart_of_accounts a
            JOIN accounting.account_type t ON a.account_type_id = t.id
            JOIN accounting.journal_item ji ON a.id = ji.account_id
            WHERE a.tenant_id = $1 
              AND (a.name ILIKE '%bank%' OR a.name ILIKE '%cash%' OR t.name = 'Asset' AND a.code LIKE '11%')
        `;
        
        const arQuery = `
            SELECT COALESCE(SUM(due_amount), 0) as total_ar
            FROM accounting.invoice
            WHERE tenant_id = $1 AND is_deleted = FALSE AND status != 'paid'
        `;
        
        const apQuery = `
            SELECT COALESCE(SUM(due_amount), 0) as total_ap
            FROM accounting.invoice
            WHERE tenant_id = $1 AND is_deleted = FALSE AND status != 'paid' AND partner_id IN (SELECT id FROM accounting.partner WHERE type = 'vendor')
        `;

        const [cashRes, arRes, apRes] = await Promise.all([
            this.db.query(cashQuery, [tenantId]),
            this.db.query(arQuery, [tenantId]),
            this.db.query(apQuery, [tenantId])
        ]);

        return {
            revenueMTD: pl.totalRevenue,
            expensesMTD: pl.totalExpenses,
            netMarginMTD: pl.totalRevenue > 0 ? ((pl.totalRevenue - pl.totalExpenses) / pl.totalRevenue * 100).toFixed(1) : 0,
            cashOnHand: parseFloat(cashRes.rows[0].balance),
            outstandingAR: parseFloat(arRes.rows[0].total_ar),
            outstandingAP: parseFloat(apRes.rows[0].total_ap),
            trialBalanceCount: (await this.getTrialBalance(tenantId)).length
        };
    }

    /**
     * AR Aging Report: Breakdown of unpaid fee invoices by age.
     */
    public async getARAgingReport(tenantId: number, filter: ReportFilter = {}): Promise<any> {
        let conditions = `fi.tenant_id = $1 AND fi.is_deleted = FALSE`;
        const params: any[] = [tenantId];

        if (filter.status) {
            params.push(filter.status);
            conditions += ` AND fi.status = $${params.length}`;
        } else {
            conditions += ` AND fi.status != 'paid'`;
        }

        if (filter.sourceType) {
            if (filter.sourceType === 'fee') {
                conditions += ` AND fi.source_type IN ('fee', 'fee_group', 'fee_allocation')`;
            } else {
                params.push(filter.sourceType);
                conditions += ` AND fi.source_type = $${params.length}`;
            }
        }

        if (filter.fromPartnerId) {
            params.push(filter.fromPartnerId);
            conditions += ` AND fi.partner_id >= $${params.length}`;
        }

        if (filter.toPartnerId) {
            params.push(filter.toPartnerId);
            conditions += ` AND fi.partner_id <= $${params.length}`;
        }

        const query = `
            SELECT 
                p.name as partner_name,
                p.type as partner_type,
                p.external_ref_type,
                p.external_ref_id,
                SUM(CASE WHEN (CURRENT_DATE - fi.due_date) <= 30 THEN fi.due_amount ELSE 0 END) as current_30,
                SUM(CASE WHEN (CURRENT_DATE - fi.due_date) > 30 AND (CURRENT_DATE - fi.due_date) <= 60 THEN fi.due_amount ELSE 0 END) as overdue_31_60,
                SUM(CASE WHEN (CURRENT_DATE - fi.due_date) > 60 AND (CURRENT_DATE - fi.due_date) <= 90 THEN fi.due_amount ELSE 0 END) as overdue_61_90,
                SUM(CASE WHEN (CURRENT_DATE - fi.due_date) > 90 THEN fi.due_amount ELSE 0 END) as overdue_91_plus,
                SUM(fi.due_amount) as total_outstanding
            FROM accounting.invoice fi
            JOIN accounting.partner p ON fi.partner_id = p.id
            WHERE ${conditions}
            GROUP BY p.id, p.name, p.type, p.external_ref_type, p.external_ref_id
            ORDER BY total_outstanding DESC
        `;
        const res = await this.db.query(query, params);
        return res.rows;
    }

    /**
     * Detailed Receivable Ledger: Every single transaction for every partner in range.
     */
    public async getDetailedReceivables(tenantId: number, filter: ReportFilter = {}): Promise<any[]> {
        let conditions = `i.tenant_id = $1 AND i.is_deleted = FALSE`;
        const params: any[] = [tenantId];

        if (filter.fromPartnerId) {
            params.push(filter.fromPartnerId);
            conditions += ` AND i.partner_id >= $${params.length}`;
        }
        if (filter.toPartnerId) {
            params.push(filter.toPartnerId);
            conditions += ` AND i.partner_id <= $${params.length}`;
        }

        const query = `
            SELECT 
                p.name as partner_name,
                i.invoice_no,
                i.invoice_date,
                i.due_date,
                i.total_amount,
                i.paid_amount,
                i.due_amount,
                i.status,
                i.source_type
            FROM accounting.invoice i
            JOIN accounting.partner p ON i.partner_id = p.id
            WHERE ${conditions}
            ORDER BY p.name ASC, i.invoice_date DESC
        `;
        const res = await this.db.query(query, params);
        return res.rows;
    }

    /**
     * AP Aging Report: Breakdown of unpaid bills by age.
     */
    public async getAPAgingReport(tenantId: number, filter: ReportFilter = {}): Promise<any> {
        const query = `
            SELECT 
                p.name as vendor_name,
                p.id as vendor_id,
                SUM(CASE WHEN (CURRENT_DATE - fi.invoice_date) <= 30 THEN fi.due_amount ELSE 0 END) as current_30,
                SUM(CASE WHEN (CURRENT_DATE - fi.invoice_date) > 30 AND (CURRENT_DATE - fi.invoice_date) <= 60 THEN fi.due_amount ELSE 0 END) as overdue_31_60,
                SUM(CASE WHEN (CURRENT_DATE - fi.invoice_date) > 60 AND (CURRENT_DATE - fi.invoice_date) <= 90 THEN fi.due_amount ELSE 0 END) as overdue_61_90,
                SUM(CASE WHEN (CURRENT_DATE - fi.invoice_date) > 90 THEN fi.due_amount ELSE 0 END) as overdue_91_plus,
                SUM(fi.due_amount) as total_outstanding
            FROM accounting.invoice fi
            JOIN accounting.partner p ON fi.partner_id = p.id
            WHERE fi.tenant_id = $1 AND fi.status != 'paid' AND fi.is_deleted = FALSE AND p.type = 'vendor'
            GROUP BY p.id, p.name
            ORDER BY total_outstanding DESC
        `;
        const res = await this.db.query(query, [tenantId]);
        return res.rows;
    }

    /**
     * Account Ledger: Detailed transaction list for a specific account.
     */
    public async getAccountLedger(tenantId: number, accountId: number, startDate: Date, endDate: Date, filter: ReportFilter = {}): Promise<any[]> {
        const query = `
            SELECT 
                je.entry_date,
                je.reference_no,
                ji.description,
                ji.debit,
                ji.credit,
                je.id as entry_id,
                p.name as partner_name
            FROM accounting.journal_item ji
            JOIN accounting.journal_entry je ON ji.journal_entry_id = je.id
            LEFT JOIN accounting.partner p ON ji.partner_id = p.id
            WHERE ji.tenant_id = $1 AND ji.account_id = $2
              AND je.entry_date BETWEEN $3 AND $4
            ORDER BY je.entry_date ASC, je.id ASC
        `;
        const res = await this.db.query(query, [tenantId, accountId, startDate, endDate]);
        return res.rows;
    }

    /**
     * Balance Sheet: Cumulative Assets, Liabilities, and Equity.
     */
    public async getBalanceSheet(tenantId: number, filter: ReportFilter = {}): Promise<any> {
        const { start, end } = await this.resolveDates(tenantId, filter);
        
        const query = `
            SELECT 
                t.name as category,
                a.name as account_name,
                a.code,
                CASE 
                    WHEN UPPER(t.normal_balance) = 'DEBIT' THEN COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0)
                    ELSE COALESCE(SUM(ji.credit), 0) - COALESCE(SUM(ji.debit), 0)
                END as balance
            FROM accounting.chart_of_accounts a
            JOIN accounting.account_type t ON a.account_type_id = t.id
            JOIN accounting.journal_item ji ON a.id = ji.account_id
            JOIN accounting.journal_entry je ON ji.journal_entry_id = je.id
            WHERE a.tenant_id = $1 
              AND t.name IN ('Asset', 'Liability', 'Equity')
              AND je.entry_date <= $2
            GROUP BY t.name, a.name, a.code, t.normal_balance
            ORDER BY t.name ASC, a.code ASC
        `;
        const res = await this.db.query(query, [tenantId, end]);
        
        const assets = res.rows.filter(r => r.category === 'Asset');
        const liabilities = res.rows.filter(r => r.category === 'Liability');
        const equity = res.rows.filter(r => r.category === 'Equity');
        
        const totalAssets = assets.reduce((sum, r) => sum + parseFloat(r.balance), 0);
        const totalLiabilities = liabilities.reduce((sum, r) => sum + parseFloat(r.balance), 0);
        const totalEquity = equity.reduce((sum, r) => sum + parseFloat(r.balance), 0);

        // Calculate Retained Earnings
        const pl = await this.getProfitAndLoss(tenantId, { endDate: end });
        const retainedEarnings = pl.netProfit;

        return {
            assets,
            liabilities,
            equity: [...equity, { account_name: 'Retained Earnings (Net Profit)', balance: retainedEarnings }],
            totalAssets,
            totalLiabilities,
            totalEquity: totalEquity + retainedEarnings,
            isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity + retainedEarnings)) < 0.01,
            asOfDate: end
        };
    }

    /**
     * Cash Flow Statement: Summary of cash movements.
     */
    public async getCashFlow(tenantId: number, filter: ReportFilter = {}): Promise<any> {
        const { start, end } = await this.resolveDates(tenantId, filter);
        
        const query = `
            SELECT 
                ji.description,
                je.entry_date,
                ji.debit as inflow,
                ji.credit as outflow,
                a.name as account_name
            FROM accounting.journal_item ji
            JOIN accounting.journal_entry je ON ji.journal_entry_id = je.id
            JOIN accounting.chart_of_accounts a ON ji.account_id = a.id
            JOIN accounting.account_type t ON a.account_type_id = t.id
            WHERE a.tenant_id = $1 
              AND (t.name = 'Asset' AND (a.name ILIKE '%bank%' OR a.name ILIKE '%cash%'))
              AND je.entry_date BETWEEN $2 AND $3
            ORDER BY je.entry_date ASC
        `;
        const res = await this.db.query(query, [tenantId, start, end]);
        
        const totalInflow = res.rows.reduce((sum, r) => sum + parseFloat(r.inflow), 0);
        const totalOutflow = res.rows.reduce((sum, r) => sum + parseFloat(r.outflow), 0);

        return {
            activities: res.rows,
            netCashFlow: totalInflow - totalOutflow,
            totalInflow,
            totalOutflow,
            period: { start, end }
        };
    }

    /**
     * Financial Trends: Monthly aggregation of Revenue vs Expenses for the last 6 months.
     */
    public async getFinancialTrends(tenantId: number): Promise<any[]> {
        const query = `
            SELECT 
                TO_CHAR(je.entry_date, 'Mon YYYY') as month,
                SUM(CASE WHEN t.name = 'Revenue' THEN ji.credit - ji.debit ELSE 0 END) as revenue,
                SUM(CASE WHEN t.name = 'Expense' THEN ji.debit - ji.credit ELSE 0 END) as expenses
            FROM accounting.journal_entry je
            JOIN accounting.journal_item ji ON je.id = ji.journal_entry_id
            JOIN accounting.chart_of_accounts a ON ji.account_id = a.id
            JOIN accounting.account_type t ON a.account_type_id = t.id
            WHERE je.tenant_id = $1
              AND je.entry_date >= NOW() - INTERVAL '12 months'
            GROUP BY TO_CHAR(je.entry_date, 'Mon YYYY'), DATE_TRUNC('month', je.entry_date)
            ORDER BY DATE_TRUNC('month', je.entry_date) ASC
        `;
        const res = await this.db.query(query, [tenantId]);
        return res.rows;
    }

    /**
     * Template Management
     */
    public async getReportTemplates(tenantId: number, reportType?: string): Promise<any[]> {
        let query = `SELECT * FROM accounting.report_template WHERE (tenant_id = $1 OR tenant_id IS NULL)`;
        const params: any[] = [tenantId];
        
        if (reportType) {
            query += ` AND report_type = $2`;
            params.push(reportType);
        }
        
        query += ` ORDER BY is_default DESC, name ASC`;
        const res = await this.db.query(query, params);
        return res.rows;
    }

    public async upsertReportTemplate(tenantId: number, data: any): Promise<any> {
        const { name, reportType, templateHtml, templateCss, config, isDefault } = data;

        // If setting as default, unset other defaults for this report type
        if (isDefault) {
            await this.db.query(
                `UPDATE accounting.report_template SET is_default = FALSE WHERE tenant_id = $1 AND report_type = $2`,
                [tenantId, reportType]
            );
        }

        const query = `
            INSERT INTO accounting.report_template (tenant_id, report_type, name, template_html, template_css, config, is_default)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (tenant_id, report_type, name) DO UPDATE SET
                template_html = EXCLUDED.template_html,
                template_css = EXCLUDED.template_css,
                config = EXCLUDED.config,
                is_default = EXCLUDED.is_default,
                updated_at = NOW()
            RETURNING *
        `;
        const res = await this.db.query(query, [tenantId, reportType, name, templateHtml, templateCss, config, isDefault]);
        return res.rows[0];
    }
}
