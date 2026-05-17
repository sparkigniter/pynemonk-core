import { Response } from "express";
import { injectable, inject } from "tsyringe";
import ReportHelper from "../helpers/ReportHelper.js";
import ExportHelper from "../helpers/ExportHelper.js";
import BaseController from "../../../core/controllers/BaseController.js";
import { AuthenticatedRequest } from "../../../core/middleware/requireAuth.js";

@injectable()
export default class ReportController extends BaseController {
    constructor(
        @inject(ReportHelper) private reportHelper: ReportHelper,
        @inject(ExportHelper) private exportHelper: ExportHelper
    ) {
        super();
    }

    public getTrialBalance = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const filter = {
                fiscalYearId: req.query.fiscalYearId ? Number(req.query.fiscalYearId) : undefined,
                showZeroBalance: req.query.showZeroBalance === 'true'
            };
            const report = await this.reportHelper.getTrialBalance(tenantId, filter);

            if (req.query.exportFormat === 'csv') {
                const csv = this.exportHelper.generateCSV(report, [
                    { key: 'code', label: 'Code' },
                    { key: 'name', label: 'Account Name' },
                    { key: 'type_name', label: 'Type' },
                    { key: 'total_debit', label: 'Debit' },
                    { key: 'total_credit', label: 'Credit' },
                    { key: 'balance', label: 'Balance' }
                ]);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=trial_balance_${new Date().toISOString().split('T')[0]}.csv`);
                return res.send(csv);
            }

            return this.ok(res, "Trial Balance retrieved", report);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public getProfitAndLoss = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const filter = {
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
                fiscalYearId: req.query.fiscalYearId ? Number(req.query.fiscalYearId) : undefined,
                gradeId: req.query.gradeId ? Number(req.query.gradeId) : undefined,
                classroomId: req.query.classroomId ? Number(req.query.classroomId) : undefined
            };
            
            const data = await this.reportHelper.getProfitAndLoss(tenantId, filter);
            return this.ok(res, "Profit and Loss statement retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public getSummary = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const summary = await this.reportHelper.getSummary(tenantId);
            return this.ok(res, "Summary retrieved", summary);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public getARAgingReport = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const filter = {
                gradeId: req.query.gradeId ? Number(req.query.gradeId) : undefined,
                sourceType: req.query.sourceType as string,
                fromPartnerId: req.query.fromPartnerId ? Number(req.query.fromPartnerId) : undefined,
                toPartnerId: req.query.toPartnerId ? Number(req.query.toPartnerId) : undefined,
                isDetailed: req.query.isDetailed === 'true',
                status: req.query.status as string
            };

            if (filter.isDetailed) {
                const report = await this.reportHelper.getDetailedReceivables(tenantId, filter);
                return this.ok(res, "Detailed AR report retrieved", report);
            }

            const report = await this.reportHelper.getARAgingReport(tenantId, filter);
            return this.ok(res, "AR Aging report retrieved", report);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public getAgingReport = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const report = await this.reportHelper.getAPAgingReport(tenantId);
            return this.ok(res, "Aging report retrieved", report);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public getLedger = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const { account_id, start_date, end_date } = req.query;
            const ledger = await this.reportHelper.getAccountLedger(
                tenantId, 
                Number(account_id), 
                new Date(start_date as string), 
                new Date(end_date as string)
            );
            return this.ok(res, "Ledger retrieved", ledger);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public getBalanceSheet = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const filter = {
                endDate: req.query.date ? new Date(req.query.date as string) : undefined,
                fiscalYearId: req.query.fiscalYearId ? Number(req.query.fiscalYearId) : undefined
            };
            const data = await this.reportHelper.getBalanceSheet(tenantId, filter);
            return this.ok(res, "Balance Sheet retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public getCashFlow = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const filter = {
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
                fiscalYearId: req.query.fiscalYearId ? Number(req.query.fiscalYearId) : undefined
            };
            const data = await this.reportHelper.getCashFlow(tenantId, filter);
            return this.ok(res, "Cash Flow Statement retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public getTrends = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const trends = await this.reportHelper.getFinancialTrends(tenantId);
            return this.ok(res, "Financial trends retrieved", trends);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public getTemplates = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const reportType = req.query.reportType as string;
            const templates = await this.reportHelper.getReportTemplates(tenantId, reportType);
            return this.ok(res, "Report templates retrieved", templates);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public saveTemplate = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const { name, reportType, html, css, settings, isDefault } = req.body;
            
            const template = await this.reportHelper.upsertReportTemplate(tenantId, {
                name,
                reportType,
                templateHtml: html,
                templateCss: css,
                config: settings,
                isDefault: !!isDefault
            });

            return this.ok(res, "Report template saved successfully", template);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public exportTrialBalancePDF = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const filter = {
                fiscalYearId: req.query.fiscalYearId ? Number(req.query.fiscalYearId) : undefined,
                showZeroBalance: req.query.showZeroBalance === 'true'
            };

            const data = await this.reportHelper.getTrialBalance(tenantId, filter);
            const totals = data.reduce((acc, a) => {
                acc.total_debit += parseFloat(a.total_debit);
                acc.total_credit += parseFloat(a.total_credit);
                return acc;
            }, { total_debit: 0, total_credit: 0 });

            const templates = await this.reportHelper.getReportTemplates(tenantId, 'trial_balance');
            const template = templates.find(t => t.is_default) || templates[0];
            
            if (!template) return this.badrequest(res, "No template found for Trial Balance. Please create one in Designer.");

            const pdf = await this.exportHelper.generatePDF({
                items: data,
                columns: [
                    { key: 'code', label: 'Code' },
                    { key: 'name', label: 'Account' },
                    { key: 'type_name', label: 'Type' },
                    { key: 'total_debit', label: 'Debit', align: 'right' },
                    { key: 'total_credit', label: 'Credit', align: 'right' }
                ],
                totals: {
                    total_debit: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.total_debit),
                    total_credit: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.total_credit)
                }
            }, template.id, tenantId);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', pdf.length);
            res.setHeader('Content-Disposition', `attachment; filename=trial_balance_${new Date().toISOString().split('T')[0]}.pdf`);
            return res.end(pdf, 'binary');
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public exportProfitLossPDF = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const filter = {
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
                fiscalYearId: req.query.fiscalYearId ? Number(req.query.fiscalYearId) : undefined
            };

            const data = await this.reportHelper.getProfitAndLoss(tenantId, filter);
            
            // Flatten income and expense accounts for the table
            const items = [
                ...data.income_accounts.map((a: any) => ({ ...a, type: 'Income' })),
                ...data.expense_accounts.map((a: any) => ({ ...a, type: 'Expense' }))
            ];

            const templates = await this.reportHelper.getReportTemplates(tenantId, 'profit_loss');
            const template = templates.find(t => t.is_default) || templates[0];
            
            if (!template) return this.badrequest(res, "No template found for Profit & Loss. Please create one in Designer.");

            const pdf = await this.exportHelper.generatePDF({
                items,
                columns: [
                    { key: 'code', label: 'Code' },
                    { key: 'name', label: 'Account' },
                    { key: 'type', label: 'Category' },
                    { key: 'balance', label: 'Amount', align: 'right' }
                ],
                totals: {
                    net_profit: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.net_profit)
                }
            }, template.id, tenantId);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', pdf.length);
            res.setHeader('Content-Disposition', `attachment; filename=profit_loss_${new Date().toISOString().split('T')[0]}.pdf`);
            return res.end(pdf, 'binary');
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public exportBalanceSheetPDF = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const filter = {
                endDate: req.query.date ? new Date(req.query.date as string) : undefined,
                fiscalYearId: req.query.fiscalYearId ? Number(req.query.fiscalYearId) : undefined
            };

            const data = await this.reportHelper.getBalanceSheet(tenantId, filter);
            
            const items = [
                ...data.assets.map((a: any) => ({ ...a, type: 'Asset' })),
                ...data.liabilities.map((a: any) => ({ ...a, type: 'Liability' })),
                ...data.equity.map((a: any) => ({ ...a, type: 'Equity' }))
            ];

            const templates = await this.reportHelper.getReportTemplates(tenantId, 'balance_sheet');
            const template = templates.find(t => t.is_default) || templates[0];
            
            if (!template) return this.badrequest(res, "No template found for Balance Sheet. Please create one in Designer.");

            const pdf = await this.exportHelper.generatePDF({
                items,
                columns: [
                    { key: 'code', label: 'Code' },
                    { key: 'name', label: 'Account' },
                    { key: 'type', label: 'Category' },
                    { key: 'balance', label: 'Balance', align: 'right' }
                ],
                totals: {
                    total_assets: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.total_assets),
                    total_liabilities: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.total_liabilities + data.total_equity)
                }
            }, template.id, tenantId);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', pdf.length);
            res.setHeader('Content-Disposition', `attachment; filename=balance_sheet_${new Date().toISOString().split('T')[0]}.pdf`);
            return res.end(pdf, 'binary');
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };
}
