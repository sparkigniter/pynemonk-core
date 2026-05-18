import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import StudentList from './pages/students/StudentList';
import StudentProfile from './pages/students/StudentProfile';
import StudentAdmission from './pages/students/StudentAdmission';
import AttendancePage from './pages/attendance/AttendancePage';
import Settings from './pages/admin/Settings';
import Layout from './components/layout/Layout';
import SchoolSelection from './pages/auth/Login'; // Redirecting to Login as it handles selection
import Exams from './pages/academics/Exams';
import ExamOverview from './pages/academics/ExamOverview';
import Faculty from './pages/admin/Teachers';
import StaffRegistration from './pages/admin/StaffRegistration';
import Timetable from './pages/academics/Timetable';
import LeaveApprovals from './pages/admin/LeaveApprovals';
import LeaveManagement from './pages/teachers/LeaveManagement';
import AdminMetrics from './pages/admin/AdminMetrics';
import LogViewer from './pages/admin/LogViewer';
import AdminFinance from './pages/admin/AdminFinance';
import BulkFeeAllocation from './pages/finance/BulkFeeAllocation';
import ReportCardView from './pages/academics/ReportCardView';
import StudentTimetable from './pages/academics/StudentTimetable';
import LMSLibrary from './pages/lms/LMSLibrary';
import AcademicPlanner from './pages/academics/AcademicPlanner';
import SettingsHub from './pages/settings/SettingsHub';
import TemplateDesigner from './pages/students/TemplateDesigner';
import ExamScheduler from './pages/academics/ExamScheduler';
import ExamPapers from './pages/academics/ExamPapers';
import ExamInvitations from './pages/academics/ExamInvitations';
import ExamResults from './pages/academics/ExamResults';
import MyClasses from './pages/academics/MyClasses';
import TeacherTimetable from './pages/academics/TeacherTimetable';
import Grades from './pages/academics/Grades';
import Subjects from './pages/academics/Subjects';
import Courses from './pages/academics/Courses';
import Classrooms from './pages/academics/Classrooms';
import TeacherDiary from './pages/academics/TeacherDiary';
import Homework from './pages/academics/Homework';
import Reports from './pages/admin/Reports';
import Integrations from './pages/admin/Integrations';
import IAM from './pages/admin/IAM';
import Rollover from './pages/admin/Rollover';
import WorkflowBuilder from './pages/onboarding/WorkflowBuilder';
import SchoolCalendar from './pages/academics/Calendar';
import NoticeBoard from './pages/academics/NoticeBoard';
import Communications from './pages/academics/Communications';

import { useAuth } from './contexts/AuthContext';

// Accounting Imports
import AccountingHub from './pages/accounting/AccountingHub';
import AccountsReceivable from './pages/accounting/AccountsReceivable';
import AccountsPayable from './pages/accounting/AccountsPayable';
import BillEntryForm from './pages/accounting/BillEntryForm';
import BillPaymentForm from './pages/accounting/BillPaymentForm';
import BillDetail from './pages/accounting/BillDetail';
import VendorForm from './pages/accounting/VendorForm';
import Banking from './pages/accounting/Banking';
import ChartOfAccounts from './pages/accounting/ChartOfAccounts';
import JournalEntries from './pages/accounting/JournalEntries';
import FinancialReports from './pages/accounting/FinancialReports';
import ReportsLayout from './pages/accounting/ReportsLayout';
import FinancialAnalytics from './pages/accounting/FinancialAnalytics';
import ReportDesignerHub from './pages/accounting/ReportDesignerHub';
import TrialBalance from './pages/accounting/TrialBalance';
import ProfitAndLoss from './pages/accounting/ProfitAndLoss';
import BalanceSheet from './pages/accounting/BalanceSheet';
import CashFlow from './pages/accounting/CashFlow';
import AgingReport from './pages/accounting/AgingReport';
import AccountingSettings from './pages/accounting/AccountingSettings';
import CreateInvoice from './pages/accounting/CreateInvoice';
import InvoiceDetail from './pages/accounting/InvoiceDetail';
import Payroll from './pages/accounting/Payroll';
import ReportTemplateDesigner from './pages/accounting/ReportTemplateDesigner';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
        <Route path="/school-selection" element={<ProtectedRoute><SchoolSelection /></ProtectedRoute>} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<StudentList />} />
          <Route path="students/register" element={<StudentAdmission />} />
          <Route path="students/:id" element={<StudentProfile />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="exams" element={<Exams />} />
          <Route path="exams/new" element={<ExamScheduler />} />
          <Route path="exams/:id/edit" element={<ExamScheduler />} />
          <Route path="exams/:id" element={<ExamOverview />} />
          <Route path="exams/:id/results" element={<ExamResults />} />
          <Route path="exams/:id/papers" element={<ExamPapers />} />
          <Route path="exams/:id/invitations" element={<ExamInvitations />} />
          <Route path="exams/:id/overview" element={<ExamOverview />} />
          <Route path="faculty" element={<Faculty />} />
          <Route path="teachers" element={<Faculty />} />
          <Route path="teachers/register" element={<StaffRegistration />} />
          <Route path="teachers/edit/:id" element={<StaffRegistration />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="calendar" element={<SchoolCalendar />} />
          <Route path="my-classes" element={<MyClasses />} />
          <Route path="my-timetable" element={<TeacherTimetable />} />
          <Route path="grades" element={<Grades />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="courses" element={<Courses />} />
          <Route path="classrooms" element={<Classrooms />} />
          <Route path="teacher-diary" element={<TeacherDiary />} />
          <Route path="homework" element={<Homework />} />
          <Route path="notice-board" element={<NoticeBoard />} />
          <Route path="communications" element={<Communications />} />
          <Route path="reports" element={<Reports />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="iam" element={<IAM />} />
          <Route path="rollover" element={<Rollover />} />
          <Route path="workflow-builder" element={<WorkflowBuilder />} />
          <Route path="leaves/apply" element={<LeaveManagement />} />
          <Route path="admin/leaves" element={<LeaveApprovals />} />
          <Route path="admin/metrics" element={<AdminMetrics />} />
          <Route path="admin/logs" element={<LogViewer />} />
          <Route path="fee-management" element={<AdminFinance />} />
          <Route path="bulk-fee-allocation" element={<BulkFeeAllocation />} />
          <Route path="onboarding/students" element={<StudentAdmission />} />
          <Route path="onboarding/teachers" element={<Faculty />} />
          <Route path="admin/finance" element={<Navigate to="/fee-management" replace />} />
          <Route path="exams/:examId/students/:studentId/report" element={<ReportCardView />} />
          <Route path="student/timetable" element={<StudentTimetable />} />
          <Route path="lms/library" element={<LMSLibrary />} />
          <Route path="academic-planner" element={<AcademicPlanner />} />
          <Route path="admin/settings" element={<SettingsHub />} />
          <Route path="students/designer/:studentId" element={<TemplateDesigner />} />
          
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
          
          <Route path="accounting/reports" element={<ReportsLayout />}>
            <Route index element={<FinancialReports />} />
            <Route path="analytics" element={<FinancialAnalytics />} />
            <Route path="templates" element={<ReportDesignerHub />} />
          </Route>

          <Route path="accounting/reports/trial-balance" element={<TrialBalance />} />
          <Route path="accounting/reports/profit-loss" element={<ProfitAndLoss />} />
          <Route path="accounting/reports/balance-sheet" element={<BalanceSheet />} />
          <Route path="accounting/reports/cash-flow" element={<CashFlow />} />
          <Route path="accounting/reports/aging" element={<AgingReport />} />
          <Route path="accounting/reports/designer" element={<ReportTemplateDesigner />} />
          <Route path="accounting/reports/fee-aging-report" element={<AgingReport />} />
          <Route path="accounting/reports/defaulter-list" element={<AgingReport />} />
          <Route path="accounting/reports/class-collection" element={<AgingReport />} />
          <Route path="accounting/reports/vendor-aging" element={<AgingReport />} />
          <Route path="accounting/settings" element={<AccountingSettings />} />
          <Route path="accounting/invoices/new" element={<CreateInvoice />} />
          <Route path="accounting/invoices/:id" element={<InvoiceDetail />} />
          <Route path="accounting/payroll" element={<Payroll />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router >
  );
}