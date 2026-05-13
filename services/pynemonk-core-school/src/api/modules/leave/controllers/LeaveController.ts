import { Request, Response } from "express";
import { injectable } from "tsyringe";
import LeaveService from "../services/LeaveService.js";
import BaseController from "../../../core/controllers/BaseController.js";

@injectable()
export default class LeaveController extends BaseController {
    constructor(private leaveService: LeaveService) {
        super();
    }

    public async applyLeave(req: Request, res: Response) {
        try {
            const { tenantId, userId } = (req as any).user;
            // Need to get staff_id from user_id
            const staffId = await (req as any).staffId; // Assuming middleware or helper attaches this
            
            const data = await this.leaveService.applyLeave(tenantId, staffId, req.body);
            return this.ok(res, "Leave application submitted", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async getMyLeaves(req: Request, res: Response) {
        try {
            const { tenantId } = (req as any).user;
            const staffId = await (req as any).staffId;
            const data = await this.leaveService.getMyLeaves(tenantId, staffId);
            return this.ok(res, "Leaves retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async getPendingLeaves(req: Request, res: Response) {
        try {
            const { tenantId } = (req as any).user;
            const data = await this.leaveService.getPendingLeaves(tenantId);
            return this.ok(res, "Pending leaves retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async approveLeave(req: Request, res: Response) {
        try {
            const { tenantId } = (req as any).user;
            const adminStaffId = await (req as any).staffId;
            const { id } = req.params;
            const { remarks } = req.body;
            
            const data = await this.leaveService.approveLeave(tenantId, parseInt(id), adminStaffId, remarks);
            return this.ok(res, "Leave approved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async getLeaveTypes(req: Request, res: Response) {
        try {
            const { tenantId } = (req as any).user;
            const data = await this.leaveService.getLeaveTypes(tenantId);
            return this.ok(res, "Leave types retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async createLeaveType(req: Request, res: Response) {
        try {
            const { tenantId } = (req as any).user;
            const data = await this.leaveService.createLeaveType(tenantId, req.body);
            return this.ok(res, "Leave type created", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
