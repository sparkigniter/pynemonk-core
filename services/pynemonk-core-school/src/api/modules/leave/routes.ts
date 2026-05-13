import * as express from "express";
import { container } from "tsyringe";
import LeaveController from "./controllers/LeaveController.js";
import { requireAuth } from "../../../api/core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";

const leaveRouter = express.Router();

leaveRouter.post("/", requireAuth, requirePermission(["staff.leave:write"]), (req, res) => {
    const ctrl = container.resolve(LeaveController);
    return ctrl.applyLeave(req, res);
});

leaveRouter.get("/my", requireAuth, requirePermission(["staff.leave:read"]), (req, res) => {
    const ctrl = container.resolve(LeaveController);
    return ctrl.getMyLeaves(req, res);
});

leaveRouter.get("/pending", requireAuth, requirePermission(["staff.leave:write"]), (req, res) => {
    const ctrl = container.resolve(LeaveController);
    return ctrl.getPendingLeaves(req, res);
});

leaveRouter.post("/:id/approve", requireAuth, requirePermission(["staff.leave:write"]), (req, res) => {
    const ctrl = container.resolve(LeaveController);
    return ctrl.approveLeave(req, res);
});

leaveRouter.get("/types", requireAuth, requirePermission(["staff.leave:read"]), (req, res) => {
    const ctrl = container.resolve(LeaveController);
    return ctrl.getLeaveTypes(req, res);
});

leaveRouter.post("/types", requireAuth, requirePermission(["staff.leave:write"]), (req, res) => {
    const ctrl = container.resolve(LeaveController);
    return ctrl.createLeaveType(req, res);
});

export default leaveRouter;
