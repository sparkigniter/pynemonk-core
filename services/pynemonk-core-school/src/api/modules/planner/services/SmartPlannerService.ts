import { injectable, inject } from 'tsyringe';
import { Pool } from 'pg';

@injectable()
export class SmartPlannerService {
    constructor(@inject('DB') private pool: Pool) {}

    // 1. Get available Global Syllabi for a grade and subject with pagination and filters
    async getGlobalSyllabi(filters: {
        boardName?: string;
        gradeName?: string;
        subjectName?: string;
        search?: string;
        limit?: number;
        offset?: number;
    } = {}) {
        const { boardName, gradeName, subjectName, search, limit = 10, offset = 0 } = filters;
        
        let query = `SELECT gs.*, gb.name as board_name, gg.name as grade_name, gsub.name as subject_name,
                     (SELECT COUNT(*) FROM school.global_chapter WHERE syllabus_id = gs.id) as chapter_count,
                     (SELECT COUNT(*) FROM school.global_topic gt JOIN school.global_chapter gc ON gt.chapter_id = gc.id WHERE gc.syllabus_id = gs.id) as topic_count
             FROM school.global_syllabus gs
             JOIN school.global_board gb ON gs.board_id = gb.id
             JOIN school.global_grade gg ON gs.grade_id = gg.id
             JOIN school.global_subject gsub ON gs.subject_id = gsub.id
             WHERE gs.is_published = TRUE`;
        
        const params: any[] = [];
        
        if (boardName) {
            params.push(boardName);
            query += ` AND gb.name ILIKE $${params.length}`;
        }
        if (gradeName) {
            params.push(gradeName);
            query += ` AND gg.name ILIKE $${params.length}`;
        }
        if (subjectName) {
            params.push(subjectName);
            query += ` AND gsub.name ILIKE $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (gb.name ILIKE $${params.length} OR gg.name ILIKE $${params.length} OR gsub.name ILIKE $${params.length} OR gsub.name ILIKE $${params.length})`;
        }

        // Clone query for count
        const countQuery = `SELECT COUNT(*) as total FROM (${query}) src`;
        const countRes = await this.pool.query(countQuery, params);
        const total = parseInt(countRes.rows[0]?.total || '0');

        // Append limit and offset
        params.push(limit);
        query += ` LIMIT $${params.length}`;
        params.push(offset);
        query += ` OFFSET $${params.length}`;

        const res = await this.pool.query(query, params);
        return { items: res.rows, total };
    }

    // 2. Subscribe a school class/subject to a global syllabus
    async subscribeToGlobalSyllabus(tenantId: number, academicYearId: number, schoolSubjectId: number, globalSyllabusId: number) {
        const res = await this.pool.query(
            `INSERT INTO school.school_syllabus_subscription 
             (tenant_id, academic_year_id, school_subject_id, global_syllabus_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (tenant_id, academic_year_id, school_subject_id) 
             DO UPDATE SET global_syllabus_id = EXCLUDED.global_syllabus_id
             RETURNING *`,
            [tenantId, academicYearId, schoolSubjectId, globalSyllabusId]
        );
        return res.rows[0];
    }

    // 3. Auto-generate the academic plan based on school timetable
    async generateAutoPlan(tenantId: number, classroomId: number, teacherId: number, schoolSyllabusId: number) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Find the subscription details
            const subRes = await client.query(
                `SELECT academic_year_id, global_syllabus_id, school_subject_id 
                 FROM school.school_syllabus_subscription 
                 WHERE id = $1 AND tenant_id = $2`,
                [schoolSyllabusId, tenantId]
            );

            if (subRes.rows.length === 0) throw new Error("Subscription not found");
            const sub = subRes.rows[0];

            // Get academic year start/end dates
            const yearRes = await client.query(
                `SELECT start_date, end_date FROM school.academic_year WHERE id = $1 AND tenant_id = $2`,
                [sub.academic_year_id, tenantId]
            );
            const { start_date, end_date } = yearRes.rows[0];

            // Create or update the Auto Academic Plan
            const planRes = await client.query(
                `INSERT INTO school.auto_academic_plan 
                 (tenant_id, school_syllabus_id, classroom_id, teacher_id, is_generated)
                 VALUES ($1, $2, $3, $4, TRUE)
                 ON CONFLICT (classroom_id, school_syllabus_id) 
                 DO UPDATE SET teacher_id = EXCLUDED.teacher_id, is_generated = TRUE, updated_at = NOW()
                 RETURNING id`,
                [tenantId, schoolSyllabusId, classroomId, teacherId]
            );
            const planId = planRes.rows[0].id;

            // Clear existing planned sessions for this plan
            await client.query(`DELETE FROM school.planned_session WHERE plan_id = $1`, [planId]);

            // Get the timetable for this classroom and subject
            const timetableRes = await client.query(
                `SELECT day_of_week FROM school.timetable 
                 WHERE tenant_id = $1 AND classroom_id = $2 AND subject_id = $3 AND is_deleted = FALSE
                 ORDER BY day_of_week ASC, start_time ASC`,
                [tenantId, classroomId, sub.school_subject_id]
            );

            if (timetableRes.rows.length === 0) {
                throw new Error("No timetable found for this subject in the given classroom. Cannot auto-schedule.");
            }

            // Available days (1 = Monday, 7 = Sunday)
            const availableDays = timetableRes.rows.map(r => r.day_of_week);

            // Get the global topics ordered by sequence
            const topicsRes = await client.query(
                `SELECT gt.id, gt.title, gc.recommended_periods 
                 FROM school.global_topic gt
                 JOIN school.global_chapter gc ON gt.chapter_id = gc.id
                 WHERE gc.syllabus_id = $1
                 ORDER BY gc.sequence_order ASC, gt.sequence_order ASC`,
                [sub.global_syllabus_id]
            );
            const topics = topicsRes.rows;

            // Simple Auto-Scheduling Algorithm
            const formatDate = (d: Date) => {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            };

            let currentDate = new Date(start_date);
            const endDateObj = new Date(end_date);
            let topicIndex = 0;
            let currentTopicRemainingPeriods = topics.length > 0 ? topics[0].recommended_periods : 0;

            const scheduledSessions = [];

            while (currentDate <= endDateObj && topicIndex < topics.length) {
                const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay(); // JS getDay: 0 is Sun. We map to 7.

                if (availableDays.includes(dayOfWeek)) {
                    // Schedule a period for the current topic
                    scheduledSessions.push({
                        plan_id: planId,
                        global_topic_id: topics[topicIndex].id,
                        scheduled_date: formatDate(currentDate)
                    });

                    currentTopicRemainingPeriods--;

                    if (currentTopicRemainingPeriods <= 0) {
                        topicIndex++;
                        if (topicIndex < topics.length) {
                            // Reset periods for next topic. 
                            // Note: A more advanced algorithm would map periods correctly per topic. 
                            // We distribute 1 period = 1 topic for simplicity here, or spread it out.
                            currentTopicRemainingPeriods = topics[topicIndex].recommended_periods || 1;
                        }
                    }
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Bulk Insert Sessions
            if (scheduledSessions.length > 0) {
                const values = scheduledSessions.map((s, i) => 
                    `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`
                ).join(', ');

                const flatParams = scheduledSessions.flatMap(s => [s.plan_id, s.global_topic_id, s.scheduled_date]);

                await client.query(
                    `INSERT INTO school.planned_session (tenant_id, plan_id, global_topic_id, scheduled_date)
                     VALUES ${values}`,
                    [tenantId, ...flatParams]
                );
            }

            await client.query('COMMIT');
            return { planId, sessionsGenerated: scheduledSessions.length };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // 4. Update session status (Dynamic Shift logic would go here if delayed)
    async updateSessionStatus(tenantId: number, sessionId: number, status: string, notes?: string) {
        // E.g., 'COMPLETED', 'DELAYED'
        const res = await this.pool.query(
            `UPDATE school.planned_session 
             SET status = $1, teacher_notes = $2, 
                 completed_at = CASE WHEN $1 = 'COMPLETED' THEN NOW() ELSE completed_at END,
                 updated_at = NOW()
             WHERE id = $3 AND tenant_id = $4
             RETURNING *`,
            [status, notes || '', sessionId, tenantId]
        );
        return res.rows[0];
    }

    // 5. Get full details of a smart plan for the frontend
    async getPlanDetails(tenantId: number, planId: number) {
        // Fetch plan
        const planRes = await this.pool.query(`SELECT * FROM school.auto_academic_plan WHERE id = $1 AND tenant_id = $2`, [planId, tenantId]);
        if (planRes.rows.length === 0) throw new Error("Plan not found");
        const plan = planRes.rows[0];

        // Fetch sessions with global topics
        const sessionRes = await this.pool.query(
            `SELECT ps.*, COALESCE(ps.custom_topic_title, gt.title) as topic_title, gc.title as chapter_title
             FROM school.planned_session ps
             JOIN school.global_topic gt ON ps.global_topic_id = gt.id
             JOIN school.global_chapter gc ON gt.chapter_id = gc.id
             WHERE ps.plan_id = $1 AND ps.tenant_id = $2
             ORDER BY ps.sequence_order ASC, ps.scheduled_date ASC, ps.id ASC`,
            [planId, tenantId]
        );

        const sessions = sessionRes.rows.map(s => ({
            id: s.id,
            chapter: s.chapter_title,
            topic: s.topic_title,
            raw_date: s.scheduled_date ? new Date(s.scheduled_date).toISOString().split('T')[0] : '',
            date: new Date(s.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            status: s.status,
            type: 'LECTURE',
            notes: s.teacher_notes || '',
            sequence_order: s.sequence_order || 0,
            resources: []
        }));

        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.status === 'COMPLETED').length;

        return {
            id: planId,
            is_smart_plan: true,
            metrics: {
                totalChapters: new Set(sessions.map(s => s.chapter)).size,
                completedTopics: completedSessions,
                totalTopics: totalSessions,
                remainingDays: 100, // Mocked for now
                progress: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
            },
            plannedSessions: sessions
        };
    }

    async getPlanByClassroomAndSubject(tenantId: number, classroomId: number, subjectId: number) {
        const res = await this.pool.query(
            `SELECT ap.id 
             FROM school.auto_academic_plan ap
             JOIN school.school_syllabus_subscription sub ON ap.school_syllabus_id = sub.id
             WHERE ap.tenant_id = $1 AND ap.classroom_id = $2 AND sub.school_subject_id = $3`,
            [tenantId, classroomId, subjectId]
        );
        if (res.rows.length === 0) return null;
        return this.getPlanDetails(tenantId, res.rows[0].id);
    }

    // Get full details of a global syllabus template including nested chapters and topics
    async getGlobalSyllabusDetails(globalSyllabusId: number) {
        const syllabusRes = await this.pool.query(
            `SELECT gs.*, gb.name as board_name, gg.name as grade_name, gsub.name as subject_name
             FROM school.global_syllabus gs
             JOIN school.global_board gb ON gs.board_id = gb.id
             JOIN school.global_grade gg ON gs.grade_id = gg.id
             JOIN school.global_subject gsub ON gs.subject_id = gsub.id
             WHERE gs.id = $1`,
            [globalSyllabusId]
        );
        if (syllabusRes.rows.length === 0) return null;
        const syllabus = syllabusRes.rows[0];

        const chaptersRes = await this.pool.query(
            `SELECT * FROM school.global_chapter 
             WHERE syllabus_id = $1 
             ORDER BY sequence_order ASC, id ASC`,
            [globalSyllabusId]
        );
        const chapters = chaptersRes.rows;

        const chapterIds = chapters.map(c => c.id);
        let topics: any[] = [];
        if (chapterIds.length > 0) {
            const topicsRes = await this.pool.query(
                `SELECT * FROM school.global_topic 
                 WHERE chapter_id = ANY($1) 
                 ORDER BY sequence_order ASC, id ASC`,
                [chapterIds]
            );
            topics = topicsRes.rows;
        }

        const chaptersWithTopics = chapters.map(ch => ({
            ...ch,
            topics: topics.filter(t => t.chapter_id === ch.id)
        }));

        return {
            ...syllabus,
            chapters: chaptersWithTopics
        };
    }

    async getGlobalTaxonomy() {
        const boardsRes = await this.pool.query(`SELECT DISTINCT name FROM school.global_board ORDER BY name ASC`);
        const gradesRes = await this.pool.query(`SELECT DISTINCT name FROM school.global_grade ORDER BY name ASC`);
        const subjectsRes = await this.pool.query(`SELECT DISTINCT name FROM school.global_subject ORDER BY name ASC`);
        
        return {
            boards: boardsRes.rows.map(r => r.name),
            grades: gradesRes.rows.map(r => r.name),
            subjects: subjectsRes.rows.map(r => r.name)
        };
    }

    async updatePlannedSession(tenantId: number, sessionId: number, data: {
        scheduled_date?: string;
        status?: string;
        teacher_notes?: string;
        topic_title?: string;
        sequence_order?: number;
    }) {
        const fields: string[] = ['updated_at = NOW()'];
        const values: any[] = [sessionId, tenantId];
        let pIdx = 3;

        if (data.scheduled_date !== undefined) {
            fields.push(`scheduled_date = $${pIdx++}`);
            values.push(data.scheduled_date);
        }
        if (data.status !== undefined) {
            fields.push(`status = $${pIdx++}`);
            values.push(data.status);
            if (data.status === 'COMPLETED') {
                fields.push(`completed_at = NOW()`);
            }
        }
        if (data.teacher_notes !== undefined) {
            fields.push(`teacher_notes = $${pIdx++}`);
            values.push(data.teacher_notes);
        }
        if (data.topic_title !== undefined) {
            fields.push(`custom_topic_title = $${pIdx++}`);
            values.push(data.topic_title);
        }
        if (data.sequence_order !== undefined) {
            fields.push(`sequence_order = $${pIdx++}`);
            values.push(data.sequence_order);
        }

        const query = `
            UPDATE school.planned_session
            SET ${fields.join(', ')}
            WHERE id = $1 AND tenant_id = $2
            RETURNING *
        `;
        const res = await this.pool.query(query, values);
        if (res.rows.length === 0) return null;
        return res.rows[0];
    }
}
