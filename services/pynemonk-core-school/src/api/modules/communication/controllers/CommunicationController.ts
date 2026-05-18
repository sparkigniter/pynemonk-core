import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { CommunicationService } from "../services/CommunicationService.js";
import ResourceController from "../../../core/controllers/ResourceController.js";

@injectable()
export class CommunicationController extends ResourceController {
    constructor(@inject(CommunicationService) private communicationService: CommunicationService) {
        super();
    }

    public async getRecipientOptions(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const user = (req as any).user;
            const options = await this.communicationService.getRecipientOptions(tenantId, user.userId, user.roles);
            return this.ok(res, "Recipient options retrieved", options);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async listTickets(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const user = (req as any).user;
            const tickets = await this.communicationService.listTickets(tenantId, user.userId, user.roles);
            return this.ok(res, "Tickets retrieved successfully", tickets);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async createTicket(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const user = (req as any).user;
            const ticket = await this.communicationService.createTicket(tenantId, user.userId, user.roles, req.body);
            return this.ok(res, "Ticket created successfully", ticket);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async listMessages(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const ticketId = parseInt(req.params.id);
            const messages = await this.communicationService.listMessages(tenantId, ticketId);
            return this.ok(res, "Messages retrieved successfully", messages);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async reply(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const ticketId = parseInt(req.params.id);
            const user = (req as any).user;
            const message = await this.communicationService.reply(tenantId, user.userId, ticketId, req.body.message);
            return this.ok(res, "Reply sent successfully", message);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async updateStatus(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const ticketId = parseInt(req.params.id);
            const { status } = req.body;
            const ticket = await this.communicationService.updateStatus(tenantId, ticketId, status);
            return this.ok(res, "Ticket status updated successfully", ticket);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
