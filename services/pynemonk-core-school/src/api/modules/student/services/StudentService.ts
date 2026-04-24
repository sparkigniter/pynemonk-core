import { injectable, inject } from "tsyringe";
import StudentHelper from "../helpers/StudentHelper.js";
import StudentValidator from "../validator/StudentValidator.js";
import AcademicYearHelper from "../../academics/helpers/AcademicYearHelper.js";
import { Pool } from "pg";
import { IAuthClient } from "../../../core/interfaces/IAuthClient.js";
import { WorkflowService } from "../../workflow/services/WorkflowService.js";

@injectable()
export default class StudentService {
    constructor(
        private studentHelper: StudentHelper,
        private studentValidator: StudentValidator,
        private academicYearHelper: AcademicYearHelper,
        @inject("IAuthClient") private authClient: IAuthClient,
        @inject(WorkflowService) private workflowService: WorkflowService,
        @inject("DB") private db: Pool,
    ) {}

    public async registerStudent(tenantId: number, data: any): Promise<any> {
        // Validation could be expanded for new fields
        await this.studentValidator.validate("CREATE_STUDENT", data);

        const client = await this.db.connect();
        try {
            await client.query("BEGIN");

            const authUser = await this.authClient.createUser({
                email: data.email,
                password: data.password || 'Student@123',
                role_slug: "student",
                tenant_id: tenantId,
            });

            const student = await this.studentHelper.createStudent(
                {
                    ...data,
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
                    target_name: `${student.first_name} ${student.last_name}`,
                    target_email: student.email
                });
            }

            await client.query("COMMIT");
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

        const [logs, documents] = await Promise.all([
            this.studentHelper.getLogs(tenantId, studentId),
            this.studentHelper.getDocuments(tenantId, studentId)
        ]);

        return { ...student, logs, documents };
    }

    public async getStudentByUserId(tenantId: number, userId: number): Promise<any> {
        return this.studentHelper.findByUserId(tenantId, userId);
    }

    public async listStudents(tenantId: number, filters: any, scope: any): Promise<any> {
        if (!filters.academic_year_id && !filters.classroom_id) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            filters.academic_year_id = currentYear?.id;
        }
        return this.studentHelper.listStudents(tenantId, filters, scope);
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

        return doc;
    }
}
