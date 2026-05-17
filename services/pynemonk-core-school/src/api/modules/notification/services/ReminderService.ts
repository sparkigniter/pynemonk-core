import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import NotificationService from "../../notification/services/NotificationService.js";
import { NotificationChannel } from "../../notification/types.js";

@injectable()
export default class ReminderService {
    constructor(
        @inject("DB") private db: Pool,
        private notificationService: NotificationService
    ) {}

    /**
     * Scan and send reminders for overdue fee installments
     */
    public async sendFeeReminders(tenantId: number): Promise<number> {
        const query = `
            SELECT 
                fi.id, fi.amount_due, fi.amount_paid, fi.due_date,
                s.first_name as student_name, s.id as student_id,
                g.first_name as guardian_name, g.phone as guardian_phone, g.email as guardian_email
            FROM school.fee_installment fi
            JOIN school.student_fee_allocation sfa ON fi.allocation_id = sfa.id
            JOIN school.student s ON sfa.student_id = s.id
            JOIN school.student_guardian sg ON s.id = sg.student_id
            JOIN school.guardian g ON sg.guardian_id = g.id
            WHERE sfa.tenant_id = $1 
              AND fi.status IN ('unpaid', 'partial')
              AND fi.due_date < CURRENT_DATE
              AND sg.is_deleted = FALSE
              AND sg.relation IN ('Father', 'Mother', 'Guardian') -- Focus on primary contacts
            LIMIT 50 -- Batch processing
        `;

        const { rows } = await this.db.query(query, [tenantId]);
        
        for (const row of rows) {
            const balance = parseFloat(row.amount_due) - parseFloat(row.amount_paid || 0);
            
            await this.notificationService.notifyStudent(row.student_id, [NotificationChannel.EMAIL, NotificationChannel.SMS], {
                to: row.guardian_email || row.guardian_phone,
                title: "Fee Payment Reminder",
                body: `Dear ${row.guardian_name}, this is a reminder that the fee installment for ${row.student_name} of ₹${balance.toLocaleString()} was due on ${new Date(row.due_date).toLocaleDateString()}. Please clear it at the earliest to avoid late fees.`,
                data: {
                    type: 'fee_reminder',
                    amount: balance,
                    due_date: row.due_date,
                    tenantId
                }
            });

            // Log that reminder was sent (we could have a notification_log table)
        }

        return rows.length;
    }

    /**
     * Notify parents about student absence
     */
    public async sendAbsenceAlert(tenantId: number, studentId: number, date: string): Promise<void> {
        const query = `
            SELECT s.first_name, g.first_name as guardian_name, g.phone
            FROM school.student s
            JOIN school.student_guardian sg ON s.id = sg.student_id
            JOIN school.guardian g ON sg.guardian_id = g.id
            WHERE s.id = $1 AND s.tenant_id = $2 AND sg.is_deleted = FALSE
            LIMIT 1
        `;
        const { rows } = await this.db.query(query, [studentId, tenantId]);
        
        if (rows.length > 0) {
            const student = rows[0];
            await this.notificationService.notifyStudent(studentId, [NotificationChannel.SMS], {
                to: student.phone,
                title: "Attendance Alert",
                body: `Dear Parent, your child ${student.first_name} was marked ABSENT today (${date}). Please provide a leave note if this was planned.`,
                data: { type: 'attendance_alert', date, tenantId }
            });
        }
    }

    /**
     * Upcoming exam reminders
     */
    public async sendExamReminders(tenantId: number, daysAhead: number = 1): Promise<number> {
        const query = `
            SELECT DISTINCT
                e.name as exam_name, sub.name as subject_name, p.exam_date, p.start_time,
                s.id as student_id, s.first_name as student_name
            FROM school.exam_paper p
            JOIN school.exam e ON p.exam_id = e.id
            JOIN school.subject sub ON p.subject_id = sub.id
            JOIN school.exam_invitation ei ON e.id = ei.exam_id
            JOIN school.student_enrollment se ON ei.classroom_id = se.classroom_id
            JOIN school.student s ON se.student_id = s.id
            WHERE se.tenant_id = $1 
              AND p.exam_date = CURRENT_DATE + $2 * INTERVAL '1 day'
              AND e.is_deleted = FALSE
        `;
        const { rows } = await this.db.query(query, [tenantId, daysAhead]);

        for (const row of rows) {
            await this.notificationService.notifyStudent(row.student_id, [NotificationChannel.PUSH], {
                title: "Exam Tomorrow",
                body: `Hi ${row.student_name}, your ${row.subject_name} exam (${row.exam_name}) is scheduled for tomorrow at ${row.start_time}. Best of luck!`,
                data: { type: 'exam_reminder', exam_id: row.exam_id, tenantId }
            });
        }

        return rows.length;
    }
}
