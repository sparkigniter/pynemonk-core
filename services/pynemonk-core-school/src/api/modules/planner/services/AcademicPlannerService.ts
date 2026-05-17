import { injectable, inject } from 'tsyringe';
import { Pool } from 'pg';

@injectable()
export class AcademicPlannerService {
    constructor(@inject('DB') private pool: Pool) {}

    async listPlanners(tenantId: number, filters: any) {
        let query = `
            SELECT p.*, s.name as subject_name, g.name as grade_name, 
                   st.first_name || ' ' || COALESCE(st.last_name, '') as teacher_name
            FROM school.academic_planner p
            JOIN school.subject s ON p.subject_id = s.id
            JOIN school.grade g ON p.grade_id = g.id
            JOIN school.staff st ON p.staff_id = st.id
            WHERE p.tenant_id = $1
        `;
        const values: any[] = [tenantId];
        let pIdx = 2;

        if (filters.staff_id) {
            query += ` AND p.staff_id = $${pIdx++}`;
            values.push(filters.staff_id);
        }
        if (filters.subject_id) {
            query += ` AND p.subject_id = $${pIdx++}`;
            values.push(filters.subject_id);
        }
        if (filters.grade_id) {
            query += ` AND p.grade_id = $${pIdx++}`;
            values.push(filters.grade_id);
        }

        query += ` ORDER BY p.created_at DESC`;
        const res = await this.pool.query(query, values);
        return res.rows;
    }

    async getPlannerByTeacherAndSubject(tenantId: number, staffId: number, subjectId: number, gradeId: number) {
        const res = await this.pool.query(
            `SELECT * FROM school.academic_planner 
             WHERE tenant_id = $1 AND staff_id = $2 AND subject_id = $3 AND grade_id = $4`,
            [tenantId, staffId, subjectId, gradeId]
        );
        return res.rows[0] || null;
    }

    async createPlanner(tenantId: number, data: any) {
        const res = await this.pool.query(
            `INSERT INTO school.academic_planner 
             (tenant_id, academic_year_id, staff_id, subject_id, grade_id, start_date, end_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (tenant_id, academic_year_id, staff_id, subject_id, grade_id) 
             DO UPDATE SET start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date, updated_at = NOW()
             RETURNING *`,
            [
                tenantId, 
                data.academic_year_id, 
                data.staff_id, 
                data.subject_id, 
                data.grade_id, 
                data.start_date || new Date().toISOString().split('T')[0], 
                data.end_date
            ]
        );
        return res.rows[0];
    }

    async getPlannerDetails(tenantId: number, id: number) {
        const plannerRes = await this.pool.query(
            `SELECT p.*, s.name as subject_name, g.name as grade_name,
                    st.first_name || ' ' || COALESCE(st.last_name, '') as teacher_name
             FROM school.academic_planner p
             JOIN school.subject s ON p.subject_id = s.id
             JOIN school.grade g ON p.grade_id = g.id
             JOIN school.staff st ON p.staff_id = st.id
             WHERE p.id = $1 AND p.tenant_id = $2`,
            [id, tenantId]
        );
        if (plannerRes.rows.length === 0) return null;

        const planner = plannerRes.rows[0];

        const chapters = await this.pool.query(
            `SELECT * FROM school.planner_chapter WHERE planner_id = $1 ORDER BY sequence_order ASC, id ASC`,
            [id]
        );
        const milestones = await this.pool.query(
            `SELECT * FROM school.planner_milestone WHERE planner_id = $1 ORDER BY target_date ASC`,
            [id]
        );

        // Get holiday events for this planner duration
        const holidaysRes = await this.pool.query(
            `SELECT start_date, end_date FROM school.event 
             WHERE tenant_id = $1 AND event_type = 'holiday' AND is_deleted = FALSE
               AND NOT (end_date < $2 OR start_date > $3)`,
            [tenantId, planner.start_date, planner.end_date]
        );

        const getHolidayDaysCount = (start: Date, end: Date) => {
            const holidaySet = new Set<string>();
            const targetStartMs = start.getTime();
            const targetEndMs = end.getTime();

            for (const h of holidaysRes.rows) {
                const hStart = new Date(h.start_date);
                const hEnd = new Date(h.end_date);
                
                const interStart = new Date(Math.max(targetStartMs, hStart.getTime()));
                const interEnd = new Date(Math.min(targetEndMs, hEnd.getTime()));

                if (interStart <= interEnd) {
                    let curr = new Date(interStart);
                    while (curr <= interEnd) {
                        holidaySet.add(curr.toISOString().split('T')[0]);
                        curr.setDate(curr.getDate() + 1);
                    }
                }
            }
            return holidaySet.size;
        };

        // Perform smart predictions
        const totalChapters = chapters.rows.length;
        const completedChapters = chapters.rows.filter(c => c.status === 'completed');
        const completedCount = completedChapters.length;
        const totalLessons = chapters.rows.reduce((sum, c) => sum + (c.estimated_lessons || 1), 0);
        const completedLessons = completedChapters.reduce((sum, c) => sum + (c.estimated_lessons || 1), 0);
        const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        const today = new Date();
        const endDate = new Date(planner.end_date);
        const startDate = new Date(planner.start_date);

        const rawTotalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
        const totalHolidays = getHolidayDaysCount(startDate, endDate);
        const totalDays = Math.max(1, rawTotalDays - totalHolidays);

        const rawRemainingDays = Math.max(0, Math.round((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));
        const holidayStart = today < startDate ? startDate : today;
        const remainingHolidays = today > endDate ? 0 : getHolidayDaysCount(holidayStart, endDate);
        const remainingDays = Math.max(0, rawRemainingDays - remainingHolidays);

        const elapsedDays = Math.max(1, totalDays - remainingDays);

        const remainingLessons = totalLessons - completedLessons;

        // Smart probability scoring
        let probability = 'On Track (High)';
        let statusColor = 'emerald';
        if (remainingDays === 0 && remainingLessons > 0) {
            probability = 'Overdue (Term Ended)';
            statusColor = 'rose';
        } else if (remainingLessons > 0) {
            const requiredPace = remainingLessons / remainingDays;
            const historicalPace = completedLessons / elapsedDays;

            if (requiredPace > 1.2) {
                probability = 'Critical Risk (Behind)';
                statusColor = 'rose';
            } else if (requiredPace > 0.8 || (historicalPace > 0 && requiredPace > historicalPace * 1.5)) {
                probability = 'Medium Risk (Behind)';
                statusColor = 'amber';
            }
        }

        return {
            ...planner,
            chapters: chapters.rows,
            milestones: milestones.rows,
            metrics: {
                totalChapters,
                completedChapters: completedCount,
                totalLessons,
                completedLessons,
                progressPercentage,
                totalDays,
                remainingDays,
                probability,
                statusColor
            }
        };
    }

    async addChapter(tenantId: number, plannerId: number, data: any) {
        // Find current max sequence
        const maxSeqRes = await this.pool.query(
            `SELECT COALESCE(MAX(sequence_order), 0) as max_seq FROM school.planner_chapter WHERE planner_id = $1`,
            [plannerId]
        );
        const nextSeq = maxSeqRes.rows[0].max_seq + 1;

        const res = await this.pool.query(
            `INSERT INTO school.planner_chapter 
             (planner_id, name, description, sequence_order, estimated_lessons, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')
             RETURNING *`,
            [plannerId, data.name, data.description || '', nextSeq, data.estimated_lessons || 1]
        );
        return res.rows[0];
    }

    async updateChapter(tenantId: number, chapterId: number, data: any) {
        const completedAt = data.status === 'completed' ? new Date().toISOString().split('T')[0] : null;
        
        // Dynamically build update fields
        const fields: string[] = ['updated_at = NOW()'];
        const values: any[] = [chapterId];
        let pIdx = 2;

        if (data.name !== undefined) {
            fields.push(`name = $${pIdx++}`);
            values.push(data.name);
        }
        if (data.description !== undefined) {
            fields.push(`description = $${pIdx++}`);
            values.push(data.description);
        }
        if (data.status !== undefined) {
            fields.push(`status = $${pIdx++}`);
            values.push(data.status);
            fields.push(`completed_at = $${pIdx++}`);
            values.push(completedAt);
        }
        if (data.estimated_lessons !== undefined) {
            fields.push(`estimated_lessons = $${pIdx++}`);
            values.push(data.estimated_lessons);
        }
        if (data.start_date !== undefined) {
            fields.push(`start_date = $${pIdx++}`);
            values.push(data.start_date);
        }
        if (data.end_date !== undefined) {
            fields.push(`end_date = $${pIdx++}`);
            values.push(data.end_date);
        }

        const query = `
            UPDATE school.planner_chapter
            SET ${fields.join(', ')}
            WHERE id = $1
            RETURNING *
        `;
        const res = await this.pool.query(query, values);
        return res.rows[0];
    }

    async addMilestone(tenantId: number, plannerId: number, data: any) {
        const res = await this.pool.query(
            `INSERT INTO school.planner_milestone 
             (planner_id, name, target_date, description)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [plannerId, data.name, data.target_date, data.description || '']
        );
        return res.rows[0];
    }

    async autoSchedulePlanner(tenantId: number, plannerId: number) {
        // Load planner details
        const plannerRes = await this.pool.query(
            `SELECT start_date, end_date FROM school.academic_planner WHERE id = $1 AND tenant_id = $2`,
            [plannerId, tenantId]
        );
        if (plannerRes.rows.length === 0) throw new Error("Planner not found");

        const planner = plannerRes.rows[0];
        const start = new Date(planner.start_date);
        const end = new Date(planner.end_date);
        const totalDuration = end.getTime() - start.getTime();

        // Load chapters
        const chaptersRes = await this.pool.query(
            `SELECT id, estimated_lessons FROM school.planner_chapter 
             WHERE planner_id = $1 
             ORDER BY sequence_order ASC, id ASC`,
            [plannerId]
        );
        const chapters = chaptersRes.rows;
        if (chapters.length === 0) return [];

        const totalLessons = chapters.reduce((sum, c) => sum + (c.estimated_lessons || 1), 0);

        let currentStart = new Date(start);

        for (let i = 0; i < chapters.length; i++) {
            const chapter = chapters[i];
            const weight = (chapter.estimated_lessons || 1) / totalLessons;
            const chapterDurationMs = totalDuration * weight;

            const chapterEnd = new Date(currentStart.getTime() + chapterDurationMs);

            // Keep formatting to YYYY-MM-DD
            const startStr = currentStart.toISOString().split('T')[0];
            const endStr = chapterEnd.toISOString().split('T')[0];

            await this.pool.query(
                `UPDATE school.planner_chapter 
                 SET start_date = $1, end_date = $2 
                 WHERE id = $3`,
                [startStr, endStr, chapter.id]
            );

            // Next chapter starts the next day
            currentStart = new Date(chapterEnd.getTime() + 24 * 3600 * 1000);
        }

        return this.getPlannerDetails(tenantId, plannerId);
    }
}
