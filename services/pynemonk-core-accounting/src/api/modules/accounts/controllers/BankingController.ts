import { Response } from "express";
import { injectable } from "tsyringe";
import BaseController from "../../../core/controllers/BaseController.js";
import { AuthenticatedRequest } from "../../../core/middleware/requireAuth.js";
import BankingHelper from "../helpers/BankingHelper.js";

@injectable()
export default class BankingController extends BaseController {
    constructor(private bankingHelper: BankingHelper) {
        super();
    }

    public listAccounts = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const accounts = await this.bankingHelper.listAccounts(tenantId);
            return this.ok(res, "Bank accounts retrieved", accounts);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public createAccount = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const account = await this.bankingHelper.createAccount(tenantId, req.body);
            return this.ok(res, "Bank account created successfully", account);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public listTransactions = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const transactions = await this.bankingHelper.listPendingTransactions(tenantId);
            return this.ok(res, "Bank transactions retrieved", transactions);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };
}
