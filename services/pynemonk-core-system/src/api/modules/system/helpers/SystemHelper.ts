import { Pool } from "pg";
import { injectable, inject } from "tsyringe";

@injectable()
export class SystemHelper {
    constructor(@inject("DB") private db: Pool) {}

    async getGlobalStats() {
        // Since we are a separate service, we query the shared database
        const schoolCount = await this.db.query("SELECT COUNT(*) FROM auth.tenant WHERE is_deleted = false");
        const studentCount = await this.db.query("SELECT COUNT(*) FROM school.student WHERE is_deleted = false");
        const teacherCount = await this.db.query(`
            SELECT COUNT(*) 
            FROM school.staff s 
            JOIN auth.user u ON s.user_id = u.id 
            JOIN auth.role r ON u.role_id = r.id 
            WHERE (r.slug = 'teacher' OR r.slug = 'class_teacher') 
            AND s.is_deleted = false
        `);
        
        const activeSchools = await this.db.query("SELECT COUNT(*) FROM auth.tenant WHERE is_active = true AND is_deleted = false");

        return {
            totalSchools: parseInt(schoolCount.rows[0].count),
            activeSchools: parseInt(activeSchools.rows[0].count),
            totalStudents: parseInt(studentCount.rows[0].count),
            totalTeachers: parseInt(teacherCount.rows[0].count),
            systemHealth: 'Healthy',
            lastUpdated: new Date().toISOString()
        };
    }
}
