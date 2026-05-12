import { Response } from "express";
import { injectable } from "tsyringe";
import BaseController from "../../../core/controllers/BaseController.js";
import { AuthenticatedRequest } from "../../../core/middleware/requireAuth.js";
import JournalHelper from "../helpers/JournalHelper.js";

@injectable()
export default class JournalController extends BaseController {
    constructor(private journalHelper: JournalHelper) {
        super();
    }

    public listEntries = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const entries = await this.journalHelper.getEntries(tenantId);
            return this.ok(res, "Journal entries retrieved", entries);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public createEntry = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const userId = req.user!.id;
            const entry = await this.journalHelper.createEntry(tenantId, userId, req.body);
            return this.ok(res, "Journal entry posted successfully", entry);
        } catch (error: any) {
            return this.badrequest(res, error.message);
        }
    };
}
