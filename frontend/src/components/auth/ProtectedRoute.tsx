import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Wraps any route that requires authentication and optionally specific permissions.
 * Redirects to /login if not authenticated, or shows an Access Denied message if 
 * the user lacks required permissions.
 */
interface ProtectedRouteProps {
    children: React.ReactNode;
    permissions?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permissions }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    // Show nothing while we restore session from localStorage
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--page-bg-from)' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
                        style={{ borderColor: 'var(--primary-100)', borderTopColor: 'var(--primary)' }} />
                    <p className="text-sm text-slate-500">Loading…</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check permissions if specified
    if (permissions && permissions.length > 0) {
        const hasPermission = permissions.some(p => user?.permissions?.includes(p));
        if (!hasPermission) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <span className="text-2xl font-bold">!</span>
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
                        <p className="text-slate-500 mb-6">
                            You do not have the required permissions to view this page. 
                            If you believe this is an error, please contact your administrator.
                        </p>
                        <button 
                            onClick={() => window.history.back()}
                            className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            );
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
