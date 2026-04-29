import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import BaseController from "../../../core/controllers/BaseController.js";

@injectable()
export default class SettingsController extends BaseController {
    constructor(@inject("DB") private db: Pool) {
        super();
    }

    public async getSettings(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const result = await this.db.query(
                'SELECT * FROM school.settings WHERE tenant_id = $1',
                [tenantId]
            );
            return this.ok(res, "Settings retrieved", result.rows[0]);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async updateSettings(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const { attendance_mode, admission_number_format } = req.body;
            
            const updates: string[] = [];
            const values: any[] = [tenantId];
            let paramIndex = 2;

            if (attendance_mode) {
                if (!['DAILY', 'PERIOD_WISE'].includes(attendance_mode)) {
                    return this.badrequest(res, "Invalid attendance mode");
                }
                updates.push(`attendance_mode = $${paramIndex}`);
                values.push(attendance_mode);
                paramIndex++;
            }

            if (admission_number_format) {
                updates.push(`admission_number_format = $${paramIndex}`);
                values.push(admission_number_format);
                paramIndex++;
            }

            if (updates.length === 0) {
                return this.badrequest(res, "No settings provided for update");
            }

            const result = await this.db.query(
                `UPDATE school.settings 
                 SET ${updates.join(', ')}, updated_at = NOW() 
                 WHERE tenant_id = $1 
                 RETURNING *`,
                values
            );

            return this.ok(res, "Settings updated successfully", result.rows[0]);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
