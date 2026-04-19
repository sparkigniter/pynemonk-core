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
import FeeAdmissionListener from "./api/modules/fee/listeners/FeeAdmissionListener.js";


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
    container.register(FeeAdmissionListener, { useClass: FeeAdmissionListener });
}

export default setupDI;
