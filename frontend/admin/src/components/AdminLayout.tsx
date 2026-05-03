import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
    LayoutDashboard, School, 
    ShieldCheck, LogOut, ChevronRight, Menu, X 
} from 'lucide-react';

const AdminLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const sessionRaw = localStorage.getItem('eduerp_session');
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const user = session?.user || { email: 'admin@pynemonk.com', name: 'Super Admin' };

    const handleLogout = () => {
        localStorage.removeItem('eduerp_session');
        window.location.href = '/login';
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Schools', path: '/schools', icon: School },
        { name: 'Identity & Access', path: '/clients', icon: ShieldCheck },
    ];

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className={`
                ${isSidebarOpen ? 'w-64' : 'w-20'} 
                bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out z-30
            `}>
                <div className="h-20 flex items-center px-6 border-b border-slate-100 shrink-0 gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
                        <ShieldCheck size={24} />
                    </div>
                    {isSidebarOpen && (
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-slate-900 truncate">Pynemonk</h2>
                            <p className="text-[10px] text-indigo-600 font-bold tracking-widest uppercase">Admin App</p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                                ${isActive 
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                            `}
                        >
                            <item.icon size={20} className="shrink-0" />
                            {isSidebarOpen && <span className="text-sm font-bold">{item.name}</span>}
                            {isSidebarOpen && (
                                <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        {isSidebarOpen && <span className="text-sm font-medium">Collapse Menu</span>}
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-all"
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="text-sm font-bold">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header className="h-20 bg-white border-b border-slate-200 flex items-center px-8 shrink-0 z-20">
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-slate-800">System Control Plane</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-black uppercase">
                                AD
                            </div>
                            <div className="text-left hidden sm:block">
                                <p className="text-xs font-bold text-slate-900 leading-none">{user.name || 'Super Admin'}</p>
                                <p className="text-[10px] text-slate-500 mt-1">{user.email}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
