import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../apps/pynemonk-monolith/.env') });

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: 'localhost',
    database: process.env.PGDATABASE || 'pynemonk_core',
    password: process.env.PGPASSWORD || 'password',
    port: parseInt(process.env.PGPORT || '5432'),
});

const FIRST_NAMES = ['Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Sai', 'Ananya', 'Diya', 'Pari', 'Saanvi', 'Ishaan'];
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Iyer'];

async function seed() {
    const tenantId = 1;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('🚀 Starting Comprehensive Seeding...');

        // 1. Cleanup
        console.log('🧹 Cleaning up old data...');
        await client.query('TRUNCATE school.academic_year, school.student, school.staff, school.classroom, school.grade, school.subject, school.student_enrollment, school.fee_installment, school.student_fee_allocation, school.exam, school.exam_paper, school.exam_marks, accounting.invoice, accounting.invoice_line, accounting.journal_entry, accounting.journal_item, accounting.partner CASCADE');

        // 2. Academic Year
        const ayRes = await client.query("INSERT INTO school.academic_year (tenant_id, name, start_date, end_date, is_current) VALUES ($1, '2026-27', '2026-04-01', '2027-03-31', true) RETURNING id", [tenantId]);
        const ayId = ayRes.rows[0].id;

        // 3. Grades & Classrooms (Grade 1 to 5 for speed)
        console.log('🏫 Creating Grades & Classrooms...');
        const gradeIds = [];
        const classroomIds = [];
        for (let i = 1; i <= 5; i++) {
            const gRes = await client.query('INSERT INTO school.grade (tenant_id, name, slug, sequence_order) VALUES ($1, $2, $3, $4) RETURNING id', [tenantId, `Grade ${i}`, `grade-${i}`, i]);
            const gId = gRes.rows[0].id;
            gradeIds.push(gId);
            
            const cRes = await client.query('INSERT INTO school.classroom (tenant_id, academic_year_id, grade_id, name, section) VALUES ($1, $2, $3, $4, $5) RETURNING id', [tenantId, ayId, gId, `Class ${i}-A`, 'A']);
            classroomIds.push(cRes.rows[0].id);
            
            // Subjects
            await client.query('INSERT INTO school.subject (tenant_id, grade_id, name, code) VALUES ($1, $2, $3, $4)', [tenantId, gId, 'Mathematics', `MATH-${i}`]);
            await client.query('INSERT INTO school.subject (tenant_id, grade_id, name, code) VALUES ($1, $2, $3, $4)', [tenantId, gId, 'English', `ENG-${i}`]);
        }

        // 4. Fee Structures
        console.log('💰 Setting up Fee Structures...');
        const feeHeadRes = await client.query("INSERT INTO school.fee_head (tenant_id, name, ledger_account_id) VALUES ($1, 'Tuition Fee', (SELECT id FROM accounting.chart_of_accounts WHERE code = '400000' LIMIT 1)) RETURNING id", [tenantId]);
        const feeHeadId = feeHeadRes.rows[0].id;

        const fsRes = await client.query("INSERT INTO school.fee_structure (tenant_id, academic_year_id, name) VALUES ($1, $2, 'Annual Fee Structure') RETURNING id", [tenantId, ayId]);
        const fsId = fsRes.rows[0].id;

        await client.query("INSERT INTO school.fee_structure_item (fee_structure_id, fee_head_id, amount, installment_name) VALUES ($1, $2, 5000, 'Term 1'), ($1, $2, 5000, 'Term 2')", [fsId, feeHeadId]);

        // 5. Students (50 Students for demo)
        console.log('👶 Enrolling 50 Students & Generating Invoices...');
        const roleRes = await client.query("SELECT id FROM auth.role WHERE slug = 'student' LIMIT 1");
        const studentRoleId = roleRes.rows[0]?.id || 1;

        for (let i = 1; i <= 50; i++) {
            const fName = FIRST_NAMES[i % FIRST_NAMES.length];
            const lName = LAST_NAMES[i % LAST_NAMES.length];
            const email = `demo_student_${i}_${Date.now()}@luvia.edu`;
            
            // Create User
            const userRes = await client.query('INSERT INTO auth.user (tenant_id, email, role_id) VALUES ($1, $2, $3) RETURNING id',
                [tenantId, email, studentRoleId]);
            const sUserId = userRes.rows[0].id;

            const sRes = await client.query('INSERT INTO school.student (tenant_id, user_id, admission_no, first_name, last_name, gender) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', 
                [tenantId, sUserId, `ADM-2026-${1000+i}`, fName, lName, i % 2 === 0 ? 'male' : 'female']);
            const sId = sRes.rows[0].id;

            const cId = classroomIds[i % classroomIds.length];
            await client.query('INSERT INTO school.student_enrollment (tenant_id, academic_year_id, student_id, classroom_id, status) VALUES ($1, $2, $3, $4, $5)', 
                [tenantId, ayId, sId, cId, 'active']);

            // Resolve Partner
            const partnerRes = await client.query('INSERT INTO accounting.partner (tenant_id, name, type, external_ref_type, external_ref_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [tenantId, `${fName} ${lName}`, 'customer', 'student', sId]);
            const partnerId = partnerRes.rows[0].id;

            // Allocate Fee
            const sfaRes = await client.query('INSERT INTO school.student_fee_allocation (tenant_id, student_id, fee_structure_id, academic_year_id) VALUES ($1, $2, $3, $4) RETURNING id', 
                [tenantId, sId, fsId, ayId]);
            const sfaId = sfaRes.rows[0].id;

            // Create Invoice
            const invNo = `INV-2026-${2000+i}`;
            const invRes = await client.query(`INSERT INTO accounting.invoice (tenant_id, partner_id, invoice_no, total_amount, net_amount, due_amount, status, source_type, source_id) 
                VALUES ($1, $2, $3, 10000, 10000, 10000, 'unpaid', 'fee_group', $4) RETURNING id`, 
                [tenantId, partnerId, invNo, sfaId]);
            const invId = invRes.rows[0].id;

            // Installments
            await client.query("INSERT INTO school.fee_installment (allocation_id, fee_structure_item_id, invoice_id, amount_due, status, due_date) VALUES ($1, (SELECT id FROM school.fee_structure_item WHERE fee_structure_id = $2 LIMIT 1), $3, 5000, 'UNPAID', CURRENT_DATE)", [sfaId, fsId, invId]);
        }

        // 6. Exams & Marks
        console.log('📝 Seeding Exam Results...');
        const examRes = await client.query("INSERT INTO school.exam (tenant_id, academic_year_id, name, type, status) VALUES ($1, $2, 'Mid-Term 2026', 'internal', 'published') RETURNING id", [tenantId, ayId]);
        const examId = examRes.rows[0].id;

        const paperRes = await client.query("INSERT INTO school.exam_paper (tenant_id, exam_id, subject_id, max_marks, pass_marks) VALUES ($1, $2, (SELECT id FROM school.subject LIMIT 1), 100, 35) RETURNING id", [tenantId, examId]);
        const paperId = paperRes.rows[0].id;

        await client.query(`INSERT INTO school.exam_marks (tenant_id, paper_id, student_id, marks_obtained, status) 
            SELECT 1, $1, id, floor(random() * 60 + 40), 'recorded' FROM school.student`, [paperId]);

        await client.query('COMMIT');
        console.log('✅ Comprehensive Seeding Success!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Seeding failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}
seed();
