import { Router } from "express";
import { container } from "tsyringe";
import FeeController from "./controllers/FeeController.js";
import { requireAuth } from "../../../api/core/middleware/requireAuth.js";
import { requirePermission } from "../../../api/core/middleware/requirePermission.js";

const feeRouter = Router();

// All fee routes require authentication
feeRouter.use(requireAuth);

feeRouter.post("/heads", requirePermission(["fee:write"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.createFeeHead(req, res);
});

feeRouter.post("/structures", requirePermission(["fee:write"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.createFeeStructure(req, res);
});

feeRouter.post("/allocate", requirePermission(["fee:write"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.allocateFeesToStudent(req, res);
});

feeRouter.get("/student/:studentId", requirePermission(["fee:read"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.getStudentFees(req, res);
});

export default feeRouter;
