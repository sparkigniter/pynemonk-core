import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

export interface ReportFilter {
    startDate?: Date;
    endDate?: Date;
    fiscalYearId?: number;
    accountingBasis?: "cash" | "accrual";
    gradeId?: number;
    classroomId?: number;
    showZeroBalance?: boolean;
    comparison?: "none" | "prior_period" | "prior_year";
    sourceType?: string;
    fromPartnerId?: number;
    toPartnerId?: number;
    isDetailed?: boolean;
    status?: string;
    examId?: number;
    studentId?: number;
}

@injectable()
export default class ReportService {
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
            ${filter.showZeroBalance ? "" : "HAVING SUM(ji.debit) != 0 OR SUM(ji.credit) != 0"}
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
        
        const revenue = res.rows.filter((r) => r.category === "Revenue");
        const expenses = res.rows.filter((r) => r.category === "Expense");
        
        const totalRevenue = revenue.reduce((sum, r) => sum + parseFloat(r.balance), 0);
        const totalExpenses = expenses.reduce((sum, r) => sum + Math.abs(parseFloat(r.balance)), 0);

        return {
            revenue_accounts: revenue,
            expense_accounts: expenses,
            totalRevenue,
            totalExpenses,
            net_profit: totalRevenue - totalExpenses,
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
            netMarginMTD: pl.totalRevenue > 0 ? (((pl.totalRevenue - pl.totalExpenses) / pl.totalRevenue) * 100).toFixed(1) : 0,
            cashOnHand: parseFloat(cashRes.rows[0].balance),
            outstandingAR: parseFloat(arRes.rows[0].total_ar),
            outstandingAP: parseFloat(apRes.rows[0].total_ap),
            trialBalanceCount: (await this.getTrialBalance(tenantId)).length
        };
    }

    /**
     * AR Aging Report: Breakdown of unpaid fee invoices by age.
     */
    public async getARAgingReport(tenantId: number, filter: ReportFilter = {}): Promise<any[]> {
        let conditions = `fi.tenant_id = $1 AND fi.is_deleted = FALSE`;
        const params: any[] = [tenantId];

        if (filter.status) {
            params.push(filter.status);
            conditions += ` AND fi.status = $${params.length}`;
        } else {
            conditions += ` AND fi.status != 'paid'`;
        }

        if (filter.sourceType) {
            if (filter.sourceType === "fee") {
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
    public async getAPAgingReport(tenantId: number): Promise<any[]> {
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
    public async getAccountLedger(
        tenantId: number,
        accountId: number,
        startDate: Date,
        endDate: Date
    ): Promise<any[]> {
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
        
        const assets = res.rows.filter((r) => r.category === "Asset");
        const liabilities = res.rows.filter((r) => r.category === "Liability");
        const equity = res.rows.filter((r) => r.category === "Equity");
        
        const totalAssets = assets.reduce((sum, r) => sum + parseFloat(r.balance), 0);
        const totalLiabilities = liabilities.reduce((sum, r) => sum + parseFloat(r.balance), 0);
        const totalEquity = equity.reduce((sum, r) => sum + parseFloat(r.balance), 0);

        // Calculate Retained Earnings from P&L
        const pl = await this.getProfitAndLoss(tenantId, { endDate: end });
        const retainedEarnings = pl.net_profit;

        return {
            assets,
            liabilities,
            equity: [...equity, { account_name: "Retained Earnings (Net Profit)", balance: retainedEarnings }],
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
     * Financial Trends: Monthly aggregation of Revenue vs Expenses for the last 12 months.
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
     * Student Grades: Aggregates academic grades for student report cards.
     */
    public async getStudentGrades(tenantId: number, filter: any = {}): Promise<any> {
        const { examId, studentId, classroomId } = filter;
        
        if (!examId) {
            throw new Error("Missing required 'examId' filter for Student Grades report.");
        }

        if (classroomId) {
            // Get all student report cards for a classroom
            const studentsQuery = `
                SELECT s.id 
                FROM school.student s
                JOIN school.student_enrollment se ON s.id = se.student_id
                WHERE s.tenant_id = $1 AND se.classroom_id = $2 AND se.status = 'active' AND se.is_deleted = FALSE
            `;
            const studentRes = await this.db.query(studentsQuery, [tenantId, classroomId]);
            const reportCards = [];
            for (const student of studentRes.rows) {
                const card = await this.getReportCardData(tenantId, Number(examId), student.id);
                if (card) reportCards.push(card);
            }
            return reportCards;
        } else if (studentId) {
            return this.getReportCardData(tenantId, Number(examId), Number(studentId));
        }

        throw new Error("Missing both 'studentId' and 'classroomId' filters. Must specify one to load student grades.");
    }

    /**
     * Helper to load individual student report card data
     */
    public async getReportCardData(tenantId: number, examId: number, studentId: number) {
        const query = `
            SELECT 
                s.first_name, s.last_name, s.admission_no,
                c.name as classroom_name,
                g.name as grade_name,
                e.name as exam_name,
                e.exam_type,
                sub.name as subject_name,
                sub.code as subject_code,
                ep.max_marks,
                ep.passing_marks,
                em.marks_obtained,
                em.is_absent,
                em.remarks,
                ay.name as academic_year
            FROM school.student s
            JOIN school.student_enrollment se ON s.id = se.student_id
            JOIN school.classroom c ON se.classroom_id = c.id
            JOIN school.grade g ON c.grade_id = g.id
            JOIN school.academic_year ay ON se.academic_year_id = ay.id
            CROSS JOIN school.exam e
            JOIN school.exam_paper ep ON e.id = ep.exam_id
            JOIN school.subject sub ON ep.subject_id = sub.id AND sub.grade_id = g.id
            LEFT JOIN school.exam_marks em ON ep.id = em.paper_id AND em.student_id = s.id
            WHERE s.tenant_id = $1 AND e.id = $2 AND s.id = $3
              AND se.status = 'active' AND se.is_deleted = FALSE
        `;
        
        const res = await this.db.query(query, [tenantId, examId, studentId]);
        if (res.rows.length === 0) return null;

        const first = res.rows[0];
        const report = {
            student: {
                id: studentId,
                name: `${first.first_name} ${first.last_name}`,
                admission_no: first.admission_no,
                classroom: first.classroom_name,
                grade: first.grade_name,
                academic_year: first.academic_year
            },
            exam: {
                id: examId,
                name: first.exam_name,
                type: first.exam_type
            },
            subjects: res.rows.map((r) => ({
                name: r.subject_name,
                code: r.subject_code,
                max: r.max_marks,
                passing: r.passing_marks,
                obtained: r.marks_obtained || 0,
                is_absent: r.is_absent,
                remarks: r.remarks,
                status: r.is_absent ? "ABSENT" : (r.marks_obtained >= r.passing_marks ? "PASS" : "FAIL")
            })),
            summary: {
                total_max: 0,
                total_obtained: 0,
                percentage: 0,
                result: "PASS"
            }
        };

        report.summary.total_max = report.subjects.reduce((sum, s) => sum + Number(s.max), 0);
        report.summary.total_obtained = report.subjects.reduce((sum, s) => sum + Number(s.obtained), 0);
        report.summary.percentage = Number(
            report.summary.total_max > 0 
                ? ((report.summary.total_obtained / report.summary.total_max) * 100).toFixed(2)
                : 0
        );
        
        if (report.subjects.some((s) => s.status === "FAIL")) {
            report.summary.result = "FAIL";
        }

        return report;
    }

    /**
     * Template Management inside reports.template schema
     */
    public async getReportTemplates(tenantId: number, reportType?: string): Promise<any[]> {
        let query = `SELECT * FROM reports.template WHERE (tenant_id = $1 OR tenant_id = 0)`;
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

        // If setting as default, unset other defaults for this report type and tenant
        if (isDefault) {
            await this.db.query(
                `UPDATE reports.template SET is_default = FALSE WHERE tenant_id = $1 AND report_type = $2`,
                [tenantId, reportType]
            );
        }

        const query = `
            INSERT INTO reports.template (tenant_id, report_type, name, template_html, template_css, config, is_default)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (tenant_id, report_type, name) DO UPDATE SET
                template_html = EXCLUDED.template_html,
                template_css = EXCLUDED.template_css,
                config = EXCLUDED.config,
                is_default = EXCLUDED.is_default,
                updated_at = NOW()
            RETURNING *
        `;
        const res = await this.db.query(query, [
            tenantId,
            reportType,
            name,
            templateHtml,
            templateCss,
            config || "{}",
            !!isDefault
        ]);
        return res.rows[0];
    }

    /**
     * Maps raw SQL outputs into clean format with items, columns, and totals for exporters.
     */
    public prepareExportData(reportType: string, rawData: any, subType?: string): any {
        if (reportType === "trial_balance") {
            const data = rawData;
            const totals = data.reduce((acc: any, a: any) => {
                acc.total_debit += parseFloat(a.total_debit || 0);
                acc.total_credit += parseFloat(a.total_credit || 0);
                return acc;
            }, { total_debit: 0, total_credit: 0 });

            return {
                items: data,
                columns: [
                    { key: "code", label: "Code" },
                    { key: "name", label: "Account" },
                    { key: "type_name", label: "Type" },
                    { key: "total_debit", label: "Debit", align: "right" },
                    { key: "total_credit", label: "Credit", align: "right" },
                    { key: "balance", label: "Balance", align: "right" }
                ],
                totals: {
                    total_debit: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totals.total_debit),
                    total_credit: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totals.total_credit)
                }
            };
        } else if (reportType === "profit_loss") {
            const items = [
                ...rawData.revenue_accounts.map((a: any) => ({ ...a, type: "Income" })),
                ...rawData.expense_accounts.map((a: any) => ({ ...a, type: "Expense" }))
            ];
            return {
                items,
                columns: [
                    { key: "code", label: "Code" },
                    { key: "name", label: "Account" },
                    { key: "type", label: "Category" },
                    { key: "balance", label: "Amount", align: "right" }
                ],
                totals: {
                    balance: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(rawData.net_profit)
                }
            };
        } else if (reportType === "balance_sheet") {
            const items = [
                ...rawData.assets.map((a: any) => ({ ...a, type: "Asset" })),
                ...rawData.liabilities.map((a: any) => ({ ...a, type: "Liability" })),
                ...rawData.equity.map((a: any) => ({ ...a, type: "Equity" }))
            ];
            return {
                items,
                columns: [
                    { key: "code", label: "Code" },
                    { key: "name", label: "Account" },
                    { key: "type", label: "Category" },
                    { key: "balance", label: "Balance", align: "right" }
                ],
                totals: {
                    balance: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(rawData.totalEquity)
                }
            };
        } else if (reportType === "cash_flow") {
            return {
                items: rawData.activities,
                columns: [
                    { key: "entry_date", label: "Date" },
                    { key: "account_name", label: "Account" },
                    { key: "description", label: "Description" },
                    { key: "inflow", label: "Inflow", align: "right" },
                    { key: "outflow", label: "Outflow", align: "right" }
                ],
                totals: {
                    inflow: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(rawData.totalInflow),
                    outflow: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(rawData.totalOutflow)
                }
            };
        } else if (reportType === "aging") {
            if (subType === "ap") {
                return {
                    items: rawData,
                    columns: [
                        { key: "vendor_name", label: "Vendor" },
                        { key: "current_30", label: "0-30 Days", align: "right" },
                        { key: "overdue_31_60", label: "31-60 Days", align: "right" },
                        { key: "overdue_61_90", label: "61-90 Days", align: "right" },
                        { key: "overdue_91_plus", label: "91+ Days", align: "right" },
                        { key: "total_outstanding", label: "Total Outstanding", align: "right" }
                    ]
                };
            } else {
                return {
                    items: rawData,
                    columns: [
                        { key: "partner_name", label: "Partner" },
                        { key: "current_30", label: "0-30 Days", align: "right" },
                        { key: "overdue_31_60", label: "31-60 Days", align: "right" },
                        { key: "overdue_61_90", label: "61-90 Days", align: "right" },
                        { key: "overdue_91_plus", label: "91+ Days", align: "right" },
                        { key: "total_outstanding", label: "Total Outstanding", align: "right" }
                    ]
                };
            }
        } else if (reportType === "student_grades") {
            if (Array.isArray(rawData)) {
                return {
                    items: rawData.map((c: any) => ({
                        student_name: c.student.name,
                        admission_no: c.student.admission_no,
                        classroom: c.student.classroom,
                        total_max: c.summary.total_max,
                        total_obtained: c.summary.total_obtained,
                        percentage: c.summary.percentage + "%",
                        result: c.summary.result
                    })),
                    columns: [
                        { key: "student_name", label: "Student" },
                        { key: "admission_no", label: "Adm No" },
                        { key: "classroom", label: "Classroom" },
                        { key: "total_max", label: "Max Marks", align: "right" },
                        { key: "total_obtained", label: "Obtained", align: "right" },
                        { key: "percentage", label: "Percentage", align: "right" },
                        { key: "result", label: "Result" }
                    ]
                };
            } else {
                return {
                    items: rawData.subjects,
                    columns: [
                        { key: "name", label: "Subject" },
                        { key: "code", label: "Code" },
                        { key: "max", label: "Max Marks", align: "right" },
                        { key: "passing", label: "Passing Marks", align: "right" },
                        { key: "obtained", label: "Obtained", align: "right" },
                        { key: "status", label: "Status" }
                    ],
                    totals: {
                        obtained: `Result: ${rawData.summary.result} | Percent: ${rawData.summary.percentage}%`
                    }
                };
            }
        }
        return rawData;
    }
}
