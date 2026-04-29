import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, GraduationCap, CalendarCheck,
    Settings, School, BookOpen, DollarSign, BarChart2,
    ChevronRight, LogOut, ChevronDown, Building2, Layers,
    Calendar, RefreshCw, X, ClipboardList, Clock, Sparkles,
    StickyNote, Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAvailableIntegrations } from '../../api/integration.api';

interface DynamicNavItem {
    name: string;
    path: string;
    icon: any;
    permissions: string[];
    group?: string;
}
const navigation = {
    main: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permissions: [] },
    ],
    academic: [
        { name: 'Grades', path: '/grades', icon: Layers, permissions: ['student.academic:read'] },
        { name: 'Subjects', path: '/subjects', icon: BookOpen, permissions: ['class:read'] },
        { name: 'Courses', path: '/courses', icon: BookOpen, permissions: ['class:read'] },
        { name: 'Classrooms', path: '/classrooms', icon: Building2, permissions: ['class:read'] },
        { name: 'Timetable', path: '/timetable', icon: Clock, permissions: ['timetable:read'] },
        { name: 'Exams', path: '/exams', icon: ClipboardList, permissions: ['class:read'] },
        { name: 'Teacher Diary', path: '/teacher-diary', icon: StickyNote, permissions: ['timetable:read'] },
        { name: 'Calendar', path: '/calendar', icon: Calendar, badge: 'New', permissions: ['class:read'] },
    ],
    people: [
        { name: 'Students', path: '/students', icon: GraduationCap, badge: '1,248', permissions: ['student:read'] },
        { name: 'Teachers', path: '/teachers', icon: Users, badge: '84', permissions: ['staff:read'] },
        { name: 'Attendance', path: '/attendance', icon: CalendarCheck, permissions: ['student.attendance:read'] },
    ],
    operations: [
        {
            name: 'Onboard',
            icon: Sparkles,
            permissions: ['user:invite', 'student:write', 'staff:write'],
            children: [
                { name: 'Teachers', path: '/onboarding/teachers', permissions: ['staff:write'] },
                { name: 'Students', path: '/onboarding/students', permissions: ['student:write'] },
                { name: 'Workflow', path: '/workflow-builder', permissions: ['settings:write'] },
            ]
        },
        { name: 'Finance', path: '/finance', icon: DollarSign, permissions: ['fee:read'] },
        { name: 'Reports', path: '/reports', icon: BarChart2, permissions: ['report:read'] },
        { name: 'Integrations', path: '/integrations', icon: Zap, permissions: ['settings:write'] },
        { name: 'Rollover', path: '/rollover', icon: RefreshCw, permissions: ['settings:write'] },
    ],
};

const Sidebar = ({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean; setMobileOpen?: (open: boolean) => void }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [showSwitcher, setShowSwitcher] = useState(false);
    const [openMenus, setOpenMenus] = useState<string[]>([]);
    const [dynamicItems, setDynamicItems] = useState<DynamicNavItem[]>([]);
    const { user, tenants, tenantFetchError, logout } = useAuth();
    const navigate = useNavigate();
    const switcherRef = useRef<HTMLDivElement>(null);

    const currentTenant = tenants.find(t => t.id === user?.tenant_id);

    useEffect(() => {
        const fetchDynamicNav = async () => {
            try {
                const integrations = await getAvailableIntegrations(user?.tenant_id);
                const items: DynamicNavItem[] = [];

                integrations.filter(i => i.isEnabled).forEach(plugin => {
                    plugin.uiPlacements?.filter(p => p.location === 'sidebar').forEach(placement => {
                        items.push({
                            name: placement.label,
                            path: placement.path || `/integrations?slug=${plugin.slug}`,
                            icon: placement.icon === 'Zap' ? Zap : Layers,
                            // Use the permissions declared by the plugin itself
                            // e.g. student:read means teachers/school_admins can see it
                            permissions: placement.permissions || [],
                            group: placement.group
                        });
                    });
                });
                setDynamicItems(items);
            } catch (err) {
                console.error('Failed to fetch dynamic nav', err);
            }
        };

        if (user) fetchDynamicNav();

        const handleClickOutside = (event: MouseEvent) => {
            if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
                setShowSwitcher(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [user]);

    const toggleMenu = (name: string) => {
        if (collapsed) setCollapsed(false);
        setOpenMenus(prev =>
            prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
        );
    };

    const hasPermission = (requiredPermissions?: string[]) => {
        if (!user) return false;
        const isSystemAdmin = user?.roles?.includes('system_admin');
        return isSystemAdmin || !requiredPermissions || requiredPermissions.length === 0 || 
            requiredPermissions.some((p: string) => user?.permissions?.includes(p));
    };

    const handleSwitch = (slug: string) => {
        logout();
        navigate('/login', { state: { schoolSlug: slug } });
    };

    const renderNavItem = (item: any, idx: number, isChild = false) => {
        if (!hasPermission(item.permissions)) return null;

        const Icon = item.icon;
        const isExpanded = openMenus.includes(item.name);
        const hasChildren = item.children && item.children.length > 0;

        if (hasChildren) {
            return (
                <div key={item.name} className="space-y-1">
                    <button
                        onClick={() => toggleMenu(item.name)}
                        className={`
                            w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative
                            ${collapsed ? 'justify-center' : ''}
                            text-white/55 hover:text-white hover:bg-white/8
                        `}
                    >
                        <div
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                text-white/50 group-hover:text-white group-hover:bg-white/10`}
                        >
                            <Icon size={17} />
                        </div>
                        {!collapsed && (
                            <>
                                <span className="text-sm font-medium flex-1 text-left">{item.name}</span>
                                <ChevronDown
                                    size={14}
                                    className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                />
                            </>
                        )}
                    </button>

                    {!collapsed && isExpanded && (
                        <div className="ml-4 pl-4 border-l border-white/10 space-y-1 animate-slide-down">
                            {item.children.map((child: any, cIdx: number) => renderNavItem(child, cIdx, true))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <NavLink
                key={item.name}
                to={item.path}
                title={collapsed && !isChild ? item.name : undefined}
                className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 relative
                    ${collapsed && !isChild ? 'justify-center' : ''}
                    ${isActive ? 'text-white' : 'text-white/55 hover:text-white hover:bg-white/8'}`
                }
                style={({ isActive }) => ({
                    animationDelay: `${idx * 50}ms`,
                    ...(isActive ? { background: 'var(--sidebar-active)' } : {}),
                })}
            >
                {({ isActive }) => (
                    <>
                        {isActive && !isChild && (
                            <span
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                                style={{ background: 'var(--sidebar-dot)' }}
                            />
                        )}
                        {!isChild && (
                            <div
                                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                    ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white group-hover:bg-white/10'}`}
                                style={isActive ? { background: 'rgba(255,255,255,0.18)' } : {}}
                            >
                                <Icon size={17} />
                            </div>
                        )}
                        {(!collapsed || isChild) && (
                            <>
                                <span className={`text-sm font-medium flex-1 ${isChild ? 'text-xs opacity-80' : ''}`}>
                                    {item.name}
                                </span>
                                {item.badge && (
                                    <span className="text-xs rounded-full px-2 py-0.5 bg-white/10 text-white/60">
                                        {item.badge}
                                    </span>
                                )}
                            </>
                        )}
                        {isChild && isActive && (
                            <div className="w-1 h-1 rounded-full bg-white/40" />
                        )}
                    </>
                )}
            </NavLink>
        );
    };

    return (
        <aside
            className={`
                ${collapsed ? 'w-20' : 'w-64'} 
                flex flex-col h-screen fixed top-0 left-0 z-[60] transition-all duration-300 ease-in-out
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                md:flex
            `}
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
                                    className="mt-2 text-[10px] font-bold text-primary hover:opacity-80 underline"
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
                                            ${t.id === user?.tenant_id ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center 
                                            ${t.id === user?.tenant_id ? 'bg-primary/20' : 'bg-slate-100'}`}>
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

                {/* Mobile Close Button */}
                {setMobileOpen && (
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden text-white/50 hover:text-white p-2"
                    >
                        <X size={20} />
                    </button>
                )}

                {!collapsed && (
                    <button
                        onClick={() => setCollapsed(true)}
                        className="text-white/40 hover:text-white transition-colors p-1 hidden md:block"
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
            <nav className="flex-1 py-3 px-2 space-y-6 overflow-y-auto custom-scrollbar">
                {/* Main */}
                <div className="space-y-0.5">
                    {navigation.main.map((item, idx) => renderNavItem(item, idx))}
                </div>

                {/* Academic */}
                <div className="space-y-0.5">
                    {!collapsed && (
                        <p className="px-3 pb-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                            Academic
                        </p>
                    )}
                    {navigation.academic.map((item, idx) => renderNavItem(item, idx))}
                    {dynamicItems.filter(i => i.group === 'academic').map((item, idx) => renderNavItem(item, idx + 100))}
                </div>

                {/* People */}
                <div className="space-y-0.5">
                    {!collapsed && (
                        <p className="px-3 pb-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                            People
                        </p>
                    )}
                    {navigation.people.map((item, idx) => renderNavItem(item, idx))}
                    {dynamicItems.filter(i => i.group === 'people').map((item, idx) => renderNavItem(item, idx + 200))}
                </div>

                {/* Operations */}
                <div className="space-y-0.5">
                    {!collapsed && (
                        <p className="px-3 pb-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                            Operations
                        </p>
                    )}
                    {navigation.operations.map((item, idx) => renderNavItem(item, idx))}
                    {dynamicItems.filter(i => i.group === 'operations' || !i.group).map((item, idx) => renderNavItem(item, idx + 300))}
                </div>

                <div className="pt-4 border-t border-white/5">
                    <NavLink
                        to="/settings"
                        title={collapsed ? 'Settings' : undefined}
                        className={({ isActive }) =>
                            `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative
                            ${collapsed ? 'justify-center' : ''}
                            ${isActive ? 'bg-white/10 text-white shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white'}`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && !collapsed && (
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
                                {!collapsed && <span className="text-sm font-medium flex-1">Settings</span>}
                            </>
                        )}
                    </NavLink>
                </div>
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