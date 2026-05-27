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

            // Fetch platform billing data
            const tenantResult = await this.db.query(
                `SELECT t.billing_status, t.is_active, p.name as package_name, p.price_usd, p.features 
                 FROM auth.tenant t 
                 JOIN auth.package p ON t.package_id = p.id 
                 WHERE t.id = $1 AND t.is_deleted = FALSE`,
                [tenantId]
            );

            if (tenantResult.rows.length > 0) {
                const subscription = tenantResult.rows[0];
                
                // Real-time usage calculation
                const studentCountResult = await this.db.query(
                    'SELECT COUNT(id) FROM school.student WHERE tenant_id = $1 AND is_deleted = FALSE',
                    [tenantId]
                );
                const staffCountResult = await this.db.query(
                    'SELECT COUNT(id) FROM school.staff WHERE tenant_id = $1 AND is_deleted = FALSE AND status = \'active\'',
                    [tenantId]
                );

                subscription.usage = {
                    students: parseInt(studentCountResult.rows[0].count, 10),
                    staff: parseInt(staffCountResult.rows[0].count, 10)
                };

                settings.platform_subscription = subscription;
            }

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
