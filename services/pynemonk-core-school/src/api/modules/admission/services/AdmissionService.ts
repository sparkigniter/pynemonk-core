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
        email?: string;
        gender: string;
        date_of_birth: string;
        mother_tongue?: string;
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
        email?: string;
        phone: string;
        gender?: string;
        relation: string;
        occupation?: string;
        address?: string;
        is_emergency?: boolean;
        avatar_url?: string;
    };
    enrollment?: {
        classroom_id?: number;
        grade_id?: number;
        section?: string;
        academic_year_id: number;
        roll_number?: string;
    };
    finance?: {
        payment_method?: string;
        amount_paid?: number;
        reference_no?: string;
        notes?: string;
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

    public async admitStudent(tenantId: number, data: AdmissionRequest, userId: number): Promise<any> {
        const client = await this.db.connect();
        try {
            await client.query("BEGIN");

            // 0. Resolve Classroom ID if not provided
            let classroomId = data.enrollment?.classroom_id;
            if (!classroomId && data.enrollment?.grade_id && data.enrollment?.section) {
                const classroom = await this.classroomHelper.findByGradeAndSection(
                    tenantId,
                    data.enrollment.academic_year_id,
                    data.enrollment.grade_id,
                    data.enrollment.section,
                );
                if (classroom) {
                    classroomId = classroom.id;
                }
            }

            // 1. Create Student Auth User
            const studentEmail = data.student.email || `std_${data.student.admission_no.toLowerCase().replace(/[^a-z0-9]/g, '_')}@pynemonk.internal`;
            const studentAuth = await this.authClient.createUser(
                {
                    tenant_id: tenantId,
                    email: studentEmail,
                    password: "ChangeMe123!", // Initial default password
                    role_slug: "student",
                },
                client,
            );

            // 2. Create Guardian Auth User
            const guardianEmail = data.guardian.email || `grd_${data.student.admission_no.toLowerCase().replace(/[^a-z0-9]/g, '_')}@pynemonk.internal`;
            const guardianAuth = await this.authClient.createUser(
                {
                    tenant_id: tenantId,
                    email: guardianEmail,
                    password: "ChangeMe123!",
                    role_slug: "parent",
                },
                client,
            );

            // 3. Create Student Profile
            const student = await this.studentHelper.createStudent(
                {
                    ...data.student,
                    tenant_id: tenantId,
                    user_id: studentAuth.id,
                    email: studentEmail,
                },
                client,
            );
            console.log(`[AdmissionService] Student profile created: ${student.id}`);

            // 4. Create Guardian Profile
            const guardian = await this.guardianHelper.createGuardian(
                {
                    ...data.guardian,
                    tenant_id: tenantId,
                    user_id: guardianAuth.id,
                    email: guardianEmail,
                },
                client,
            );
            console.log(`[AdmissionService] Guardian profile created: ${guardian.id}`);

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
            let enrollment = null;
            if (classroomId && data.enrollment) {
                enrollment = await this.enrollmentHelper.enrollStudent(
                    {
                        tenant_id: tenantId,
                        student_id: student.id,
                        classroom_id: classroomId,
                        academic_year_id: data.enrollment.academic_year_id,
                        roll_number: data.enrollment.roll_number,
                    },
                    client,
                );
            }

            await client.query("COMMIT");

            // 7. Emit Event
            const studentName = `${student.first_name} ${student.last_name}`;
            const academicYearId = enrollment?.academic_year_id || data.enrollment?.academic_year_id;
            
            if (academicYearId) {
                this.dispatchAdmissionEvent(
                    tenantId, 
                    student.id, 
                    studentName, 
                    academicYearId, 
                    enrollment?.classroom_id || null, 
                    userId, 
                    data.finance
                );
            }

            return {
                student_id: student.id,
                admission_no: student.admission_no,
                enrollment_id: enrollment?.id,
            };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    private dispatchAdmissionEvent(tenantId: number, studentId: number, studentName: string, academicYearId: number, classroomId: number | null, userId: number, finance?: any) {
        // Map to standard accounting automation format
        const totalFee = finance?.admission_fee ?? 0;
        const amountPaid = finance?.amount_paid ?? 0;
        
        // isPaid should be true only if explicitly set or if amountPaid covers the totalFee
        // If amountPaid is 0 and is_paid is false, isPaid will be false.
        const isPaid = !!(finance?.is_paid || (amountPaid > 0 && totalFee > 0 && amountPaid >= totalFee));

        const eventData = {
            tenantId,
            studentId,
            studentName,
            userId,
            classroomId,
            academicYearId,
            amount: totalFee,
            amountPaid: amountPaid,
            isPaid,
            paymentMethod: finance?.payment_method || 'Cash',
            reference: finance?.reference_no || `ADM-${Date.now()}`,
            finance
        };

        this.eventBus.emit("ADMISSION_COMPLETED", eventData);
        console.log(`[AdmissionService] >>> EVENT EMITTED: ADMISSION_COMPLETED for student: ${studentName}`);
        console.log(`[AdmissionService] Payload: ${JSON.stringify(eventData)}`);
    }
}
