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
            SELECT DISTINCT start_time, end_time
            FROM school.timetable
            WHERE tenant_id = $1 AND academic_year_id = $2 AND is_deleted = FALSE
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
