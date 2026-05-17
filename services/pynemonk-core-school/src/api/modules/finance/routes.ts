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

feeRouter.put("/heads/:id", requirePermission(["fee:write"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.updateFeeHead(req, res);
});

feeRouter.delete("/heads/:id", requirePermission(["fee:write"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.deleteFeeHead(req, res);
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

feeRouter.get("/heads", requirePermission(["fee:read"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.getFeeHeads(req, res);
});

feeRouter.get("/structures", requirePermission(["fee:read"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.getFeeStructures(req, res);
});

feeRouter.get("/discounts", requirePermission(["fee:read"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.getFeeDiscounts(req, res);
});

feeRouter.get("/collections", requirePermission(["fee:read"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.getCollections(req, res);
});

feeRouter.get("/receipts", requirePermission(["fee:read"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.getReceipts(req, res);
});

feeRouter.get("/stats", requirePermission(["fee:read"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.getFinanceStats(req, res);
});

feeRouter.post("/payments", requirePermission(["fee:write"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.recordPayment(req, res);
});

feeRouter.post("/allocations", requirePermission(["fee:write"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.allocateFee(req, res);
});

feeRouter.post("/bulk-allocate", requirePermission(["fee:write"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.bulkAllocate(req, res);
});

feeRouter.get("/grade-templates", requirePermission(["fee:read"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.getGradeFeeTemplates(req, res);
});

feeRouter.post("/grade-templates", requirePermission(["fee:write"]), (req, res) => {
    const ctrl = container.resolve(FeeController);
    return ctrl.saveGradeFeeTemplate(req, res);
});


export default feeRouter;
