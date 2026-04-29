import { injectable } from 'tsyringe';
import { IntegrationRegistry } from '../core/IntegrationRegistry.js';
import { PluginContextFactory } from '../core/PluginContextFactory.js';
import IntegrationHelper from '../helpers/IntegrationHelper.js';
import { isExportResult } from '../core/IIntegrationAdapter.js';

@injectable()
export class IntegrationService {
    constructor(
        private registry: IntegrationRegistry,
        private helper: IntegrationHelper,
        private contextFactory: PluginContextFactory,
    ) {}

    public async listAvailableIntegrations(tenantId: number) {
        const adapters = this.registry.listAdapters();
        const settings = await this.dbQuery(
            `SELECT system_slug, is_enabled FROM school.integration_setting WHERE tenant_id = $1`,
            [tenantId],
        );
        const settingsMap = new Map(
            settings.rows.map((s: any) => [s.system_slug, s.is_enabled]),
        );

        return adapters.map((a: any) => ({
            ...a,
            isEnabled: settingsMap.get(a.slug) ?? false,
        }));
    }

    public async toggleIntegration(
        tenantId: number,
        systemSlug: string,
        isEnabled: boolean,
    ) {
        await this.dbQuery(
            `INSERT INTO school.integration_setting (tenant_id, system_slug, is_enabled)
             VALUES ($1, $2, $3)
             ON CONFLICT (tenant_id, system_slug)
             DO UPDATE SET is_enabled = $3, updated_at = NOW()`,
            [tenantId, systemSlug, isEnabled],
        );
        return { systemSlug, isEnabled };
    }

    private async dbQuery(query: string, params: any[]) {
        const db = (this.helper as any).db;
        return db.query(query, params);
    }

    /**
     * Execute a plugin action.
     *
     * @returns For regular actions: { type: 'json', data }
     *          For file exports:    { type: 'file', buffer, mimeType, filename }
     */
    public async executeAction(
        tenantId: number,
        systemSlug: string,
        action: string,
        options?: any,
    ) {
        const settings = await this.helper.getIntegrationSettings(tenantId, systemSlug);
        if (!settings?.is_enabled && action !== 'toggle') {
            throw new Error(`Integration ${systemSlug} is not enabled for this tenant`);
        }

        const adapter = this.registry.getAdapter(systemSlug);
        if (!adapter) throw new Error(`Integration ${systemSlug} not found`);

        // Build the plugin context for this request
        const context = this.contextFactory.create(tenantId, systemSlug);

        const result = await adapter.execute(context, action, options);

        if (isExportResult(result)) {
            return { type: 'file' as const, ...result };
        }

        return { type: 'json' as const, data: result };
    }
}
