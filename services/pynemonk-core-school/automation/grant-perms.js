import { Pool } from 'pg';
const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    database: 'pynemonk_core',
    password: 'password',
    port: 5432
});
async function grant() {
    try {
        // 1. Get all scopes
        const scopesRes = await pool.query('SELECT value FROM auth.scope');
        const scopes = scopesRes.rows.map(r => r.value);
        // 2. Update system_admin role data_scope
        await pool.query('UPDATE auth.role SET data_scope = $1 WHERE slug = $2', [JSON.stringify(scopes), 'system_admin']);
        // 3. Update the procedure to sync from auth.role instead of template
        await pool.query(`
            CREATE OR REPLACE FUNCTION auth.proc_publish_iam_state()
            RETURNS VOID AS $$
            DECLARE
                v_client_id INT;
            BEGIN
                -- A. Propagate Template permissions to all Tenant Roles (Initial Sync)
                INSERT INTO auth.role_permission (tenant_id, role_id, permission_id)
                SELECT r.tenant_id, r.id, p.id
                FROM auth.role r
                JOIN auth.role_template rt ON r.slug = rt.slug
                CROSS JOIN LATERAL jsonb_array_elements_text(rt.data_scope) as scope_key
                JOIN auth.permission p ON p.key = scope_key
                ON CONFLICT (role_id, permission_id) DO NOTHING;

                -- B. Sync to Triadic JWT Layer (client_role_scope) for Internal Clients
                -- CRITICAL: Uses r.data_scope for live overrides
                FOR v_client_id IN SELECT id FROM auth.client WHERE is_internal = TRUE LOOP
                    INSERT INTO auth.client_role_scope (client_id, role_id, scope_id)
                    SELECT v_client_id, r.id, s.id
                    FROM auth.role r
                    CROSS JOIN LATERAL jsonb_array_elements_text(r.data_scope) as scope_key
                    JOIN auth.scope s ON s.value = scope_key
                    ON CONFLICT (client_id, role_id, scope_id) DO UPDATE SET granted = TRUE;
                END LOOP;

                -- C. Sync Whitelists
                PERFORM auth.proc_sync_internal_client_scopes();
            END;
            $$ LANGUAGE plpgsql;
        `);
        // 4. Publish IAM State
        await pool.query('SELECT auth.proc_publish_iam_state()');
        console.log('✅ Permissions granted, procedure updated, and IAM state published');
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await pool.end();
    }
}
grant();
