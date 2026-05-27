import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Setup __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../../apps/pynemonk-monolith/.env') });

// Detect if running inside Docker
const isDocker = fs.existsSync('/.dockerenv');

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: isDocker ? 'postgres' : (process.env.PGHOST || 'localhost'),
    database: process.env.PGDATABASE || 'pynemonk_core',
    password: process.env.PGPASSWORD || 'password',
    port: parseInt(process.env.PGPORT || '5432'),
});

const FIRST_NAMES_MALE = ['Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Sai', 'Ishaan', 'Aaryan', 'Krishna', 'Shaurya', 'Kabir'];
const FIRST_NAMES_FEMALE = ['Ananya', 'Diya', 'Pari', 'Saanvi', 'Angel', 'Ishani', 'Aanya', 'Myra', 'Kavya', 'Riya'];
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Joshi'];

const RELIGIONS = ['Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain'];
const COMMON_SUBJECTS = ['Mathematics', 'English', 'Science', 'Social Studies'];

async function cleanup(client: any, tenantId: number) {
    console.log('🧹 Clearing institutional data...');
    await client.query('TRUNCATE school.academic_year, school.student, school.staff, school.classroom, school.grade, school.subject, school.student_enrollment, school.fee_installment, school.student_fee_allocation, school.exam, school.exam_paper, school.exam_marks, school.teacher_assignment, school.timetable, accounting.invoice, accounting.invoice_line, accounting.journal_entry, accounting.journal_item, accounting.partner CASCADE');
}

async function createUser(client: any, tenantId: number, email: string, roleId: number) {
    const existing = await client.query('SELECT id FROM auth.user WHERE email = $1', [email]);
    let userId;
    if (existing.rows[0]) {
        userId = existing.rows[0].id;
    } else {
        const userRes = await client.query('INSERT INTO auth.user (tenant_id, email, role_id) VALUES ($1, $2, $3) RETURNING id', [tenantId, email, roleId]);
        userId = userRes.rows[0].id;
    }

    // Ensure user profile exists (so portal does not crash reading name)
    const profileRes = await client.query('SELECT id FROM auth.user_profile WHERE user_id = $1', [userId]);
    if (profileRes.rows.length === 0) {
        const parts = email.split('@');
        const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        await client.query('INSERT INTO auth.user_profile (tenant_id, user_id, first_name, last_name) VALUES ($1, $2, $3, $4)', [tenantId, userId, firstName, 'Demo']);
    }

    // Ensure user credential exists (password: 'password123')
    const credRes = await client.query('SELECT id FROM auth.user_credential WHERE user_id = $1', [userId]);
    if (credRes.rows.length === 0) {
        const passwordHash = '$2b$10$njZZti4N6qN3pm1jzTByS.IyjHg02ZUu2RvOtoqEb7fa2liw3z626';
        await client.query('INSERT INTO auth.user_credential (tenant_id, user_id, password_hash) VALUES ($1, $2, $3)', [tenantId, userId, passwordHash]);
    }
    
    return userId;
}

async function seed() {
    let client;

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        // 0. Fetch or Create default tenant to satisfy foreign key constraints
        const officeUserCheck = await client.query("SELECT tenant_id FROM auth.user WHERE email = 'office@demo.edu' LIMIT 1");
        let tenantId;
        if (officeUserCheck.rows.length > 0) {
            tenantId = officeUserCheck.rows[0].tenant_id;
        } else {
            const tenantCheck = await client.query('SELECT id FROM auth.tenant LIMIT 1');
            if (tenantCheck.rows.length > 0) {
                tenantId = tenantCheck.rows[0].id;
            } else {
                console.log('🏢 No active tenant found. Creating a default tenant...');
                const defaultPkgRes = await client.query("SELECT id FROM auth.package WHERE slug = 'standard' LIMIT 1");
                const pkgId = defaultPkgRes.rows[0]?.id || 1;
                
                const tenantInsert = await client.query(
                    `INSERT INTO auth.tenant (name, slug, email, package_id) 
                     VALUES ($1, $2, $3, $4) RETURNING id`,
                    ['Demo Academy', 'demo', 'demo@pynemonk.com', pkgId]
                );
                tenantId = tenantInsert.rows[0].id;
            }
        }
        console.log(`🏢 Seeding for Tenant ID: ${tenantId}`);

        await cleanup(client, tenantId);

        // 1. Academic Year
        console.log('📅 Creating Academic Year 2026-27...');
        const ayRes = await client.query("INSERT INTO school.academic_year (tenant_id, name, start_date, end_date, is_current) VALUES ($1, '2026-27', '2026-04-01', '2027-03-31', true) RETURNING id", [tenantId]);
        const ayId = ayRes.rows[0].id;

        // 2. Roles
        const roleRes = await client.query("SELECT id, slug FROM auth.role WHERE tenant_id = $1 OR tenant_id IS NULL", [tenantId]);
        const roleMap = Object.fromEntries(roleRes.rows.map(r => [r.slug, r.id]));

        // 2.5 Staff
        console.log('👑 Creating Management & Faculty...');
        const adminId = await createUser(client, tenantId, 'office@demo.edu', roleMap['school_admin']);
        await client.query('INSERT INTO school.staff (tenant_id, user_id, first_name, last_name, employee_code, designation) VALUES ($1, $2, $3, $4, $5, $6)',
            [tenantId, adminId, 'Sanjay', 'Gupta', 'ADM-001', 'School Administrator']);

        const principalId = await createUser(client, tenantId, 'principal@demo.edu', roleMap['principal']);
        await client.query('INSERT INTO school.staff (tenant_id, user_id, first_name, last_name, employee_code, designation) VALUES ($1, $2, $3, $4, $5, $6)',
            [tenantId, principalId, 'Dr. Rajesh', 'Khanna', 'PRN-001', 'Principal']);

        const teacherStaffIds = [];
        for (let i = 1; i <= 5; i++) {
            const tId = await createUser(client, tenantId, `teacher${i}@demo.edu`, roleMap['teacher']);
            const staffRes = await client.query('INSERT INTO school.staff (tenant_id, user_id, first_name, last_name, employee_code, designation) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                [tenantId, tId, `Teacher`, `${i}`, `TCH-${i.toString().padStart(3, '0')}`, 'Senior Faculty']);
            teacherStaffIds.push(staffRes.rows[0].id);
        }

        // 2.7 Parents / Guardians
        console.log('👪 Creating Guardian Accounts...');
        const parentRoleId = roleMap['parent'];
        let guardianId: number | undefined;
        if (parentRoleId) {
            const pId = await createUser(client, tenantId, 'parent1@demo.edu', parentRoleId);
            
            // Create guardian entry in school.guardian
            const guardianCheck = await client.query('SELECT id FROM school.guardian WHERE user_id = $1', [pId]);
            if (guardianCheck.rows.length === 0) {
                const guardianRes = await client.query(
                    `INSERT INTO school.guardian (tenant_id, user_id, first_name, last_name, gender, phone, email, occupation)
                     VALUES ($1, $2, 'Ramesh', 'Sharma', 'male', '9876543210', 'parent1@demo.edu', 'Business Owner') RETURNING id`,
                    [tenantId, pId]
                );
                guardianId = guardianRes.rows[0].id;
            } else {
                guardianId = guardianCheck.rows[0].id;
            }
        }

        // 3. Grades & Subjects
        console.log('🏫 Setting up Grades & Subjects...');
        const gradeIds = [];
        const classroomIds = [];
        const subjectIds: number[] = [];
        for (let i = 1; i <= 5; i++) {
            const gRes = await client.query('INSERT INTO school.grade (tenant_id, name, slug, sequence_order) VALUES ($1, $2, $3, $4) RETURNING id', [tenantId, `Grade ${i}`, `grade-${i}`, i]);
            const gId = gRes.rows[0].id;
            gradeIds.push(gId);
            
            const cRes = await client.query('INSERT INTO school.classroom (tenant_id, academic_year_id, grade_id, name, section) VALUES ($1, $2, $3, $4, $5) RETURNING id', [tenantId, ayId, gId, `Class ${i}-A`, 'A']);
            const classroomId = cRes.rows[0].id;
            classroomIds.push(classroomId);

            const teacherStaffId = teacherStaffIds[i - 1];
            await client.query('UPDATE school.classroom SET class_teacher_id = $1 WHERE id = $2', [teacherStaffId, classroomId]);

            for (const sub of COMMON_SUBJECTS) {
                const sRes = await client.query('INSERT INTO school.subject (tenant_id, grade_id, name, code) VALUES ($1, $2, $3, $4) RETURNING id', [tenantId, gId, sub, `${sub.substring(0,3).toUpperCase()}-${i}`]);
                const subjectId = sRes.rows[0].id;
                subjectIds.push(subjectId);

                await client.query('INSERT INTO school.teacher_assignment (tenant_id, staff_id, classroom_id, subject_id, academic_year_id) VALUES ($1, $2, $3, $4, $5)',
                    [tenantId, teacherStaffId, classroomId, subjectId, ayId]);
            }
        }

        // 4. Fee Setup
        console.log('💰 Configuring Fee Structures...');
        const feeHeadRes = await client.query("INSERT INTO school.fee_head (tenant_id, name, ledger_account_id) VALUES ($1, 'Tuition Fee', (SELECT id FROM accounting.chart_of_accounts WHERE code = '400000' LIMIT 1)) RETURNING id", [tenantId]);
        const feeHeadId = feeHeadRes.rows[0].id;

        const fsRes = await client.query("INSERT INTO school.fee_structure (tenant_id, academic_year_id, name) VALUES ($1, $2, 'Standard Annual Fee') RETURNING id", [tenantId, ayId]);
        const fsId = fsRes.rows[0].id;

        await client.query("INSERT INTO school.fee_structure_item (fee_structure_id, fee_head_id, amount, installment_name) VALUES ($1, $2, 5000, 'Term 1'), ($1, $2, 5000, 'Term 2')", [fsId, feeHeadId]);

        // 5. Students
        console.log('👶 Enrolling 50 Students & Generating Invoices...');
        for (let i = 1; i <= 50; i++) {
            const isMale = Math.random() > 0.5;
            const fName = isMale ? FIRST_NAMES_MALE[i % 10] : FIRST_NAMES_FEMALE[i % 10];
            const lName = LAST_NAMES[i % 10];
            const email = `student_${i}_${Date.now()}@demo.edu`;
            
            const uId = await createUser(client, tenantId, email, roleMap['student']);
            const sRes = await client.query('INSERT INTO school.student (tenant_id, user_id, admission_no, first_name, last_name, gender, religion) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', 
                [tenantId, uId, `ADM-26-${1000+i}`, fName, lName, isMale ? 'male' : 'female', RELIGIONS[i % 5]]);
            const sId = sRes.rows[0].id;

            const cId = classroomIds[i % classroomIds.length];
            await client.query('INSERT INTO school.student_enrollment (tenant_id, academic_year_id, student_id, classroom_id, status) VALUES ($1, $2, $3, $4, $5)', [tenantId, ayId, sId, cId, 'active']);

            // Accounting Sync
            const pRes = await client.query('INSERT INTO accounting.partner (tenant_id, name, type, external_ref_type, external_ref_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [tenantId, `${fName} ${lName}`, 'customer', 'student', sId]);
            const pId = pRes.rows[0].id;

            // Allocation & Invoice
            const sfaRes = await client.query('INSERT INTO school.student_fee_allocation (tenant_id, student_id, fee_structure_id, academic_year_id) VALUES ($1, $2, $3, $4) RETURNING id', [tenantId, sId, fsId, ayId]);
            const sfaId = sfaRes.rows[0].id;

            const invRes = await client.query(`INSERT INTO accounting.invoice (tenant_id, partner_id, invoice_no, total_amount, net_amount, due_amount, status, source_type, source_id) 
                VALUES ($1, $2, $3, 10000, 10000, 10000, 'unpaid', 'fee_group', $4) RETURNING id`, [tenantId, pId, `INV-26-${2000+i}`, sfaId]);
            const invId = invRes.rows[0].id;

            // Invoice Lines (DB Level)
            await client.query(`INSERT INTO accounting.invoice_line (tenant_id, invoice_id, description, quantity, unit_price, amount, ledger_account_id)
                VALUES ($1, $2, 'Tuition Fee - Term 1', 1, 5000, 5000, (SELECT ledger_account_id FROM school.fee_head WHERE id = $3)), 
                       ($1, $2, 'Tuition Fee - Term 2', 1, 5000, 5000, (SELECT ledger_account_id FROM school.fee_head WHERE id = $3))`,
                [tenantId, invId, feeHeadId]);

            await client.query("INSERT INTO school.fee_installment (allocation_id, fee_structure_item_id, invoice_id, amount_due, status, due_date) VALUES ($1, (SELECT id FROM school.fee_structure_item WHERE fee_structure_id = $2 LIMIT 1), $3, 5000, 'UNPAID', CURRENT_DATE)", [sfaId, fsId, invId]);

            // Link parent/guardian (if guardianId exists) to this student
            if (guardianId) {
                await client.query(
                    `INSERT INTO school.student_guardian (tenant_id, student_id, guardian_id, relation, is_emergency)
                     VALUES ($1, $2, $3, 'Father', true)
                     ON CONFLICT (student_id, guardian_id) DO NOTHING`,
                    [tenantId, sId, guardianId]
                );
            }
        }

        // 5.5 Seed Timetable slots for each classroom and its subjects
        console.log('📅 Seeding Timetable slots...');
        for (let i = 1; i <= 5; i++) {
            const classroomId = classroomIds[i - 1];
            const teacherStaffId = teacherStaffIds[i - 1];
            const classSubjects = [
                subjectIds[(i - 1) * 4],
                subjectIds[(i - 1) * 4 + 1],
                subjectIds[(i - 1) * 4 + 2],
                subjectIds[(i - 1) * 4 + 3]
            ];

            // Monday
            await client.query('INSERT INTO school.timetable (tenant_id, classroom_id, subject_id, teacher_id, academic_year_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4, $5, 1, \'09:00\', \'09:45\'), ($1, $2, $6, $4, $5, 1, \'09:45\', \'10:30\')',
                [tenantId, classroomId, classSubjects[0], teacherStaffId, ayId, classSubjects[1]]);

            // Tuesday
            await client.query('INSERT INTO school.timetable (tenant_id, classroom_id, subject_id, teacher_id, academic_year_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4, $5, 2, \'09:00\', \'09:45\'), ($1, $2, $6, $4, $5, 2, \'09:45\', \'10:30\')',
                [tenantId, classroomId, classSubjects[2], teacherStaffId, ayId, classSubjects[3]]);

            // Wednesday
            await client.query('INSERT INTO school.timetable (tenant_id, classroom_id, subject_id, teacher_id, academic_year_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4, $5, 3, \'09:00\', \'09:45\'), ($1, $2, $6, $4, $5, 3, \'09:45\', \'10:30\')',
                [tenantId, classroomId, classSubjects[0], teacherStaffId, ayId, classSubjects[1]]);

            // Thursday
            await client.query('INSERT INTO school.timetable (tenant_id, classroom_id, subject_id, teacher_id, academic_year_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4, $5, 4, \'09:00\', \'09:45\'), ($1, $2, $6, $4, $5, 4, \'09:45\', \'10:30\')',
                [tenantId, classroomId, classSubjects[2], teacherStaffId, ayId, classSubjects[3]]);

            // Friday
            await client.query('INSERT INTO school.timetable (tenant_id, classroom_id, subject_id, teacher_id, academic_year_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4, $5, 5, \'09:00\', \'09:45\'), ($1, $2, $6, $4, $5, 5, \'09:45\', \'10:30\'), ($1, $2, $7, $4, $5, 5, \'10:30\', \'11:15\'), ($1, $2, $8, $4, $5, 5, \'11:15\', \'12:00\')',
                [tenantId, classroomId, classSubjects[0], teacherStaffId, ayId, classSubjects[1], classSubjects[2], classSubjects[3]]);
        }

        // 6. Exams
        console.log('📝 Seeding Mid-Term Results...');
        const exRes = await client.query("INSERT INTO school.exam (tenant_id, academic_year_id, name, exam_type, start_date, end_date, is_published, status) VALUES ($1, $2, 'Mid-Term 2026', 'periodic', CURRENT_DATE, CURRENT_DATE + 7, true, 'published') RETURNING id", [tenantId, ayId]);
        const exId = exRes.rows[0].id;

        // Seed invitations for all classrooms/grades to this exam
        for (let i = 0; i < classroomIds.length; i++) {
            await client.query(
                `INSERT INTO school.exam_invitation (tenant_id, exam_id, grade_id, classroom_id) 
                 VALUES ($1, $2, $3, $4)`,
                [tenantId, exId, gradeIds[i], classroomIds[i]]
            );
        }

        for (let i = 0; i < 3; i++) {
            const paperRes = await client.query("INSERT INTO school.exam_paper (tenant_id, exam_id, subject_id, max_marks, passing_marks, exam_date, start_time, end_time) VALUES ($1, $2, $3, 100, 35, CURRENT_DATE, '09:00', '12:00') RETURNING id", [tenantId, exId, subjectIds[i]]);
            const paperId = paperRes.rows[0].id;

            await client.query(`INSERT INTO school.exam_marks (tenant_id, exam_id, paper_id, student_id, marks_obtained) 
                SELECT $3, $1, $2, id, floor(random() * 50 + 50) FROM school.student WHERE tenant_id = $3`, [exId, paperId, tenantId]);
        }

        await client.query('COMMIT');
        console.log('✅ Seeding Completed Successfully!');
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('❌ Seeding failed:', error);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}
seed();
