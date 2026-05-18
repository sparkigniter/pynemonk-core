import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

export interface CommunicationTicket {
    id?: number;
    tenant_id: number;
    student_id: number;
    teacher_id: number;
    guardian_id: number;
    title: string;
    type: "complaint" | "query";
    status: "open" | "resolved" | "closed";
    category: "academic" | "behavioral" | "attendance" | "general";
}

export interface CommunicationMessage {
    id?: number;
    tenant_id: number;
    ticket_id: number;
    sender_id: number;
    message: string;
    attachment_url?: string | null;
}

@injectable()
export class CommunicationService {
    constructor(@inject("DB") private pool: Pool) {}

    private async getStaffId(tenantId: number, userId: number): Promise<number | null> {
        const res = await this.pool.query(
            "SELECT id FROM school.staff WHERE tenant_id = $1 AND user_id = $2 AND is_deleted = FALSE",
            [tenantId, userId]
        );
        return res.rows.length > 0 ? res.rows[0].id : null;
    }

    private async getGuardianId(tenantId: number, userId: number): Promise<number | null> {
        const res = await this.pool.query(
            "SELECT id FROM school.guardian WHERE tenant_id = $1 AND user_id = $2 AND is_deleted = FALSE",
            [tenantId, userId]
        );
        return res.rows.length > 0 ? res.rows[0].id : null;
    }

    async getRecipientOptions(tenantId: number, userId: number, roles: string[]) {
        const isGuardian = roles.includes("guardian") || roles.includes("parent");
        const isTeacher = roles.includes("teacher");

        if (isGuardian) {
            // For parents: get all teachers assigned to their children's classrooms
            const query = `
                SELECT DISTINCT 
                    s.id as teacher_id, 
                    s.first_name || ' ' || COALESCE(s.last_name, '') as teacher_name, 
                    sub.name as subject_name, 
                    st.id as student_id, 
                    st.first_name || ' ' || COALESCE(st.last_name, '') as student_name
                FROM school.student_enrollment se
                JOIN school.student_guardian sg ON se.student_id = sg.student_id
                JOIN school.guardian g ON sg.guardian_id = g.id
                JOIN school.student st ON se.student_id = st.id
                JOIN school.teacher_assignment ta ON se.classroom_id = ta.classroom_id
                JOIN school.staff s ON ta.staff_id = s.id
                JOIN school.subject sub ON ta.subject_id = sub.id
                WHERE g.tenant_id = $1 AND g.user_id = $2 AND se.status = 'active' AND se.is_deleted = FALSE AND ta.is_deleted = FALSE
            `;
            const result = await this.pool.query(query, [tenantId, userId]);
            return { role: "guardian", options: result.rows };
        } else if (isTeacher) {
            // For teachers: get all students and their parents enrolled in their classrooms
            const query = `
                SELECT DISTINCT 
                    st.id as student_id, 
                    st.first_name || ' ' || COALESCE(st.last_name, '') as student_name, 
                    g.id as guardian_id, 
                    g.first_name || ' ' || COALESCE(g.last_name, '') as guardian_name, 
                    sg.relation
                FROM school.teacher_assignment ta
                JOIN school.staff s ON ta.staff_id = s.id
                JOIN school.student_enrollment se ON ta.classroom_id = se.classroom_id
                JOIN school.student st ON se.student_id = st.id
                JOIN school.student_guardian sg ON st.id = sg.student_id
                JOIN school.guardian g ON sg.guardian_id = g.id
                WHERE s.tenant_id = $1 AND s.user_id = $2 AND se.status = 'active' AND se.is_deleted = FALSE AND ta.is_deleted = FALSE AND sg.is_deleted = FALSE
            `;
            const result = await this.pool.query(query, [tenantId, userId]);
            return { role: "teacher", options: result.rows };
        }

        return { role: "admin", options: [] };
    }

    async listTickets(tenantId: number, userId: number, roles: string[]) {
        const isAdmin = roles.includes("school_admin") || roles.includes("system_admin") || roles.includes("principal");
        const isTeacher = roles.includes("teacher");
        const isGuardian = roles.includes("guardian") || roles.includes("parent");

        let query = `
            SELECT 
                t.*,
                st.first_name || ' ' || COALESCE(st.last_name, '') as student_name,
                st.avatar_url as student_avatar,
                s.first_name || ' ' || COALESCE(s.last_name, '') as teacher_name,
                g.first_name || ' ' || COALESCE(g.last_name, '') as guardian_name,
                (SELECT COUNT(*) FROM school.communication_message WHERE ticket_id = t.id AND is_deleted = FALSE) as message_count
            FROM school.communication_ticket t
            JOIN school.student st ON t.student_id = st.id
            JOIN school.staff s ON t.teacher_id = s.id
            JOIN school.guardian g ON t.guardian_id = g.id
            WHERE t.tenant_id = $1 AND t.is_deleted = FALSE
        `;
        const params: any[] = [tenantId];

        if (isAdmin) {
            // Can view everything
        } else if (isTeacher) {
            const staffId = await this.getStaffId(tenantId, userId);
            if (!staffId) return [];
            params.push(staffId);
            query += ` AND t.teacher_id = $2`;
        } else if (isGuardian) {
            const guardianId = await this.getGuardianId(tenantId, userId);
            if (!guardianId) return [];
            params.push(guardianId);
            query += ` AND t.guardian_id = $2`;
        } else {
            return [];
        }

        query += ` ORDER BY t.updated_at DESC`;
        const result = await this.pool.query(query, params);
        return result.rows;
    }

    async createTicket(tenantId: number, userId: number, roles: string[], data: Omit<CommunicationTicket, "tenant_id" | "status"> & { initialMessage: string }) {
        const isTeacher = roles.includes("teacher");
        const isGuardian = roles.includes("guardian") || roles.includes("parent");

        let teacherId = data.teacher_id;
        let guardianId = data.guardian_id;

        if (isTeacher) {
            const staffId = await this.getStaffId(tenantId, userId);
            if (!staffId) throw new Error("Staff record not found.");
            teacherId = staffId;
        } else if (isGuardian) {
            const guardId = await this.getGuardianId(tenantId, userId);
            if (!guardId) throw new Error("Guardian record not found.");
            guardianId = guardId;
        }

        // Start transaction
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const ticketQuery = `
                INSERT INTO school.communication_ticket (tenant_id, student_id, teacher_id, guardian_id, title, type, category)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            const ticketValues = [
                tenantId,
                data.student_id,
                teacherId,
                guardianId,
                data.title,
                data.type,
                data.category || "general"
            ];
            const ticketResult = await client.query(ticketQuery, ticketValues);
            const ticket = ticketResult.rows[0];

            // Insert initial message
            const messageQuery = `
                INSERT INTO school.communication_message (tenant_id, ticket_id, sender_id, message)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            await client.query(messageQuery, [tenantId, ticket.id, userId, data.initialMessage]);

            await client.query("COMMIT");
            return ticket;
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    }

    async listMessages(tenantId: number, ticketId: number) {
        const query = `
            SELECT 
                m.*,
                u.email as sender_email,
                COALESCE(s.first_name || ' ' || s.last_name, g.first_name || ' ' || g.last_name, 'Admin') as sender_name,
                CASE
                    WHEN s.id IS NOT NULL THEN 'teacher'
                    WHEN g.id IS NOT NULL THEN 'parent'
                    ELSE 'admin'
                END as sender_role
            FROM school.communication_message m
            JOIN auth.user u ON m.sender_id = u.id
            LEFT JOIN school.staff s ON u.id = s.user_id AND s.tenant_id = m.tenant_id
            LEFT JOIN school.guardian g ON u.id = g.user_id AND g.tenant_id = m.tenant_id
            WHERE m.ticket_id = $1 AND m.tenant_id = $2 AND m.is_deleted = FALSE
            ORDER BY m.created_at ASC
        `;
        const result = await this.pool.query(query, [ticketId, tenantId]);
        return result.rows;
    }

    async reply(tenantId: number, userId: number, ticketId: number, message: string) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const messageQuery = `
                INSERT INTO school.communication_message (tenant_id, ticket_id, sender_id, message)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const msgResult = await client.query(messageQuery, [tenantId, ticketId, userId, message]);

            // Update ticket updated_at
            await client.query(
                "UPDATE school.communication_ticket SET updated_at = NOW() WHERE id = $1 AND tenant_id = $2",
                [ticketId, tenantId]
            );

            await client.query("COMMIT");
            return msgResult.rows[0];
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    }

    async updateStatus(tenantId: number, ticketId: number, status: "open" | "resolved" | "closed") {
        const query = `
            UPDATE school.communication_ticket
            SET status = $1, updated_at = NOW()
            WHERE id = $2 AND tenant_id = $3
            RETURNING *
        `;
        const result = await this.pool.query(query, [status, ticketId, tenantId]);
        return result.rows[0];
    }
}
