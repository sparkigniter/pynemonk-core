import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the monolith directory
dotenv.config({ path: path.resolve(__dirname, '../../../../apps/pynemonk-monolith/.env') });

// Also try loading from current working directory (in case user runs from root)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/pynemonk-monolith/.env') });

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST === 'postgres' ? 'localhost' : (process.env.PGHOST || 'localhost'),
    database: process.env.PGDATABASE || 'pynemonk_core',
    password: process.env.PGPASSWORD || 'password',
    port: parseInt(process.env.PGPORT || '5432'),
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
});

const FIRST_NAMES = [
    'Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Sai', 'Ishaan', 'Aaryan', 'Krishna', 'Shaurya',
    'Ananya', 'Diya', 'Pari', 'Saanvi', 'Angel', 'Ishani', 'Aanya', 'Myra', 'Kavya', 'Riya',
    'Rahul', 'Rohit', 'Amit', 'Sanjay', 'Vikram', 'Deepak', 'Rajesh', 'Sunil', 'Kiran', 'Prakash',
    'Neha', 'Pooja', 'Sneha', 'Anjali', 'Megha', 'Shweta', 'Tanvi', 'Roshni', 'Jyoti', 'Komal'
];

const LAST_NAMES = [
    'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Joshi',
    'Malhotra', 'Kapoor', 'Khan', 'Mishra', 'Yadav', 'Choudhury', 'Deshmukh', 'Kulkarni', 'Bose', 'Chatterjee'
];

const SUBJECTS = [
    'Mathematics', 'General Science', 'English Literature', 'Hindi Grammar', 'Social Studies', 'Computer Science'
];

const SECTIONS = ['A', 'B', 'C', 'D'];

async function seed() {
    const tenantId = 1; // Default demo tenant
    let client;

    try {
        client = await pool.connect();
        await client.query('BEGIN');
        console.log('🚀 Starting demo data seeding for tenant 1...');

        // 1. Get Academic Year
        const ayRes = await client.query('SELECT id FROM school.academic_year WHERE tenant_id = $1 AND is_current = TRUE LIMIT 1', [tenantId]);
        if (ayRes.rows.length === 0) throw new Error('No current academic year found for tenant 1. Please ensure a school is registered.');
        const ayId = ayRes.rows[0].id;

        // 2. Get Roles
        const roleRes = await client.query('SELECT id, slug FROM auth.role WHERE tenant_id = $1 OR tenant_id IS NULL', [tenantId]);
        const roleMap = Object.fromEntries(roleRes.rows.map(r => [r.slug, r.id]));
        const teacherRoleId = roleMap['teacher'];
        const studentRoleId = roleMap['student'];

        if (!teacherRoleId || !studentRoleId) throw new Error('Teacher or Student roles not found in auth.role');

        // 3. Seed Grades (1 to 10)
        console.log('🏫 Seeding grades...');
        const gradeIds = [];
        for (let i = 1; i <= 10; i++) {
            const slug = `grade-${i}`;
            const res = await client.query(
                'INSERT INTO school.grade (tenant_id, name, slug, sequence_order) VALUES ($1, $2, $3, $4) ON CONFLICT (tenant_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id',
                [tenantId, `Grade ${i}`, slug, i]
            );
            gradeIds.push(res.rows[0].id);
        }

        // 4. Seed Subjects for each Grade
        console.log('📚 Seeding subjects per grade...');
        for (const gId of gradeIds) {
            for (const name of SUBJECTS) {
                const code = `${name.substring(0, 3).toUpperCase()}-${gradeIds.indexOf(gId) + 1}`;
                await client.query(
                    'INSERT INTO school.subject (tenant_id, grade_id, name, code) VALUES ($1, $2, $3, $4) ON CONFLICT (tenant_id, grade_id, code) DO NOTHING',
                    [tenantId, gId, name, code]
                );
            }
        }

        // 5. Seed Classrooms
        console.log('🏢 Seeding classrooms...');
        const classroomIds = [];
        for (const gId of gradeIds) {
            for (const section of SECTIONS) {
                const res = await client.query(
                    'INSERT INTO school.classroom (tenant_id, academic_year_id, grade_id, name, section) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (tenant_id, academic_year_id, grade_id, section) DO UPDATE SET name = EXCLUDED.name RETURNING id',
                    [tenantId, ayId, gId, `Class ${gradeIds.indexOf(gId) + 1}${section}`, section]
                );
                classroomIds.push(res.rows[0].id);
            }
        }

        // 6. Seed Teachers (20)
        console.log('👨‍🏫 Seeding 20 teachers...');
        for (let i = 1; i <= 20; i++) {
            const fName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
            const lName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
            const email = `teacher${i}@demo.edu`;

            // Create User
            const userRes = await client.query(
                'INSERT INTO auth.user (tenant_id, email, role_id) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id',
                [tenantId, email, teacherRoleId]
            );
            const userId = userRes.rows[0].id;

            // Create Credential
            await client.query(
                'INSERT INTO auth.user_credential (tenant_id, user_id, password_hash) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash',
                [tenantId, userId, '$2b$12$Wbkdx61wwjKAQwohUBsGVe76p6K4Nxl/OfVhTXkU1b6lf6gXl5CYG'] // password123
            );

            // Create Staff Profile
            await client.query(
                'INSERT INTO school.staff (tenant_id, user_id, first_name, last_name, employee_code, designation, phone) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (tenant_id, user_id) DO NOTHING',
                [tenantId, userId, fName, lName, `TCH-${100 + i}`, 'Senior Teacher', `98765432${i.toString().padStart(2, '0')}`]
            );
        }

        // 7. Seed Students (5000)
        console.log('👶 Seeding 5000 students...');
        const batchSize = 100;
        for (let i = 0; i < 5000; i += batchSize) {
            for (let j = 0; j < batchSize; j++) {
                const idx = i + j + 1;
                const fName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
                const lName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
                const email = `student${idx}@demo.edu`;
                const admNo = `ADM-2026-${idx.toString().padStart(4, '0')}`;

                const userRes = await client.query(
                    'INSERT INTO auth.user (tenant_id, email, role_id) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id',
                    [tenantId, email, studentRoleId]
                );
                const userId = userRes.rows[0].id;

                await client.query(
                    'INSERT INTO auth.user_credential (tenant_id, user_id, password_hash) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash',
                    [tenantId, userId, '$2b$12$Wbkdx61wwjKAQwohUBsGVe76p6K4Nxl/OfVhTXkU1b6lf6gXl5CYG'] // password123
                );

                const studentRes = await client.query(
                    'INSERT INTO school.student (tenant_id, user_id, admission_no, first_name, last_name, gender, date_of_birth, blood_group) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (tenant_id, admission_no) DO UPDATE SET first_name = EXCLUDED.first_name RETURNING id',
                    [tenantId, userId, admNo, fName, lName, Math.random() > 0.5 ? 'male' : 'female', '2010-01-01', 'O+']
                );

                if (studentRes.rows[0]) {
                    const studentId = studentRes.rows[0].id;
                    const classroomId = classroomIds[Math.floor(Math.random() * classroomIds.length)];
                    await client.query(
                        'INSERT INTO school.student_enrollment (tenant_id, academic_year_id, student_id, classroom_id, roll_number, status) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (student_id, academic_year_id) DO NOTHING',
                        [tenantId, ayId, studentId, classroomId, (j + 1).toString(), 'active']
                    );
                }
            }
            if (i % 500 === 0) console.log(`...processed ${i} students`);
        }

        await client.query('COMMIT');
        console.log('✅ Seeding completed successfully!');
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('❌ Seeding failed:', error);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

seed();
