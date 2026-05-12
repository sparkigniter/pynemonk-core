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
import StudentPlacement from './pages/students/StudentPlacement';
import MarksEntry from './pages/academics/MarksEntry';
import TeacherDiary from './pages/academics/TeacherDiary';
import Homework from './pages/academics/Homework';
import HomeworkForm from './pages/academics/HomeworkForm';
import Integrations from './pages/admin/Integrations';
import IAM from './pages/admin/IAM';
import TeacherTimetable from './pages/academics/TeacherTimetable';
import ExamResults from './pages/academics/ExamResults';
import ChartOfAccounts from './pages/accounting/ChartOfAccounts';
import JournalEntries from './pages/accounting/JournalEntries';
import FinancialReports from './pages/accounting/FinancialReports';
import AccountingHub from './pages/accounting/AccountingHub';
import AccountsReceivable from './pages/accounting/AccountsReceivable';
import AccountsPayable from './pages/accounting/AccountsPayable';
import Banking from './pages/accounting/Banking';
import AccountingSettings from './pages/accounting/AccountingSettings';
import BillEntryForm from './pages/accounting/BillEntryForm';
import BillPaymentForm from './pages/accounting/BillPaymentForm';
import BillDetail from './pages/accounting/BillDetail';
import VendorForm from './pages/accounting/VendorForm';
import TrialBalance from './pages/accounting/TrialBalance';
import ProfitAndLoss from './pages/accounting/ProfitAndLoss';
import CreateInvoice from './pages/accounting/CreateInvoice';
import { useAuth } from './contexts/AuthContext';

const HomeRedirect = () => {
  const { user, can } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  // Role-based redirection
  if (user.roles.includes('accountant') || can('accounting:read')) {
    return <Navigate to="/accounting/hub" replace />;
  }
  
  if (user.roles.includes('teacher')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

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
          <Route index element={<HomeRedirect />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<StudentList />} />
          <Route path="students/register" element={<StudentAdmission />} />
          <Route path="students/placement" element={<StudentPlacement />} />
          <Route path="students/:id" element={<StudentProfile />} />
          <Route path="teachers" element={<Teachers />} />
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
          <Route path="exams/:id/results" element={<ExamResults />} />
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
          
          {/* Accounting Module */}
          <Route path="accounting/hub" element={<AccountingHub />} />
          <Route path="accounting/ar" element={<AccountsReceivable />} />
          <Route path="accounting/ap" element={<AccountsPayable />} />
          <Route path="accounting/ap/new-bill" element={<BillEntryForm />} />
          <Route path="accounting/ap/pay-bill" element={<BillPaymentForm />} />
          <Route path="accounting/ap/bills/:id" element={<BillDetail />} />
          <Route path="accounting/ap/vendors/new" element={<VendorForm />} />
          <Route path="accounting/ap/vendors/:id/edit" element={<VendorForm />} />
          <Route path="accounting/banking" element={<Banking />} />
          <Route path="accounting/coa" element={<ChartOfAccounts />} />
          <Route path="accounting/journals" element={<JournalEntries />} />
          <Route path="accounting/reports" element={<FinancialReports />} />
          <Route path="accounting/reports/trial-balance" element={<TrialBalance />} />
          <Route path="accounting/reports/profit-loss" element={<ProfitAndLoss />} />
          <Route path="accounting/settings" element={<AccountingSettings />} />
          <Route path="accounting/invoices/new" element={<CreateInvoice />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router >
  );
}