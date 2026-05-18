import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

export interface Announcement {
    id?: number;
    tenant_id: number;
    classroom_id?: number | null;
    title: string;
    content: string;
    published_by: number;
    publish_date: string;
    expiry_date?: string | null;
}

@injectable()
export class AnnouncementService {
    constructor(@inject("DB") private pool: Pool) {}

    private async getStaffId(tenantId: number, userId: number): Promise<number> {
        const res = await this.pool.query(
            "SELECT id FROM school.staff WHERE tenant_id = $1 AND user_id = $2 AND is_deleted = FALSE",
            [tenantId, userId]
        );
        if (res.rows.length === 0) {
            throw new Error("Staff record not found for the user.");
        }
        return res.rows[0].id;
    }

    async list(tenantId: number, userId: number, roles: string[]) {
        const isStaff = roles.includes("school_admin") || roles.includes("system_admin") || roles.includes("principal") || roles.includes("teacher");
        const isGuardian = roles.includes("guardian") || roles.includes("parent");
        const isStudent = roles.includes("student");

        let classroomIds: number[] = [];

        if (isStudent) {
            const studentRes = await this.pool.query(
                `SELECT classroom_id FROM school.student_enrollment se
                 JOIN school.student s ON se.student_id = s.id
                 WHERE s.tenant_id = $1 AND s.user_id = $2 AND se.status = 'active' AND se.is_deleted = FALSE`,
                [tenantId, userId]
            );
            classroomIds = studentRes.rows.map(r => r.classroom_id);
        } else if (isGuardian) {
            const guardianRes = await this.pool.query(
                `SELECT classroom_id FROM school.student_enrollment se
                 JOIN school.student_guardian sg ON se.student_id = sg.student_id
                 JOIN school.guardian g ON sg.guardian_id = g.id
                 WHERE g.tenant_id = $1 AND g.user_id = $2 AND se.status = 'active' AND se.is_deleted = FALSE`,
                [tenantId, userId]
            );
            classroomIds = guardianRes.rows.map(r => r.classroom_id);
        }

        let query = `
            SELECT a.*, s.first_name || ' ' || COALESCE(s.last_name, '') as publisher_name, c.name as classroom_name
            FROM school.announcement a
            JOIN school.staff s ON a.published_by = s.id
            LEFT JOIN school.classroom c ON a.classroom_id = c.id
            WHERE a.tenant_id = $1 AND a.is_deleted = FALSE
        `;
        const params: any[] = [tenantId];

        if (!isStaff) {
            if (classroomIds.length > 0) {
                params.push(classroomIds);
                query += ` AND (a.classroom_id IS NULL OR a.classroom_id = ANY($2))`;
            } else {
                query += ` AND a.classroom_id IS NULL`;
            }
        }

        query += ` ORDER BY a.publish_date DESC, a.created_at DESC`;

        const result = await this.pool.query(query, params);
        return result.rows;
    }

    async create(tenantId: number, userId: number, data: Omit<Announcement, "tenant_id" | "published_by">) {
        const staffId = await this.getStaffId(tenantId, userId);
        const query = `
            INSERT INTO school.announcement (tenant_id, classroom_id, title, content, published_by, publish_date, expiry_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [
            tenantId,
            data.classroom_id || null,
            data.title,
            data.content,
            staffId,
            data.publish_date || new Date().toISOString().split("T")[0],
            data.expiry_date || null
        ];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async update(tenantId: number, id: number, data: Partial<Announcement>) {
        const query = `
            UPDATE school.announcement
            SET classroom_id = COALESCE($3, classroom_id),
                title = COALESCE($4, title),
                content = COALESCE($5, content),
                publish_date = COALESCE($6, publish_date),
                expiry_date = COALESCE($7, expiry_date),
                updated_at = NOW()
            WHERE id = $1 AND tenant_id = $2 AND is_deleted = FALSE
            RETURNING *
        `;
        const values = [id, tenantId, data.classroom_id, data.title, data.content, data.publish_date, data.expiry_date];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async delete(tenantId: number, id: number) {
        await this.pool.query(
            "UPDATE school.announcement SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND tenant_id = $2",
            [id, tenantId]
        );
    }
}
