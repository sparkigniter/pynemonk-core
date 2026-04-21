/**
 * tenant.api.ts
 * Typed wrapper around the tenant/school registration endpoints.
 */

const BASE_URL = (import.meta as any).env?.VITE_AUTH_API_URL ?? 'http://localhost:3000';

async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? `Request failed: ${res.status}`);
    return json.data ?? json;
}

async function post<T>(path: string, body: object): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? `Request failed: ${res.status}`);
    return json.data ?? json;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Package {
    id: number;
    name: string;
    slug: string;
    description: string;
    price_usd: string;
    features: string[];
}

export interface RegisterTenantPayload {
    name: string;
    school_id?: string; // The unique text ID (slug)
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    package_id: number;
    academic_year?: {
        name: string;
        start_date: string;
        end_date: string;
    };
    settings?: {
        language: string;
        date_format: string;
    };
}

export interface SetupOwnerPayload {
    admin_email: string;
    admin_password: string;
}

export interface Tenant {
    id: number;
    uuid: string;
    name: string;
    slug: string; // school_id maps to slug
    email: string;
    package_id: number;
    created_at: string;
}

export interface RegisterTenantResponse {
    tenant: Tenant;
    admin: {
        id: number;
        email: string;
    };
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

/** GET /api/v1/tenant/packages */
export async function getPackages(): Promise<Package[]> {
    return get<Package[]>('/api/v1/tenant/packages');
}

/** POST /api/v1/tenant/register — Step 1: register school + seed roles */
export async function registerTenant(payload: RegisterTenantPayload): Promise<Tenant> {
    return post<Tenant>('/api/v1/tenant/register', payload);
}

/** POST /api/v1/tenant/:id/setup-owner — Step 2: create owner account */
export async function setupOwner(tenantId: number, payload: SetupOwnerPayload): Promise<{ id: number; email: string }> {
    return post<{ id: number; email: string }>(`/api/v1/tenant/${tenantId}/setup-owner`, payload);
}
