import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class ReportHelper {
    constructor(@inject("DB") private db: Pool) {}

    /**
     * Trial Balance: Aggregates current balance for every account.
     */
    public async getTrialBalance(tenantId: number): Promise<any[]> {
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
            WHERE a.tenant_id = $1 AND a.is_deleted = FALSE
            GROUP BY a.id, a.code, a.name, t.name, t.normal_balance
            HAVING SUM(ji.debit) IS NOT NULL OR SUM(ji.credit) IS NOT NULL
            ORDER BY a.code ASC
        `;
        const res = await this.db.query(query, [tenantId]);
        return res.rows;
    }

    /**
     * Profit & Loss: Summary of Revenue and Expenses.
     */
    public async getProfitAndLoss(tenantId: number, startDate: Date, endDate: Date): Promise<any> {
        const query = `
            SELECT 
                t.name as category,
                a.name as account_name,
                a.code,
                COALESCE(SUM(ji.credit), 0) - COALESCE(SUM(ji.debit), 0) as balance
            FROM accounting.chart_of_accounts a
            JOIN accounting.account_type t ON a.account_type_id = t.id
            JOIN accounting.journal_item ji ON a.id = ji.account_id
            JOIN accounting.journal_entry je ON ji.journal_entry_id = je.id
            WHERE a.tenant_id = $1 
              AND t.name IN ('Revenue', 'Expense')
              AND je.entry_date BETWEEN $2 AND $3
            GROUP BY t.name, a.name, a.code
            ORDER BY t.name DESC, a.code ASC
        `;
        const res = await this.db.query(query, [tenantId, startDate, endDate]);
        
        const revenue = res.rows.filter(r => r.category === 'Revenue');
        const expenses = res.rows.filter(r => r.category === 'Expense');
        
        const totalRevenue = revenue.reduce((sum, r) => sum + parseFloat(r.balance), 0);
        const totalExpenses = expenses.reduce((sum, r) => sum + Math.abs(parseFloat(r.balance)), 0);

        return {
            revenue,
            expenses,
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses
        };
    }

    /**
     * Financial Summary: Quick overview of key metrics.
     */
    public async getSummary(tenantId: number): Promise<any> {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        
        // 1. Revenue & Expenses MTD
        const pl = await this.getProfitAndLoss(tenantId, startOfMonth, new Date());
        
        // 2. Cash on Hand (Sum of all Bank Accounts balances)
        // We look at the GL accounts linked to bank accounts
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
        
        // 3. Accounts Receivable (Outstanding Fees)
        const arQuery = `
            SELECT COALESCE(SUM(due_amount), 0) as total_ar
            FROM accounting.fee_invoice
            WHERE tenant_id = $1 AND is_deleted = FALSE AND status != 'paid'
        `;
        
        // 4. Accounts Payable (Unpaid Bills)
        const apQuery = `
            SELECT COALESCE(SUM(total_amount - paid_amount), 0) as total_ap
            FROM accounting.vendor_bill
            WHERE tenant_id = $1 AND is_deleted = FALSE AND status != 'paid'
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
     * AP Aging Report: Breakdown of unpaid bills by age.
     */
    public async getAPAgingReport(tenantId: number): Promise<any> {
        const query = `
            SELECT 
                v.name as vendor_name,
                v.code as vendor_code,
                SUM(CASE WHEN (CURRENT_DATE - je.entry_date) <= 30 THEN (vb.total_amount - vb.paid_amount) ELSE 0 END) as current_30,
                SUM(CASE WHEN (CURRENT_DATE - je.entry_date) > 30 AND (CURRENT_DATE - je.entry_date) <= 60 THEN (vb.total_amount - vb.paid_amount) ELSE 0 END) as overdue_31_60,
                SUM(CASE WHEN (CURRENT_DATE - je.entry_date) > 60 AND (CURRENT_DATE - je.entry_date) <= 90 THEN (vb.total_amount - vb.paid_amount) ELSE 0 END) as overdue_61_90,
                SUM(CASE WHEN (CURRENT_DATE - je.entry_date) > 90 THEN (vb.total_amount - vb.paid_amount) ELSE 0 END) as overdue_91_plus,
                SUM(vb.total_amount - vb.paid_amount) as total_outstanding
            FROM accounting.vendor_bill vb
            JOIN accounting.vendor v ON vb.vendor_id = v.id
            JOIN accounting.journal_entry je ON vb.journal_entry_id = je.id
            WHERE vb.tenant_id = $1 AND vb.status != 'paid' AND vb.is_deleted = FALSE
            GROUP BY v.id, v.name, v.code
            ORDER BY total_outstanding DESC
        `;
        const res = await this.db.query(query, [tenantId]);
        return res.rows;
    }

    /**
     * Account Ledger: Detailed transaction list for a specific account.
     */
    public async getAccountLedger(tenantId: number, accountId: number, startDate: Date, endDate: Date): Promise<any[]> {
        const query = `
            SELECT 
                je.entry_date,
                je.reference_no,
                ji.description,
                ji.debit,
                ji.credit,
                je.id as entry_id
            FROM accounting.journal_item ji
            JOIN accounting.journal_entry je ON ji.journal_entry_id = je.id
            WHERE ji.tenant_id = $1 AND ji.account_id = $2
              AND je.entry_date BETWEEN $3 AND $4
            ORDER BY je.entry_date ASC, je.id ASC
        `;
        const res = await this.db.query(query, [tenantId, accountId, startDate, endDate]);
        return res.rows;
    }

    /**
     * Partner Ledger: Detailed transaction list for a specific student or vendor.
     */
    public async getPartnerLedger(tenantId: number, partnerType: 'student' | 'vendor', partnerId: number, startDate: Date, endDate: Date): Promise<any[]> {
        const query = `
            SELECT 
                je.entry_date,
                je.reference_no,
                ji.description,
                ji.debit,
                ji.credit,
                a.name as account_name,
                je.id as entry_id
            FROM accounting.journal_item ji
            JOIN accounting.journal_entry je ON ji.journal_entry_id = je.id
            JOIN accounting.chart_of_accounts a ON ji.account_id = a.id
            WHERE ji.tenant_id = $1 
              AND ji.partner_type = $2 AND ji.partner_id = $3
              AND je.entry_date BETWEEN $4 AND $5
            ORDER BY je.entry_date ASC, je.id ASC
        `;
        const res = await this.db.query(query, [tenantId, partnerType, partnerId, startDate, endDate]);
        return res.rows;
    }
}
