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
            const tenantId = (req as any).user.tenantId;
            const result = await this.db.query(
                'SELECT key, value FROM school.settings WHERE tenant_id = $1 AND is_deleted = FALSE',
                [tenantId]
            );
            
            // Convert array of {key, value} to a single object {key: value}
            const settings = result.rows.reduce((acc: any, row: any) => {
                acc[row.key] = row.value;
                return acc;
            }, {});

            return this.ok(res, "Settings retrieved", settings);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async updateSettings(req: Request, res: Response) {
        const client = await this.db.connect();
        try {
            const tenantId = (req as any).user.tenantId;
            const settingsData = req.body; // Expecting { key: value, ... }
            
            await client.query('BEGIN');

            for (const [key, value] of Object.entries(settingsData)) {
                if (key === 'attendance_mode' && !['DAILY', 'PERIOD_WISE'].includes(value as string)) {
                    continue; // Skip invalid values or throw error
                }

                await client.query(
                    `INSERT INTO school.settings (tenant_id, key, value)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (tenant_id, key) 
                     DO UPDATE SET value = $3, updated_at = NOW(), is_deleted = FALSE`,
                    [tenantId, key, String(value)]
                );
            }

            await client.query('COMMIT');
            
            // Fetch updated settings
            const result = await client.query(
                'SELECT key, value FROM school.settings WHERE tenant_id = $1 AND is_deleted = FALSE',
                [tenantId]
            );
            const settings = result.rows.reduce((acc: any, row: any) => {
                acc[row.key] = row.value;
                return acc;
            }, {});

            return this.ok(res, "Settings updated successfully", settings);
        } catch (error: any) {
            await client.query('ROLLBACK');
            return this.internalservererror(res, error.message);
        } finally {
            client.release();
        }
    }
}
