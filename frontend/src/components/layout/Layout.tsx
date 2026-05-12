import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, Settings, LogOut, Calendar } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAuth } from '../../contexts/AuthContext';
import { useAcademics } from '../../contexts/AcademicsContext';

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
    const { currentYear } = useAcademics();

    const initials = user?.email
        ? user.email.slice(0, 2).toUpperCase()
        : 'AD';

    const handleLogout = async () => {
        setUserMenuOpen(false);
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen flex bg-[var(--background)] overflow-x-hidden">
            <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 z-50 md:hidden backdrop-blur-sm animate-fade-in"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col md:ml-[280px] transition-all duration-300 pb-20 md:pb-0">
                {/* Header */}
                <header
                    className="h-20 flex items-center justify-between px-6 lg:px-8 z-40 sticky top-0 bg-white/80 backdrop-blur-xl border-b border-[var(--card-border)]"
                >
                    <div className="flex items-center gap-6">
                        <button
                            className="md:hidden text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-lg active:scale-95"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <Menu size={22} />
                        </button>

                        <div className="relative hidden lg:block group">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-[var(--primary)] transition-colors" />
                            <input
                                id="header-search"
                                type="text"
                                placeholder="Search platform..."
                                className="pl-11 pr-4 py-2.5 bg-slate-100/50 border border-transparent rounded-xl text-[13px] focus:outline-none w-80 transition-all placeholder-slate-400 focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-primary/5 font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Academic Year chip */}
                        {currentYear && (
                            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm border ${currentYear.status === 'closed' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-primary/5 text-primary border-primary/10'}`}>
                                <Calendar size={13} />
                                {currentYear.name}
                            </div>
                        )}

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                id="notification-btn"
                                onClick={() => setNotifOpen(!notifOpen)}
                                className="relative p-2.5 text-slate-500 rounded-xl transition-all hover:bg-slate-100 active:scale-95"
                            >
                                <Bell size={20} />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                            </button>

                            {notifOpen && (
                                <div
                                    className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-[var(--card-border)] overflow-hidden z-50 animate-scale-in origin-top-right"
                                >
                                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">4 NEW</span>
                                    </div>
                                    <div className="max-h-[360px] overflow-y-auto">
                                        {notifications.map(n => (
                                            <div key={n.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">{n.dot}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-bold text-slate-800 leading-tight mb-0.5">{n.title}</p>
                                                    <p className="text-[11px] text-slate-500 truncate">{n.desc}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1 font-medium">{n.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-5 py-3 bg-slate-50 text-center border-t border-slate-100">
                                        <button className="text-[11px] font-bold text-primary hover:underline">
                                            Mark all as read
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile */}
                        <div className="relative">
                            <button
                                id="user-menu-btn"
                                onClick={() => setUserMenuOpen(o => !o)}
                                className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-100 transition-all active:scale-95 border border-transparent hover:border-slate-200"
                            >
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
                                    style={{ background: 'var(--primary)' }}
                                >
                                    {initials}
                                </div>
                                <div className="hidden sm:block text-left pr-2">
                                    <p className="text-[13px] font-bold text-slate-700 leading-none truncate max-w-[120px]">
                                        {user?.email?.split('@')[0] ?? 'Admin'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-medium capitalize">{user?.roles[0] || 'Member'}</p>
                                </div>
                            </button>

                            {userMenuOpen && (
                                <div
                                    className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-[var(--card-border)] overflow-hidden z-50 animate-scale-in origin-top-right"
                                >
                                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account</p>
                                        <p className="text-[13px] font-bold text-slate-800 truncate">{user?.email}</p>
                                    </div>
                                    <div className="p-2">
                                        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                                            <Settings size={16} />
                                            Settings
                                        </button>
                                        <button
                                            id="logout-btn"
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                        >
                                            <LogOut size={16} />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 lg:p-10 overflow-auto">
                    <Outlet />
                </main>
                <BottomNav onMenuClick={() => setMobileMenuOpen(true)} />
            </div>
        </div>
    );
};

export default Layout;