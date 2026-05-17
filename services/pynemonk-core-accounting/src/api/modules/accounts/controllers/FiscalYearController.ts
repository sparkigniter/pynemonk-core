import { Response } from "express";
import { inject, injectable } from "tsyringe";
import BaseController from "../../../core/controllers/BaseController.js";
import { AuthenticatedRequest } from "../../../core/middleware/requireAuth.js";
import YearEndService from "../helpers/YearEndService.js";
import { Pool } from "pg";

@injectable()
export default class FiscalYearController extends BaseController {
    constructor(
        private yearEndService: YearEndService,
        @inject("DB") private db: Pool
    ) {
        super();
    }

    public listFiscalYears = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const years = await this.db.query(
                `SELECT * FROM accounting.fiscal_year WHERE tenant_id = $1 ORDER BY start_date DESC`,
                [tenantId]
            );
            return this.ok(res, "Fiscal years retrieved", years.rows);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public createFiscalYear = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const { name, start_date, end_date } = req.body;
            const result = await this.db.query(
                `INSERT INTO accounting.fiscal_year (tenant_id, name, start_date, end_date)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [tenantId, name, start_date, end_date]
            );
            return this.ok(res, "Fiscal year created", result.rows[0]);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public closeYear = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const userId = req.user!.id;
            const { id } = req.params;
            
            const result = await this.yearEndService.closeFiscalYear(tenantId, userId, parseInt(id));
            return this.ok(res, result.message, result);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };
}
