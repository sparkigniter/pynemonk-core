import { Response } from "express";
import { injectable } from "tsyringe";
import BaseController from "../../../core/controllers/BaseController.js";
import { AuthenticatedRequest } from "../../../core/middleware/requireAuth.js";
import AccountHelper from "../helpers/AccountHelper.js";

@injectable()
export default class AccountController extends BaseController {
    constructor(private accountHelper: AccountHelper) {
        super();
    }

    public getTypes = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const types = await this.accountHelper.getAccountTypes();
            return this.ok(res, "Account types retrieved", types);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public getChart = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const search = req.query.search as string;
            const chart = await this.accountHelper.getChartOfAccounts(tenantId, search);
            return this.ok(res, "Chart of accounts retrieved", chart);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public createAccount = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const account = await this.accountHelper.createAccount(tenantId, req.body);
            return this.ok(res, "Account created successfully", account);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };
}
