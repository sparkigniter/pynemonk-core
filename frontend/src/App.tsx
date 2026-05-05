import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AcademicsProvider } from './contexts/AcademicsContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import StudentList from './pages/students/StudentList';
import StudentProfile from './pages/students/StudentProfile';
import Attendance from './pages/attendance/AttendancePage';
import Teachers from './pages/admin/Teachers';
import Grades from './pages/academics/Grades';
import MyClasses from './pages/academics/MyClasses';
import Finance from './pages/finance/Finance';
import Reports from './pages/admin/Reports';
import Subjects from './pages/academics/Subjects';
import Settings from './pages/admin/Settings';
import Timetable from './pages/academics/Timetable';
import Classrooms from './pages/academics/Classrooms';
import Rollover from './pages/admin/Rollover';
import Exams from './pages/academics/Exams';
import ExamScheduler from './pages/academics/ExamScheduler';
import ExamOverview from './pages/academics/ExamOverview';
import ExamInvitations from './pages/academics/ExamInvitations';
import ExamPapers from './pages/academics/ExamPapers';
import Calendar from './pages/academics/Calendar';
import Courses from './pages/academics/Courses';
import OnboardingPipeline from './pages/onboarding/OnboardingPipeline';
import WorkflowBuilder from './pages/onboarding/WorkflowBuilder';
import StaffRegistration from './pages/admin/StaffRegistration';
import StudentAdmission from './pages/students/StudentAdmission';
import MarksEntry from './pages/academics/MarksEntry';
import TeacherDiary from './pages/academics/TeacherDiary';
import Homework from './pages/academics/Homework';
import HomeworkForm from './pages/academics/HomeworkForm';
import Integrations from './pages/admin/Integrations';
import IAM from './pages/admin/IAM';
import TeacherTimetable from './pages/academics/TeacherTimetable';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected — all app pages live under Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AcademicsProvider>
                <Layout />
              </AcademicsProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<StudentList />} />
          <Route path="students/register" element={<StudentAdmission />} />
          <Route path="students/:id" element={<StudentProfile />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="staff-directory" element={<Teachers />} />
          <Route path="teachers/register" element={<StaffRegistration />} />
          <Route path="grades" element={<Grades />} />
          <Route path="my-classes" element={<MyClasses />} />
          <Route path="my-timetable" element={<TeacherTimetable />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="finance" element={<Finance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="classrooms" element={<Classrooms />} />
          <Route path="courses" element={<Courses />} />
          <Route path="settings" element={<Settings />} />
          <Route path="rollover" element={<Rollover />} />
          <Route path="exams" element={<Exams />} />
          <Route path="exams/new" element={<ExamScheduler />} />
          <Route path="exams/:id/overview" element={<ExamOverview />} />
          <Route path="exams/:id/edit" element={<ExamScheduler />} />
          <Route path="exams/:id/papers" element={<ExamPapers />} />
          <Route path="exams/:id/invitations" element={<ExamInvitations />} />
          <Route path="exams/:id/papers/:paperId/marks" element={<MarksEntry />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="onboarding" element={<OnboardingPipeline />} />
          <Route path="onboarding/students" element={<OnboardingPipeline type="Student" />} />
          <Route path="onboarding/teachers" element={<OnboardingPipeline type="Teacher" />} />
          <Route path="workflow-builder" element={<WorkflowBuilder />} />
          <Route path="teacher-diary" element={<TeacherDiary />} />
          <Route path="homework" element={<Homework />} />
          <Route path="homework/new" element={<HomeworkForm />} />
          <Route path="homework/:id/edit" element={<HomeworkForm />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="iam" element={<IAM />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router >
  );
}