import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class IntegrationHelper {
    constructor(@inject("DB") private db: Pool) {}

    public async getExternalIdentity(tenantId: number, entityType: string, entityId: number, systemSlug: string) {
        const res = await this.db.query(
            `SELECT * FROM school.external_identity 
             WHERE tenant_id = $1 AND entity_type = $2 AND entity_id = $3 AND system_slug = $4`,
            [tenantId, entityType, entityId, systemSlug]
        );
        return res.rows[0];
    }

    public async saveExternalIdentity(data: {
        tenant_id: number;
        entity_type: string;
        entity_id: number;
        system_slug: string;
        external_id: string;
        metadata?: any;
    }) {
        const res = await this.db.query(
            `INSERT INTO school.external_identity 
                (tenant_id, entity_type, entity_id, system_slug, external_id, metadata)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (tenant_id, entity_type, entity_id, system_slug) 
             DO UPDATE SET external_id = EXCLUDED.external_id, metadata = EXCLUDED.metadata, updated_at = NOW()
             RETURNING *`,
            [data.tenant_id, data.entity_type, data.entity_id, data.system_slug, data.external_id, data.metadata || {}]
        );
        return res.rows[0];
    }

    public async listIdentitiesBySystem(tenantId: number, systemSlug: string, entityType?: string) {
        let query = `SELECT * FROM school.external_identity WHERE tenant_id = $1 AND system_slug = $2`;
        const params = [tenantId, systemSlug];
        
        if (entityType) {
            query += ` AND entity_type = $3`;
            params.push(entityType);
        }

        const res = await this.db.query(query, params);
        return res.rows;
    }

    public async getIntegrationSettings(tenantId: number, systemSlug: string) {
        const res = await this.db.query(
            `SELECT * FROM school.integration_setting WHERE tenant_id = $1 AND system_slug = $2`,
            [tenantId, systemSlug]
        );
        return res.rows[0];
    }
}
