import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import { IAuthClient } from "../../../core/interfaces/IAuthClient.js";
import StudentHelper from "../../student/helpers/StudentHelper.js";
import GuardianHelper from "../../guardian/helpers/GuardianHelper.js";
import EnrollmentHelper from "../../student/helpers/EnrollmentHelper.js";
import { EventEmitter } from "events";


export interface AdmissionRequest {
    student: {
        admission_no: string;
        first_name: string;
        last_name: string;
        email: string;
        gender: string;
        date_of_birth: string;
        address: string;
    };
    guardian: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        relation: string;
    };
    enrollment: {
        classroom_id: number;
        academic_year_id: number;
    };
}

@injectable()
export default class AdmissionService {
    constructor(
        @inject("DB") private db: Pool,
        @inject("IAuthClient") private authClient: IAuthClient,
        @inject("EventBus") private eventBus: EventEmitter,
        private studentHelper: StudentHelper,
        private guardianHelper: GuardianHelper,
        private enrollmentHelper: EnrollmentHelper
    ) {}

    public async admitStudent(tenantId: number, data: AdmissionRequest): Promise<any> {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');

            // 1. Create Student Auth User
            const studentAuth = await this.authClient.createUser({
                tenant_id: tenantId,
                email: data.student.email,
                password: "ChangeMe123!", // Initial default password
                role_slug: 'student'
            }, client);

            // 2. Create Guardian Auth User
            const guardianAuth = await this.authClient.createUser({
                tenant_id: tenantId,
                email: data.guardian.email,
                password: "ChangeMe123!",
                role_slug: 'parent'
            }, client);

            // 3. Create Student Profile
            const student = await this.studentHelper.createStudent({
                tenant_id: tenantId,
                user_id: studentAuth.id,
                ...data.student
            }, client);

            // 4. Create Guardian Profile
            const guardian = await this.guardianHelper.createGuardian({
                tenant_id: tenantId,
                user_id: guardianAuth.id,
                ...data.guardian
            }, client);

            // 5. Link Student and Guardian
            await this.guardianHelper.linkStudent(tenantId, student.id, guardian.id, data.guardian.relation, client);

            // 6. Enroll Student in Classroom
            const enrollment = await this.enrollmentHelper.enrollStudent({
                tenant_id: tenantId,
                student_id: student.id,
                ...data.enrollment
            }, client);

            await client.query('COMMIT');

            // 7. Emit Event (Using a simple internal notification mechanism for now)
            // In a real microservice, this would go to RabbitMQ/Kafka.
            // In our monolith, we can use a shared EventEmitter or just call a hook.
            this.dispatchAdmissionEvent(tenantId, student.id, enrollment);

            return {
                student_id: student.id,
                admission_no: student.admission_no,
                enrollment_id: enrollment.id
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    private dispatchAdmissionEvent(tenantId: number, studentId: number, enrollment: any) {
        this.eventBus.emit("STUDENT_ADMITTED", {
            tenantId,
            studentId,
            classroomId: enrollment.classroom_id,
            academicYearId: enrollment.academic_year_id
        });
        console.log(`[EventBus] Emitted STUDENT_ADMITTED: student=${studentId}`);
    }
}
