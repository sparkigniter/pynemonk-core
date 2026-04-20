import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import { IAuthClient } from "../../../core/interfaces/IAuthClient.js";
import StudentHelper from "../../student/helpers/StudentHelper.js";
import GuardianHelper from "../../guardian/helpers/GuardianHelper.js";
import EnrollmentHelper from "../../student/helpers/EnrollmentHelper.js";
import ClassroomHelper from "../../classroom/helpers/ClassroomHelper.js";
import { EventEmitter } from "events";

export interface AdmissionRequest {
    student: {
        admission_no: string;
        first_name: string;
        last_name: string;
        email: string;
        gender: string;
        date_of_birth: string;
        blood_group?: string;
        nationality?: string;
        religion?: string;
        phone?: string;
        address?: string;
        avatar_url?: string;
    };
    guardian: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        gender?: string;
        relation: string;
        occupation?: string;
        address?: string;
        is_emergency?: boolean;
        avatar_url?: string;
    };
    enrollment: {
        classroom_id?: number;
        grade_id?: number;
        section?: string;
        academic_year_id: number;
        roll_number?: string;
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
        private enrollmentHelper: EnrollmentHelper,
        private classroomHelper: ClassroomHelper,
    ) {}

    public async admitStudent(tenantId: number, data: AdmissionRequest): Promise<any> {
        const client = await this.db.connect();
        try {
            await client.query("BEGIN");

            // 0. Resolve Classroom ID if not provided
            let classroomId = data.enrollment.classroom_id;
            if (!classroomId && data.enrollment.grade_id && data.enrollment.section) {
                const classroom = await this.classroomHelper.findByGradeAndSection(
                    tenantId,
                    data.enrollment.academic_year_id,
                    data.enrollment.grade_id,
                    data.enrollment.section,
                );
                if (!classroom) {
                    throw new Error(
                        `Classroom not found for Grade ${data.enrollment.grade_id} Section ${data.enrollment.section}`,
                    );
                }
                classroomId = classroom.id;
            }

            if (!classroomId) {
                throw new Error("Classroom ID is required for enrollment");
            }

            // 1. Create Student Auth User
            const studentAuth = await this.authClient.createUser(
                {
                    tenant_id: tenantId,
                    email: data.student.email,
                    password: "ChangeMe123!", // Initial default password
                    role_slug: "student",
                },
                client,
            );

            // 2. Create Guardian Auth User
            const guardianAuth = await this.authClient.createUser(
                {
                    tenant_id: tenantId,
                    email: data.guardian.email,
                    password: "ChangeMe123!",
                    role_slug: "parent",
                },
                client,
            );

            // 3. Create Student Profile
            const student = await this.studentHelper.createStudent(
                {
                    tenant_id: tenantId,
                    user_id: studentAuth.id,
                    ...data.student,
                },
                client,
            );

            // 4. Create Guardian Profile
            const guardian = await this.guardianHelper.createGuardian(
                {
                    tenant_id: tenantId,
                    user_id: guardianAuth.id,
                    ...data.guardian,
                },
                client,
            );

            // 5. Link Student and Guardian
            await this.guardianHelper.linkStudent(
                tenantId,
                student.id,
                guardian.id,
                data.guardian.relation,
                data.guardian.is_emergency || false,
                client,
            );

            // 6. Enroll Student in Classroom
            const enrollment = await this.enrollmentHelper.enrollStudent(
                {
                    tenant_id: tenantId,
                    student_id: student.id,
                    classroom_id: classroomId,
                    academic_year_id: data.enrollment.academic_year_id,
                    roll_number: data.enrollment.roll_number,
                },
                client,
            );

            await client.query("COMMIT");

            // 7. Emit Event
            this.dispatchAdmissionEvent(tenantId, student.id, enrollment);

            return {
                student_id: student.id,
                admission_no: student.admission_no,
                enrollment_id: enrollment.id,
            };
        } catch (error) {
            await client.query("ROLLBACK");
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
            academicYearId: enrollment.academic_year_id,
        });
        console.log(`[EventBus] Emitted STUDENT_ADMITTED: student=${studentId}`);
    }
}
