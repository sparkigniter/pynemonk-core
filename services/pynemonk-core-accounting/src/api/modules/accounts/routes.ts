import { Router } from "express";
import { container } from "tsyringe";
import AccountController from "./controllers/AccountController.js";
import JournalController from "./controllers/JournalController.js";
import ReportController from "./controllers/ReportController.js";
import VendorController from "./controllers/VendorController.js";
import BankingController from "./controllers/BankingController.js";
import AutomationController from "./controllers/AutomationController.js";
import PayrollController from "./controllers/PayrollController.js";
import SettingsController from "./controllers/SettingsController.js";
import FiscalYearController from "./controllers/FiscalYearController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requireRole } from "../../core/middleware/requireRole.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import FeeInvoiceController from "../fee/controllers/FeeInvoiceController.js";
import FeePaymentController from "../fee/controllers/FeePaymentController.js";
import FeeCategoryController from "../fee/controllers/FeeCategoryController.js";
import ReceivableController from "./controllers/ReceivableController.js";

const router = Router();

// ── COA Routes ──────────────────────────────────────────────────────────────
router.get("/coa/types", requireAuth, requirePermission("coa:read"), (req, res) => {
    return container.resolve(AccountController).getTypes(req, res);
});
router.get("/coa/chart", requireAuth, requirePermission("coa:read"), (req, res) => {
    return container.resolve(AccountController).getChart(req, res);
});
router.post("/coa/accounts", requireAuth, requirePermission("coa:write"), (req, res) => {
    return container.resolve(AccountController).createAccount(req, res);
});

// ── Journal Routes ──────────────────────────────────────────────────────────
router.get("/journals", requireAuth, requirePermission("journal:read"), (req, res) => {
    return container.resolve(JournalController).listEntries(req, res);
});
router.post("/journals", requireAuth, requirePermission("journal:write"), (req, res) => {
    return container.resolve(JournalController).createEntry(req, res);
});

// ── Vendor (AP) Routes ──────────────────────────────────────────────────────
router.get("/vendors", requireAuth, requirePermission("billing:read"), (req, res) => {
    return container.resolve(VendorController).listVendors(req, res);
});
router.post("/vendors", requireAuth, requirePermission("billing:write"), (req, res) => {
    return container.resolve(VendorController).createVendor(req, res);
});
router.get("/bills", requireAuth, requirePermission("billing:read"), (req, res) => {
    return container.resolve(VendorController).listBills(req, res);
});
router.post("/bills", requireAuth, requirePermission("billing:write"), (req, res) => {
    return container.resolve(VendorController).createBill(req, res);
});
router.post("/bill-payments", requireAuth, requirePermission("billing:write"), (req, res) => {
    return container.resolve(VendorController).recordPayment(req, res);
});
router.get("/bill-payments", requireAuth, requirePermission("billing:read"), (req, res) => {
    return container.resolve(VendorController).listPayments(req, res);
});

// ── Accounts Receivable (AR) & Customer Routes ─────────────────────────────
router.get("/invoices", requireAuth, requirePermission("invoice:read"), (req, res) => {
    return container.resolve(ReceivableController).listInvoices(req, res);
});
router.post("/invoices", requireAuth, requirePermission("invoice:write"), (req, res) => {
    return container.resolve(ReceivableController).createInvoice(req, res);
});
router.get("/invoices/summary", requireAuth, requirePermission("invoice:read"), (req, res) => {
    return container.resolve(ReceivableController).getSummary(req, res);
});
router.get("/partners", requireAuth, requirePermission("parent:read"), (req, res) => {
    return container.resolve(ReceivableController).listPartners(req, res);
});
router.post("/partners", requireAuth, requirePermission("parent:write"), (req, res) => {
    return container.resolve(ReceivableController).createPartner(req, res);
});
router.get("/invoices/:id", requireAuth, requirePermission("invoice:read"), (req, res) => {
    return container.resolve(FeeInvoiceController).get(req, res);
});
router.post("/fee-payments", requireAuth, requirePermission("payment:write"), (req, res) => {
    return container.resolve(FeePaymentController).create(req, res);
});
router.get("/fee-installments", requireAuth, (req, res) => {
    return container.resolve(FeeCategoryController).listInstallments(req, res);
});

// ── Banking Routes ──────────────────────────────────────────────────────────
router.get("/banking/accounts", requireAuth, requirePermission("billing:read"), (req, res) => {
    return container.resolve(BankingController).listAccounts(req, res);
});
router.post("/banking/accounts", requireAuth, requirePermission("billing:write"), (req, res) => {
    return container.resolve(BankingController).createAccount(req, res);
});
router.get("/banking/transactions", requireAuth, requirePermission("billing:read"), (req, res) => {
    return container.resolve(BankingController).listTransactions(req, res);
});
router.get("/banking/treasury", requireAuth, requirePermission("billing:read"), (req, res) => {
    return container.resolve(BankingController).getTreasuryInventory(req, res);
});
router.post("/banking/settle", requireAuth, requirePermission("billing:write"), (req, res) => {
    return container.resolve(BankingController).settleFunds(req, res);
});

// ── Automation & Mapping Routes ─────────────────────────────────────────────
router.get("/automation/mappings", requireAuth, requirePermission("settings:read"), (req, res) => {
    return container.resolve(AutomationController).getMappings(req, res);
});
router.post("/automation/mappings", requireAuth, requirePermission("settings:write"), (req, res) => {
    return container.resolve(AutomationController).saveMapping(req, res);
});
router.post("/automation/trigger", requireAuth, requirePermission("settings:write"), (req, res) => {
    return container.resolve(AutomationController).trigger(req, res);
});
router.post("/automation/late-fees/run", requireAuth, requirePermission("billing:write"), (req, res) => {
    return container.resolve(AutomationController).runLateFeeAutomation(req, res);
});
router.get("/automation/late-fees/policies", requireAuth, (req, res) => {
    return container.resolve(AutomationController).getLateFeePolicies(req, res);
});
router.post("/automation/late-fees/policies", requireAuth, requirePermission("billing:write"), (req, res) => {
    return container.resolve(AutomationController).createLateFeePolicy(req, res);
});

// ── Payroll Routes ──────────────────────────────────────────────────────────
router.get("/payroll/salaries", requireAuth, requirePermission("staff.payroll:read"), (req, res) => {
    return container.resolve(PayrollController).listSalaries(req, res);
});
router.post("/payroll/generate", requireAuth, requirePermission("staff.payroll:write"), (req, res) => {
    return container.resolve(PayrollController).generate(req, res);
});
router.post("/payroll/pay/:id", requireAuth, requirePermission("staff.payroll:write"), (req, res) => {
    return container.resolve(PayrollController).pay(req, res);
});

// ── Report Routes ───────────────────────────────────────────────────────────
router.get("/reports/trial-balance", requireAuth, requirePermission("report.financial:read"), (req, res) => {
    return container.resolve(ReportController).getTrialBalance(req, res);
});
router.get("/reports/trial-balance/export/pdf", requireAuth, requirePermission("report.financial:read"), (req, res) => {
    return container.resolve(ReportController).exportTrialBalancePDF(req, res);
});
router.get("/reports/profit-loss/export/pdf", requireAuth, requirePermission("report.financial:read"), (req, res) => {
    return container.resolve(ReportController).exportProfitLossPDF(req, res);
});
router.get("/reports/balance-sheet/export/pdf", requireAuth, requirePermission("report.financial:read"), (req, res) => {
    return container.resolve(ReportController).exportBalanceSheetPDF(req, res);
});
router.get("/reports/profit-loss", requireAuth, requirePermission("report.financial:read"), (req, res) => {
    return container.resolve(ReportController).getProfitAndLoss(req, res);
});
router.get("/reports/summary", requireAuth, requirePermission("report.financial:read"), (req, res) => {
    return container.resolve(ReportController).getSummary(req, res);
});
router.get("/reports/aging/ar", requireAuth, requirePermission("report.financial:read"), (req, res) => {
    return container.resolve(ReportController).getARAgingReport(req, res);
});
router.get("/reports/aging", requireAuth, requirePermission("report.financial:read"), (req, res) => {
    return container.resolve(ReportController).getAgingReport(req, res);
});
router.get("/reports/ledger", requireAuth, requirePermission("report.financial:read"), (req, res) => {
    return container.resolve(ReportController).getLedger(req, res);
});
router.get("/reports/balance-sheet", requireAuth, requirePermission("report.financial:read"), (req, res) => {
    return container.resolve(ReportController).getBalanceSheet(req, res);
});
router.get("/reports/cash-flow", requireAuth, requirePermission("report.financial:read"), (req, res) => {
    return container.resolve(ReportController).getCashFlow(req, res);
});
router.get("/reports/trends", requireAuth, requirePermission("report.financial:read"), (req, res) => {
    return container.resolve(ReportController).getTrends(req, res);
});
router.get("/reports/templates", requireAuth, requirePermission("report.financial:read"), (req, res) => {
    return container.resolve(ReportController).getTemplates(req, res);
});
router.post("/reports/templates", requireAuth, requirePermission("settings:write"), (req, res) => {
    return container.resolve(ReportController).saveTemplate(req, res);
});

// ── Settings Routes ─────────────────────────────────────────────────────────
router.get("/settings", requireAuth, requirePermission("settings:read"), (req, res) => {
    return container.resolve(SettingsController).getSettings(req, res);
});
router.post("/settings", requireAuth, requirePermission("settings:write"), (req, res) => {
    return container.resolve(SettingsController).updateSettings(req, res);
});

// ── Fiscal Year Routes ──────────────────────────────────────────────────────
router.get("/fiscal-years", requireAuth, (req, res) => {
    return container.resolve(FiscalYearController).listFiscalYears(req, res);
});
router.post("/fiscal-years", requireAuth, requirePermission("settings:write"), (req, res) => {
    return container.resolve(FiscalYearController).createFiscalYear(req, res);
});
router.post("/fiscal-years/:id/close", requireAuth, requirePermission("settings:write"), (req, res) => {
    return container.resolve(FiscalYearController).closeYear(req, res);
});

export default router;
