import { inject, injectable } from "tsyringe";
import { Pool } from "pg";
import AcademicYearHelper from "../../academics/helpers/AcademicYearHelper.js";

export interface TimetableEntry {
    id?: number;
    tenant_id: number;
    classroom_id: number;
    subject_id: number;
    teacher_id: number;
    academic_year_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
}

@injectable()
export class TimetableService {
    constructor(
        @inject("DB") private pool: Pool,
        @inject(AcademicYearHelper) private academicYearHelper: AcademicYearHelper
    ) { }

    async getByClassroom(tenantId: number, classroomId: number, academicYearId?: number) {
        if (!academicYearId) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            academicYearId = currentYear?.id;
        }

        const query = `
            SELECT t.*, s.name as subject_name, st.first_name || ' ' || st.last_name as teacher_name
            FROM school.timetable t
            JOIN school.subject s ON t.subject_id = s.id
            JOIN school.staff st ON t.teacher_id = st.id
            WHERE t.tenant_id = $1 AND t.classroom_id = $2 AND t.academic_year_id = $3 AND t.is_deleted = FALSE
            ORDER BY t.day_of_week, t.start_time
        `;
        const result = await this.pool.query(query, [tenantId, classroomId, academicYearId]);
        return result.rows;
    }

    async createEntry(entry: TimetableEntry) {
        if (!entry.academic_year_id) {
            const currentYear = await this.academicYearHelper.findCurrent(entry.tenant_id);
            entry.academic_year_id = currentYear?.id;
        }

        await this.checkConflicts(entry);
        const query = `
            INSERT INTO school.timetable 
            (tenant_id, classroom_id, subject_id, teacher_id, academic_year_id, day_of_week, start_time, end_time)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const values = [entry.tenant_id, entry.classroom_id, entry.subject_id, entry.teacher_id, entry.academic_year_id, entry.day_of_week, entry.start_time, entry.end_time];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async updateEntry(id: number, entry: Partial<TimetableEntry>) {
        const tenantId = entry.tenant_id!;
        const current = await this.pool.query('SELECT * FROM school.timetable WHERE id = $1 AND tenant_id = $2 AND is_deleted = FALSE', [id, tenantId]);
        if (current.rows.length === 0) throw new Error("Entry not found");

        const merged = { ...current.rows[0], ...entry };
        await this.checkConflicts(merged, id);

        const query = `
            UPDATE school.timetable 
            SET day_of_week = $1, start_time = $2, end_time = $3, teacher_id = $4, subject_id = $5, updated_at = NOW()
            WHERE id = $6 AND tenant_id = $7
            RETURNING *
        `;
        const result = await this.pool.query(query, [
            merged.day_of_week, merged.start_time, merged.end_time, merged.teacher_id, merged.subject_id, id, tenantId
        ]);
        return result.rows[0];
    }

    private async checkConflicts(entry: TimetableEntry, excludeId?: number) {
        const excludeClause = excludeId ? `AND t.id != ${excludeId}` : '';

        // Teacher conflict
        const teacherQuery = `
            SELECT t.*, c.name as classroom_name
            FROM school.timetable t
            JOIN school.classroom c ON t.classroom_id = c.id
            WHERE t.tenant_id = $1 
              AND t.teacher_id = $2 
              AND t.day_of_week = $3
              AND t.is_deleted = FALSE
              ${excludeClause}
              AND ((t.start_time, t.end_time) OVERLAPS ($4::time, $5::time))
        `;
        const teacherConflict = await this.pool.query(teacherQuery, [
            entry.tenant_id, entry.teacher_id, entry.day_of_week, entry.start_time, entry.end_time
        ]);

        if (teacherConflict.rows.length > 0) {
            const conflict = teacherConflict.rows[0];
            throw new Error(`Teacher conflict: This teacher is already assigned to ${conflict.classroom_name} at this time.`);
        }

        // Classroom conflict
        const classroomQuery = `
            SELECT t.*, s.name as subject_name
            FROM school.timetable t
            JOIN school.subject s ON t.subject_id = s.id
            WHERE t.tenant_id = $1 
              AND t.classroom_id = $2 
              AND t.day_of_week = $3
              AND t.is_deleted = FALSE
              ${excludeClause}
              AND ((t.start_time, t.end_time) OVERLAPS ($4::time, $5::time))
        `;
        const classroomConflict = await this.pool.query(classroomQuery, [
            entry.tenant_id, entry.classroom_id, entry.day_of_week, entry.start_time, entry.end_time
        ]);

        if (classroomConflict.rows.length > 0) {
            throw new Error(`Classroom conflict: This classroom is already occupied by ${classroomConflict.rows[0].subject_name} at this time.`);
        }
    }

    async deleteEntry(tenantId: number, id: number) {
        await this.pool.query('UPDATE school.timetable SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    }

    async toggleSticky(tenantId: number, id: number, isSticky: boolean) {
        const query = `UPDATE school.timetable SET is_sticky = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`;
        const res = await this.pool.query(query, [isSticky, id, tenantId]);
        return res.rows[0];
    }

    async getBreaks(tenantId: number) {
        const res = await this.pool.query(
            `SELECT id, name, start_time, end_time FROM school.period_config WHERE tenant_id = $1 AND is_break = TRUE AND is_deleted = FALSE ORDER BY start_time`,
            [tenantId]
        );
        return res.rows;
    }

    async createBreak(tenantId: number, data: { name: string, start_time: string, end_time: string }) {
        const res = await this.pool.query(
            `INSERT INTO school.period_config (tenant_id, name, start_time, end_time, is_break) VALUES ($1, $2, $3, $4, TRUE) RETURNING *`,
            [tenantId, data.name, data.start_time, data.end_time]
        );
        return res.rows[0];
    }

    async deleteBreak(tenantId: number, id: number) {
        await this.pool.query(
            `UPDATE school.period_config SET is_deleted = TRUE WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );
        return { success: true };
    }

    async finalizeTimetable(tenantId: number, classroomId: number, academicYearId?: number) {
        if (!academicYearId) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            academicYearId = currentYear?.id;
        }
        await this.pool.query(`
            UPDATE school.timetable 
            SET is_sticky = TRUE, updated_at = NOW() 
            WHERE tenant_id = $1 AND classroom_id = $2 AND academic_year_id = $3 AND is_deleted = FALSE
        `, [tenantId, classroomId, academicYearId]);
        return { success: true, message: "Timetable finalized successfully" };
    }

    async generateAutomatedTimetable(tenantId: number, classroomId: number, academicYearId?: number) {
        if (!academicYearId) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            academicYearId = currentYear?.id;
        }

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Clear all non-sticky entries for this classroom/year
            await client.query(`
                UPDATE school.timetable 
                SET is_deleted = TRUE, updated_at = NOW() 
                WHERE tenant_id = $1 AND classroom_id = $2 AND academic_year_id = $3 AND is_sticky = FALSE
            `, [tenantId, classroomId, academicYearId]);

            // 2. Get requirements: Subjects for this grade/classroom and their target periods per week
            const reqQuery = `
                WITH subjects_to_schedule AS (
                    SELECT s.id as subject_id, COALESCE(s.periods_per_week, 5) as periods_per_week
                    FROM school.class_subject cs
                    JOIN school.subject s ON cs.subject_id = s.id
                    WHERE cs.classroom_id = $2 AND cs.is_deleted = FALSE
                    UNION
                    SELECT s.id as subject_id, COALESCE(s.periods_per_week, 5) as periods_per_week
                    FROM school.subject s
                    JOIN school.classroom c ON c.grade_id = s.grade_id
                    WHERE c.id = $2 AND s.is_deleted = FALSE
                    AND NOT EXISTS (SELECT 1 FROM school.class_subject WHERE classroom_id = $2 AND is_deleted = FALSE)
                )
                SELECT sts.*, ta.staff_id as teacher_id
                FROM subjects_to_schedule sts
                LEFT JOIN school.teacher_assignment ta ON ta.subject_id = sts.subject_id AND ta.classroom_id = $2 AND ta.academic_year_id = $1
            `;
            const requirements = await client.query(reqQuery, [academicYearId, classroomId]);
            
            // 3. Get existing occupied slots (Sticky periods + School Breaks)
            const stickyQuery = `SELECT day_of_week, start_time, end_time FROM school.timetable WHERE classroom_id = $1 AND academic_year_id = $2 AND is_sticky = TRUE AND is_deleted = FALSE`;
            const stickyRes = await client.query(stickyQuery, [classroomId, academicYearId]);
            
            const breakQuery = `SELECT start_time, end_time, name FROM school.period_config WHERE tenant_id = $1 AND is_break = TRUE AND is_deleted = FALSE`;
            const breakRes = await client.query(breakQuery, [tenantId]);

            const occupiedSlots = new Set();
            stickyRes.rows.forEach(r => occupiedSlots.add(`${r.day_of_week}-${r.start_time}`));
            
            // Add breaks to occupied slots for EVERY day
            const days = [1, 2, 3, 4, 5];
            breakRes.rows.forEach(b => {
                days.forEach(d => occupiedSlots.add(`${d}-${b.start_time}`));
            });

            // 4. Calculate remaining periods needed
            const workload = requirements.rows.map(r => {
                const existing = stickyRes.rows.filter(s => (s as any).subject_id === r.subject_id).length;
                return { ...r, needed: Math.max(0, r.periods_per_week - existing) };
            }).filter(w => w.needed > 0 && w.teacher_id);

            if (workload.length === 0) {
                await client.query('ROLLBACK');
                return { success: false, message: "No subjects with assigned teachers found." };
            }

            // 5. Define standard slots
            const times = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];

            // 6. Greedy Allocation
            for (const day of days) {
                const scheduledToday = new Set();
                // Track subjects already scheduled for this day (including sticky entries)
                stickyRes.rows
                    .filter(r => r.day_of_week === day)
                    .forEach(r => scheduledToday.add(r.subject_id));

                for (const time of times) {
                    const slotKey = `${day}-${time}:00`;
                    if (occupiedSlots.has(slotKey)) continue;

                    for (let i = 0; i < workload.length; i++) {
                        const item = workload[i];
                        if (item.needed <= 0) continue;
                        
                        // IMPORTANT: Avoid repetitive subjects for the same day in auto-gen
                        if (scheduledToday.has(item.subject_id)) continue;

                        const endTime = `${(parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;
                        
                        const teacherBusy = await client.query(`
                            SELECT 1 FROM school.timetable 
                            WHERE tenant_id = $1 AND teacher_id = $2 AND day_of_week = $3 AND is_deleted = FALSE 
                            AND ((start_time, end_time) OVERLAPS ($4::time, $5::time))
                        `, [tenantId, item.teacher_id, day, time, endTime]);

                        if (teacherBusy.rows.length === 0) {
                            await client.query(`
                                INSERT INTO school.timetable (tenant_id, classroom_id, subject_id, teacher_id, academic_year_id, day_of_week, start_time, end_time, is_sticky)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
                            `, [tenantId, classroomId, item.subject_id, item.teacher_id, academicYearId, day, time, endTime]);
                            
                            item.needed--;
                            scheduledToday.add(item.subject_id);
                            break;
                        }
                    }
                }
            }

            await client.query('COMMIT');
            return { success: true, message: "Timetable generated successfully" };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async getAvailableSlots(tenantId: number, teacherId: number, classroomId: number, day: number) {
        const slots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
        const available = [];
        for (const startTime of slots) {
            const endTime = `${(parseInt(startTime.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;
            const teacherBusy = await this.pool.query(`SELECT 1 FROM school.timetable WHERE tenant_id = $1 AND teacher_id = $2 AND day_of_week = $3 AND is_deleted = FALSE AND ((start_time, end_time) OVERLAPS ($4::time, $5::time))`, [tenantId, teacherId, day, startTime, endTime]);
            const classroomBusy = await this.pool.query(`SELECT 1 FROM school.timetable WHERE tenant_id = $1 AND classroom_id = $2 AND day_of_week = $3 AND is_deleted = FALSE AND ((start_time, end_time) OVERLAPS ($4::time, $5::time))`, [tenantId, classroomId, day, startTime, endTime]);
            if (teacherBusy.rows.length === 0 && classroomBusy.rows.length === 0) available.push({ start_time: startTime, end_time: endTime });
        }
        return available;
    }

    async getTeacherSchedule(tenantId: number, teacherId: number, day: number, academicYearId?: number) {
        if (!academicYearId) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            academicYearId = currentYear?.id;
        }
        const query = `
            SELECT t.*, c.name as classroom_name, s.name as subject_name
            FROM school.timetable t
            JOIN school.classroom c ON t.classroom_id = c.id
            JOIN school.subject s ON t.subject_id = s.id
            WHERE t.tenant_id = $1 AND t.teacher_id = $2 AND t.day_of_week = $3 
              AND t.academic_year_id = $4 AND t.is_deleted = FALSE
            ORDER BY t.start_time
        `;
        const result = await this.pool.query(query, [tenantId, teacherId, day, academicYearId]);
        return result.rows;
    }

    async getUniquePeriods(tenantId: number, academicYearId?: number) {
        if (!academicYearId) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            academicYearId = currentYear?.id;
        }
        const query = `
            SELECT 
                ROW_NUMBER() OVER(ORDER BY start_time) as period_number,
                start_time, 
                end_time
            FROM (
                SELECT DISTINCT start_time, end_time
                FROM school.timetable
                WHERE tenant_id = $1 AND academic_year_id = $2 AND is_deleted = FALSE
            ) as unique_periods
            ORDER BY start_time
        `;
        const result = await this.pool.query(query, [tenantId, academicYearId]);
        return result.rows;
    }

    async getGlobalSchedule(tenantId: number, academicYearId?: number) {
        if (!academicYearId) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            academicYearId = currentYear?.id;
        }
        const query = `
            SELECT t.*, c.name as classroom_name, s.name as subject_name, st.user_id as teacher_user_id, 'timetable' as type
            FROM school.timetable t
            JOIN school.classroom c ON t.classroom_id = c.id
            JOIN school.subject s ON t.subject_id = s.id
            JOIN school.staff st ON t.teacher_id = st.id
            WHERE t.tenant_id = $1 AND t.academic_year_id = $2 AND t.is_deleted = FALSE
        `;
        const result = await this.pool.query(query, [tenantId, academicYearId]);
        return result.rows;
    }
}
