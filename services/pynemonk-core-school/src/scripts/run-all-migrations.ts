import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../apps/pynemonk-monolith/.env') });

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'pynemonk_core',
    password: process.env.PGPASSWORD || 'password',
    port: parseInt(process.env.PGPORT || '5432')
});

async function runServiceMigrations(pool: Pool, schema: string, migrationsPath: string) {
    const client = await pool.connect();
    try {
        console.log(`[MigrationRunner:${schema}] Checking for migrations in ${migrationsPath}...`);
        
        await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema};`);
        await client.query(`
            CREATE TABLE IF NOT EXISTS ${schema}.migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        if (!fs.existsSync(migrationsPath)) {
            console.warn(`[MigrationRunner:${schema}] Directory not found: ${migrationsPath}`);
            return;
        }

        const files = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql')).sort();

        for (const file of files) {
            const { rows } = await client.query(`SELECT id FROM ${schema}.migrations WHERE name = $1`, [file]);
            if (rows.length === 0) {
                console.log(`[MigrationRunner:${schema}] Applying ${file}...`);
                const sql = fs.readFileSync(path.join(migrationsPath, file), 'utf8');
                await client.query('BEGIN');
                try {
                    await client.query(sql);
                    await client.query(`INSERT INTO ${schema}.migrations (name) VALUES ($1)`, [file]);
                    await client.query('COMMIT');
                } catch (err: any) {
                    await client.query('ROLLBACK');
                    console.error(`[MigrationRunner:${schema}] Failed ${file}:`, err.message);
                    throw err;
                }
            }
        }
        console.log(`[MigrationRunner:${schema}] Done.`);
    } finally {
        client.release();
    }
}

async function main() {
    try {
        // Run School Migrations
        await runServiceMigrations(
            pool, 
            'school', 
            path.resolve(__dirname, '../../../../services/pynemonk-core-school/sql/migrations')
        );

        // Run Auth Migrations
        await runServiceMigrations(
            pool, 
            'auth', 
            path.resolve(__dirname, '../../../../services/pynemonk-core-auth/sql/migrations')
        );

        console.log('✅ All migrations finished.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
}

main();
