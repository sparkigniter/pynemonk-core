import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export class AdmissionNumberService {
    constructor(@inject("DB") private pool: Pool) {}

    async getNextAdmissionNumber(tenantId: number): Promise<string> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Get format from key-value settings
            const settingsRes = await client.query(
                `SELECT value FROM school.settings WHERE tenant_id = $1 AND key = 'admission_number_format'`,
                [tenantId]
            );

            let format = settingsRes.rows[0]?.value || 'ADM-{YEAR}-{SEQ}';
            
            // 2. Get current sequence
            const seqRes = await client.query(
                `SELECT value FROM school.settings WHERE tenant_id = $1 AND key = 'next_admission_seq'`,
                [tenantId]
            );
            let seq = parseInt(seqRes.rows[0]?.value || '1', 10);

            const now = new Date();
            const year = now.getFullYear().toString();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');

            let admissionNo = '';
            let isUnique = false;

            // 3. Loop until we find a unique number
            while (!isUnique) {
                const paddedSeq = seq.toString().padStart(4, '0');
                admissionNo = format
                    .replace('{YEAR}', year)
                    .replace('{MONTH}', month)
                    .replace('{SEQ}', paddedSeq);

                // Check collision
                const collisionRes = await client.query(
                    `SELECT id FROM school.student WHERE tenant_id = $1 AND admission_no = $2`,
                    [tenantId, admissionNo]
                );

                if (collisionRes.rows.length === 0) {
                    isUnique = true;
                } else {
                    seq++;
                }
            }

            // 4. Update the sequence key to the NEXT available one
            await client.query(
                `INSERT INTO school.settings (tenant_id, key, value)
                 VALUES ($1, 'next_admission_seq', $2)
                 ON CONFLICT (tenant_id, key) DO UPDATE 
                 SET value = EXCLUDED.value, updated_at = NOW()`,
                [tenantId, (seq + 1).toString()]
            );

            // Ensure format exists
            if (settingsRes.rows.length === 0) {
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
