import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import LeaveService from "../services/LeaveService.js";
import StaffService from "../../staff/services/StaffService.js";
import BaseController from "../../../core/controllers/BaseController.js";

@injectable()
export default class LeaveController extends BaseController {
    constructor(
        @inject(LeaveService) private leaveService: LeaveService,
        @inject(StaffService) private staffService: StaffService
    ) {
        super();
    }

    private async getStaffId(req: Request): Promise<number> {
        const { tenantId, userId } = (req as any).user;
        const staff = await this.staffService.getStaffByUserId(tenantId, parseInt(userId));
        if (!staff) {
            throw new Error("Staff profile not found for the logged-in user.");
        }
        return staff.id;
    }

    public async applyLeave(req: Request, res: Response) {
        try {
            const { tenantId } = (req as any).user;
            const staffId = await this.getStaffId(req);
            
            const data = await this.leaveService.applyLeave(tenantId, staffId, req.body);
            return this.ok(res, "Leave application submitted", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async getMyLeaves(req: Request, res: Response) {
        try {
            const { tenantId } = (req as any).user;
            const staffId = await this.getStaffId(req);
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
            const adminStaffId = await this.getStaffId(req);
            const { id } = req.params;
            const { remarks } = req.body;
            
            const data = await this.leaveService.approveLeave(tenantId, parseInt(id), adminStaffId, remarks);
            return this.ok(res, "Leave approved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async rejectLeave(req: Request, res: Response) {
        try {
            const { tenantId } = (req as any).user;
            const adminStaffId = await this.getStaffId(req);
            const { id } = req.params;
            const { remarks } = req.body;
            
            const data = await this.leaveService.rejectLeave(tenantId, parseInt(id), adminStaffId, remarks);
            return this.ok(res, "Leave rejected", data);
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
