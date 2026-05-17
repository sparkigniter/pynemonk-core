import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import { IAuthClient } from "../../../core/interfaces/IAuthClient.js";
import StudentHelper from "../../student/helpers/StudentHelper.js";
import GuardianHelper from "../../guardian/helpers/GuardianHelper.js";
import EnrollmentHelper from "../../student/helpers/EnrollmentHelper.js";
import ClassroomHelper from "../../classroom/helpers/ClassroomHelper.js";
import NotificationService from "../../notification/services/NotificationService.js";
import { NotificationChannel } from "../../notification/types.js";
import { EventEmitter } from "events";
import { FeeService } from "../../finance/services/FeeService.js";

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
        bank_account_id?: number;
        amount_paid?: number;
        admission_fee?: number;
        structure_ids?: number[];
        reference_no?: string;
        notes?: string;
        is_paid?: boolean;
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
        private notificationService: NotificationService,
        private feeService: FeeService,
    ) {}

    public async admitStudent(tenantId: number, data: AdmissionRequest, userId: number): Promise<any> {
        const client = await this.db.connect();
        try {
            await client.query("BEGIN");

            // 0. Resolve IDs and sanitize empty strings to prevent Postgres integer syntax errors
            const rawEnrollment: any = data.enrollment || {};
            const academicYearId = rawEnrollment.academic_year_id ? parseInt(rawEnrollment.academic_year_id.toString()) : null;
            const gradeId = rawEnrollment.grade_id ? parseInt(rawEnrollment.grade_id.toString()) : null;
            let classroomId = rawEnrollment.classroom_id ? parseInt(rawEnrollment.classroom_id.toString()) : null;

            if (!classroomId && gradeId && rawEnrollment.section && academicYearId) {
                const classroom = await this.classroomHelper.findByGradeAndSection(
                    tenantId,
                    academicYearId,
                    gradeId,
                    rawEnrollment.section,
                );
                if (classroom) {
                    classroomId = classroom.id;
                }
            }

            // Update the data object with sanitized integers for consistent downstream usage
            if (data.enrollment) {
                data.enrollment.academic_year_id = academicYearId as any;
                data.enrollment.grade_id = gradeId as any;
                data.enrollment.classroom_id = classroomId as any;
            }

            // Sanitize finance data
            if (data.finance) {
                data.finance.admission_fee = data.finance.admission_fee ? parseFloat(data.finance.admission_fee.toString()) : 0;
                data.finance.amount_paid = data.finance.amount_paid ? parseFloat(data.finance.amount_paid.toString()) : 0;
            }

            // 1. Create Student Auth User
            const studentEmail = data.student.email || `std_${data.student.admission_no.toLowerCase().replace(/[^a-z0-9]/g, '_')}@luviaedu.internal`;
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
            const guardianEmail = data.guardian.email || `grd_${data.student.admission_no.toLowerCase().replace(/[^a-z0-9]/g, '_')}@luviaedu.internal`;
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
                    grade_id: data.enrollment?.grade_id,
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
            console.log(`[AdmissionService] Enrollment created: ${enrollment?.id}`);
            
            // 7. Fee Allocation (Institutional Finance)
            const finance = data.finance;
            // Support both singular structure_id (backward compat) and plural structure_ids
            const structureIds = finance?.structure_ids || 
                                ((finance as any)?.structure_id ? [(finance as any).structure_id] : []);

            console.log(`[AdmissionService] Finance data detected. Structures:`, structureIds);

            if (structureIds.length > 0) {
                console.log(`[AdmissionService] Allocating ${structureIds.length} fee structures`);
                
                for (const structureId of structureIds) {
                    await this.feeService.allocateFee(
                        tenantId, 
                        student.id, 
                        structureId, 
                        data.enrollment!.academic_year_id,
                        client
                    );
                }
                
                // 8. Handle Initial Payment (distributed across all allocations)
                if (finance?.amount_paid && finance.amount_paid > 0) {
                    console.log(`[AdmissionService] Recording distributed payment: ${finance.amount_paid}`);
                    
                    // Fetch all installments for the student across all structures
                    const installments = await this.feeService.getStudentFees(tenantId, student.id, client);
                    const unpaidInstallments = installments.filter((f: any) => f.status !== 'PAID');
                    
                    let remainingPayment = finance.amount_paid;
                    for (const installment of unpaidInstallments) {
                        if (remainingPayment <= 0) break;

                        const unpaidAmount = parseFloat(installment.amount_due) - parseFloat(installment.amount_paid);
                        const amountToPay = Math.min(remainingPayment, unpaidAmount);
                        
                        if (amountToPay > 0) {
                            await this.feeService.recordPayment(
                                tenantId,
                                installment.id,
                                amountToPay,
                                {
                                    payment_method: finance.payment_method,
                                    bank_account_id: finance.bank_account_id,
                                    reference: finance.reference_no || (finance as any).reference
                                },
                                client
                            );
                            remainingPayment -= amountToPay;
                        }
                    }
                }
            }

            await client.query("COMMIT");

            // Send Admission Notification
            this.notificationService.notify(
                [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
                {
                    to: data.student.email || '',
                    title: 'Welcome to LuviaEdu!',
                    body: `Hello ${data.student.first_name}, your admission has been successfully processed with Admission No: ${data.student.admission_no}.`
                }
            ).catch((err: any) => console.error('Notification trigger failed:', err));

            // 7. Emit Event
            const studentName = `${student.first_name} ${student.last_name}`;
            const eventAcademicYearId = enrollment?.academic_year_id || data.enrollment?.academic_year_id;
            
            if (eventAcademicYearId) {
                this.dispatchAdmissionEvent(
                    tenantId, 
                    student.id, 
                    studentName, 
                    eventAcademicYearId, 
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
        } catch (error: any) {
            await client.query("ROLLBACK");
            if (error.code === '23505') {
                const err: any = new Error(`Admission number "${data.student.admission_no}" is already in use by another student.`);
                err.statusCode = 409;
                throw err;
            }
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
