import * as express from "express";
import { container } from "tsyringe";
import PayrollController from "./controllers/PayrollController.js";
import { requireAuth } from "../../../api/core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";

const payrollRouter = express.Router();

payrollRouter.post("/staff/:staffId/structure", requireAuth, requirePermission(["staff.payroll:write"]), (req, res) => {
    const ctrl = container.resolve(PayrollController);
    return ctrl.saveStructure(req, res);
});

payrollRouter.get("/staff/:staffId", requireAuth, requirePermission(["staff.payroll:read"]), (req, res) => {
    const ctrl = container.resolve(PayrollController);
    return ctrl.getStaffPayroll(req, res);
});

payrollRouter.post("/generate", requireAuth, requirePermission(["staff.payroll:write"]), (req, res) => {
    const ctrl = container.resolve(PayrollController);
    return ctrl.generatePayslip(req, res);
});

payrollRouter.post("/:id/pay", requireAuth, requirePermission(["staff.payroll:write"]), (req, res) => {
    const ctrl = container.resolve(PayrollController);
    return ctrl.pay(req, res);
});

export default payrollRouter;
