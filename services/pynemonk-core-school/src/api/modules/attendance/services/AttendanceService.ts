import { injectable, inject } from "tsyringe";
import { Pool } from "pg";

@injectable()
export class AttendanceService {
    constructor(@inject("DB") private db: Pool) { }

    /**
     * Get students enrolled in a classroom for attendance taking.
     * Includes current attendance status for a specific date.
     */
    public async getClassroomRoster(tenantId: number, classroomId: number, date: string) {
        const query = `
            SELECT 
                s.id as student_id,
                s.first_name,
                s.last_name,
                s.admission_no,
                s.avatar_url,
                se.id as enrollment_id,
                se.roll_number,
                a.status as attendance_status,
                a.remarks
            FROM school.student_enrollment se
            JOIN school.student s ON se.student_id = s.id
            LEFT JOIN school.attendance a ON se.id = a.enrollment_id AND a.date = $3
            WHERE se.classroom_id = $2 AND se.tenant_id = $1 AND se.is_deleted = FALSE
            ORDER BY se.roll_number, s.first_name
        `;
        const res = await this.db.query(query, [tenantId, classroomId, date]);
        return res.rows;
    }

    /**
     * Bulk upsert attendance records.
     */
    public async saveBulkAttendance(tenantId: number, userId: number, date: string, classroomId: number, subjectId: number, records: any[]) {
        // 1. Find staff_id for the user
        const staffRes = await this.db.query(
            'SELECT id FROM school.staff WHERE user_id = $1 AND tenant_id = $2',
            [userId, tenantId]
        );
        
        if (staffRes.rows.length === 0) {
            throw new Error('User is not a registered staff member.');
        }
        const staffId = staffRes.rows[0].id;

        // 2. Attendance Mode & Validation
        const settingsRes = await this.db.query(
            "SELECT value FROM school.settings WHERE tenant_id = $1 AND key = 'attendance_mode' AND is_deleted = FALSE",
            [tenantId]
        );
        const mode = settingsRes.rows[0]?.value || 'DAILY';

        if (mode === 'DAILY') {
            const classRes = await this.db.query(
                'SELECT class_teacher_id FROM school.classroom WHERE id = $1',
                [classroomId]
            );
            if (classRes.rows[0]?.class_teacher_id !== staffId) {
                throw new Error('Only the designated Class Teacher can mark daily attendance for this classroom.');
            }
        } else {
            // PERIOD_WISE: Timetable Validation
            const dayOfWeek = new Date(date).getDay() || 7;
            const ttRes = await this.db.query(
                `SELECT 1 FROM school.timetable 
                 WHERE teacher_id = $1 AND classroom_id = $2 AND subject_id = $3 AND day_of_week = $4 AND is_deleted = FALSE`,
                [staffId, classroomId, subjectId, dayOfWeek]
            );

            if (ttRes.rows.length === 0) {
                throw new Error('No scheduled timetable slot found for this teacher in this class/subject today.');
            }
        }

        // 3. Map students to enrollments
        const enrollmentRes = await this.db.query(
            'SELECT id, student_id FROM school.student_enrollment WHERE classroom_id = $1 AND is_deleted = FALSE',
            [classroomId]
        );
        const enrollmentMap = Object.fromEntries(enrollmentRes.rows.map((r: any) => [r.student_id, r.id]));

        const client = await this.db.connect();
        try {
            await client.query('BEGIN');

            for (const record of records) {
                const enrollmentId = enrollmentMap[record.student_id];
                if (!enrollmentId) continue;

                const upsertQuery = `
                    INSERT INTO school.attendance (
                        tenant_id, enrollment_id, date, status, remarks, marked_by
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (enrollment_id, date) 
                    DO UPDATE SET 
                        status = EXCLUDED.status,
                        remarks = EXCLUDED.remarks,
                        marked_by = EXCLUDED.marked_by,
                        updated_at = NOW()
                `;
                await client.query(upsertQuery, [
                    tenantId, 
                    enrollmentId, 
                    date, 
                    record.status || 'present', 
                    record.remarks || '', 
                    staffId
                ]);
            }

            await client.query('COMMIT');
            return { success: true, count: records.length };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

export default AttendanceService;
