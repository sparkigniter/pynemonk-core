/**
 * PluginContextFactory
 *
 * Builds a PluginContext instance that is scoped to a single plugin execution.
 * Plugins receive this context rather than raw service/helper references,
 * keeping them decoupled from internals and making third-party development safe.
 */
import { injectable, inject } from 'tsyringe';
import type { EventEmitter } from 'events';
import StudentHelper from '../../student/helpers/StudentHelper.js';
import IntegrationHelper from '../helpers/IntegrationHelper.js';
import type {
    PluginContext,
    StudentRecord,
    PaginatedResult,
    ExternalIdentityRecord,
} from './IIntegrationAdapter.js';

@injectable()
export class PluginContextFactory {
    constructor(
        @inject(StudentHelper) private studentHelper: StudentHelper,
        @inject(IntegrationHelper) private integrationHelper: IntegrationHelper,
        @inject('EventBus') private eventBus: EventEmitter,
    ) {}

    /** Create a fully-populated PluginContext for a given tenant + plugin slug. */
    public create(tenantId: number, systemSlug: string): PluginContext {
        const { studentHelper, integrationHelper, eventBus } = this;

        return {
            tenantId,

            // ─── Students ────────────────────────────────────────────────
            async getStudents(filters = {}): Promise<PaginatedResult<StudentRecord>> {
                return studentHelper.listStudents(tenantId, filters) as Promise<
                    PaginatedResult<StudentRecord>
                >;
            },

            async getAllStudents(filters = {}): Promise<StudentRecord[]> {
                const PAGE_SIZE = 100;
                let page = 1;
                const allStudents: StudentRecord[] = [];

                while (true) {
                    const result = await studentHelper.listStudents(tenantId, {
                        ...filters,
                        page,
                        limit: PAGE_SIZE,
                    });
                    allStudents.push(...result.data);
                    if (page >= result.pagination.pages) break;
                    page++;
                }

                return allStudents;
            },

            // ─── External Identity ────────────────────────────────────────
            async getExternalId(
                entityType: string,
                entityId: number,
            ): Promise<ExternalIdentityRecord | undefined> {
                return integrationHelper.getExternalIdentity(
                    tenantId,
                    entityType,
                    entityId,
                    systemSlug,
                );
            },

            async saveExternalId(
                entityType: string,
                entityId: number,
                externalId: string,
                metadata?: Record<string, any>,
            ): Promise<ExternalIdentityRecord> {
                return integrationHelper.saveExternalIdentity({
                    tenant_id: tenantId,
                    entity_type: entityType,
                    entity_id: entityId,
                    system_slug: systemSlug,
                    external_id: externalId,
                    metadata,
                });
            },

            async listExternalIds(entityType: string): Promise<ExternalIdentityRecord[]> {
                return integrationHelper.listIdentitiesBySystem(tenantId, systemSlug, entityType);
            },

            // ─── Plugin Settings ──────────────────────────────────────────
            async getSettings(): Promise<Record<string, any> | null> {
                const row = await integrationHelper.getIntegrationSettings(tenantId, systemSlug);
                return row?.config ?? null;
            },

            // ─── Hooks ────────────────────────────────────────────────────
            on(event: string, handler: (payload: any) => Promise<void>): void {
                eventBus.on(`plugin:${systemSlug}:${event}`, handler);
            },

            async emit(event: string, payload: any): Promise<void> {
                eventBus.emit(`plugin:${systemSlug}:${event}`, payload);
            },

            // ─── Logging ──────────────────────────────────────────────────
            log(level: 'info' | 'warn' | 'error', message: string, meta?: any): void {
                const prefix = `[plugin:${systemSlug}]`;
                if (level === 'error') console.error(prefix, message, meta ?? '');
                else if (level === 'warn') console.warn(prefix, message, meta ?? '');
                else console.log(prefix, message, meta ?? '');
            },
        };
    }
}
