import { singleton } from 'tsyringe';
import type { IIntegrationAdapter } from './IIntegrationAdapter.js';

@singleton()
export class IntegrationRegistry {
    private adapters: Map<string, IIntegrationAdapter> = new Map();

    public register(adapter: IIntegrationAdapter): void {
        const manifest = adapter.getManifest();
        this.adapters.set(manifest.slug, adapter);
        console.log(`[IntegrationRegistry] Registered plugin: ${manifest.slug} v${manifest.version}`);
    }

    public getAdapter(slug: string): IIntegrationAdapter | undefined {
        return this.adapters.get(slug);
    }

    public listAdapters(): ReturnType<IIntegrationAdapter['getManifest']>[] {
        return Array.from(this.adapters.values()).map((a) => a.getManifest());
    }

    public hasAdapter(slug: string): boolean {
        return this.adapters.has(slug);
    }
}
