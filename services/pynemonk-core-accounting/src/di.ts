import "reflect-metadata";
import { container } from "tsyringe";
import pool from "./db/pg-pool.js";

import FeeCategoryHelper from "./api/modules/fee/helpers/FeeCategoryHelper.js";
import FeeCategoryValidator from "./api/modules/fee/validator/FeeCategoryValidator.js";
import FeeCategoryService from "./api/modules/fee/services/FeeCategoryService.js";
import FeeCategoryController from "./api/modules/fee/controllers/FeeCategoryController.js";
import FeePaymentHelper from "./api/modules/fee/helpers/FeePaymentHelper.js";
import FeePaymentService from "./api/modules/fee/services/FeePaymentService.js";
import FeePaymentController from "./api/modules/fee/controllers/FeePaymentController.js";


import AccountHelper from "./api/modules/accounts/helpers/AccountHelper.js";
import JournalHelper from "./api/modules/accounts/helpers/JournalHelper.js";
import VendorHelper from "./api/modules/accounts/helpers/VendorHelper.js";
import BankingHelper from "./api/modules/accounts/helpers/BankingHelper.js";
import SystemMappingHelper from "./api/modules/accounts/helpers/SystemMappingHelper.js";
import PayrollHelper from "./api/modules/accounts/helpers/PayrollHelper.js";

import AccountingAutomationSubscriber from "./api/modules/accounts/subscribers/AccountingAutomationSubscriber.js";

import AccountController from "./api/modules/accounts/controllers/AccountController.js";
import JournalController from "./api/modules/accounts/controllers/JournalController.js";
import VendorController from "./api/modules/accounts/controllers/VendorController.js";
import BankingController from "./api/modules/accounts/controllers/BankingController.js";
import AutomationController from "./api/modules/accounts/controllers/AutomationController.js";
import PayrollController from "./api/modules/accounts/controllers/PayrollController.js";
import ReportController from "./api/modules/accounts/controllers/ReportController.js";


function setupDI(): void {
    // ── Infrastructure ──────────────────────────────────────────────────────
    container.registerInstance("DB", pool);

    // ── Fee Module ────────────────────────────────────────────────────────
    container.register(FeeCategoryHelper, { useClass: FeeCategoryHelper });
    container.register(FeeCategoryValidator, { useClass: FeeCategoryValidator });
    container.register(FeeCategoryService, { useClass: FeeCategoryService });
    container.register(FeeCategoryController, { useClass: FeeCategoryController });
    container.register(FeePaymentHelper, { useClass: FeePaymentHelper });
    container.register(FeePaymentService, { useClass: FeePaymentService });
    container.register(FeePaymentController, { useClass: FeePaymentController });


    // ── Accounts Module ──────────────────────────────────────────────────
    container.register(AccountHelper, { useClass: AccountHelper });
    container.register(JournalHelper, { useClass: JournalHelper });
    container.register(VendorHelper, { useClass: VendorHelper });
    container.register(BankingHelper, { useClass: BankingHelper });
    container.register(SystemMappingHelper, { useClass: SystemMappingHelper });
    container.register(PayrollHelper, { useClass: PayrollHelper });

    container.register(AccountingAutomationSubscriber, { useClass: AccountingAutomationSubscriber });

    container.register(AccountController, { useClass: AccountController });
    container.register(JournalController, { useClass: JournalController });
    container.register(VendorController, { useClass: VendorController });
    container.register(BankingController, { useClass: BankingController });
    container.register(AutomationController, { useClass: AutomationController });
    container.register(PayrollController, { useClass: PayrollController });
    container.register(ReportController, { useClass: ReportController });
}

export default setupDI;
