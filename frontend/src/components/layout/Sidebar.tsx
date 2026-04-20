import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, GraduationCap, CalendarCheck,
    Settings, School, BookOpen, DollarSign, BarChart2,
    ChevronRight, LogOut, ChevronDown, Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, badge: null },
    { name: 'Students', path: '/students', icon: GraduationCap, badge: '1,248' },
    { name: 'Teachers', path: '/teachers', icon: Users, badge: '84' },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck, badge: null },
    { name: 'Courses', path: '/courses', icon: BookOpen, badge: '32' },
    { name: 'Finance', path: '/finance', icon: DollarSign, badge: null },
    { name: 'Reports', path: '/reports', icon: BarChart2, badge: null },
];

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [showSwitcher, setShowSwitcher] = useState(false);
    const { user, tenants, tenantFetchError, logout } = useAuth();
    const navigate = useNavigate();
    const switcherRef = useRef<HTMLDivElement>(null);

    const currentTenant = tenants.find(t => t.id === user?.tenant_id);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
                setShowSwitcher(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSwitch = (slug: string) => {
        // Since we don't have a dedicated switchTenant API yet that works with just the token,
        // we'll redirect to login with the school slug (or we could implement it).
        // For now, the user said "user can switch to any school".
        // A simple way is to logout and go to login with that slug.
        // But better is to just go to login.
        logout();
        navigate('/login', { state: { schoolSlug: slug } });
    };

    return (
        <aside
            className={`${collapsed ? 'w-20' : 'w-64'} flex flex-col h-screen hidden md:flex fixed top-0 left-0 z-30 transition-all duration-300 ease-in-out`}
            style={{ background: 'linear-gradient(160deg, var(--sidebar-from) 0%, var(--sidebar-via) 40%, var(--sidebar-to) 100%)' }}
        >
            {/* Logo & Switcher */}
            <div className={`relative h-16 flex items-center border-b border-white/10 ${collapsed ? 'justify-center px-2' : 'px-4 gap-3'}`}>
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                >
                    <School className="w-5 h-5 text-white" />
                </div>
                
                {!collapsed && (
                    <div className="flex-1 min-w-0 cursor-pointer group" onClick={() => setShowSwitcher(!showSwitcher)}>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-white font-heading tracking-wide truncate">
                                {currentTenant?.name || 'EduERP'}
                            </span>
                            {tenants.length > 1 && <ChevronDown size={14} className={`text-white/40 transition-transform ${showSwitcher ? 'rotate-180' : ''}`} />}
                        </div>
                        <p className="text-[10px] leading-none" style={{ color: 'var(--sidebar-dot)', opacity: 0.8 }}>
                            {tenants.length > 1 ? 'Switch School' : 'School Manager'}
                        </p>
                    </div>
                )}

                {/* Switcher Dropdown */}
                {showSwitcher && !collapsed && (
                    <div 
                        ref={switcherRef}
                        className="absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-scale-in origin-top"
                    >
                        {tenantFetchError ? (
                            <div className="px-4 py-3">
                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Error Loading Schools</p>
                                <p className="text-xs text-slate-500 leading-relaxed">{tenantFetchError}</p>
                                <button 
                                    onClick={() => window.location.reload()}
                                    className="mt-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline"
                                >
                                    Retry Now
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Schools</p>
                                {tenants.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleSwitch(t.slug)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                                            ${t.id === user?.tenant_id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center 
                                            ${t.id === user?.tenant_id ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                                            <Building2 size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate">{t.name}</p>
                                            <p className="text-[10px] opacity-60 truncate">{t.slug}</p>
                                        </div>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {!collapsed && (
                    <button
                        onClick={() => setCollapsed(true)}
                        className="text-white/40 hover:text-white transition-colors p-1"
                        title="Collapse"
                    >
                        <ChevronRight size={16} />
                    </button>
                )}
            </div>

            {collapsed && (
                <button
                    onClick={() => setCollapsed(false)}
                    className="mt-3 mx-auto text-white/40 hover:text-white transition-colors p-1"
                >
                    <ChevronRight size={16} className="rotate-180" />
                </button>
            )}

            {!collapsed && (
                <p className="px-5 pt-5 pb-1 text-xs font-semibold text-white/30 uppercase tracking-widest">
                    Main Menu
                </p>
            )}

            {/* Nav */}
            <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
                {navItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            title={collapsed ? item.name : undefined}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative
                                ${collapsed ? 'justify-center' : ''}
                                ${isActive ? 'text-white' : 'text-white/55 hover:text-white hover:bg-white/8'}`
                            }
                            style={({ isActive }) => ({
                                animationDelay: `${idx * 50}ms`,
                                ...(isActive ? { background: 'var(--sidebar-active)' } : {}),
                            })}
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <span
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                                            style={{ background: 'var(--sidebar-dot)' }}
                                        />
                                    )}
                                    <div
                                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                            ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white group-hover:bg-white/10'}`}
                                        style={isActive ? { background: 'rgba(255,255,255,0.18)' } : {}}
                                    >
                                        <Icon size={17} />
                                    </div>
                                    {!collapsed && (
                                        <>
                                            <span className="text-sm font-medium flex-1">{item.name}</span>
                                            {item.badge && (
                                                <span className="text-xs rounded-full px-2 py-0.5 bg-white/10 text-white/60">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}

                {!collapsed && (
                    <p className="px-3 pt-4 pb-1 text-xs font-semibold text-white/30 uppercase tracking-widest">
                        System
                    </p>
                )}

                <NavLink
                    to="/settings"
                    title={collapsed ? 'Settings' : undefined}
                    className={({ isActive }) =>
                        `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative
                        ${collapsed ? 'justify-center' : ''}
                        ${isActive ? 'text-white' : 'text-white/55 hover:text-white hover:bg-white/8'}`
                    }
                    style={({ isActive }) => isActive ? { background: 'var(--sidebar-active)' } : {}}
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <span
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                                    style={{ background: 'var(--sidebar-dot)' }}
                                />
                            )}
                            <div
                                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                    ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white group-hover:bg-white/10'}`}
                                style={isActive ? { background: 'rgba(255,255,255,0.18)' } : {}}
                            >
                                <Settings size={17} />
                            </div>
                            {!collapsed && <span className="text-sm font-medium">Settings</span>}
                        </>
                    )}
                </NavLink>
            </nav>

            {/* User profile */}
            <div className={`p-3 border-t border-white/10 ${collapsed ? 'flex justify-center' : ''}`}>
                {collapsed ? (
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                        onClick={logout}
                    >
                        {user?.email?.substring(0, 2).toUpperCase() || 'AD'}
                    </div>
                ) : (
                    <div 
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/8 transition-colors cursor-pointer group"
                        onClick={logout}
                    >
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                        >
                            {user?.email?.substring(0, 2).toUpperCase() || 'AD'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user?.email?.split('@')[0] || 'User'}</p>
                            <p className="text-xs text-white/40 truncate">{user?.email || 'admin@eduerp.com'}</p>
                        </div>
                        <LogOut size={15} className="text-white/30 group-hover:text-white/70 transition-colors flex-shrink-0" />
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;