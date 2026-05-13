import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, GraduationCap, CalendarCheck,
    Settings, School, BookOpen, DollarSign, BarChart2,
    ChevronRight, LogOut, ChevronDown, Building2, Layers,
    Calendar, RefreshCw, X, ClipboardList, Clock, Sparkles,
    StickyNote, Zap, Shield, BookCheck
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
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permissions: ['report:read'] },
    ],
    academic: [
        { 
            name: 'My Classes', 
            path: '/my-classes', 
            icon: CalendarCheck, 
            permissions: ['student.academic:read'],
            roleFilter: 'teacher' 
        },
        { 
            name: 'My Timetable', 
            path: '/my-timetable', 
            icon: Clock, 
            permissions: ['student.academic:read'],
            roleFilter: 'teacher' 
        },
        { 
            name: 'Grades', 
            path: '/grades', 
            icon: Layers, 
            permissions: ['student.academic:read'],
            roleFilter: 'admin' 
        },
        { name: 'Subjects', path: '/subjects', icon: BookOpen, permissions: ['class:read'], roleFilter: 'admin' },
        { name: 'Courses', path: '/courses', icon: BookOpen, permissions: ['class:read'], roleFilter: 'admin' },
        { name: 'Classrooms', path: '/classrooms', icon: Building2, permissions: ['class:read'], roleFilter: 'admin' },
        { name: 'Timetable', path: '/timetable', icon: Clock, permissions: ['timetable:read'], roleFilter: 'admin' },
        { name: 'Exams', path: '/exams', icon: ClipboardList, permissions: ['exam:read'] },
        { name: 'Teacher Diary', path: '/teacher-diary', icon: StickyNote, permissions: ['teacher_note:read'] },
        { name: 'Homework', path: '/homework', icon: BookCheck, permissions: ['assignment:read'] },
        { name: 'Calendar', path: '/calendar', icon: Calendar, permissions: ['class:read'] },
    ],
    people: [
        { name: 'Students', path: '/students', icon: GraduationCap, permissions: ['student:read', 'student.directory:read'] },
        { name: 'Faculty Records', path: '/teachers', icon: Users, permissions: ['staff:read', 'staff.directory:read'] },
        { name: 'Attendance', path: '/attendance', icon: CalendarCheck, permissions: ['student.attendance:read'] },
    ],
    operations: [
        {
            name: 'Onboard',
            icon: Sparkles,
            permissions: ['user:invite', 'student:write', 'staff:write'],
            children: [
                { name: 'Talent Recruitment', path: '/onboarding/teachers', permissions: ['staff:write'] },
                { name: 'Student Admission', path: '/onboarding/students', permissions: ['student:write'] },
                { name: 'Workflow Builder', path: '/workflow-builder', permissions: ['settings:write'] },
            ]
        },
        { 
            name: 'Accounting', 
            icon: DollarSign, 
            permissions: ['accounting:read'],
            children: [
                { name: 'Workspace Hub', path: '/accounting/hub', permissions: ['fee:read'] },
                { name: 'Accounts Payable', path: '/accounting/ap', permissions: ['accounting:read'] },
                { name: 'Accounts Receivable', path: '/finance', permissions: ['fee:read'] },
                { name: 'General Ledger', path: '/accounting/coa', permissions: ['coa:read'] },
                { name: 'Banking & Cash', path: '/accounting/banking', permissions: ['accounting:read'] },
                { name: 'Financial Reports', path: '/accounting/reports', permissions: ['report.financial:read'] },
                { name: 'Fixed Assets', path: '#', permissions: ['accounting:write'], isPro: true },
                { name: 'Journal Entries', path: '/accounting/journals', permissions: ['journal:read'] },
            ]
        },
        { name: 'Reports', path: '/reports', icon: BarChart2, permissions: ['report:read'] },
        { name: 'Integrations', path: '/integrations', icon: Zap, permissions: ['settings:write'] },
        { name: 'IAM Settings', path: '/iam', icon: Shield, permissions: ['settings:write'] },
        { name: 'Rollover', path: '/rollover', icon: RefreshCw, permissions: ['settings:write'] },
    ],
};

const Sidebar = ({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean; setMobileOpen?: (open: boolean) => void }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [showSwitcher, setShowSwitcher] = useState(false);
    const [openMenus, setOpenMenus] = useState<string[]>([]);
    const [dynamicItems, setDynamicItems] = useState<DynamicNavItem[]>([]);
    const { user, tenants, tenantFetchError, logout, can } = useAuth();
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

    const hasPermission = (item: any) => {
        if (item.roleFilter) {
            const isTeacher = user?.roles.includes('teacher');
            if (item.roleFilter === 'teacher' && !isTeacher) return false;
            if (item.roleFilter === 'admin' && isTeacher) return false;
        }
        
        if (!item.permissions || item.permissions.length === 0) return true;
        return item.permissions.some((p: string) => can(p));
    };

    const handleSwitch = (slug: string) => {
        logout();
        navigate('/login', { state: { schoolSlug: slug } });
    };

    const renderNavItem = (item: any, isChild = false) => {
        if (!hasPermission(item)) return null;

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
                            text-[var(--sidebar-text)] hover:bg-white/5 hover:text-[var(--sidebar-text-active)]
                        `}
                    >
                        <div
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                text-slate-500 group-hover:text-[var(--sidebar-text-active)]`}
                        >
                            <Icon size={18} />
                        </div>
                        {!collapsed && (
                            <>
                                <span className="text-[13px] font-medium flex-1 text-left">{item.name}</span>
                                <ChevronDown
                                    size={14}
                                    className={`transition-transform duration-200 opacity-40 ${isExpanded ? 'rotate-180' : ''}`}
                                />
                            </>
                        )}
                    </button>

                    {!collapsed && isExpanded && (
                        <div className="ml-7 pl-3 border-l border-white/10 space-y-1 mt-1">
                            {item.children.map((child: any) => renderNavItem(child, true))}
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
                    `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative
                    ${collapsed && !isChild ? 'justify-center' : ''}
                    ${isActive 
                        ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-text-active)] font-bold' 
                        : 'text-[var(--sidebar-text)] hover:bg-white/5 hover:text-[var(--sidebar-text-active)]'}`
                }
            >
                {({ isActive }) => (
                    <>
                        <div
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                ${isActive ? 'text-[var(--sidebar-text-active)]' : 'text-slate-500 group-hover:text-[var(--sidebar-text-active)]'}`}
                        >
                            <Icon size={18} />
                        </div>
                        {(!collapsed || isChild) && (
                            <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                                <span className={`text-[13px] truncate ${isChild ? 'text-[12px] opacity-80' : ''}`}>
                                    {item.name}
                                </span>
                                {item.isPro && (
                                    <span className="text-[8px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-md uppercase tracking-tighter shrink-0 border border-primary/10">
                                        PRO
                                    </span>
                                )}
                            </div>
                        )}
                    </>
                )}
            </NavLink>
        );
    };

    return (
        <aside
            className={`
                ${collapsed ? 'w-20' : 'w-[280px]'} 
                flex flex-col h-screen fixed top-0 left-0 z-[60] transition-all duration-300 ease-in-out
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                md:flex border-r border-white/5 bg-gradient-sidebar
            `}
        >
            {/* Logo & Switcher */}
            <div className={`relative h-20 flex items-center border-b border-white/5 ${collapsed ? 'justify-center px-2' : 'px-6 gap-3'}`}>
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
                    style={{ background: 'var(--primary)' }}
                >
                    <School className="w-6 h-6 text-white" />
                </div>

                {!collapsed && (
                    <div className="flex-1 min-w-0 cursor-pointer group" onClick={() => setShowSwitcher(!showSwitcher)}>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-[var(--sidebar-text-active)] font-heading tracking-tight truncate">
                                {currentTenant?.name || 'LuviaEdu'}
                            </span>
                            {tenants.length > 1 && <ChevronDown size={14} className="text-slate-400 transition-transform group-hover:text-primary" />}
                        </div>
                        <p className="text-[10px] font-semibold text-[var(--text-muted)]">
                            {tenants.length > 1 ? 'Switch Workspace' : 'Core Platform'}
                        </p>
                    </div>
                )}

                {/* Switcher Dropdown */}
                {showSwitcher && !collapsed && (
                    <div
                        ref={switcherRef}
                        className="absolute top-[80%] left-4 right-4 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-scale-in origin-top"
                    >
                        {tenantFetchError ? (
                            <div className="px-4 py-3">
                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Error Loading Schools</p>
                                <p className="text-xs text-slate-500 leading-relaxed">{tenantFetchError}</p>
                            </div>
                        ) : (
                            <>
                                <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspaces</p>
                                {tenants.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleSwitch(t.slug)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                                            ${t.id === user?.tenant_id ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center 
                                            ${t.id === user?.tenant_id ? 'bg-primary/10' : 'bg-slate-100'}`}>
                                            <Building2 size={15} />
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
                        className="md:hidden text-slate-400 hover:text-slate-600 p-2"
                    >
                        <X size={20} />
                    </button>
                )}

                {!collapsed && (
                    <button
                        onClick={() => setCollapsed(true)}
                        className="text-slate-500 hover:text-[var(--sidebar-text-active)] transition-colors p-1 hidden md:block"
                        title="Collapse"
                    >
                        <ChevronRight size={16} />
                    </button>
                )}
            </div>

            {collapsed && (
                <button
                    onClick={() => setCollapsed(false)}
                    className="mt-4 mx-auto text-slate-400 hover:text-primary transition-colors p-1"
                >
                    <ChevronRight size={18} className="rotate-180" />
                </button>
            )}

            {/* Nav */}
            <nav className="flex-1 py-6 px-3 space-y-7 overflow-y-auto custom-scrollbar">
                {/* Main */}
                <div className="space-y-1">
                    {!collapsed && (
                        <p className="px-3 pb-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                            Overview
                        </p>
                    )}
                    {navigation.main.map((item) => renderNavItem(item))}
                </div>

                {/* People - Consistently placed */}
                <div className="space-y-1">
                    {!collapsed && (
                        <p className="px-3 pb-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                            People
                        </p>
                    )}
                    {navigation.people.map((item) => renderNavItem(item))}
                </div>

                {/* Academic */}
                <div className="space-y-1">
                    {!collapsed && (
                        <p className="px-3 pb-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                            Academic
                        </p>
                    )}
                    {navigation.academic.map((item) => renderNavItem(item))}
                    {dynamicItems.filter(i => i.group === 'academic').map((item) => renderNavItem(item))}
                </div>

                {/* Operations */}
                <div className="space-y-1">
                    {!collapsed && (
                        <p className="px-3 pb-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                            Operations
                        </p>
                    )}
                    {navigation.operations.map((item) => renderNavItem(item))}
                    {dynamicItems.filter(i => i.group === 'operations' || !i.group).map((item) => renderNavItem(item))}
                </div>

                <div className="pt-4 border-t border-white/5">
                    <NavLink
                        to="/settings"
                        title={collapsed ? 'Settings' : undefined}
                        className={({ isActive }) =>
                            `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative
                            ${collapsed ? 'justify-center' : ''}
                            ${isActive ? 'bg-[var(--sidebar-active)] text-[var(--primary)] font-bold' : 'text-[var(--sidebar-text)] hover:bg-slate-200/50 hover:text-[var(--text-main)]'}`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div
                                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                        ${isActive ? 'text-[var(--sidebar-text-active)]' : 'text-slate-500 group-hover:text-[var(--sidebar-text-active)]'}`}
                                >
                                    <Settings size={18} />
                                </div>
                                {!collapsed && <span className="text-[13px] flex-1">Settings</span>}
                            </>
                        )}
                    </NavLink>
                </div>
            </nav>

            {/* User profile */}
            <div className={`p-4 border-t border-white/5 ${collapsed ? 'flex justify-center' : ''}`}>
                {collapsed ? (
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs cursor-pointer shadow-sm"
                        style={{ background: 'var(--primary)' }}
                        onClick={logout}
                    >
                        {user?.email?.substring(0, 2).toUpperCase() || 'AD'}
                    </div>
                ) : (
                    <div
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={() => navigate('/settings')}
                    >
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm"
                            style={{ background: 'var(--primary)' }}
                        >
                            {user?.email?.substring(0, 2).toUpperCase() || 'AD'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-[var(--sidebar-text-active)] truncate">{user?.email?.split('@')[0] || 'User'}</p>
                            <p className="text-[10px] text-[var(--text-muted)] truncate font-medium">Administrator</p>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); logout(); }}
                            className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;