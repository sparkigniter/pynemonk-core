import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { EventService } from "../services/EventService.js";
import ResourceController from "../../../core/controllers/ResourceController.js";

@injectable()
export default class EventController extends ResourceController {
    constructor(@inject(EventService) private eventService: EventService) {
        super();
    }

    public async list(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const events = await this.eventService.list(tenantId);
            return this.ok(res, "Events retrieved", events);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async create(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const event = await this.eventService.create({ ...req.body, tenant_id: tenantId });
            return this.ok(res, "Event created successfully", event);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async update(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const event = await this.eventService.update(tenantId, id, req.body);
            return this.ok(res, "Event updated successfully", event);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            await this.eventService.delete(tenantId, id);
            return this.ok(res, "Event deleted successfully");
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
