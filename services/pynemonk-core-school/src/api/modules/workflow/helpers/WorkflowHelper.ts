import { Pool } from "pg";
import { injectable, inject } from "tsyringe";

@injectable()
export class WorkflowHelper {
    constructor(@inject("DB") private db: Pool) {}

    /** Create a new template with steps */
    async createTemplate(tenantId: number, data: { name: string; description?: string; entity_type: string; steps: any[] }) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            const res = await client.query(
                `INSERT INTO school.workflow_template (tenant_id, name, description, entity_type) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [tenantId, data.name, data.description, data.entity_type]
            );
            const templateId = res.rows[0].id;

            for (let i = 0; i < data.steps.length; i++) {
                const step = data.steps[i];
                await client.query(
                    `INSERT INTO school.workflow_step_template (tenant_id, template_id, name, description, step_order, required_role, task_type, is_mandatory) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [tenantId, templateId, step.name, step.description, i, step.required_role, step.task_type || 'approval', step.is_mandatory !== false]
                );
            }
            await client.query('COMMIT');
            return templateId;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    /** List templates for a tenant */
    async getTemplates(tenantId: number) {
        const res = await this.db.query(
            "SELECT * FROM school.workflow_template WHERE tenant_id = $1 AND is_deleted = FALSE ORDER BY created_at DESC",
            [tenantId]
        );
        return res.rows;
    }

    /** Find template by entity type (student/staff) */
    async findTemplateByType(tenantId: number, entityType: string) {
        const res = await this.db.query(
            "SELECT * FROM school.workflow_template WHERE tenant_id = $1 AND entity_type = $2 AND is_deleted = FALSE LIMIT 1",
            [tenantId, entityType]
        );
        return res.rows[0];
    }

    /** Start a workflow instance for a candidate */
    async startInstance(tenantId: number, data: { template_id: number; target_id?: number; target_name: string; target_email?: string }) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            
            // 1. Create Instance
            const res = await client.query(
                `INSERT INTO school.workflow_instance (tenant_id, template_id, target_id, target_name, target_email, status) 
                 VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
                [tenantId, data.template_id, data.target_id, data.target_name, data.target_email]
            );
            const instanceId = res.rows[0].id;

            // 2. Provision Steps from Template
            const steps = await client.query(
                "SELECT id FROM school.workflow_step_template WHERE template_id = $1 AND is_deleted = FALSE ORDER BY step_order ASC",
                [data.template_id]
            );

            for (const step of steps.rows) {
                await client.query(
                    `INSERT INTO school.workflow_step_instance (tenant_id, instance_id, step_template_id, status) 
                     VALUES ($1, $2, $3, 'pending')`,
                    [tenantId, instanceId, step.id]
                );
            }

            // 3. Set current step to the first one
            if (steps.rows.length > 0) {
                await client.query(
                    "UPDATE school.workflow_instance SET current_step_id = $1, status = 'in_progress' WHERE id = $2",
                    [steps.rows[0].id, instanceId]
                );
            }

            await client.query('COMMIT');
            return instanceId;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    /** Find active workflow for a specific target (e.g. student) */
    async findActiveInstanceByTarget(tenantId: number, targetId: number) {
        const res = await this.db.query(
            `SELECT * FROM school.workflow_instance 
             WHERE tenant_id = $1 AND target_id = $2 AND status = 'in_progress' AND is_deleted = FALSE 
             LIMIT 1`,
            [tenantId, targetId]
        );
        return res.rows[0];
    }

    /** Complete a step by its task type (e.g. 'document_upload') */
    async completeStepByType(tenantId: number, instanceId: number, taskType: string, data: { notes?: string; attachment_url?: string }) {
        const res = await this.db.query(
            `SELECT si.id, si.step_template_id 
             FROM school.workflow_step_instance si
             JOIN school.workflow_step_template st ON si.step_template_id = st.id
             WHERE si.instance_id = $1 AND si.tenant_id = $2 AND st.task_type = $3 AND si.status = 'pending'
             LIMIT 1`,
            [instanceId, tenantId, taskType]
        );

        if (res.rows.length > 0) {
            const stepId = res.rows[0].id;
            await this.db.query(
                `UPDATE school.workflow_step_instance 
                 SET status = 'completed', completed_at = NOW(), notes = $1, attachment_url = $2
                 WHERE id = $3 AND tenant_id = $4`,
                [data.notes, data.attachment_url, stepId, tenantId]
            );

            // Trigger progression to next step
            await this.progressToNextStep(tenantId, instanceId);
        }
    }

    private async progressToNextStep(tenantId: number, instanceId: number) {
        // Find next pending step
        const steps = await this.db.query(
            `SELECT si.id, si.step_template_id 
             FROM school.workflow_step_instance si
             JOIN school.workflow_step_template st ON si.step_template_id = st.id
             WHERE si.instance_id = $1 AND si.tenant_id = $2 AND si.status = 'pending'
             ORDER BY st.step_order ASC LIMIT 1`,
            [instanceId, tenantId]
        );

        if (steps.rows.length > 0) {
            await this.db.query(
                "UPDATE school.workflow_instance SET current_step_id = $1 WHERE id = $2",
                [steps.rows[0].step_template_id, instanceId]
            );
        } else {
            // All steps done!
            await this.db.query(
                "UPDATE school.workflow_instance SET status = 'completed', completed_at = NOW() WHERE id = $1",
                [instanceId]
            );
        }
    }

    /** List active instances */
    async getInstances(tenantId: number) {
        const res = await this.db.query(
            `SELECT i.*, t.name as template_name, st.name as current_step_name, st.task_type
             FROM school.workflow_instance i
             JOIN school.workflow_template t ON i.template_id = t.id
             LEFT JOIN school.workflow_step_template st ON i.current_step_id = st.id
             WHERE i.tenant_id = $1 AND i.is_deleted = FALSE
             ORDER BY i.created_at DESC`,
            [tenantId]
        );
        return res.rows;
    }

    /** Get detailed instance progress */
    async getInstanceDetails(tenantId: number, instanceId: number) {
        const instance = await this.db.query(
            `SELECT i.*, t.name as template_name, t.entity_type 
             FROM school.workflow_instance i 
             JOIN school.workflow_template t ON i.template_id = t.id 
             WHERE i.id = $1 AND i.tenant_id = $2`,
            [instanceId, tenantId]
        );
        
        if (instance.rows.length === 0) return null;

        const steps = await this.db.query(
            `SELECT si.*, st.name as step_name, st.description as step_description, st.required_role, st.task_type 
             FROM school.workflow_step_instance si 
             JOIN school.workflow_step_template st ON si.step_template_id = st.id 
             WHERE si.instance_id = $1 AND si.tenant_id = $2 
             ORDER BY st.step_order ASC`,
            [instanceId, tenantId]
        );

        return {
            ...instance.rows[0],
            steps: steps.rows
        };
    }
}
