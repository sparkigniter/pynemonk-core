import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../apps/pynemonk-monolith/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST === 'postgres' ? 'localhost' : (process.env.PGHOST || 'localhost'),
    database: process.env.PGDATABASE || 'pynemonk_core',
    password: process.env.PGPASSWORD || 'password',
    port: parseInt(process.env.PGPORT || '5432'),
    ssl: (process.env.PGSSL === 'true' ||
        (process.env.PGHOST &&
            !process.env.PGHOST.includes('localhost') &&
            !process.env.PGHOST.includes('db') &&
            !process.env.PGHOST.includes('postgres') &&
            process.env.PGSSL !== 'false'))
        ? { rejectUnauthorized: false }
        : false,
    max: 20
});

const FIRST_NAMES = ['Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Sai', 'Ishaan', 'Aaryan', 'Krishna', 'Shaurya', 'Ananya', 'Diya', 'Pari', 'Saanvi', 'Angel', 'Ishani', 'Aanya', 'Myra', 'Kavya', 'Riya'];
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Joshi', 'Malhotra', 'Kapoor', 'Khan', 'Mishra'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer'];
const SECTIONS = ['A', 'B', 'C', 'D'];
const DEMO_PASSWORD_HASH = '$2b$12$Wbkdx61wwjKAQwohUBsGVe76p6K4Nxl/OfVhTXkU1b6lf6gXl5CYG'; // password123

async function seed() {
    let client;
    try {
        client = await pool.connect();
        
        console.log('🧹 Cleaning existing data...');
        await client.query('TRUNCATE school.student_guardian, school.guardian, school.student_enrollment, school.student, school.timetable, school.teacher_assignment, school.class_subject, school.staff, school.classroom, school.subject, school.grade, school.academic_year CASCADE');
        await client.query('TRUNCATE auth.refresh_token, auth.user_role, auth.user_credential, auth.user_profile, auth.user, auth.role, auth.client, auth.tenant CASCADE');

        await client.query(`INSERT INTO auth.client (name, description, client_id, client_secret) VALUES ('Pynemonk Web Frontend', 'Main web interface', '03458d1b77bf121e', '838086db215b5a9dca34194d3d5d3fbe')`);

        const packageRes = await client.query('SELECT id FROM auth.package LIMIT 1');
        const packageId = packageRes.rows[0]?.id || 1;
        const roleTemplates = (await client.query('SELECT slug, id FROM auth.role_template')).rows;

        console.log('🚀 Starting massive seeding: 1000 schools, 5000 students/school...');

        for (let s = 1; s <= 1000; s++) {
            await client.query('BEGIN');
            try {
                const tenantRes = await client.query('INSERT INTO auth.tenant (name, slug, email, package_id) VALUES ($1, $2, $3, $4) RETURNING id', [`School ${s}`, `school-${s}`, `admin@school${s}.edu`, packageId]);
                const tenantId = tenantRes.rows[0].id;

                const roleMap: Record<string, number> = {};
                for (const rt of roleTemplates) {
                    const rRes = await client.query('INSERT INTO auth.role (tenant_id, slug, name, description, tier, is_system, data_scope) SELECT $1, slug, name, description, tier, is_system, data_scope FROM auth.role_template WHERE id = $2 RETURNING id', [tenantId, rt.id]);
                    roleMap[rt.slug] = rRes.rows[0].id;
                }

                const ayRes = await client.query('INSERT INTO school.academic_year (tenant_id, name, start_date, end_date, is_current) VALUES ($1, $2, $3, $4, $5) RETURNING id', [tenantId, '2026-27', '2026-06-01', '2027-05-31', true]);
                const ayId = ayRes.rows[0].id;

                const classroomIds = [];
                for (let g = 1; g <= 10; g++) {
                    const gradeRes = await client.query('INSERT INTO school.grade (tenant_id, name, slug, sequence_order) VALUES ($1, $2, $3, $4) RETURNING id', [tenantId, `Grade ${g}`, `g${g}`, g]);
                    const gradeId = gradeRes.rows[0].id;
                    for (const subj of SUBJECTS) await client.query('INSERT INTO school.subject (tenant_id, grade_id, name, code) VALUES ($1, $2, $3, $4)', [tenantId, gradeId, subj, `${subj.substring(0,3).toUpperCase()}${g}`]);
                    for (const sec of SECTIONS) {
                        const clsRes = await client.query('INSERT INTO school.classroom (tenant_id, academic_year_id, grade_id, section, name) VALUES ($1, $2, $3, $4, $5) RETURNING id', [tenantId, ayId, gradeId, sec, `${g}${sec}`]);
                        classroomIds.push(clsRes.rows[0].id);
                    }
                }

                // Staff
                const staffEntries = [['principal', 'Principal'], ['school_admin', 'Admin'], ...Array(20).fill(['teacher', 'Teacher'])];
                for (let i = 0; i < staffEntries.length; i++) {
                    const [role, prefix] = staffEntries[i];
                    const email = `${role}${i}@s${s}.edu`;
                    const uRes = await client.query('INSERT INTO auth.user (tenant_id, email, role_id) VALUES ($1, $2, $3) RETURNING id', [tenantId, email, roleMap[role]]);
                    const uid = uRes.rows[0].id;
                    await client.query('INSERT INTO auth.user_credential (tenant_id, user_id, password_hash) VALUES ($1, $2, $3)', [tenantId, uid, DEMO_PASSWORD_HASH]);
                    await client.query('INSERT INTO auth.user_role (user_id, role_id, is_primary) VALUES ($1, $2, $3)', [uid, roleMap[role], true]);
                    await client.query('INSERT INTO school.staff (tenant_id, user_id, first_name, last_name, employee_code, designation) VALUES ($1, $2, $3, $4, $5, $6)', [tenantId, uid, prefix, `Staff ${i}`, `E${s}-${i}`, role.toUpperCase()]);
                }

                // Students (5000)
                console.log(`   🏫 School ${s}: Seeding 5000 students...`);
                for (let b = 0; b < 5000; b++) {
                    const sEmail = `s${s}_${b}@edu.com`;
                    const gEmail = `g${s}_${b}@edu.com`;
                    
                    const suRes = await client.query('INSERT INTO auth.user (tenant_id, email, role_id) VALUES ($1, $2, $3) RETURNING id', [tenantId, sEmail, roleMap['student']]);
                    const sid_uid = suRes.rows[0].id;
                    const guRes = await client.query('INSERT INTO auth.user (tenant_id, email, role_id) VALUES ($1, $2, $3) RETURNING id', [tenantId, gEmail, roleMap['parent']]);
                    const gid_uid = guRes.rows[0].id;

                    await client.query('INSERT INTO auth.user_credential (tenant_id, user_id, password_hash) VALUES ($1, $2, $3), ($1, $4, $3)', [tenantId, sid_uid, DEMO_PASSWORD_HASH, gid_uid]);
                    await client.query('INSERT INTO auth.user_role (user_id, role_id, is_primary) VALUES ($1, $2, TRUE), ($3, $4, TRUE)', [sid_uid, roleMap['student'], gid_uid, roleMap['parent']]);

                    const sRes = await client.query('INSERT INTO school.student (tenant_id, user_id, admission_no, first_name, last_name, gender) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [tenantId, sid_uid, `A${s}-${b}`, FIRST_NAMES[b%19], LAST_NAMES[b%14], b%2==0?'male':'female']);
                    const sid = sRes.rows[0].id;
                    const gRes = await client.query('INSERT INTO school.guardian (tenant_id, user_id, first_name, last_name, email) VALUES ($1, $2, $3, $4, $5) RETURNING id', [tenantId, gid_uid, 'Parent', LAST_NAMES[b%14], gEmail]);
                    const gid = gRes.rows[0].id;

                    const cid = classroomIds[Math.floor(Math.random()*classroomIds.length)];
                    await client.query('INSERT INTO school.student_enrollment (tenant_id, student_id, classroom_id, academic_year_id, roll_number) VALUES ($1, $2, $3, $4, $5)', [tenantId, sid, cid, ayId, `${b}`]);
                    await client.query('INSERT INTO school.student_guardian (tenant_id, student_id, guardian_id, relation) VALUES ($1, $2, $3, $4)', [tenantId, sid, gid, 'Father']);
                    
                    if (b > 0 && b % 500 === 0) console.log(`      🔸 ${b} students done...`);
                }
                await client.query('COMMIT');
                if (s % 5 === 0) console.log(`✅ Processed ${s} schools...`);
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            }
        }
        console.log('🎉 Seeding completed!');
    } catch (err) {
        console.error('❌ Failed:', err);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}
seed();
