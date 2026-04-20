import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class EnrollmentHelper {
    constructor(@inject("DB") private db: Pool) {}

    public async enrollStudent(
        data: {
            tenant_id: number;
            student_id: number;
            classroom_id: number;
            academic_year_id: number;
            roll_number?: string;
        },
        db: Pool | any = this.db,
    ): Promise<any> {
        const res = await db.query(
            `INSERT INTO school.student_enrollment
                (tenant_id, student_id, classroom_id, academic_year_id, roll_number)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (student_id, academic_year_id) 
             DO UPDATE SET classroom_id = $3, roll_number = $5, is_deleted = FALSE
             RETURNING id, classroom_id, academic_year_id, roll_number`,
            [
                data.tenant_id,
                data.student_id,
                data.classroom_id,
                data.academic_year_id,
                data.roll_number ?? null,
            ],
        );
        return res.rows[0];
    }
}
