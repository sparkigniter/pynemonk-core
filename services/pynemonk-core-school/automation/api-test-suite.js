import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../apps/pynemonk-monolith/.env') });
const AUTH_URL = 'http://localhost:3000/api/v1/auth';
const SCHOOL_URL = 'http://localhost:3000/api/v1/school';
class Reporter {
    constructor() {
        this.results = [];
    }
    log(name, status, error) {
        this.results.push({ name, status, error });
        const icon = status === 'PASS' ? '✅' : '❌';
        console.log(`${icon} ${name}`);
        if (error)
            console.error(`   Error: ${error}`);
    }
    summary() {
        console.log('\n' + '='.repeat(40));
        console.log('🏁 API AUTOMATION EXECUTION SUMMARY');
        console.log('='.repeat(40));
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const total = this.results.length;
        console.log(`Total Scenarios: ${total}`);
        console.log(`Passed:         ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
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
    constructor() {
        this.token = null;
    }
    async request(url, method, body) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token)
            headers['Authorization'] = `Bearer ${this.token}`;
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
            email: 'admin@pynemonk.com',
            password: 'password',
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
        const teacher = await api.request(`${SCHOOL_URL}/staff`, 'POST', {
            first_name: 'Professor',
            last_name: 'Robot',
            email: 'probot@pynemonk.internal',
            role_slug: 'teacher',
            designation: 'Lead Automation Engineer'
        });
        reporter.log('Onboard Teaching Staff', 'PASS');
        // SCENARIO 3: Multi-stage Admission Workflow
        const workflow = await api.request(`${SCHOOL_URL}/admissions/workflow/start`, 'POST', {
            student: {
                first_name: 'Test',
                last_name: 'Subject Alpha',
                gender: 'male',
                date_of_birth: '2015-05-05'
            },
            guardian: {
                first_name: 'Master',
                last_name: 'Guardian',
                relation: 'Father',
                phone: '5551234567'
            }
        });
        reporter.log('Initiate Admission Workflow', 'PASS');
        await api.request(`${SCHOOL_URL}/admissions/workflow/${workflow.id}`, 'PATCH', {
            stage: 'document_verification',
            data: { status: 'verified' }
        });
        reporter.log('Workflow: Document Verification', 'PASS');
        const student = await api.request(`${SCHOOL_URL}/admissions/workflow/${workflow.id}/finalize`, 'POST');
        reporter.log('Workflow: Finalize Admission', 'PASS');
        // SCENARIO 4: Enrollment
        await api.request(`${SCHOOL_URL}/students/${student.id}/enroll`, 'POST', {
            classroom_id: classroom.id,
            academic_year_id: academicYear.id,
            roll_number: 'QA-001'
        });
        reporter.log('Student Classroom Placement', 'PASS');
        // SCENARIO 5: Attendance
        await api.request(`${SCHOOL_URL}/attendance`, 'POST', {
            classroom_id: classroom.id,
            date: new Date().toISOString().split('T')[0],
            records: [
                { student_id: student.id, status: 'present' }
            ]
        });
        reporter.log('Record Daily Attendance', 'PASS');
        // SCENARIO 6: Assessment Lifecycle
        const exam = await api.request(`${SCHOOL_URL}/exams`, 'POST', {
            academic_year_id: academicYear.id,
            name: 'QA Assessment Q1',
            exam_type: 'periodic',
            start_date: '2026-06-01',
            end_date: '2026-06-10'
        });
        reporter.log('Create Examination Schedule', 'PASS');
        const paper = await api.request(`${SCHOOL_URL}/exams/${exam.id}/papers`, 'POST', {
            subject_id: subject.id,
            paper_date: '2026-06-02',
            start_time: '09:00',
            end_time: '12:00',
            max_marks: 100
        });
        reporter.log('Create Exam Paper', 'PASS');
        await api.request(`${SCHOOL_URL}/exams/${exam.id}/papers/${paper.id}/marks`, 'POST', {
            marks: [
                { student_id: student.id, marks_obtained: 95, remarks: 'Excellent performance in automation' }
            ]
        });
        reporter.log('Publish Student Results', 'PASS');
        // SCENARIO 7: System Intelligence Validation
        const metrics = await api.request(`${SCHOOL_URL}/system/metrics`, 'GET');
        if (metrics.studentCount >= 1) {
            reporter.log('Validate System Intelligence Metrics', 'PASS');
        }
        else {
            reporter.log('Validate System Intelligence Metrics', 'FAIL', 'Student count did not update in metrics');
        }
    }
    catch (err) {
        reporter.log('Global Error Handler', 'FAIL', err.message);
    }
    finally {
        reporter.summary();
    }
}
runAutomation();
