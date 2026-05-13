import { injectable, inject } from "tsyringe";
import { UserContext } from "../middleware/AuthMiddleware.js";

export enum AccessLevel {
    FULL = "FULL",
    ASSIGNED = "ASSIGNED",
    SELF = "SELF",
}

export class DataScope {
    constructor(
        public accessLevel: AccessLevel,
        public gradeIds: number[] = [],
        public classroomIds: number[] = [],
        public subjectIds: number[] = [],
        public examIds: number[] = [],
        public paperIds: number[] = [],
        public studentIds: number[] = [],
        public staffIds: number[] = [],
        public studentId?: number,
        public staffId?: number,
    ) {}

    /** Check if the user has access to a specific grade */
    public hasGrade(id: number): boolean {
        return this.accessLevel === AccessLevel.FULL || this.gradeIds.includes(id);
    }

    /** Check if the user has access to a specific classroom */
    public hasClassroom(id: number): boolean {
        return this.accessLevel === AccessLevel.FULL || this.classroomIds.includes(id);
    }

    /** Check if the user has access to a specific student */
    public hasStudent(id: number): boolean {
        return this.accessLevel === AccessLevel.FULL || this.studentIds.includes(id) || this.studentId === id;
    }

    /** Check if the user has access to a specific staff member */
    public hasStaff(id: number): boolean {
        return this.accessLevel === AccessLevel.FULL || this.staffIds.includes(id) || this.staffId === id;
    }

    /** Check if the user has access to a specific exam */
    public hasExam(id: number): boolean {
        return this.accessLevel === AccessLevel.FULL || this.examIds.includes(id);
    }

    /** Check if the user has access to a specific exam paper */
    public hasPaper(id: number): boolean {
        return this.accessLevel === AccessLevel.FULL || this.paperIds.includes(id);
    }

    /** Check if the user has access to a specific subject */
    public hasSubject(id: number): boolean {
        return this.accessLevel === AccessLevel.FULL || this.subjectIds.includes(id);
    }
}

/**
 * Resolves the effective data scope for a user based on their roles and assignments.
 */
@injectable()
export class DataScopeHelper {
    constructor(@inject("DB") private db: any) {}

    public async resolveScope(user: UserContext): Promise<DataScope> {
        console.log(`[DataScopeHelper] Resolving scope for user ${user.userId} with roles: ${user.roles.join(', ')}`);
        
        // 1. Check for Administrative Roles (Tier 0, 1, 2)
        // If user has 'owner', 'principal', or 'school_admin', they get FULL access.
        const isAdmin = user.roles.some((role: string) =>
            ["owner", "principal", "vice_principal", "school_admin", "system_admin"].includes(role),
        );

        if (isAdmin) {
            console.log(`[DataScopeHelper] User ${user.userId} is ADMIN. Returning FULL scope.`);
            return new DataScope(AccessLevel.FULL);
        }

        // 2. Check for Teacher Role (Tier 3)
        if (user.roles.includes("teacher") || user.roles.includes("class_teacher")) {
            // Fetch assignments from the database
            const staffRes = await this.db.query(
                `SELECT id FROM school.staff WHERE user_id = $1 AND is_deleted = FALSE`,
                [user.userId],
            );

            if (staffRes.rows.length > 0) {
                const staffId = staffRes.rows[0].id;
                const assignments = await this.db.query(
                    `SELECT classroom_id, subject_id FROM school.teacher_assignment 
                     WHERE staff_id = $1 AND is_deleted = FALSE`,
                    [staffId],
                );

                const classroomIds = Array.from(new Set<number>(assignments.rows.map((a: any) => a.classroom_id as number).filter((id: number) => id !== null)));
                const subjectIds = Array.from(new Set<number>(assignments.rows.map((a: any) => a.subject_id as number).filter((id: number) => id !== null)));

                // Fetch grade IDs for assigned classrooms
                let gradeIds: number[] = [];
                if (classroomIds.length > 0) {
                    const grades = await this.db.query(
                        `SELECT DISTINCT grade_id FROM school.classroom WHERE id = ANY($1)`,
                        [classroomIds],
                    );
                    gradeIds = grades.rows.map((g: any) => g.grade_id as number);
                }

                // Fetch relevant student IDs (enrolled in assigned classrooms)
                let studentIds: number[] = [];
                if (classroomIds.length > 0) {
                    const students = await this.db.query(
                        `SELECT student_id FROM school.student_enrollment 
                         WHERE classroom_id = ANY($1) AND is_deleted = FALSE`,
                        [classroomIds],
                    );
                    studentIds = students.rows.map((s: any) => s.student_id as number);
                }

                // Fetch relevant exam IDs
                let examIds: number[] = [];
                if (classroomIds.length > 0 || subjectIds.length > 0) {
                    const exams = await this.db.query(
                        `SELECT DISTINCT exam_id FROM school.exam_invitation 
                         WHERE (classroom_id = ANY($1) OR subject_id = ANY($2)) 
                         AND is_deleted = FALSE`,
                        [classroomIds, subjectIds],
                    );
                    examIds = exams.rows.map((e: any) => e.exam_id as number);

                    // Also include exams where teacher is a supervisor
                    const supervisedExams = await this.db.query(
                        `SELECT DISTINCT exam_id FROM school.exam_paper 
                         WHERE supervisor_id = $1 AND is_deleted = FALSE`,
                        [staffId],
                    );
                    examIds = Array.from(new Set<number>([...examIds, ...supervisedExams.rows.map((e: any) => e.exam_id as number)]));
                }

                // Fetch relevant paper IDs
                let paperIds: number[] = [];
                if (subjectIds.length > 0 || staffId) {
                    const papers = await this.db.query(
                        `SELECT id FROM school.exam_paper 
                         WHERE (subject_id = ANY($1) OR supervisor_id = $2) 
                         AND is_deleted = FALSE`,
                        [subjectIds, staffId],
                    );
                    paperIds = papers.rows.map((p: any) => p.id as number);
                }

                console.log(`[DataScopeHelper] User ${user.userId} is TEACHER. Resolved ${classroomIds.length} classrooms, ${gradeIds.length} grades, ${paperIds.length} papers.`);
                
                return new DataScope(
                    AccessLevel.ASSIGNED,
                    gradeIds,
                    classroomIds,
                    subjectIds,
                    examIds,
                    paperIds,
                    studentIds,
                    [staffId],
                    undefined,
                    staffId,
                );
            } else {
                console.warn(`[DataScopeHelper] User ${user.userId} has teacher role but no record in school.staff`);
            }
        }

        // 3. Check for Student Role (Tier 4)
        if (user.roles.includes("student")) {
            const studentRes = await this.db.query(
                `SELECT id FROM school.student WHERE user_id = $1 AND is_deleted = FALSE`,
                [user.userId],
            );
            if (studentRes.rows.length > 0) {
                const sid = studentRes.rows[0].id;
                console.log(`[DataScopeHelper] User ${user.userId} is STUDENT. Returning SELF scope for studentId ${sid}`);
                return new DataScope(AccessLevel.SELF, [], [], [], [], [], [sid], [], sid);
            }
        }

        // Default: No access
        console.log(`[DataScopeHelper] User ${user.userId} has no resolved scope. Returning SELF with empty IDs.`);
        return new DataScope(AccessLevel.SELF, [], [], [], [], [], [], [], -1);
    }
}
