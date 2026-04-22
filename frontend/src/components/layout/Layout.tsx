import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, Sun, ChevronDown, X, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAuth } from '../../contexts/AuthContext';

const notifications = [
    { id: 1, title: 'New student enrolled', desc: 'Grade 10 · Section A', time: '2m ago', dot: '🎓' },
    { id: 2, title: 'Attendance alert', desc: 'Grade 8-B below 80%', time: '15m ago', dot: '⚠️' },
    { id: 3, title: 'Fee payment received', desc: '$1,200 from John Doe', time: '1h ago', dot: '💰' },
    { id: 4, title: 'Exam schedule published', desc: 'Final exams for Grade 12', time: '3h ago', dot: '📅' },
];

const Layout = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const initials = user?.email
        ? user.email.slice(0, 2).toUpperCase()
        : 'AD';

    const handleLogout = async () => {
        setUserMenuOpen(false);
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen flex bg-gradient-page overflow-x-hidden" style={{ transition: 'background 0.4s ease' }}>
            <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 z-50 md:hidden backdrop-blur-sm animate-fade-in"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300 pb-20 md:pb-0">
                {/* Header */}
                <header
                    className="h-16 flex items-center justify-between px-4 sm:px-6 z-40 sticky top-0"
                    style={{
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 1px 20px rgba(0,0,0,0.04)',
                    }}
                >
                    <div className="flex items-center gap-3">
                        <button
                            className="md:hidden text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-lg active:scale-95"
                            style={{ '--tw-ring-color': 'var(--ring)' } as React.CSSProperties}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <Menu size={22} />
                        </button>

                        <div className="relative hidden sm:block">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                id="header-search"
                                type="text"
                                placeholder="Search students, teachers, courses..."
                                className="pl-10 pr-4 py-2.5 border border-slate-200/80 rounded-xl text-sm focus:outline-none w-72 transition-all placeholder-slate-400"
                                style={{
                                    background: 'rgba(248,250,252,0.8)',
                                    outline: 'none',
                                }}
                                onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 3px var(--ring)`; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                onBlur={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Date chip */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-slate-500"
                            style={{ background: 'var(--primary-50)' }}>
                            <Sun size={13} className="text-amber-500" />
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                id="notification-btn"
                                onClick={() => setNotifOpen(!notifOpen)}
                                className="relative p-2.5 text-slate-500 rounded-xl transition-all hover:bg-slate-100"
                                style={{ '--hover-color': 'var(--primary)' } as React.CSSProperties}
                            >
                                <Bell size={19} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                            </button>

                            {notifOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50 animate-scale-in"
                                    style={{
                                        background: 'rgba(255,255,255,0.97)',
                                        backdropFilter: 'blur(20px)',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                                    }}
                                >
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">Notifications</p>
                                            <p className="text-xs text-slate-400">4 unread</p>
                                        </div>
                                        <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {notifications.map(n => (
                                            <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                                                <div className="text-xl mt-0.5">{n.dot}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                                                    <p className="text-xs text-slate-500 truncate">{n.desc}</p>
                                                </div>
                                                <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">{n.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                                        <button className="text-xs font-medium transition-colors" style={{ color: 'var(--primary)' }}>
                                            View all notifications →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User menu */}
                        <div className="relative">
                            <button
                                id="user-menu-btn"
                                onClick={() => setUserMenuOpen(o => !o)}
                                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-all"
                            >
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                    style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                                >
                                    {initials}
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-sm font-semibold text-slate-700 leading-none truncate max-w-[120px]">
                                        {user?.email?.split('@')[0] ?? 'Admin'}
                                    </p>
                                    <p className="text-xs text-slate-400 leading-none mt-0.5">Logged in</p>
                                </div>
                                <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
                            </button>

                            {userMenuOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden z-50 animate-scale-in"
                                    style={{
                                        background: 'rgba(255,255,255,0.97)',
                                        backdropFilter: 'blur(20px)',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                                    }}
                                >
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <p className="text-xs font-semibold text-slate-800 truncate">{user?.email}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Role ID: {user?.role_id}</p>
                                    </div>
                                    <div className="p-1.5">
                                        <button
                                            id="logout-btn"
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                        >
                                            <LogOut size={15} />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
                    <Outlet />
                </main>
                <BottomNav onMenuClick={() => setMobileMenuOpen(true)} />
            </div>
        </div>
    );
};

export default Layout;