import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import Schools from './pages/Schools';
import OAuthClients from './pages/OAuthClients';
import Login from './pages/Login';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = localStorage.getItem('eduerp_session');
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="schools" element={<Schools />} />
          <Route path="clients" element={<OAuthClients />} />
          <Route path="roles" element={<div>Role Management (Coming Soon)</div>} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
