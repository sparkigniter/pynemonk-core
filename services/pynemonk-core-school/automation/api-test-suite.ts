import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../apps/pynemonk-monolith/.env') });

const AUTH_URL = 'http://localhost:3000/api/v1/auth';
const SCHOOL_URL = 'http://localhost:3000/api/v1/school';

class Reporter {
    results: { name: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

    log(name: string, status: 'PASS' | 'FAIL', error?: string) {
        this.results.push({ name, status, error });
        const icon = status === 'PASS' ? '✅' : '❌';
        console.log(`${icon} ${name}`);
        if (error) console.error(`   Error: ${error}`);
    }

    summary() {
        console.log('\n' + '='.repeat(40));
        console.log('🏁 API AUTOMATION EXECUTION SUMMARY');
        console.log('='.repeat(40));
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const total = this.results.length;

        console.log(`Total Scenarios: ${total}`);
        console.log(`Passed:         ${passed} (${((passed/total)*100).toFixed(1)}%)`);
        console.log(`Failed:         ${failed}`);
        console.log('='.repeat(40));
        
        if (failed > 0) {
            console.log('\nFailures Detail:');
            this.results.filter(r => r.status === 'FAIL').forEach(r => {
                console.log(`- ${r.name}: ${r.error}`);
            });
        }
    }
}

class ApiClient {
    token: string | null = null;

    async request(url: string, method: string, body?: any) {
        const headers: any = { 'Content-Type': 'application/json' };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || response.statusText);
        }
        return data.data || data;
    }

    async login() {
        const data = await this.request(`${AUTH_URL}/login`, 'POST', {
            email: 'admin@demo.edu',
            password: 'password123',
            client_id: 'frontend_client',
            client_secret: 'frontend_secret',
            grant_type: 'password'
        });
        this.token = data.access_token;
        return data;
    }
}

async function runAutomation() {
    const reporter = new Reporter();
    const api = new ApiClient();
    
    console.log('🚀 Initializing API Automation Suite...');

    try {
        // SCENARIO 0: Authentication
        await api.login();
        reporter.log('Authentication (Super Admin)', 'PASS');

        // SCENARIO 1: Academic Structure
        const academicYear = await api.request(`${SCHOOL_URL}/academics/years`, 'POST', {
            name: 'QA_YEAR_2026',
            start_date: '2026-01-01',
            end_date: '2026-12-31',
            is_current: true
        });
        reporter.log('Create Academic Year', 'PASS');

        const grade = await api.request(`${SCHOOL_URL}/grades`, 'POST', {
            name: 'Senior QA Grade',
            slug: 'qa-grade-1',
            sequence_order: 1
        });
        reporter.log('Create Grade', 'PASS');

        const subject = await api.request(`${SCHOOL_URL}/subjects`, 'POST', {
            grade_id: grade.id,
            name: 'Automated Testing 101',
            code: 'QA-101'
        });
        reporter.log('Create Subject', 'PASS');

        const classroom = await api.request(`${SCHOOL_URL}/classrooms`, 'POST', {
            academic_year_id: academicYear.id,
            grade_id: grade.id,
            section: 'QA',
            name: 'QA Lab Alpha'
        });
        reporter.log('Create Classroom', 'PASS');

        // SCENARIO 2: HR & Staff
        const timestamp = Date.now();
        const teacherEmail = `teacher_${timestamp}@pynemonk.com`;
        const teacher = await api.request(`${SCHOOL_URL}/staff`, 'POST', {
            first_name: 'Professor',
            last_name: 'Robot',
            email: teacherEmail,
            password: 'password123',
            role_slug: 'teacher',
            designation: 'Lead Automation Engineer'
        });
        reporter.log('Onboard Teaching Staff', 'PASS');

        // Properly assign teacher to classroom/subject for scope resolution
        await api.request(`${SCHOOL_URL}/subjects/assign-teacher`, 'POST', {
            staff_id: teacher.id,
            classroom_id: classroom.id,
            subject_id: subject.id,
            academic_year_id: academicYear.id
        });

        // Also set as Class Teacher to satisfy "Only designated Class Teacher" error
        await api.request(`${SCHOOL_URL}/classrooms/${classroom.id}`, 'PUT', {
            class_teacher_id: teacher.id
        });

        // SCENARIO 3: Multi-stage Admission Workflow
        const workflow = await api.request(`${SCHOOL_URL}/admissions/workflow/start`, 'POST', {
            first_name: 'Test',
            last_name: 'Subject Alpha',
            gender: 'male',
            date_of_birth: '2015-05-05'
        });
        reporter.log('Initiate Admission Workflow', 'PASS');

        await api.request(`${SCHOOL_URL}/admissions/workflow/${workflow.id}`, 'PATCH', {
            stage: 'guardian',
            data: {
                first_name: 'Master',
                last_name: 'Guardian',
                relation: 'Father',
                phone: '5551234567'
            },
            next_stage: 'documents'
        });

        await api.request(`${SCHOOL_URL}/admissions/workflow/${workflow.id}`, 'PATCH', {
            stage: 'documents',
            data: { birth_certificate: 'verified' }
        });
        reporter.log('Workflow: Document Verification', 'PASS');

        const student = await api.request(`${SCHOOL_URL}/admissions/workflow/${workflow.id}/finalize`, 'POST');
        reporter.log('Workflow: Finalize Admission', 'PASS');

        // SCENARIO 4: Enrollment
        await api.request(`${SCHOOL_URL}/students/${student.student_id}/enroll`, 'POST', {
            classroom_id: classroom.id,
            academic_year_id: academicYear.id,
            roll_number: 'QA-001'
        });
        reporter.log('Student Classroom Placement', 'PASS');

        // Login as Teacher to record attendance
        const adminToken = api.token;
        await api.request(`${AUTH_URL}/login`, 'POST', {
            email: teacherEmail,
            password: 'password123',
            client_id: 'frontend_client',
            client_secret: 'frontend_secret',
            grant_type: 'password'
        }).then(data => api.token = data.access_token);

        // SCENARIO 5: Attendance
        await api.request(`${SCHOOL_URL}/attendance`, 'POST', {
            classroom_id: classroom.id,
            date: new Date().toISOString().split('T')[0],
            records: [
                { student_id: student.student_id, status: 'present' }
            ]
        });
        reporter.log('Record Daily Attendance', 'PASS');

        // Restore admin token for next scenarios if needed
        api.token = adminToken;

        // Use teacher token for marks
        api.token = adminToken; // Restore admin to create exam/paper
        const exam = await api.request(`${SCHOOL_URL}/exams`, 'POST', {
            academic_year_id: academicYear.id,
            name: 'QA Assessment Q1',
            exam_type: 'periodic',
            start_date: '2026-06-01',
            end_date: '2026-06-10',
            invitations: [
                { grade_id: grade.id, classroom_id: classroom.id }
            ]
        });
        reporter.log('Create Examination Schedule', 'PASS');

        const paper = await api.request(`${SCHOOL_URL}/exams/${exam.id}/papers`, 'POST', {
            subject_id: subject.id,
            exam_date: '2026-06-02',
            start_time: '09:00',
            end_time: '12:00',
            max_marks: 100,
            passing_marks: 33
        });
        reporter.log('Create Exam Paper', 'PASS');

        // Switch back to teacher for marks
        // Wait 1.1s to ensure a unique iat (Issued At) timestamp for the refresh token JWT
        await new Promise(resolve => setTimeout(resolve, 1100));
        
        await api.request(`${AUTH_URL}/login`, 'POST', {
            email: teacherEmail,
            password: 'password123',
            client_id: 'frontend_client',
            client_secret: 'frontend_secret',
            grant_type: 'password'
        }).then(data => api.token = data.access_token);
        reporter.log('Login as Teacher (Assessment)', 'PASS');

        await api.request(`${SCHOOL_URL}/exams/${exam.id}/papers/${paper.id}/marks`, 'POST', [
            { student_id: student.student_id, marks_obtained: 95, is_absent: false, remarks: 'Excellent performance in automation' }
        ]);
        reporter.log('Publish Student Results', 'PASS');

        // Restore admin token for system metrics
        api.token = adminToken;

        // Login as Super Admin for system metrics
        await new Promise(resolve => setTimeout(resolve, 1100));
        await api.request(`${AUTH_URL}/login`, 'POST', {
            email: 'vikas@sparkigniter.com',
            password: 'password123',
            client_id: 'frontend_client',
            client_secret: 'frontend_secret',
            grant_type: 'password'
        }).then(data => api.token = data.access_token);

        // SCENARIO 7: System Intelligence Validation
        const metrics = await api.request(`${SCHOOL_URL}/system/metrics`, 'GET');
        if (metrics.totalStudents >= 1) {
            reporter.log('Validate System Intelligence Metrics', 'PASS');
        } else {
            reporter.log('Validate System Intelligence Metrics', 'FAIL', 'Student count did not update in metrics');
        }

    } catch (err: any) {
        reporter.log('Global Error Handler', 'FAIL', err.message);
    } finally {
        reporter.summary();
    }
}

runAutomation();
