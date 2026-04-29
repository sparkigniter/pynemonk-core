import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../../apps/pynemonk-monolith/.env') });

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST === 'postgres' ? 'localhost' : (process.env.PGHOST || 'localhost'),
    database: process.env.PGDATABASE || 'pynemonk_core',
    password: process.env.PGPASSWORD || 'password',
    port: parseInt(process.env.PGPORT || '5432'),
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
});

const FIRST_NAMES_MALE = [
    'Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Sai', 'Ishaan', 'Aaryan', 'Krishna', 'Shaurya', 'Kabir',
    'Aryan', 'Rohan', 'Ansh', 'Vivaan', 'Pranav', 'Dev', 'Ayaan', 'Rishi', 'Atharv', 'Ayush',
    'Rahul', 'Rohit', 'Amit', 'Sanjay', 'Vikram', 'Deepak', 'Rajesh', 'Sunil', 'Kiran', 'Prakash'
];

const FIRST_NAMES_FEMALE = [
    'Ananya', 'Diya', 'Pari', 'Saanvi', 'Angel', 'Ishani', 'Aanya', 'Myra', 'Kavya', 'Riya',
    'Neha', 'Pooja', 'Sneha', 'Anjali', 'Megha', 'Shweta', 'Tanvi', 'Roshni', 'Jyoti', 'Komal'
];

const LAST_NAMES = [
    'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Joshi',
    'Malhotra', 'Kapoor', 'Khan', 'Mishra', 'Yadav', 'Choudhury', 'Deshmukh', 'Kulkarni', 'Bose', 'Chatterjee'
];

const CASTES = ['General', 'OBC', 'SC', 'ST'];
const RELIGIONS = ['Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain'];
const COMMON_SUBJECTS = ['Mathematics', 'English', 'Kannada', 'Hindi', 'PlayTime (PT)', 'Music', 'Craft'];

async function cleanup(client: any, tenantId: number) {
    console.log('🧹 Clearing existing data for tenant 1...');
    await client.query('DELETE FROM school.attendance WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM school.exam_student WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM school.exam_paper WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM school.exam_invitation WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM school.exam WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM school.timetable WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM school.teacher_assignment WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM school.student_guardian WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM school.guardian WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM school.student_enrollment WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM school.student WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM school.classroom WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM school.staff WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM school.subject WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM school.grade WHERE tenant_id = $1', [tenantId]);
}

async function createUser(client: any, tenantId: number, email: string, roleId: number) {
    // 1. Check if user exists
    const existing = await client.query('SELECT id FROM auth.user WHERE email = $1', [email]);
    let userId;

    if (existing.rows.length > 0) {
        userId = existing.rows[0].id;
        await client.query('UPDATE auth.user SET role_id = $1 WHERE id = $2', [roleId, userId]);
    } else {
        const userRes = await client.query(
            'INSERT INTO auth.user (tenant_id, email, role_id) VALUES ($1, $2, $3) RETURNING id',
            [tenantId, email, roleId]
        );
        userId = userRes.rows[0].id;
    }

    // 2. Ensure credentials exist (Manual Check instead of ON CONFLICT)
    const existingCred = await client.query('SELECT user_id FROM auth.user_credential WHERE user_id = $1', [userId]);
    if (existingCred.rows.length === 0) {
        await client.query(
            'INSERT INTO auth.user_credential (tenant_id, user_id, password_hash) VALUES ($1, $2, $3)',
            [tenantId, userId, '$2b$12$Wbkdx61wwjKAQwohUBsGVe76p6K4Nxl/OfVhTXkU1b6lf6gXl5CYG']
        );
    }

    return userId;
}

async function seed() {
    const tenantId = 1;
    let client;

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        // Ensure Tenant 1 exists
        const existingTenant = await client.query('SELECT id FROM auth.tenant WHERE id = $1', [tenantId]);
        if (existingTenant.rows.length === 0) {
            await client.query(`INSERT INTO auth.tenant (id, name, slug, email, package_id) VALUES (1, 'Pynemonk Demo School', 'demo-school', 'admin@pynemonk.com', 1)`);
        }

        await cleanup(client, tenantId);

        // 1. Ensure Academic Year exists
        let ayRes = await client.query('SELECT id FROM school.academic_year WHERE tenant_id = $1 AND is_current = TRUE LIMIT 1', [tenantId]);

        if (ayRes.rows.length === 0) {
            console.log('📅 No academic year found. Creating default: 2026-27...');
            ayRes = await client.query(
                'INSERT INTO school.academic_year (tenant_id, name, start_date, end_date, is_current) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [tenantId, '2026-27', '2026-04-01', '2027-03-31', true]
            );
        }
        const ayId = ayRes.rows[0].id;
        
        // 1.2 Ensure School Settings exist
        const settingsRes = await client.query('SELECT 1 FROM school.settings WHERE tenant_id = $1', [tenantId]);
        if (settingsRes.rows.length === 0) {
            console.log('⚙️ Initializing school settings...');
            await client.query(`
                INSERT INTO school.settings (tenant_id, attendance_mode)
                VALUES ($1, 'DAILY')
            `, [tenantId]);
        }

        // 1.5 Ensure Roles exist for this tenant (Clone from templates if missing)
        console.log('🎭 Initializing tenant roles from templates...');
        const templates = await client.query('SELECT * FROM auth.role_template');
        for (const tmpl of templates.rows) {
            const existingRole = await client.query('SELECT id FROM auth.role WHERE tenant_id = $1 AND slug = $2 AND is_deleted = FALSE', [tenantId, tmpl.slug]);
            if (existingRole.rows.length === 0) {
                // Ensure data_scope is a valid JSON string
                const dataScope = typeof tmpl.data_scope === 'string' ? tmpl.data_scope : JSON.stringify(tmpl.data_scope);
                await client.query(`
                    INSERT INTO auth.role (tenant_id, slug, name, description, tier, is_system, data_scope)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [tenantId, tmpl.slug, tmpl.name, tmpl.description, tmpl.tier, tmpl.is_system, dataScope]);
            }
        }

        // 2. Get Roles
        const roleRes = await client.query('SELECT id, slug FROM auth.role WHERE tenant_id = $1 OR tenant_id IS NULL', [tenantId]);
        const roleMap = Object.fromEntries(roleRes.rows.map(r => [r.slug, r.id]));
        console.log('🎭 Available Roles:', Object.keys(roleMap).join(', '));

        const getRole = (slug: string) => {
            const id = roleMap[slug];
            if (!id) {
                console.warn(`⚠️ Warning: Role '${slug}' not found. Using first available role.`);
                return Object.values(roleMap)[0];
            }
            return id;
        };

        console.log('👑 Creating Management Staff...');
        await createUser(client, tenantId, 'admin@pynemonk.com', getRole('system_admin'));
        const schoolAdminUserId = await createUser(client, tenantId, 'office@demo.edu', getRole('school_admin'));
        await client.query('INSERT INTO school.staff (tenant_id, user_id, first_name, last_name, employee_code, designation) VALUES ($1, $2, $3, $4, $5, $6)',
            [tenantId, schoolAdminUserId, 'Sanjay', 'Gupta', 'ADM-001', 'School Administrator']);
        const principalUserId = await createUser(client, tenantId, 'principal@demo.edu', getRole('principal'));
        await client.query('INSERT INTO school.staff (tenant_id, user_id, first_name, last_name, employee_code, designation) VALUES ($1, $2, $3, $4, $5, $6)',
            [tenantId, principalUserId, 'Dr. Rajesh', 'Khanna', 'PRN-001', 'Principal']);

        // 3. Create 20 Teachers
        console.log('👨‍🏫 Creating 20 Teachers...');
        const teacherIds = [];
        for (let i = 1; i <= 20; i++) {
            const isMale = Math.random() > 0.4;
            const fName = isMale ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)] : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)];
            const lName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
            const email = `teacher${i}@demo.edu`;
            const userId = await createUser(client, tenantId, email, getRole('teacher'));
            const staffRes = await client.query('INSERT INTO school.staff (tenant_id, user_id, first_name, last_name, employee_code, designation, phone) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
                [tenantId, userId, fName, lName, `TCH-${100 + i}`, 'TGT Teacher', `99887766${i.toString().padStart(2, '0')}`]);
            teacherIds.push(staffRes.rows[0].id);
        }

        // 4. Create Grades and Classrooms
        console.log('🏫 Setting up Grades and Classrooms...');
        const gradeIds = [];
        const classroomIdsByGrade: Record<number, number[]> = {};
        for (let i = 1; i <= 10; i++) {
            const gradeRes = await client.query('INSERT INTO school.grade (tenant_id, name, slug, sequence_order) VALUES ($1, $2, $3, $4) RETURNING id', [tenantId, `Grade ${i}`, `grade-${i}`, i]);
            const gId = gradeRes.rows[0].id;
            gradeIds.push(gId);
            classroomIdsByGrade[gId] = [];
            const sectionCount = i === 10 ? 3 : 2;
            for (let s = 0; s < sectionCount; s++) {
                const section = String.fromCharCode(65 + s);
                const classRes = await client.query('INSERT INTO school.classroom (tenant_id, academic_year_id, grade_id, name, section) VALUES ($1, $2, $3, $4, $5) RETURNING id', [tenantId, ayId, gId, `Class ${i}-${section}`, section]);
                classroomIdsByGrade[gId].push(classRes.rows[0].id);
            }
            const gradeSubjects = [...COMMON_SUBJECTS, i >= 8 ? 'Physics' : 'Science', i >= 8 ? 'Chemistry' : null, i >= 8 ? 'Biology' : null].filter(Boolean);
            for (const subName of gradeSubjects) {
                await client.query('INSERT INTO school.subject (tenant_id, grade_id, name, code) VALUES ($1, $2, $3, $4)', [tenantId, gId, subName, `${(subName as string).substring(0, 3).toUpperCase()}-${i}`]);
            }
        }

        // 5. Create 500 Students
        console.log('👶 Enrolling 500 Students...');
        let studentCount = 0;
        for (const gId of gradeIds) {
            const classrooms = classroomIdsByGrade[gId];
            const gradeNum = gradeIds.indexOf(gId) + 1;
            for (let s = 0; s < 50; s++) {
                studentCount++;
                const isMale = Math.random() > 0.5;
                const fName = isMale ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)] : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)];
                const lName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
                const email = `student${studentCount}@demo.edu`;
                const userId = await createUser(client, tenantId, email, getRole('student'));
                const studentRes = await client.query('INSERT INTO school.student (tenant_id, user_id, admission_no, first_name, last_name, gender, date_of_birth, religion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
                    [tenantId, userId, `ADM-2026-${studentCount.toString().padStart(4, '0')}`, fName, lName, isMale ? 'male' : 'female', `${2026 - (gradeNum + 5)}-05-20`, RELIGIONS[Math.floor(Math.random() * RELIGIONS.length)]]);
                const studentId = studentRes.rows[0].id;
                const classroomId = classrooms[s % classrooms.length];
                await client.query('INSERT INTO school.student_enrollment (tenant_id, academic_year_id, student_id, classroom_id, roll_number, status) VALUES ($1, $2, $3, $4, $5, $6)',
                    [tenantId, ayId, studentId, classroomId, ((s % (50 / classrooms.length)) + 1).toString(), 'active']);

                // 6. Create Parent for this student
                const parentFName = isMale ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)] : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)];
                const parentEmail = `parent${studentCount}@demo.edu`;
                const parentUserId = await createUser(client, tenantId, parentEmail, getRole('parent'));

                const guardianRes = await client.query(
                    'INSERT INTO school.guardian (tenant_id, user_id, first_name, last_name, gender, phone, email, relation_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
                    [tenantId, parentUserId, parentFName, lName, Math.random() > 0.5 ? 'male' : 'female', `900000${studentCount.toString().padStart(4, '0')}`, parentEmail, 'Father']
                );

                await client.query(
                    'INSERT INTO school.student_guardian (tenant_id, student_id, guardian_id, relation, is_emergency) VALUES ($1, $2, $3, $4, $5)',
                    [tenantId, studentId, guardianRes.rows[0].id, 'Father', true]
                );
            }
            console.log(`... Grade ${gradeNum} complete`);
        }
        await client.query('COMMIT');
        console.log('✅ Seeding Completed!');
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('❌ Seeding failed:', error);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}
seed();
