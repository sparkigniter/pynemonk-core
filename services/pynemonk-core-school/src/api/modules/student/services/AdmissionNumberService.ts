import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export class AdmissionNumberService {
    constructor(@inject("DB") private pool: Pool) {}

    async getNextAdmissionNumber(tenantId: number): Promise<string> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Get format and sequence from key-value settings
            const settingsRes = await client.query(
                `SELECT key, value FROM school.settings WHERE tenant_id = $1 AND key IN ('admission_number_format', 'next_admission_seq')`,
                [tenantId]
            );

            let format = 'ADM-{YEAR}-{SEQ}';
            let seq = 1;

            settingsRes.rows.forEach(row => {
                if (row.key === 'admission_number_format') format = row.value;
                if (row.key === 'next_admission_seq') seq = parseInt(row.value, 10);
            });

            // 2. Generate the number
            const now = new Date();
            const year = now.getFullYear().toString();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const paddedSeq = seq.toString().padStart(4, '0');

            let admissionNo = format
                .replace('{YEAR}', year)
                .replace('{MONTH}', month)
                .replace('{SEQ}', paddedSeq);

            // 3. Increment and update the sequence key
            await client.query(
                `INSERT INTO school.settings (tenant_id, key, value)
                 VALUES ($1, 'next_admission_seq', $2)
                 ON CONFLICT (tenant_id, key) DO UPDATE 
                 SET value = (EXCLUDED.value::int + 1)::text, updated_at = NOW()`,
                [tenantId, (seq + 1).toString()]
            );

            // Ensure format exists if it didn't
            if (!settingsRes.rows.find(r => r.key === 'admission_number_format')) {
                await client.query(
                    `INSERT INTO school.settings (tenant_id, key, value)
                     VALUES ($1, 'admission_number_format', $2)
                     ON CONFLICT DO NOTHING`,
                    [tenantId, format]
                );
            }

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
            `SELECT key, value FROM school.settings WHERE tenant_id = $1`,
            [tenantId]
        );
        const settings: any = {};
        res.rows.forEach(row => {
            settings[row.key] = row.value;
        });
        return {
            admission_number_format: settings.admission_number_format || 'ADM-{YEAR}-{SEQ}',
            next_admission_seq: parseInt(settings.next_admission_seq || '1', 10)
        };
    }

    async updateSettings(tenantId: number, settings: { admission_number_format?: string }) {
        if (settings.admission_number_format) {
            await this.pool.query(`
                INSERT INTO school.settings (tenant_id, key, value)
                VALUES ($1, 'admission_number_format', $2)
                ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
            `, [tenantId, settings.admission_number_format]);
        }
        return this.getSettings(tenantId);
    }
}
