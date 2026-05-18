import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { AnnouncementService } from "../services/AnnouncementService.js";
import ResourceController from "../../../core/controllers/ResourceController.js";

@injectable()
export class AnnouncementController extends ResourceController {
    constructor(@inject(AnnouncementService) private announcementService: AnnouncementService) {
        super();
    }

    public async list(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const user = (req as any).user;
            const announcements = await this.announcementService.list(tenantId, user.userId, user.roles);
            return this.ok(res, "Announcements retrieved successfully", announcements);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async create(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const user = (req as any).user;
            const announcement = await this.announcementService.create(tenantId, user.userId, req.body);
            return this.ok(res, "Announcement created successfully", announcement);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async update(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const announcement = await this.announcementService.update(tenantId, id, req.body);
            return this.ok(res, "Announcement updated successfully", announcement);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            await this.announcementService.delete(tenantId, id);
            return this.ok(res, "Announcement deleted successfully");
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
