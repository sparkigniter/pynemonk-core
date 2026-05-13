import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../apps/pynemonk-monolith/.env') });

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST === 'postgres' ? 'localhost' : (process.env.PGHOST || 'localhost'),
    database: process.env.PGDATABASE || 'pynemonk_core',
    password: process.env.PGPASSWORD || 'password',
    port: parseInt(process.env.PGPORT || '5432')
});

async function fix() {
    console.log('🛡️  Synchronizing IAM Scopes for ERP Modules...');
    const client = await pool.connect();
    try {
        const newScopes = [
            'fee:read', 'fee:write', 'fee:delete',
            'assignment:read', 'assignment:write', 'assignment:delete',
            'timetable:read', 'timetable:write', 'timetable:delete',
            'report:read', 'report:write',
            'settings:read', 'settings:write'
        ];

        // 1. Register Scopes & Permissions
        for (const s of newScopes) {
            await client.query('INSERT INTO auth.scope (value, description) VALUES ($1, $2) ON CONFLICT (value) DO NOTHING', [s, `Access to ${s}`]);
            await client.query('INSERT INTO auth.permission (key, description) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING', [s, `Permission for ${s}`]);
        }

        // 2. Grant to Admin Templates
        const allScopes = await client.query('SELECT value FROM auth.scope');
        const scopeValues = allScopes.rows.map(r => r.value);
        await client.query('UPDATE auth.role_template SET data_scope = $1 WHERE slug IN ($2, $3, $4)', [JSON.stringify(scopeValues), 'admin', 'system_admin', 'school_admin']);

        // 3. Update existing roles in all tenants
        await client.query('UPDATE auth.role SET data_scope = $1 WHERE slug IN ($2, $3, $4)', [JSON.stringify(scopeValues), 'admin', 'system_admin', 'school_admin']);

        // 4. Publish IAM State
        await client.query('SELECT auth.proc_publish_iam_state()');
        
        console.log('✅ IAM State Synchronized. Admin now has full ERP access.');
    } catch (err) {
        console.error('❌ IAM Fix Failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

fix();
