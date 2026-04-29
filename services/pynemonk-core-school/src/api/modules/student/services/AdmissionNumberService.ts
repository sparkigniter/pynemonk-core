import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export class AdmissionNumberService {
    constructor(@inject("DB") private pool: Pool) {}

    async getNextAdmissionNumber(tenantId: number): Promise<string> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Get current settings and sequence
            const settingsRes = await client.query(
                `SELECT admission_number_format, next_admission_seq FROM school.settings WHERE tenant_id = $1`,
                [tenantId]
            );

            let format = 'ADM-{YEAR}-{SEQ}';
            let seq = 1;

            if (settingsRes.rows.length > 0) {
                format = settingsRes.rows[0].admission_number_format;
                seq = settingsRes.rows[0].next_admission_seq;
            } else {
                // Initialize settings if missing
                await client.query(`INSERT INTO school.settings (tenant_id) VALUES ($1)`, [tenantId]);
            }

            // 2. Generate the number
            const now = new Date();
            const year = now.getFullYear().toString();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const paddedSeq = seq.toString().padStart(4, '0');

            let admissionNo = format
                .replace('{YEAR}', year)
                .replace('{MONTH}', month)
                .replace('{SEQ}', paddedSeq);

            // 3. Increment for next time
            await client.query(
                `UPDATE school.settings SET next_admission_seq = next_admission_seq + 1, updated_at = NOW() WHERE tenant_id = $1`,
                [tenantId]
            );

            await client.query('COMMIT');
            return admissionNo;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getSettings(tenantId: number) {
        const res = await this.pool.query(
            `SELECT * FROM school.settings WHERE tenant_id = $1`,
            [tenantId]
        );
        return res.rows[0] || { admission_number_format: 'ADM-{YEAR}-{SEQ}' };
    }

    async updateSettings(tenantId: number, settings: { admission_number_format?: string }) {
        const query = `
            INSERT INTO school.settings (tenant_id, admission_number_format)
            VALUES ($1, $2)
            ON CONFLICT (tenant_id) DO UPDATE 
            SET admission_number_format = EXCLUDED.admission_number_format, updated_at = NOW()
            RETURNING *
        `;
        const res = await this.pool.query(query, [tenantId, settings.admission_number_format]);
        return res.rows[0];
    }
}
