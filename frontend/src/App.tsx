import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AcademicsProvider } from './contexts/AcademicsContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import StudentList from './pages/students/StudentList';
import StudentProfile from './pages/students/StudentProfile';
import Attendance from './pages/students/Attendance';
import Teachers from './pages/admin/Teachers';
import Grades from './pages/academics/Grades';
import Finance from './pages/finance/Finance';
import Reports from './pages/admin/Reports';
import Subjects from './pages/academics/Subjects';
import Settings from './pages/admin/Settings';
import Timetable from './pages/academics/Timetable';
import Classrooms from './pages/academics/Classrooms';
import Rollover from './pages/admin/Rollover';
import Exams from './pages/academics/Exams';
import Calendar from './pages/academics/Calendar';
import Courses from './pages/academics/Courses';
import OnboardingPipeline from './pages/onboarding/OnboardingPipeline';
import WorkflowBuilder from './pages/onboarding/WorkflowBuilder';
import StaffRegistration from './pages/admin/StaffRegistration';
import StudentAdmission from './pages/students/StudentAdmission';
import MarksEntry from './pages/academics/MarksEntry';

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
          <Route path="teachers/register" element={<StaffRegistration />} />
          <Route path="grades" element={<Grades />} />
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
          <Route path="exams/:id/papers/:paperId/marks" element={<MarksEntry />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="onboarding" element={<OnboardingPipeline />} />
          <Route path="onboarding/students" element={<OnboardingPipeline type="Student" />} />
          <Route path="onboarding/teachers" element={<OnboardingPipeline type="Teacher" />} />
          <Route path="workflow-builder" element={<WorkflowBuilder />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router >
  );
}