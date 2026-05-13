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
        // 1. Truncate School Tables (Ordered to handle FKs)
        const schoolTables = [
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
            'school.admission_workflow'
        ];
        console.log('   Removing academic and student records...');
        for (const table of schoolTables) {
            try {
                await client.query(`TRUNCATE TABLE ${table} CASCADE`);
            }
            catch (e) {
                // Ignore if table doesn't exist
            }
        }
        // 2. Cleanup Auth Users (keep super_admin)
        console.log('   Removing test user accounts...');
        try {
            await client.query(`
                DELETE FROM auth.user 
                WHERE id NOT IN (
                    SELECT user_id FROM auth.user_role ur 
                    JOIN auth.role r ON ur.role_id = r.id 
                    WHERE r.slug = 'super_admin'
                )
            `);
        }
        catch (e) { }
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
        }
        catch (e) { }
        console.log('✅ Institutional environment is now clean.');
    }
    catch (err) {
        console.error('❌ Cleanup failed:', err);
    }
    finally {
        client.release();
        await pool.end();
    }
}
cleanup();
