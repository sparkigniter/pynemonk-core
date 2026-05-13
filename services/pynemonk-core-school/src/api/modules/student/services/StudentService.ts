import { injectable, inject } from "tsyringe";
import StudentHelper from "../helpers/StudentHelper.js";
import StudentValidator from "../validator/StudentValidator.js";
import AcademicYearHelper from "../../academics/helpers/AcademicYearHelper.js";
import GuardianHelper from "../../guardian/helpers/GuardianHelper.js";
import { Pool } from "pg";
import { IAuthClient } from "../../../core/interfaces/IAuthClient.js";
import { WorkflowService } from "../../workflow/services/WorkflowService.js";

@injectable()
export default class StudentService {
    constructor(
        private studentHelper: StudentHelper,
        private studentValidator: StudentValidator,
        private academicYearHelper: AcademicYearHelper,
        private guardianHelper: GuardianHelper,
        @inject("IAuthClient") private authClient: IAuthClient,
        @inject(WorkflowService) private workflowService: WorkflowService,
        @inject("DB") private db: Pool,
        @inject("EventBus") private eventBus: any,
    ) { }

    public async registerStudent(tenantId: number, data: any): Promise<any> {
        // Validation now matches the nested frontend structure
        await this.studentValidator.validate("CREATE_STUDENT", data);

        const client = await this.db.connect();
        try {
            await client.query("BEGIN");

            const studentData = data.student;
            const userEmail = studentData.email || `${studentData.admission_no.replace(/[^a-zA-Z0-9]/g, '')}@luviaedu.internal`;

            const authUser = await this.authClient.createUser({
                email: userEmail,
                password: data.password || 'Student@123',
                role_slug: "student",
                tenant_id: tenantId,
            });

            const student = await this.studentHelper.createStudent(
                {
                    ...studentData,
                    ...data.guardian,
                    ...data.enrollment,
                    tenant_id: tenantId,
                    user_id: authUser.id,
                },
                client,
            );

            // 3. Trigger Onboarding Workflow if template exists
            const templates = await this.workflowService.getTemplates(tenantId);
            const studentTemplate = templates.find((t: any) => t.entity_type === 'student');

            if (studentTemplate) {
                await this.workflowService.startOnboarding(tenantId, {
                    template_id: studentTemplate.id,
                    target_id: student.id,
                    target_name: `${studentData.first_name} ${studentData.last_name}`,
                    target_email: studentData.email
                });
            }

            await client.query("COMMIT");

            // 4. Notify Accounting for automated entry
            this.eventBus.emit('ADMISSION_COMPLETED', {
                tenantId,
                userId: student.created_by || 0,
                studentId: student.id,
                studentName: `${studentData.first_name} ${studentData.last_name}`,
                academicYearId: data.enrollment?.academic_year_id || 0,
                amount: data.admission_fee || 0,
                isPaid: data.is_paid || false,
                paymentMethod: data.payment_method || 'cash',
                reference: `ADM-${student.admission_no}`,
            });

            return student;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    public async getStudentProfile(tenantId: number, studentId: number): Promise<any> {
        const student = await this.studentHelper.getStudentById(tenantId, studentId);
        if (!student) return null;

        const [logs, documents, guardians] = await Promise.all([
            this.studentHelper.getLogs(tenantId, studentId),
            this.studentHelper.getDocuments(tenantId, studentId),
            this.guardianHelper.getStudentGuardians(tenantId, studentId)
        ]);

        return { ...student, logs, documents, guardians };
    }

    public async getStudentByUserId(tenantId: number, userId: number): Promise<any> {
        return this.studentHelper.findByUserId(tenantId, userId);
    }

    public async listStudents(tenantId: number, filters: any): Promise<any> {
        if (!filters.academic_year_id && !filters.classroom_id) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            filters.academic_year_id = currentYear?.id;
        }
        return this.studentHelper.listStudents(tenantId, filters);
    }

    public async addDocument(tenantId: number, studentId: number, data: any): Promise<any> {
        const doc = await this.studentHelper.addDocument({
            ...data,
            tenant_id: tenantId,
            student_id: studentId
        });

        await this.studentHelper.createLog({
            tenant_id: tenantId,
            student_id: studentId,
            event_type: 'document_upload',
            description: `New document uploaded: ${data.document_type}`,
            metadata: { file_name: data.file_name }
        });

        // AUTO-AUTOMATION: Find active workflow and complete the document step
        try {
            const workflow = await this.workflowService.getStudentActiveWorkflow(tenantId, studentId);
            if (workflow) {
                await this.workflowService.completeStepByType(tenantId, workflow.id, 'document_upload', {
                    notes: `Auto-completed via document upload: ${data.document_type}`,
                    attachment_url: data.file_url
                });
            }
        } catch (err) {
            console.error('Failed to auto-complete workflow step:', err);
        }

        return doc;
    }

    public async updateStudentProfile(tenantId: number, studentId: number, data: any): Promise<any> {
        const student = await this.studentHelper.updateStudent(tenantId, studentId, data);

        await this.studentHelper.createLog({
            tenant_id: tenantId,
            student_id: studentId,
            event_type: 'profile_update',
            description: `Student profile updated`,
            metadata: { updated_fields: Object.keys(data) }
        });

        return student;
    }
    public async addGuardian(tenantId: number, studentId: number, data: any): Promise<any> {
        const client = await this.db.connect();
        try {
            await client.query("BEGIN");

            const student = await this.studentHelper.getStudentById(tenantId, studentId);
            if (data.address === 'Same as student' && student) {
                data.address = student.address;
            }

            // 1. Create Auth User for Guardian
            const userEmail = data.email || `grd_${Math.random().toString(36).substring(7)}@luviaedu.internal`;
            
            const authUser = await this.authClient.createUser({
                email: userEmail,
                password: data.password || 'Guardian@123',
                role_slug: "guardian",
                tenant_id: tenantId,
            });

            // 2. Create Guardian Record
            const guardian = await this.guardianHelper.createGuardian({
                ...data,
                tenant_id: tenantId,
                user_id: authUser.id
            }, client);

            // 3. Link to Student
            await this.guardianHelper.linkStudent(
                tenantId,
                studentId,
                guardian.id,
                data.relation || 'Parent',
                data.is_emergency || false,
                client
            );

            await this.studentHelper.createLog({
                tenant_id: tenantId,
                student_id: studentId,
                event_type: 'guardian_added',
                description: `New guardian added: ${data.first_name} ${data.last_name || ''}`,
                metadata: { guardian_id: guardian.id, relation: data.relation }
            }, client);

            await client.query("COMMIT");
            return guardian;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}
