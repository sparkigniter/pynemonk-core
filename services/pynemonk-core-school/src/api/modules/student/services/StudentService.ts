import { injectable, inject } from "tsyringe";
import StudentHelper from "../helpers/StudentHelper.js";
import StudentValidator from "../validator/StudentValidator.js";

// Note: To register a student, we also need to create their auth.user record.
// In a monolith this is easy (import UserHelper), in microservices we might do an HTTP call.
// Assuming monolith shared DB pattern for now:
import { Pool } from "pg";

import { IAuthClient } from "../../../core/interfaces/IAuthClient.js";

@injectable()
export default class StudentService {
    constructor(
        private studentHelper: StudentHelper,
        private studentValidator: StudentValidator,
        @inject("IAuthClient") private authClient: IAuthClient,
        @inject("DB") private db: Pool
    ) {}

    public async registerStudent(tenantId: number, data: any): Promise<any> {
        await this.studentValidator.validate("CREATE_STUDENT", data);

        // Start transaction for the school-specific parts
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');

            // 1. Create auth.user via the client (Abstracted)
            const authUser = await this.authClient.createUser({
                email: data.email,
                password: data.password,
                role_slug: 'student',
                tenant_id: tenantId
            });

            // 2. Create school.student
            const student = await this.studentHelper.createStudent({
                tenant_id: tenantId,
                user_id: authUser.id,
                admission_no: data.admission_no,
                first_name: data.first_name,
                last_name: data.last_name,
                gender: data.gender,
                date_of_birth: data.date_of_birth,
                blood_group: data.blood_group,
                nationality: data.nationality,
                religion: data.religion,
                phone: data.phone,
                address: data.address,
            });

            await client.query('COMMIT');
            return student;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    public async getStudent(tenantId: number, studentId: number): Promise<any> {
        return this.studentHelper.getStudentById(tenantId, studentId);
    }

    public async listStudents(tenantId: number, scope: any, limit: number, offset: number): Promise<any[]> {
        return this.studentHelper.listStudents(tenantId, scope, limit, offset);
    }
}
