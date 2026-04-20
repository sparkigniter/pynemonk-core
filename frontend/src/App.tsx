import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import StudentProfile from './pages/StudentProfile';
import Attendance from './pages/Attendance';
import Teachers from './pages/Teachers';
import Grades from './pages/Grades';
import Courses from './pages/Courses';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

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
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<StudentList />} />
          <Route path="students/:id" element={<StudentProfile />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="grades" element={<Grades />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="courses" element={<Courses />} />
          <Route path="finance" element={<Finance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router >
  );
}