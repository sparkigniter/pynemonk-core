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
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requireRole } from "../../core/middleware/requireRole.js";
import FeeInvoiceController from "../fee/controllers/FeeInvoiceController.js";
import FeePaymentController from "../fee/controllers/FeePaymentController.js";
import FeeCategoryController from "../fee/controllers/FeeCategoryController.js";
import ReceivableController from "./controllers/ReceivableController.js";

const router = Router();

// COA Routes
router.get("/coa/types", requireAuth, requireRole(["owner", "accountant", "school_admin", "principal"]), (req, res) => {
    return container.resolve(AccountController).getTypes(req, res);
});
router.get("/coa/chart", requireAuth, requireRole(["owner", "accountant", "school_admin", "principal"]), (req, res) => {
    return container.resolve(AccountController).getChart(req, res);
});
router.post("/coa/accounts", requireAuth, requireRole(["owner", "accountant"]), (req, res) => {
    return container.resolve(AccountController).createAccount(req, res);
});

// Journal Routes
router.get("/journals", requireAuth, requireRole(["owner", "accountant", "school_admin", "principal"]), (req, res) => {
    return container.resolve(JournalController).listEntries(req, res);
});
router.post("/journals", requireAuth, requireRole(["owner", "accountant"]), (req, res) => {
    return container.resolve(JournalController).createEntry(req, res);
});

// Vendor (AP) Routes
router.get("/vendors", requireAuth, requireRole(["owner", "accountant", "school_admin", "principal"]), (req, res) => {
    return container.resolve(VendorController).listVendors(req, res);
});
router.post("/vendors", requireAuth, requireRole(["owner", "accountant"]), (req, res) => {
    return container.resolve(VendorController).createVendor(req, res);
});
router.get("/bills", requireAuth, requireRole(["owner", "accountant", "school_admin", "principal"]), (req, res) => {
    return container.resolve(VendorController).listBills(req, res);
});
router.post("/bills", requireAuth, requireRole(["owner", "accountant"]), (req, res) => {
    return container.resolve(VendorController).createBill(req, res);
});
router.post("/bill-payments", requireAuth, requireRole(["owner", "accountant"]), (req, res) => {
    return container.resolve(VendorController).recordPayment(req, res);
});
router.get("/bill-payments", requireAuth, requireRole(["owner", "accountant", "school_admin", "principal"]), (req, res) => {
    return container.resolve(VendorController).listPayments(req, res);
});

// Accounts Receivable (AR) & Customer Routes
router.get("/invoices", requireAuth, requireRole(["owner", "accountant", "school_admin", "principal"]), (req, res) => {
    return container.resolve(ReceivableController).listInvoices(req, res);
});
router.post("/invoices", requireAuth, requireRole(["owner", "accountant"]), (req, res) => {
    return container.resolve(ReceivableController).createInvoice(req, res);
});

router.get("/invoices/summary", requireAuth, requireRole(["owner", "accountant", "school_admin", "principal"]), (req, res) => {
    return container.resolve(ReceivableController).getSummary(req, res);
});
router.get("/partners", requireAuth, requireRole(["owner", "accountant", "school_admin", "principal"]), (req, res) => {
    return container.resolve(ReceivableController).listPartners(req, res);
});
router.post("/partners", requireAuth, requireRole(["owner", "accountant"]), (req, res) => {
    return container.resolve(ReceivableController).createPartner(req, res);
});
router.get("/invoices/:id", requireAuth, requireRole(["owner", "accountant", "school_admin", "principal"]), (req, res) => {
    return container.resolve(FeeInvoiceController).get(req, res);
});
router.post("/fee-payments", requireAuth, requireRole(["owner", "accountant"]), (req, res) => {
    return container.resolve(FeePaymentController).create(req, res);
});
router.get("/fee-installments", requireAuth, (req, res) => {
    return container.resolve(FeeCategoryController).listInstallments(req, res);
});

// Banking Routes
router.get("/banking/accounts", requireAuth, requireRole(["owner", "accountant", "school_admin", "principal"]), (req, res) => {
    return container.resolve(BankingController).listAccounts(req, res);
});
router.post("/banking/accounts", requireAuth, requireRole(["owner", "accountant"]), (req, res) => {
    return container.resolve(BankingController).createAccount(req, res);
});
router.get("/banking/transactions", requireAuth, requireRole(["owner", "accountant", "school_admin"]), (req, res) => {
    return container.resolve(BankingController).listTransactions(req, res);
});

// Automation & Mapping Routes
router.get("/automation/mappings", requireAuth, requireRole(["owner", "accountant", "school_admin"]), (req, res) => {
    return container.resolve(AutomationController).getMappings(req, res);
});
router.post("/automation/mappings", requireAuth, requireRole(["owner", "accountant"]), (req, res) => {
    return container.resolve(AutomationController).saveMapping(req, res);
});
router.post("/automation/trigger", requireAuth, (req, res) => {
    return container.resolve(AutomationController).trigger(req, res);
});

// Payroll Routes
router.get("/payroll/salaries", requireAuth, requireRole(["owner", "accountant", "school_admin"]), (req, res) => {
    return container.resolve(PayrollController).listSalaries(req, res);
});
router.post("/payroll/generate", requireAuth, requireRole(["owner", "accountant"]), (req, res) => {
    return container.resolve(PayrollController).generate(req, res);
});
router.post("/payroll/pay/:id", requireAuth, requireRole(["owner", "accountant"]), (req, res) => {
    return container.resolve(PayrollController).pay(req, res);
});

// Report Routes
router.get("/reports/trial-balance", requireAuth, requireRole(["owner", "accountant", "principal"]), (req, res) => {
    return container.resolve(ReportController).getTrialBalance(req, res);
});
router.get("/reports/profit-loss", requireAuth, requireRole(["owner", "accountant", "principal"]), (req, res) => {
    return container.resolve(ReportController).getProfitAndLoss(req, res);
});
router.get("/reports/summary", requireAuth, requireRole(["owner", "accountant", "principal"]), (req, res) => {
    return container.resolve(ReportController).getSummary(req, res);
});
router.get("/reports/aging", requireAuth, requireRole(["owner", "accountant", "principal"]), (req, res) => {
    return container.resolve(ReportController).getAgingReport(req, res);
});
router.get("/reports/ledger", requireAuth, requireRole(["owner", "accountant", "principal"]), (req, res) => {
    return container.resolve(ReportController).getLedger(req, res);
});

// Settings Routes
router.get("/settings", requireAuth, (req, res) => {
    return container.resolve(SettingsController).getSettings(req, res);
});
router.post("/settings", requireAuth, requireRole(["owner"]), (req, res) => {
    return container.resolve(SettingsController).updateSettings(req, res);
});

export default router;
