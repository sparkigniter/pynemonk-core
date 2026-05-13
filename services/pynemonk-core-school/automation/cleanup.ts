import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from monolith
dotenv.config({ path: path.resolve(__dirname, '../../../apps/pynemonk-monolith/.env') });

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST === 'postgres' ? 'localhost' : (process.env.PGHOST || 'localhost'),
    database: process.env.PGDATABASE || 'pynemonk_core',
    password: process.env.PGPASSWORD || 'password',
    port: parseInt(process.env.PGPORT || '5432')
});

async function cleanup() {
    console.log('🧹 Starting institutional data cleanup...');
    const client = await pool.connect();
    try {
        const beforeUsers = await client.query('SELECT count(*) FROM auth.user');
        console.log(`   Users before: ${beforeUsers.rows[0].count}`);

        // 1. Truncate School Tables (Ordered to handle FKs)
        const schoolTables = [
            'school.lms_submission',
            'school.lms_resource',
            'school.student_fee_discount',
            'school.fee_discount',
            'school.fee_installment',
            'school.student_fee_allocation',
            'school.fee_structure_item',
            'school.fee_structure',
            'school.fee_head',
            'school.fee_group',
            'school.exam_marks',
            'school.exam_paper',
            'school.exam',
            'school.homework',
            'school.attendance',
            'school.timetable',
            'school.student_enrollment',
            'school.classroom',
            'school.student_document',
            'school.student_log',
            'school.student',
            'school.staff',
            'school.subject',
            'school.grade',
            'school.academic_year',
            'school.student_guardian',
            'school.guardian',
            'school.admission_workflow'
        ];

        console.log('   Removing academic and student records...');
        for (const table of schoolTables) {
            try {
                await client.query(`TRUNCATE TABLE ${table} CASCADE`);
            } catch (e) {
                // Ignore if table doesn't exist
            }
        }

        // 2. Cleanup Auth Users (keep super_admin)
        console.log('   Removing test user accounts...');
        try {
            await client.query(`DELETE FROM auth.refresh_token WHERE user_id NOT IN (SELECT id FROM auth.user WHERE email IN ('admin@pynemonk.com', 'vikas@sparkigniter.com', 'admin@demo.edu'))`);
            await client.query(`DELETE FROM auth.user_profile WHERE user_id NOT IN (SELECT id FROM auth.user WHERE email IN ('admin@pynemonk.com', 'vikas@sparkigniter.com', 'admin@demo.edu'))`);
            await client.query(`DELETE FROM auth.user_credential WHERE user_id NOT IN (SELECT id FROM auth.user WHERE email IN ('admin@pynemonk.com', 'vikas@sparkigniter.com', 'admin@demo.edu'))`);
            await client.query(`DELETE FROM auth.user_role WHERE user_id NOT IN (SELECT id FROM auth.user WHERE email IN ('admin@pynemonk.com', 'vikas@sparkigniter.com', 'admin@demo.edu'))`);
            await client.query(`DELETE FROM auth.user WHERE email NOT IN ('admin@pynemonk.com', 'vikas@sparkigniter.com', 'admin@demo.edu')`);
        } catch (e) {}

        // 3. Reset Sequences
        console.log('   Resetting system sequences...');
        try {
            const sequences = await client.query(`
                SELECT 'ALTER SEQUENCE ' || relname || ' RESTART WITH 1' as sql
                FROM pg_class WHERE relkind = 'S' AND relname LIKE 'school_%'
            `);
            for (const seq of sequences.rows) {
                await client.query(seq.sql);
            }
        } catch (e) {}

        const afterUsers = await client.query('SELECT count(*) FROM auth.user');
        console.log(`   Users after: ${afterUsers.rows[0].count}`);

        console.log('✅ Institutional environment is now clean.');
    } catch (err) {
        console.error('❌ Cleanup failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

cleanup();
