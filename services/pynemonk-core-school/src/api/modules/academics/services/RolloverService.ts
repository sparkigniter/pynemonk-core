import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import ClassroomHelper from "../../classroom/helpers/ClassroomHelper.js";
import SubjectHelper from "../../subject/helpers/SubjectHelper.js";
import StudentHelper from "../../student/helpers/StudentHelper.js";
import EnrollmentHelper from "../../student/helpers/EnrollmentHelper.js";

@injectable()
export default class RolloverService {
    constructor(
        @inject("DB") private db: Pool,
        private classroomHelper: ClassroomHelper,
        private subjectHelper: SubjectHelper,
        private enrollmentHelper: EnrollmentHelper
    ) {}

    /**
     * Step 1: Preview Rollover
     * Fetches current classrooms and assignments to show the user what will be cloned.
     */
    public async getRolloverPreview(tenantId: number, sourceYearId: number) {
        const response = await this.classroomHelper.findAll(tenantId, { academic_year_id: sourceYearId });
        const assignments = await this.subjectHelper.getAssignments(tenantId, { academic_year_id: sourceYearId });
        
        return {
            classrooms: response.data,
            assignments
        };
    }

    /**
     * Step 2: Execute Rollover
     * Clones classrooms and assignments into the target year.
     */
    public async executeRollover(tenantId: number, data: {
        source_year_id: number;
        target_year_id: number;
        options: {
            clone_classrooms: boolean;
            clone_assignments: boolean;
            promote_students: boolean;
        }
    }) {
        const client = await this.db.connect();
        try {
            await client.query("BEGIN");

            const classroomMap = new Map<number, number>();

            // 1. Clone Classrooms
            if (data.options.clone_classrooms) {
                const response = await this.classroomHelper.findAll(tenantId, { academic_year_id: data.source_year_id });
                for (const cls of response.data) {
                    const newCls = await client.query(`
                        INSERT INTO school.classroom 
                            (tenant_id, academic_year_id, grade_id, section, name, room, capacity, class_teacher_id)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT (tenant_id, academic_year_id, grade_id, section) 
                        DO UPDATE SET name = EXCLUDED.name 
                        RETURNING id
                    `, [tenantId, data.target_year_id, cls.grade_id, cls.section, cls.name, cls.room, cls.capacity, cls.class_teacher_id]);
                    
                    if (newCls.rows[0]) {
                        classroomMap.set(cls.id, newCls.rows[0].id);
                    }
                }
            }

            // 2. Clone Teacher Assignments
            if (data.options.clone_assignments) {
                const sourceAssignments = await this.subjectHelper.getAssignments(tenantId, { academic_year_id: data.source_year_id });
                for (const ass of sourceAssignments) {
                    const targetClassroomId = classroomMap.get(ass.classroom_id);
                    if (targetClassroomId) {
                        await client.query(`
                            INSERT INTO school.teacher_assignment 
                                (tenant_id, staff_id, classroom_id, subject_id, academic_year_id)
                            VALUES ($1, $2, $3, $4, $5)
                            ON CONFLICT (staff_id, classroom_id, subject_id, academic_year_id) DO NOTHING
                        `, [tenantId, ass.staff_id, targetClassroomId, ass.subject_id, data.target_year_id]);
                    }
                }
            }

            // 3. Promote Students (If enabled)
            if (data.options.promote_students) {
                // Find the single promotional exam for the source academic year
                const examRes = await client.query(`
                    SELECT id, min_promotion_threshold 
                    FROM school.exam 
                    WHERE tenant_id = $1 AND academic_year_id = $2 AND is_promotional = TRUE AND is_deleted = FALSE
                    LIMIT 1
                `, [tenantId, data.source_year_id]);

                const promoExam = examRes.rows[0];

                if (promoExam) {
                    // Fetch grading system setting ('percentage' or 'cgpa')
                    const settingsRes = await client.query(`
                        SELECT value FROM school.settings 
                        WHERE tenant_id = $1 AND key = 'grading_system' AND is_deleted = FALSE
                        LIMIT 1
                    `, [tenantId]);
                    const gradingSystem = settingsRes.rows[0]?.value || 'percentage';

                    // Fetch custom grading scale if defined as JSON, otherwise use standard scale
                    const scaleRes = await client.query(`
                        SELECT value FROM school.settings 
                        WHERE tenant_id = $1 AND key = 'grading_scale' AND is_deleted = FALSE
                        LIMIT 1
                    `, [tenantId]);
                    let gradingScale = [
                        { min: 90, gp: 4.0 },
                        { min: 80, gp: 3.0 },
                        { min: 70, gp: 2.0 },
                        { min: 60, gp: 1.0 },
                        { min: 0, gp: 0.0 }
                    ];
                    if (scaleRes.rows[0]?.value) {
                        try {
                            gradingScale = JSON.parse(scaleRes.rows[0].value);
                        } catch (e) {
                            console.warn("Failed to parse grading_scale JSON, falling back to standard scale.");
                        }
                    }

                    // Query student marks across all exam papers for the promotional exam
                    const marksRes = await client.query(`
                        SELECT 
                            s.id as student_id,
                            s.first_name,
                            s.last_name,
                            c.grade_id as current_grade_id,
                            c.section as current_section,
                            ep.id as paper_id,
                            ep.max_marks,
                            COALESCE(em.marks_obtained, 0) as marks_obtained
                        FROM school.student s
                        JOIN school.student_enrollment se ON s.id = se.student_id AND se.is_deleted = FALSE AND se.academic_year_id = $2
                        JOIN school.classroom c ON se.classroom_id = c.id
                        JOIN school.exam_paper ep ON ep.exam_id = $3 AND ep.is_deleted = FALSE
                        LEFT JOIN school.exam_marks em ON em.student_id = s.id AND em.paper_id = ep.id AND em.is_deleted = FALSE
                        WHERE s.tenant_id = $1 AND s.is_deleted = FALSE
                    `, [tenantId, data.source_year_id, promoExam.id]);

                    // Group marks by student
                    const studentMarks: { [key: number]: any } = {};
                    for (const row of marksRes.rows) {
                        if (!studentMarks[row.student_id]) {
                            studentMarks[row.student_id] = {
                                student_id: row.student_id,
                                current_grade_id: row.current_grade_id,
                                current_section: row.current_section,
                                scores: []
                            };
                        }
                        const percentage = row.max_marks > 0 ? (parseFloat(row.marks_obtained) / parseFloat(row.max_marks)) * 100 : 0;
                        studentMarks[row.student_id].scores.push(percentage);
                    }

                    // Map percentage to grade points
                    const getGradePoint = (percentage: number) => {
                        const match = gradingScale.find(scale => percentage >= scale.min);
                        return match ? match.gp : 0.00;
                    };

                    // Evaluate each student
                    for (const studentIdStr of Object.keys(studentMarks)) {
                        const studentId = parseInt(studentIdStr);
                        const record = studentMarks[studentId];
                        let finalScore = 0;

                        if (gradingSystem === 'cgpa') {
                            const totalGP = record.scores.reduce((acc: number, pct: number) => acc + getGradePoint(pct), 0);
                            finalScore = record.scores.length > 0 ? totalGP / record.scores.length : 0;
                        } else {
                            const totalPct = record.scores.reduce((acc: number, pct: number) => acc + pct, 0);
                            finalScore = record.scores.length > 0 ? totalPct / record.scores.length : 0;
                        }

                        const passed = finalScore >= parseFloat(promoExam.min_promotion_threshold);

                        if (passed) {
                            // Find the target grade (next in sequence order)
                            const currentGradeRes = await client.query(`
                                SELECT sequence_order FROM school.grade 
                                WHERE tenant_id = $1 AND id = $2 AND is_deleted = FALSE
                            `, [tenantId, record.current_grade_id]);

                            const sequenceOrder = currentGradeRes.rows[0]?.sequence_order || 0;

                            const nextGradeRes = await client.query(`
                                SELECT id FROM school.grade 
                                WHERE tenant_id = $1 AND sequence_order > $2 AND is_deleted = FALSE
                                ORDER BY sequence_order ASC LIMIT 1
                            `, [tenantId, sequenceOrder]);

                            const nextGrade = nextGradeRes.rows[0];

                            if (nextGrade) {
                                // Find classroom in next grade with matching section in the target academic year
                                const classroomRes = await client.query(`
                                    SELECT id FROM school.classroom 
                                    WHERE tenant_id = $1 AND academic_year_id = $2 AND grade_id = $3 AND section = $4 AND is_deleted = FALSE
                                    LIMIT 1
                                `, [tenantId, data.target_year_id, nextGrade.id, record.current_section]);

                                const targetClassroomId = classroomRes.rows[0]?.id;

                                if (targetClassroomId) {
                                    // Terminate current enrollment
                                    await client.query(`
                                        UPDATE school.student_enrollment 
                                        SET is_deleted = TRUE, updated_at = NOW() 
                                        WHERE student_id = $1 AND academic_year_id = $2
                                    `, [record.student_id, data.source_year_id]);

                                    // Insert new enrollment
                                    await client.query(`
                                        INSERT INTO school.student_enrollment 
                                            (tenant_id, student_id, classroom_id, academic_year_id, status)
                                        VALUES ($1, $2, $3, $4, 'active')
                                        ON CONFLICT (student_id, academic_year_id) 
                                        DO UPDATE SET classroom_id = EXCLUDED.classroom_id, is_deleted = FALSE
                                    `, [tenantId, record.student_id, targetClassroomId, data.target_year_id]);
                                }
                            }
                        } else {
                            // Repeat Year: Enroll in matching classroom in target year under same grade and section
                            const repeatClassRes = await client.query(`
                                SELECT id FROM school.classroom 
                                WHERE tenant_id = $1 AND academic_year_id = $2 AND grade_id = $3 AND section = $4 AND is_deleted = FALSE
                                LIMIT 1
                            `, [tenantId, data.target_year_id, record.current_grade_id, record.current_section]);

                            const repeatClassroomId = repeatClassRes.rows[0]?.id;

                            if (repeatClassroomId) {
                                await client.query(`
                                    UPDATE school.student_enrollment 
                                    SET is_deleted = TRUE, updated_at = NOW() 
                                    WHERE student_id = $1 AND academic_year_id = $2
                                `, [record.student_id, data.source_year_id]);

                                await client.query(`
                                    INSERT INTO school.student_enrollment 
                                        (tenant_id, student_id, classroom_id, academic_year_id, status)
                                    VALUES ($1, $2, $3, $4, 'active')
                                    ON CONFLICT (student_id, academic_year_id) 
                                    DO UPDATE SET classroom_id = EXCLUDED.classroom_id, is_deleted = FALSE
                                `, [tenantId, record.student_id, repeatClassroomId, data.target_year_id]);
                            }
                        }
                    }
                }
            }

            // 4. Mark target year as current and active, old ones as closed
            await client.query(`
                UPDATE school.academic_year 
                SET is_current = FALSE, status = 'closed' 
                WHERE tenant_id = $1 AND is_current = TRUE
            `, [tenantId]);
            
            await client.query(`
                UPDATE school.academic_year 
                SET is_current = TRUE, status = 'active' 
                WHERE id = $1
            `, [data.target_year_id]);

            await client.query("COMMIT");
            return { success: true, message: "Rollover completed successfully" };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}
