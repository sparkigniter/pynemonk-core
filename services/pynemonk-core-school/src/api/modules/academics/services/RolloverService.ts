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
        const classrooms = await this.classroomHelper.findAll(tenantId, sourceYearId);
        const assignments = await this.subjectHelper.getAssignments(tenantId, { academic_year_id: sourceYearId });
        
        return {
            classrooms,
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
                const sourceClassrooms = await this.classroomHelper.findAll(tenantId, data.source_year_id);
                for (const cls of sourceClassrooms) {
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

            // 3. Mark target year as current and planning -> active
            await client.query(`
                UPDATE school.academic_year SET is_current = FALSE WHERE tenant_id = $1
            `, [tenantId]);
            await client.query(`
                UPDATE school.academic_year SET is_current = TRUE, status = 'active' WHERE id = $1
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
