import { injectable, inject } from 'tsyringe';
import { Pool } from 'pg';

@injectable()
export class AcademicPlannerService {
    constructor(@inject('DB') private pool: Pool) {}

    async resolveStaffId(staffId: number): Promise<number> {
        const staffRes = await this.pool.query(
            `SELECT id FROM school.staff WHERE user_id = $1 OR id = $1 LIMIT 1`,
            [staffId]
        );
        return staffRes.rows.length > 0 ? staffRes.rows[0].id : staffId;
    }

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
            const resolvedStaffId = await this.resolveStaffId(parseInt(filters.staff_id));
            query += ` AND p.staff_id = $${pIdx++}`;
            values.push(resolvedStaffId);
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

    async getPlannerByTeacherAndSubject(tenantId: number, staffId: number, subjectId: number, gradeId: number, academicYearId?: number) {
        const resolvedStaffId = await this.resolveStaffId(staffId);
        let query = `SELECT * FROM school.academic_planner 
             WHERE tenant_id = $1 AND staff_id = $2 AND subject_id = $3 AND grade_id = $4`;
        const params: any[] = [tenantId, resolvedStaffId, subjectId, gradeId];

        if (academicYearId) {
            query += ` AND academic_year_id = $5`;
            params.push(academicYearId);
        } else {
            const currentYear = await this.pool.query(
                `SELECT id FROM school.academic_year WHERE tenant_id = $1 AND is_current = TRUE AND is_deleted = FALSE LIMIT 1`,
                [tenantId]
            );
            if (currentYear.rows.length > 0) {
                query += ` AND academic_year_id = $5`;
                params.push(currentYear.rows[0].id);
            }
        }

        const res = await this.pool.query(query, params);
        if (res.rows.length === 0) return null;
        return this.getPlannerDetails(tenantId, res.rows[0].id);
    }

    async createPlanner(tenantId: number, data: any) {
        const resolvedStaffId = await this.resolveStaffId(data.staff_id);
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
                resolvedStaffId, 
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

        // Fetch topics for these chapters
        const chapterIds = chapters.rows.map(c => c.id);
        let topics: any[] = [];
        if (chapterIds.length > 0) {
            const topicsRes = await this.pool.query(
                `SELECT * FROM school.planner_topic WHERE chapter_id = ANY($1) ORDER BY sequence_order ASC, id ASC`,
                [chapterIds]
            );
            topics = topicsRes.rows;
        }

        const chaptersWithTopics = chapters.rows.map(chapter => ({
            ...chapter,
            topics: topics.filter(t => t.chapter_id === chapter.id)
        }));

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
        const totalChapters = chaptersWithTopics.length;
        const completedChapters = chaptersWithTopics.filter(c => c.status === 'completed');
        const completedCount = completedChapters.length;
        const totalLessons = chaptersWithTopics.reduce((sum, c) => sum + (c.estimated_lessons || 1), 0);
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
            chapters: chaptersWithTopics,
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
        if (data.sequence_order !== undefined) {
            fields.push(`sequence_order = $${pIdx++}`);
            values.push(data.sequence_order);
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

    async importGlobalSyllabus(tenantId: number, plannerId: number, globalSyllabusId: number) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Find current max sequence
            const maxSeqRes = await client.query(
                `SELECT COALESCE(MAX(sequence_order), 0) as max_seq FROM school.planner_chapter WHERE planner_id = $1`,
                [plannerId]
            );
            let currentSeq = maxSeqRes.rows[0].max_seq;

            // Fetch global chapters
            const chaptersRes = await client.query(
                `SELECT gc.id, gc.title, gc.description, gc.sequence_order, gc.recommended_periods 
                 FROM school.global_chapter gc
                 WHERE gc.syllabus_id = $1
                 ORDER BY gc.sequence_order ASC`,
                [globalSyllabusId]
            );

            const globalChapters = chaptersRes.rows;

            for (const gChap of globalChapters) {
                currentSeq++;
                const insertedChapRes = await client.query(
                    `INSERT INTO school.planner_chapter 
                     (planner_id, name, description, sequence_order, estimated_lessons, status)
                     VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
                    [
                        plannerId, 
                        gChap.title, 
                        gChap.description || '', 
                        currentSeq, 
                        gChap.recommended_periods || 5
                    ]
                );
                const chapterId = insertedChapRes.rows[0].id;

                // Fetch global topics for this chapter
                const topicsRes = await client.query(
                    `SELECT title, description, sequence_order FROM school.global_topic
                     WHERE chapter_id = $1 ORDER BY sequence_order ASC`,
                    [gChap.id]
                );

                for (const gTopic of topicsRes.rows) {
                    await client.query(
                        `INSERT INTO school.planner_topic (chapter_id, title, description, sequence_order)
                         VALUES ($1, $2, $3, $4)`,
                        [chapterId, gTopic.title, gTopic.description || '', gTopic.sequence_order]
                    );
                }
            }

            await client.query('COMMIT');
            return this.getPlannerDetails(tenantId, plannerId);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async deleteChapter(tenantId: number, chapterId: number) {
        // Find chapter first to get planner_id
        const chapRes = await this.pool.query(
            `SELECT planner_id FROM school.planner_chapter WHERE id = $1`,
            [chapterId]
        );
        if (chapRes.rows.length === 0) throw new Error("Chapter not found");
        const plannerId = chapRes.rows[0].planner_id;

        await this.pool.query(
            `DELETE FROM school.planner_chapter WHERE id = $1`,
            [chapterId]
        );
        return this.getPlannerDetails(tenantId, plannerId);
    }

    async moveChapter(tenantId: number, chapterId: number, direction: 'up' | 'down') {
        const chapRes = await this.pool.query(
            `SELECT id, planner_id, sequence_order FROM school.planner_chapter WHERE id = $1`,
            [chapterId]
        );
        if (chapRes.rows.length === 0) throw new Error("Chapter not found");
        const chap = chapRes.rows[0];

        let swapRes;
        if (direction === 'up') {
            swapRes = await this.pool.query(
                `SELECT id, sequence_order FROM school.planner_chapter 
                 WHERE planner_id = $1 AND sequence_order < $2 
                 ORDER BY sequence_order DESC LIMIT 1`,
                [chap.planner_id, chap.sequence_order]
            );
        } else {
            swapRes = await this.pool.query(
                `SELECT id, sequence_order FROM school.planner_chapter 
                 WHERE planner_id = $1 AND sequence_order > $2 
                 ORDER BY sequence_order ASC LIMIT 1`,
                [chap.planner_id, chap.sequence_order]
            );
        }

        if (swapRes.rows.length > 0) {
            const swapChap = swapRes.rows[0];
            const client = await this.pool.connect();
            try {
                await client.query('BEGIN');
                await client.query(
                    `UPDATE school.planner_chapter SET sequence_order = $1 WHERE id = $2`,
                    [swapChap.sequence_order, chap.id]
                );
                await client.query(
                    `UPDATE school.planner_chapter SET sequence_order = $1 WHERE id = $2`,
                    [chap.sequence_order, swapChap.id]
                );
                await client.query('COMMIT');
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }
        }
        return this.getPlannerDetails(tenantId, chap.planner_id);
    }

    // Topic Operations
    async addTopic(tenantId: number, chapterId: number, data: any) {
        // Find current max sequence for topics in this chapter
        const maxSeqRes = await this.pool.query(
            `SELECT COALESCE(MAX(sequence_order), 0) as max_seq FROM school.planner_topic WHERE chapter_id = $1`,
            [chapterId]
        );
        const nextSeq = maxSeqRes.rows[0].max_seq + 1;

        const res = await this.pool.query(
            `INSERT INTO school.planner_topic 
             (chapter_id, title, description, sequence_order)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [chapterId, data.title, data.description || '', nextSeq]
        );
        return res.rows[0];
    }

    async updateTopic(tenantId: number, topicId: number, data: any) {
        const fields: string[] = [];
        const values: any[] = [];
        let pIdx = 1;

        if (data.title !== undefined) {
            fields.push(`title = $${pIdx++}`);
            values.push(data.title);
        }
        if (data.description !== undefined) {
            fields.push(`description = $${pIdx++}`);
            values.push(data.description);
        }
        if (data.sequence_order !== undefined) {
            fields.push(`sequence_order = $${pIdx++}`);
            values.push(data.sequence_order);
        }

        if (fields.length === 0) {
            const current = await this.pool.query(`SELECT * FROM school.planner_topic WHERE id = $1`, [topicId]);
            return current.rows[0];
        }

        values.push(topicId);
        const query = `
            UPDATE school.planner_topic 
            SET ${fields.join(', ')}, updated_at = NOW() 
            WHERE id = $${pIdx} 
            RETURNING *
        `;

        const res = await this.pool.query(query, values);
        return res.rows[0];
    }

    async deleteTopic(tenantId: number, topicId: number) {
        const res = await this.pool.query(
            `DELETE FROM school.planner_topic WHERE id = $1 RETURNING *`,
            [topicId]
        );
        return res.rows[0];
    }

    async moveTopic(tenantId: number, topicId: number, direction: 'up' | 'down') {
        const topicRes = await this.pool.query(
            `SELECT * FROM school.planner_topic WHERE id = $1`,
            [topicId]
        );
        if (topicRes.rows.length === 0) {
            throw new Error("Topic not found");
        }
        const topic = topicRes.rows[0];
        const chapterId = topic.chapter_id;
        const currentSeq = topic.sequence_order;

        // Find adjacent topic in the same chapter
        let adjRes;
        if (direction === 'up') {
            adjRes = await this.pool.query(
                `SELECT * FROM school.planner_topic 
                 WHERE chapter_id = $1 AND sequence_order < $2 
                 ORDER BY sequence_order DESC LIMIT 1`,
                [chapterId, currentSeq]
            );
        } else {
            adjRes = await this.pool.query(
                `SELECT * FROM school.planner_topic 
                 WHERE chapter_id = $1 AND sequence_order > $2 
                 ORDER BY sequence_order ASC LIMIT 1`,
                [chapterId, currentSeq]
            );
        }

        if (adjRes.rows.length === 0) {
            return topic; // Already at edge
        }

        const adjTopic = adjRes.rows[0];
        const adjSeq = adjTopic.sequence_order;

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(
                `UPDATE school.planner_topic SET sequence_order = $1 WHERE id = $2`,
                [adjSeq, topicId]
            );
            await client.query(
                `UPDATE school.planner_topic SET sequence_order = $1 WHERE id = $2`,
                [currentSeq, adjTopic.id]
            );
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        return { ...topic, sequence_order: adjSeq };
    }
}
