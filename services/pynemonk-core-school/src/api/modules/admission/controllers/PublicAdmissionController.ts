import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import BaseController from '../../../core/controllers/BaseController.js';
import AdmissionWorkflowService from '../services/AdmissionWorkflowService.js';
import { Pool } from 'pg';

@injectable()
export class PublicAdmissionController extends BaseController {
    constructor(
        private admissionWorkflowService: AdmissionWorkflowService,
        private db: Pool
    ) {
        super();
    }

    /**
     * Submit an admission application from a public portal
     */
    async submitPublicApplication(req: Request, res: Response) {
        try {
            const { school_slug, student_data, parent_data, grade_id, academic_year_id } = req.body;

            if (!school_slug) return this.badrequest(res, "School slug is required");

            // 1. Resolve Tenant ID from Slug
            const tenantRes = await this.db.query(
                `SELECT id FROM auth.tenant WHERE slug = $1`,
                [school_slug]
            );

            if (tenantRes.rows.length === 0) {
                return this.notfound(res, "School not found with provided slug");
            }

            const tenantId = tenantRes.rows[0].id;

            // 2. Create Application Draft
            // We use a system user ID (0) for public submissions
            const application = await this.admissionWorkflowService.createApplication(tenantId, student_data, 0);

            // 3. Update with stage-specific data
            await this.admissionWorkflowService.updateApplication(tenantId, application.id, 'student', student_data);
            
            if (parent_data) {
                await this.admissionWorkflowService.updateApplication(tenantId, application.id, 'parent', parent_data);
            }

            // Set Grade and Academic Year if provided
            await this.db.query(
                `UPDATE school.admission_application SET grade_id = $1, academic_year_id = $2 WHERE id = $3`,
                [grade_id, academic_year_id, application.id]
            );

            return this.ok(res, "Application submitted successfully. Your application number is " + application.application_no, {
                application_no: application.application_no
            });

        } catch (error: any) {
            console.error('Public Admission Error:', error);
            return this.internalservererror(res, error.message);
        }
    }

    /**
     * Get basic school info for the public landing page
     */
    async getPublicSchoolInfo(req: Request, res: Response) {
        try {
            const { slug } = req.params;
            const resData = await this.db.query(
                `SELECT id, name, slug, metadata FROM auth.tenant WHERE slug = $1`,
                [slug]
            );

            if (resData.rows.length === 0) return this.notfound(res, "School not found");

            // Also fetch available Grades and Academic Years for the dropdowns
            const tenantId = resData.rows[0].id;
            
            const gradesRes = await this.db.query(
                `SELECT id, name FROM school.grade WHERE tenant_id = $1 AND is_deleted = FALSE`,
                [tenantId]
            );

            const yearsRes = await this.db.query(
                `SELECT id, name FROM school.academic_year WHERE tenant_id = $1 AND is_active = TRUE`,
                [tenantId]
            );

            return this.ok(res, "School info retrieved", {
                school: resData.rows[0],
                grades: gradesRes.rows,
                academic_years: yearsRes.rows
            });
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
