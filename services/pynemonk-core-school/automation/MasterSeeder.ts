import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../apps/pynemonk-monolith/.env') });

const AUTH_URL = 'http://localhost:3000/api/v1/auth';
const SCHOOL_URL = 'http://localhost:3000/api/v1/school';

class ERPSeeder {
    token: string | null = null;
    tenantId: number | null = null;

    async request(url: string, method: string, body?: any, headers: any = {}) {
        const fullHeaders: any = { 
            'Content-Type': 'application/json',
            ...headers
        };
        if (this.token) fullHeaders['Authorization'] = `Bearer ${this.token}`;

        const response = await fetch(url, {
            method,
            headers: fullHeaders,
            body: body ? JSON.stringify(body) : undefined
        });

        const data = await response.json();
        if (!response.ok) throw new Error(`${method} ${url} failed: ` + (data.message || response.statusText));
        return data.data || data;
    }

    async login(email = 'admin@demo.edu', password = 'password123') {
        const data = await this.request(`${AUTH_URL}/login`, 'POST', {
            email,
            password,
            client_id: 'frontend_client',
            client_secret: 'frontend_secret',
            grant_type: 'password'
        });
        this.token = data.access_token;
        console.log(`🔑 Logged in as ${email}`);
        return data;
    }

    async seed() {
        console.log('🚀 Starting Perfect ERP Lifecycle Seeding...');

        try {
            await this.login();

            // 1. Foundation: Academic Year 2026-27
            const academicYear = await this.request(`${SCHOOL_URL}/academics/years`, 'POST', {
                name: 'AY 2026-27',
                start_date: '2026-06-01',
                end_date: '2027-05-31',
                is_current: true
            });
            console.log('✅ Created Academic Year: AY 2026-27');

            // 2. Grades & Subjects
            const gradeNames = ['Grade 1', 'Grade 2', 'Grade 3'];
            const grades: any[] = [];
            for (const name of gradeNames) {
                const g = await this.request(`${SCHOOL_URL}/grades`, 'POST', { name, slug: name.toLowerCase().replace(' ', '-'), sequence_order: grades.length + 1 });
                grades.push(g);
                
                // Add core subjects to each grade
                const subjects = ['Mathematics', 'Science', 'English Literature'];
                for (const sub of subjects) {
                    await this.request(`${SCHOOL_URL}/subjects`, 'POST', {
                        grade_id: g.id,
                        name: sub,
                        code: `${sub.slice(0, 3).toUpperCase()}-${g.id}`
                    });
                }
            }
            console.log('✅ Created 3 Grades with core subjects.');

            // 3. Classrooms
            const classrooms: any[] = [];
            for (const g of grades) {
                const c = await this.request(`${SCHOOL_URL}/classrooms`, 'POST', {
                    academic_year_id: academicYear.id,
                    grade_id: g.id,
                    section: 'A',
                    name: `${g.name} - Section A`
                });
                classrooms.push(c);
            }
            console.log('✅ Created Classrooms for each grade.');

            // 4. Finance Setup
            const tuitionHead = await this.request(`${SCHOOL_URL}/finance/heads`, 'POST', {
                name: 'Tuition Fee',
                code: 'FEE-TUI',
                is_refundable: false
            });
            const transportHead = await this.request(`${SCHOOL_URL}/finance/heads`, 'POST', {
                name: 'Transport Fee',
                code: 'FEE-TRA',
                is_refundable: false
            });

            const structure = await this.request(`${SCHOOL_URL}/finance/structures`, 'POST', {
                name: 'Standard Annual Plan (Grade 1-3)',
                total_amount: 15000,
                items: [
                    { fee_head_id: tuitionHead.id, amount: 5000, due_date: '2026-06-15', installment_name: 'Quarter 1' },
                    { fee_head_id: tuitionHead.id, amount: 5000, due_date: '2026-09-15', installment_name: 'Quarter 2' },
                    { fee_head_id: transportHead.id, amount: 5000, due_date: '2026-06-15', installment_name: 'Annual Transport' }
                ]
            }, { 'x-academic-year-id': academicYear.id.toString() });
            console.log('✅ Configured Financial Structures.');

            // 5. Admissions & Enrollment
            console.log('⚡ Bulk Admitting Students...');
            for (let i = 1; i <= 6; i++) {
                const workflow = await this.request(`${SCHOOL_URL}/admissions/workflow/start`, 'POST', {
                    first_name: `Student`,
                    last_name: `${i}`,
                    gender: i % 2 === 0 ? 'female' : 'male',
                    date_of_birth: '2018-10-10'
                });
                
                await this.request(`${SCHOOL_URL}/admissions/workflow/${workflow.id}`, 'PATCH', {
                    stage: 'guardian',
                    data: { first_name: 'Parent', last_name: `${i}`, relation: 'Father', phone: `555100${i}` },
                    next_stage: 'documents'
                });

                const student = await this.request(`${SCHOOL_URL}/admissions/workflow/${workflow.id}/finalize`, 'POST');
                
                // Enroll in grade/classroom (Grade 1 for all in this demo)
                const targetClass = classrooms[0]; 
                await this.request(`${SCHOOL_URL}/students/${student.student_id}/enroll`, 'POST', {
                    classroom_id: targetClass.id,
                    academic_year_id: academicYear.id,
                    roll_number: `R-2026-00${i}`
                });

                // Allocate Fees
                await this.request(`${SCHOOL_URL}/finance/allocate`, 'POST', {
                    student_id: student.student_id,
                    fee_structure_id: structure.id
                }, { 'x-academic-year-id': academicYear.id.toString() });
            }
            console.log('✅ Admitted, Enrolled & Invoiced 6 Students.');

            // 6. LMS Resources
            await this.request(`${SCHOOL_URL}/homework/lms/library`, 'POST', {
                title: 'Institutional Syllabus 2026',
                description: 'Complete academic roadmap for the session.',
                resource_type: 'pdf',
                url: 'https://pynemonk.com/syllabus.pdf',
                tags: ['syllabus', 'official']
            });
            await this.request(`${SCHOOL_URL}/homework/lms/library`, 'POST', {
                title: 'Introduction to Pynemonk LMS',
                description: 'A video guide for students to use the hub.',
                resource_type: 'video',
                url: 'https://youtube.com/watch?v=demo',
                tags: ['tutorial']
            });
            console.log('✅ Seeded LMS Knowledge Hub.');

            // 7. Exams & Evaluations
            const midTerm = await this.request(`${SCHOOL_URL}/exams`, 'POST', {
                academic_year_id: academicYear.id,
                name: 'Mid-Term Assessment Q1',
                exam_type: 'quarterly',
                start_date: '2026-08-01',
                end_date: '2026-08-15',
                invitations: [{ grade_id: grades[0].id, classroom_id: classrooms[0].id }]
            });

            console.log('🏁 ERP Lifecycle Seeding Complete.');

        } catch (err: any) {
            console.error('❌ Seeding Failed:', err.message);
            throw err;
        }
    }
}

new ERPSeeder().seed();
