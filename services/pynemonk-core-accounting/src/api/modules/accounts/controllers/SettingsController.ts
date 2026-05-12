import { Response } from "express";
import { injectable } from "tsyringe";
import BaseController from "../../../core/controllers/BaseController.js";
import { AuthenticatedRequest } from "../../../core/middleware/requireAuth.js";
import SettingsHelper from "../helpers/SettingsHelper.js";

@injectable()
export default class SettingsController extends BaseController {
    constructor(private settingsHelper: SettingsHelper) {
        super();
    }

    public getSettings = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const settings = await this.settingsHelper.getSettings(tenantId);
            return this.ok(res, "Settings retrieved", settings);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public updateSettings = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const settings = await this.settingsHelper.updateSettings(tenantId, req.body);
            return this.ok(res, "Settings updated successfully", settings);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };
}
