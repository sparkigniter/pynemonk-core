import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import AdmissionService from "./AdmissionService.js";
import { WorkflowHelper } from "../../workflow/helpers/WorkflowHelper.js";

export interface AdmissionDraft {
    id?: number;
    application_no: string;
    current_stage: string;
    student_data: any;
    parent_data: any;
    document_data: any;
    test_data: any;
    finance_data: any;
    status: string;
    academic_year_id?: number;
    grade_id?: number;
}

@injectable()
export default class AdmissionWorkflowService {
    constructor(
        @inject("DB") private db: Pool,
        private admissionService: AdmissionService,
        private workflowHelper: WorkflowHelper
    ) {}

    public async createApplication(tenantId: number, data: any, userId: number): Promise<any> {
        const appNo = await this.generateApplicationNumber(tenantId);
        const res = await this.db.query(
            `INSERT INTO school.admission_application 
                (tenant_id, application_no, status, current_stage, student_data, created_by)
             VALUES ($1, $2, 'draft', 'student', $3, $4)
             RETURNING *`,
            [tenantId, appNo, JSON.stringify(data), userId]
        );
        return res.rows[0];
    }

    public async updateApplication(tenantId: number, id: number, stage: string, data: any, nextStage?: string): Promise<any> {
        const updateData: any = {};

        if (stage === 'enrollment') {
            if (data.grade_id) updateData.grade_id = parseInt(data.grade_id);
            if (data.academic_year_id) updateData.academic_year_id = parseInt(data.academic_year_id);
        } else {
            const stageColumn = this.getStageColumn(stage);
            if (!stageColumn) throw new Error(`Invalid stage: ${stage}`);
            updateData[stageColumn] = JSON.stringify(data);
        }

        // Always update the stage to the current one being saved, or the next one if specified
        updateData.current_stage = nextStage || stage;

        const keys = Object.keys(updateData);
        const values = Object.values(updateData);
        const setClause = keys.map((key, index) => `${key} = $${index + 3}`).join(", ");

        const res = await this.db.query(
            `UPDATE school.admission_application 
             SET ${setClause}, updated_at = NOW()
             WHERE id = $1 AND tenant_id = $2
             RETURNING *`,
            [id, tenantId, ...values]
        );

        return res.rows[0];
    }

    public async getApplication(tenantId: number, id: number): Promise<any> {
        const res = await this.db.query(
            `SELECT * FROM school.admission_application WHERE id = $1 AND tenant_id = $2 AND is_deleted = FALSE`,
            [id, tenantId]
        );
        return res.rows[0];
    }

    public async listApplications(tenantId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT id, application_no, status, current_stage, created_at,
                    student_data->>'first_name' as first_name,
                    student_data->>'last_name'  as last_name
             FROM school.admission_application
             WHERE tenant_id = $1 AND is_deleted = FALSE
             ORDER BY created_at DESC`,
            [tenantId]
        );
        return res.rows;
    }

    public async finalizeAdmission(tenantId: number, id: number, userId: number): Promise<any> {
        const app = await this.getApplication(tenantId, id);
        if (!app) throw new Error("Application not found");

        const studentData = {
            ...app.student_data,
            admission_no: app.student_data.admission_no || app.application_no
        };

        const admissionRequest = {
            student: studentData,
            guardian: app.parent_data,
            enrollment: {
                academic_year_id: app.academic_year_id || app.student_data.academic_year_id,
                grade_id: app.grade_id || app.student_data.grade_id,
                classroom_id: app.student_data.classroom_id,
                section: app.student_data.section || 'A'
            },
            finance: app.finance_data
        };

        const result = await this.admissionService.admitStudent(tenantId, admissionRequest, userId);

        // ── Onboarding Workflow: Phase C Fix ────────────────────────────────────
        // Previously used a slug string which WorkflowHelper cannot resolve.
        // Now we look up the template by entity_type = 'student' to get the real id.
        try {
            const template = await this.workflowHelper.findTemplateByType(tenantId, 'student');
            if (template) {
                const studentName = `${studentData.first_name || ''} ${studentData.last_name || ''}`.trim();
                await this.workflowHelper.startInstance(tenantId, {
                    template_id: template.id,
                    target_id: result.student_id,
                    target_name: studentName,
                    target_email: studentData.email
                });
            } else {
                console.warn(
                    `[AdmissionWorkflow] No 'student' onboarding template found for tenant ${tenantId}. ` +
                    `Create one via POST /api/v1/school/workflows/templates with entity_type='student'.`
                );
            }
        } catch (err) {
            // Non-fatal: the admission itself succeeds; workflow is best-effort.
            console.error("[AdmissionWorkflow] Failed to start onboarding:", err);
        }

        await this.db.query(
            `UPDATE school.admission_application
             SET status = 'completed', current_stage = 'completed', updated_at = NOW()
             WHERE id = $1`,
            [id]
        );

        return result;
    }

    private getStageColumn(stage: string): string | null {
        const mapping: Record<string, string> = {
            student:   'student_data',
            guardian:  'parent_data',
            documents: 'document_data',
            test:      'test_data',
            finance:   'finance_data'
        };
        return mapping[stage] ?? null;
    }

    private async generateApplicationNumber(tenantId: number): Promise<string> {
        const res = await this.db.query(
            `SELECT COUNT(*) FROM school.admission_application WHERE tenant_id = $1`,
            [tenantId]
        );
        const count = parseInt(res.rows[0].count) + 1;
        return `APP-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;
    }
}
