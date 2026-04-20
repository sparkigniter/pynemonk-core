import { injectable, inject } from "tsyringe";
import { UserContext } from "../middleware/AuthMiddleware.js";

export enum AccessLevel {
    FULL = "FULL",
    ASSIGNED = "ASSIGNED",
    SELF = "SELF"
}

export class DataScope {
    constructor(
        public accessLevel: AccessLevel,
        public classroomIds: number[] = [],
        public subjectIds: number[] = [],
        public studentId?: number,
        public staffId?: number
    ) { }

    /** Check if the user has access to a specific classroom */
    public hasClassroom(id: number): boolean {
        return this.accessLevel === AccessLevel.FULL || this.classroomIds.includes(id);
    }
}

/**
 * Resolves the effective data scope for a user based on their roles and assignments.
 */
@injectable()
export class DataScopeHelper {
    constructor(@inject("DB") private db: any) { }

    public async resolveScope(user: UserContext): Promise<DataScope> {
        // 1. Check for Administrative Roles (Tier 0, 1, 2)
        // If user has 'owner', 'principal', or 'school_admin', they get FULL access.
        const isAdmin = user.roles.some(role => ['owner', 'principal', 'vice_principal', 'school_admin'].includes(role));

        if (isAdmin) {
            return new DataScope(AccessLevel.FULL);
        }

        // 2. Check for Teacher Role (Tier 3)
        if (user.roles.includes('teacher') || user.roles.includes('class_teacher')) {
            // Fetch assignments from the database
            const staffRes = await this.db.query(
                `SELECT id FROM school.staff WHERE user_id = $1 AND is_deleted = FALSE`,
                [user.userId]
            );

            if (staffRes.rows.length > 0) {
                const staffId = staffRes.rows[0].id;
                const assignments = await this.db.query(
                    `SELECT classroom_id, subject_id FROM school.teacher_assignment 
                     WHERE staff_id = $1 AND is_deleted = FALSE`,
                    [staffId]
                );

                const classroomIds = assignments.rows.map((a: any) => a.classroom_id);
                const subjectIds = assignments.rows.map((a: any) => a.subject_id);

                return new DataScope(AccessLevel.ASSIGNED, classroomIds, subjectIds, undefined, staffId);
            }
        }

        // 3. Check for Student Role (Tier 4)
        if (user.roles.includes('student')) {
            const studentRes = await this.db.query(
                `SELECT id FROM school.student WHERE user_id = $1 AND is_deleted = FALSE`,
                [user.userId]
            );
            if (studentRes.rows.length > 0) {
                return new DataScope(AccessLevel.SELF, [], [], studentRes.rows[0].id);
            }
        }

        // Default: No access
        return new DataScope(AccessLevel.SELF, [], [], -1);
    }
}
