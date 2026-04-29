import { injectable, inject } from "tsyringe";

export interface TeacherNote {
    id: number;
    tenant_id: number;
    staff_id: number;
    classroom_id?: number;
    subject_id?: number;
    timetable_id?: number;
    note_date: string;
    content: string;
    is_completed: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
    
    // Joined fields
    classroom_name?: string;
    subject_name?: string;
}

@injectable()
export class TeacherNoteHelper {
    constructor(@inject("DB") private db: any) {}

    async listNotes(tenantId: number, staffId: number, filters: {
        startDate?: string;
        endDate?: string;
        classroomId?: number;
        subjectId?: number;
    }) {
        let query = `
            SELECT tn.*, c.name as classroom_name, s.name as subject_name
            FROM school.teacher_note tn
            LEFT JOIN school.classroom c ON tn.classroom_id = c.id
            LEFT JOIN school.subject s ON tn.subject_id = s.id
            WHERE tn.tenant_id = $1 
              AND tn.staff_id = $2
              AND tn.is_deleted = FALSE
        `;
        const params: any[] = [tenantId, staffId];

        if (filters.startDate) {
            params.push(filters.startDate);
            query += ` AND tn.note_date >= $${params.length}`;
        }
        if (filters.endDate) {
            params.push(filters.endDate);
            query += ` AND tn.note_date <= $${params.length}`;
        }
        if (filters.classroomId) {
            params.push(filters.classroomId);
            query += ` AND tn.classroom_id = $${params.length}`;
        }
        if (filters.subjectId) {
            params.push(filters.subjectId);
            query += ` AND tn.subject_id = $${params.length}`;
        }

        query += ` ORDER BY tn.note_date DESC, tn.created_at DESC`;

        const result = await this.db.query(query, params);
        return result.rows;
    }

    async createNote(tenantId: number, staffId: number, data: Partial<TeacherNote>) {
        const query = `
            INSERT INTO school.teacher_note (
                tenant_id, staff_id, classroom_id, subject_id, timetable_id, note_date, content
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const params = [
            tenantId,
            staffId,
            data.classroom_id || null,
            data.subject_id || null,
            data.timetable_id || null,
            data.note_date || new Date(),
            data.content
        ];

        const result = await this.db.query(query, params);
        return result.rows[0];
    }

    async updateNote(tenantId: number, staffId: number, noteId: number, data: Partial<TeacherNote>) {
        const updates: string[] = [];
        const params: any[] = [tenantId, staffId, noteId];

        if (data.content !== undefined) {
            params.push(data.content);
            updates.push(`content = $${params.length}`);
        }
        if (data.is_completed !== undefined) {
            params.push(data.is_completed);
            updates.push(`is_completed = $${params.length}`);
        }
        if (data.is_deleted !== undefined) {
            params.push(data.is_deleted);
            updates.push(`is_deleted = $${params.length}`);
        }

        if (updates.length === 0) return null;

        const query = `
            UPDATE school.teacher_note
            SET ${updates.join(", ")}, updated_at = NOW()
            WHERE tenant_id = $1 AND staff_id = $2 AND id = $3
            RETURNING *
        `;

        const result = await this.db.query(query, params);
        return result.rows[0];
    }
}
