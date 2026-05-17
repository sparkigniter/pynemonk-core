import { injectable, inject } from "tsyringe";
import { Pool } from "pg";

export interface CertificateTemplate {
    id?: number;
    tenant_id: number;
    name: string;
    type: string;
    html_content: string;
    is_default?: boolean;
}

@injectable()
export default class CertificateTemplateService {
    constructor(@inject("DB") private db: Pool) {}

    async getTemplate(tenantId: number, type: string): Promise<CertificateTemplate | null> {
        const query = `
            SELECT * FROM school.certificate_template 
            WHERE tenant_id = $1 AND type = $2 AND is_deleted = FALSE
            LIMIT 1
        `;
        const result = await this.db.query(query, [tenantId, type]);
        return result.rows[0] || null;
    }

    async upsertTemplate(tenantId: number, data: Partial<CertificateTemplate>): Promise<CertificateTemplate> {
        const query = `
            INSERT INTO school.certificate_template (tenant_id, name, type, html_content, is_default)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (tenant_id, type) DO UPDATE SET
                name = EXCLUDED.name,
                html_content = EXCLUDED.html_content,
                is_default = EXCLUDED.is_default,
                updated_at = NOW()
            RETURNING *
        `;
        const result = await this.db.query(query, [
            tenantId,
            data.name || 'Default Template',
            data.type,
            data.html_content,
            data.is_default || false
        ]);
        return result.rows[0];
    }
}
