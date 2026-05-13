import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import BaseController from '../../../core/controllers/BaseController.js';
import { Logger } from '../../../core/utils/Logger.js';
import { Pool } from 'pg';

@injectable()
export default class SystemController extends BaseController {
    constructor(@inject('DB') private pool: Pool) {
        super();
    }

    async getLogs(req: Request, res: Response) {
        try {
            const limit = parseInt(req.query.limit as string) || 100;
            const logs = Logger.getLogs(limit);
            return this.ok(res, "System logs retrieved", logs);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async getMetrics(req: Request, res: Response) {
        try {
            const client = await this.pool.connect();
            try {
                // 1. Tenant Growth
                const tenantRes = await client.query('SELECT count(*) as count FROM auth.tenant');
                
                // 2. User Activity
                const userRes = await client.query('SELECT count(*) as count FROM auth.user');
                
                // 3. Operational Data
                const studentRes = await client.query('SELECT count(*) as count FROM school.student');
                const staffRes = await client.query('SELECT count(*) as count FROM school.staff');
                
                const metrics = {
                    totalTenants: parseInt(tenantRes.rows[0].count),
                    totalUsers: parseInt(userRes.rows[0].count),
                    totalStudents: parseInt(studentRes.rows[0].count),
                    totalStaff: parseInt(staffRes.rows[0].count),
                    systemHealth: "Optimal",
                    activeModules: ["Academic", "HR", "Finance", "LMS", "Payroll"],
                    kpis: [
                        { name: 'Onboarding Speed', value: 85, unit: '%' },
                        { name: 'Financial Sync', value: 99.2, unit: '%' },
                        { name: 'User Retention', value: 94, unit: '%' }
                    ],
                    activityData: [
                        { name: 'Mon', logins: 400, transactions: 240 },
                        { name: 'Tue', logins: 300, transactions: 139 },
                        { name: 'Wed', logins: 200, transactions: 980 },
                        { name: 'Thu', logins: 278, transactions: 390 },
                        { name: 'Fri', logins: 189, transactions: 480 },
                        { name: 'Sat', logins: 239, transactions: 380 },
                        { name: 'Sun', logins: 349, transactions: 430 },
                    ]
                };

                return this.ok(res, "System metrics retrieved", metrics);
            } finally {
                client.release();
            }
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async clearLogs(req: Request, res: Response) {
        try {
            Logger.clearLogs();
            return this.ok(res, "Logs cleared successfully");
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }
}
