import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import StaffService from "../services/StaffService.js";
import ResourceController from "../../../core/controllers/ResourceController.js";

import { Pool } from "pg";

@injectable()
export default class StaffController extends ResourceController {
    constructor(@inject(StaffService) private staffService: StaffService) {
        super();
    }

    public async list(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const { page, limit, search, status } = req.query;

            const filters = {
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10,
                search: search as string,
                status: status as string,
            };

            const staff = await this.staffService.getStaffList(tenantId, filters);
            return this.ok(res, "Staff list retrieved", staff);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async get(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const staff = await this.staffService.getStaffById(tenantId, id);
            if (!staff) return this.notfound(res, "Staff not found");
            return this.ok(res, "Staff details retrieved", staff);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async create(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const staff = await this.staffService.addStaff(tenantId, req.body);
            return this.ok(res, "Staff created successfully", staff);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async update(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const staff = await this.staffService.updateStaff(tenantId, id, req.body);
            return this.ok(res, "Staff updated successfully", staff);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            await this.staffService.removeStaff(tenantId, id);
            return this.ok(res, "Staff deleted successfully");
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
