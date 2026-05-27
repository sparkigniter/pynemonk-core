import { injectable, inject } from 'tsyringe';
import { Pool } from 'pg';

@injectable()
export class LessonPlanService {
    constructor(@inject('DB') private db: Pool) {}

    async getLessonPlans(tenantId: number, staffId: number, startDate: string, endDate: string) {
        // Resolve staff_id from user_id if needed
        const staffRes = await this.db.query(
            `SELECT id FROM school.staff WHERE user_id = $1 OR id = $1 LIMIT 1`,
            [staffId]
        );
        const resolvedStaffId = staffRes.rows.length > 0 ? staffRes.rows[0].id : staffId;

        // 1. Fetch manual lesson plans
        const manualQuery = `
            SELECT 
                lp.*,
                pc.name as chapter_name,
                false as is_smart_plan
            FROM school.lesson_plan lp
            LEFT JOIN school.planner_chapter pc ON lp.planner_chapter_id = pc.id
            WHERE lp.tenant_id = $1 
              AND lp.staff_id = $2
              AND lp.scheduled_date >= $3
              AND lp.scheduled_date <= $4
            ORDER BY lp.scheduled_date ASC, lp.period_start_time ASC
        `;
        const { rows: manualPlans } = await this.db.query(manualQuery, [tenantId, resolvedStaffId, startDate, endDate]);

        // 2. Fetch smart planned sessions mapped to timetable periods
        const smartQuery = `
            SELECT 
                ps.id as id,
                ps.scheduled_date,
                ps.status,
                ps.teacher_notes as teaching_notes,
                ap.classroom_id,
                sub.school_subject_id as subject_id,
                COALESCE(ps.custom_topic_title, gt.title) as topic_title,
                gc.title as chapter_name,
                t.start_time as period_start_time,
                true as is_smart_plan
            FROM school.planned_session ps
            JOIN school.auto_academic_plan ap ON ps.plan_id = ap.id
            JOIN school.school_syllabus_subscription sub ON ap.school_syllabus_id = sub.id
            JOIN school.global_topic gt ON ps.global_topic_id = gt.id
            JOIN school.global_chapter gc ON gt.chapter_id = gc.id
            JOIN school.timetable t ON t.classroom_id = ap.classroom_id 
                                   AND t.subject_id = sub.school_subject_id 
                                   AND t.day_of_week = extract(isodow from ps.scheduled_date)
                                   AND t.is_deleted = FALSE
            WHERE ap.tenant_id = $1
              AND (ap.teacher_id = $2 OR t.teacher_id = $2)
              AND ps.scheduled_date >= $3
              AND ps.scheduled_date <= $4
        `;
        const { rows: smartPlans } = await this.db.query(smartQuery, [tenantId, resolvedStaffId, startDate, endDate]);

        const formatDate = (d: any) => {
            if (d instanceof Date) {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            }
            if (typeof d === 'string') return d.split('T')[0];
            return String(d);
        };

        const formatTime = (t: string) => {
            if (!t) return '';
            return t.slice(0, 5);
        };

        const normalized = new Map<string, any>();

        for (const sp of smartPlans) {
            const dateStr = formatDate(sp.scheduled_date);
            const timeStr = formatTime(sp.period_start_time);
            const key = `${dateStr}_${timeStr}_${sp.classroom_id}_${sp.subject_id}`;
            normalized.set(key, {
                ...sp,
                scheduled_date: dateStr,
                period_start_time: sp.period_start_time
            });
        }

        for (const lp of manualPlans) {
            const dateStr = formatDate(lp.scheduled_date);
            const timeStr = formatTime(lp.period_start_time);
            const key = `${dateStr}_${timeStr}_${lp.classroom_id}_${lp.subject_id}`;
            normalized.set(key, {
                ...lp,
                scheduled_date: dateStr,
                period_start_time: lp.period_start_time
            });
        }

        return Array.from(normalized.values());
    }

    async saveLessonPlan(tenantId: number, data: any) {
        // Resolve staff_id from user_id if needed
        const staffRes = await this.db.query(
            `SELECT id FROM school.staff WHERE user_id = $1 OR id = $1 LIMIT 1`,
            [data.staff_id]
        );
        const resolvedStaffId = staffRes.rows.length > 0 ? staffRes.rows[0].id : data.staff_id;

        const query = `
            INSERT INTO school.lesson_plan (
                tenant_id, staff_id, classroom_id, subject_id, 
                planner_chapter_id, planner_topic_id, scheduled_date, period_start_time, 
                topic_title, teaching_notes, homework_assigned, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (tenant_id, staff_id, classroom_id, subject_id, scheduled_date, period_start_time)
            DO UPDATE SET
                planner_chapter_id = EXCLUDED.planner_chapter_id,
                planner_topic_id = EXCLUDED.planner_topic_id,
                topic_title = EXCLUDED.topic_title,
                teaching_notes = EXCLUDED.teaching_notes,
                homework_assigned = EXCLUDED.homework_assigned,
                status = EXCLUDED.status,
                updated_at = NOW()
            RETURNING *
        `;
        
        const values = [
            tenantId,
            resolvedStaffId,
            data.classroom_id,
            data.subject_id,
            data.planner_chapter_id || null,
            data.planner_topic_id || null,
            data.scheduled_date,
            data.period_start_time,
            data.topic_title || null,
            data.teaching_notes || null,
            data.homework_assigned || null,
            data.status || 'PLANNED'
        ];

        const { rows } = await this.db.query(query, values);
        return rows[0];
    }
}
