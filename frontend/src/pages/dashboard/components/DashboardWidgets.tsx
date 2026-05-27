import React, { useState } from 'react';
import { 
    GraduationCap, Users, CalendarCheck, BarChart2, BookOpen, 
    Clock, CheckCircle2, AlertCircle, ChevronRight, PenTool,
    Calendar, ArrowUpRight, DollarSign, FileText, Check, X, Megaphone, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../../components/ui/StatsCard';
import AttendanceChart from '../../../components/ui/AttendanceChart';
import ActivityFeed from '../../../components/ui/ActivityFeed';
import SubjectPerformance from '../../../components/ui/SubjectPerformance';

// Helper for card styling
const WidgetCard: React.FC<{
    title: string;
    icon: React.ComponentType<any>;
    children: React.ReactNode;
    extra?: React.ReactNode;
}> = ({ title, icon: Icon, children, extra }) => (
    <div className="premium-card p-6 sm:p-8 flex flex-col h-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300">
        <div className="flex items-center justify-between mb-6 shrink-0">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/5 rounded-2xl text-primary border border-primary/10">
                    <Icon size={18} />
                </div>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight">{title}</h3>
            </div>
            {extra}
        </div>
        <div className="flex-1 min-h-0">
            {children}
        </div>
    </div>
);

// 1. Stats Grid Widget
export const StatsGridWidget: React.FC<{ data: any; role: string }> = ({ data, role }) => {
    
    
    const getStats = () => {
        if (!data) return [];
        
        if (role === 'admin') {
            return [
                {
                    title: 'Total Students',
                    value: data.stats?.total_students?.toLocaleString() || '0',
                    icon: GraduationCap,
                    trend: 'Enrolled this term',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                    subtitle: 'Active students',
                    path: '/students'
                },
                {
                    title: 'Total Staff',
                    value: data.stats?.total_staff?.toLocaleString() || '0',
                    icon: Users,
                    trend: 'Active faculty',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    subtitle: 'Current payroll',
                    path: '/teachers'
                },
                {
                    title: 'Today Attendance',
                    value: (data.attendanceTrends?.slice(-1)[0]?.percentage || '0') + '%',
                    icon: CalendarCheck,
                    trend: 'Real-time response',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    subtitle: 'Daily presence',
                    path: '/attendance'
                },
                {
                    title: 'Total Subjects',
                    value: data.stats?.total_subjects?.toLocaleString() || '0',
                    icon: BarChart2,
                    trend: 'Ongoing courses',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                    subtitle: 'Active curriculum',
                    path: '/subjects'
                },
            ];
        }

        if (role === 'principal') {
            return [
                {
                    title: 'Student Population',
                    value: data.stats?.total_students?.toLocaleString() || '0',
                    icon: GraduationCap,
                    trend: 'School enrollment',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                    subtitle: 'Total children',
                    path: '/students'
                },
                {
                    title: 'Daily Attendance',
                    value: (data.stats?.today_attendance || '0') + '%',
                    icon: CalendarCheck,
                    trend: 'Real-time check',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    subtitle: 'Presence index',
                    path: '/attendance'
                },
                {
                    title: 'Fee Collection Efficiency',
                    value: (data.stats?.fee_collection_rate || '0') + '%',
                    icon: DollarSign,
                    trend: 'Expected vs Collected',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    subtitle: 'Collection efficiency',
                    path: '/fee-management'
                },
                {
                    title: 'Faculty Active Rate',
                    value: (data.stats?.faculty_presence_rate || '100') + '%',
                    icon: Users,
                    trend: 'Operational staff',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                    subtitle: 'Active presence',
                    path: '/teachers'
                },
            ];
        }

        if (role === 'teacher') {
            return [
                {
                    title: 'Assigned Classes',
                    value: data.stats?.classCount?.toString() || '0',
                    icon: BookOpen,
                    trend: 'My direct cohorts',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                    subtitle: 'Total divisions',
                    path: '/my-classes'
                },
                {
                    title: 'Instructed Students',
                    value: data.stats?.my_students_count?.toString() || '0',
                    icon: Users,
                    trend: 'Enrolled under me',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    subtitle: 'Active enrollment',
                },
                {
                    title: 'Active Homeworks',
                    value: data.stats?.my_homework_count?.toString() || '0',
                    icon: FileText,
                    trend: 'Homeworks indexed',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    subtitle: 'Active tasks',
                    path: '/homework'
                },
                {
                    title: 'Subjects Handled',
                    value: data.stats?.my_subjects_count?.toString() || '0',
                    icon: BarChart2,
                    trend: 'Curriculum coverage',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                    subtitle: 'Assigned courses',
                },
            ];
        }
        return [];
    };

    const stats = getStats();
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {stats.map((s, i) => (
                <StatsCard 
                    key={i} 
                    title={s.title} 
                    value={s.value} 
                    icon={s.icon} 
                    trend={s.trend} 
                    trendUp={s.trendUp} 
                    gradient={s.gradient} 
                    subtitle={s.subtitle}
                    delay={`delay-${(i+1)*50}`}
                    path={s.path}
                />
            ))}
        </div>
    );
};

// 2. Fee Summary Widget (Principal)
export const FeeSummaryWidget: React.FC<{ data: any }> = ({ data }) => {
    const navigate = useNavigate();
    const financial = data?.financials || { total_expected: 0, total_collected: 0, total_outstanding: 0, late_payments: 0, collection_rate: 0 };
    const rate = Math.round(parseFloat(financial.collection_rate || '0'));

    return (
        <WidgetCard 
            title="Financial Collections Cockpit" 
            icon={DollarSign}
            extra={
                <button onClick={() => navigate('/fee-management')} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                    Manage <ChevronRight size={12} />
                </button>
            }
        >
            <div className="flex flex-col md:flex-row items-center justify-around h-full gap-6">
                {/* Circular Gauge */}
                <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" className="stroke-slate-100 fill-transparent" strokeWidth="8" />
                        <circle 
                            cx="50" 
                            cy="50" 
                            r="40" 
                            className="stroke-primary fill-transparent transition-all duration-1000 ease-out" 
                            strokeWidth="8" 
                            strokeDasharray={251.2}
                            strokeDashoffset={251.2 - (251.2 * rate) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-800 tracking-tighter">{rate}%</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Efficiency</span>
                    </div>
                </div>

                {/* KPI Breakdown */}
                <div className="flex-1 w-full space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Collected</span>
                        </div>
                        <span className="text-sm font-black text-slate-800">₹{parseFloat(financial.total_collected).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expected Target</span>
                        </div>
                        <span className="text-sm font-black text-slate-800">₹{parseFloat(financial.total_expected).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Outstanding</span>
                        </div>
                        <span className="text-sm font-black text-slate-800">₹{parseFloat(financial.total_outstanding).toLocaleString('en-IN')}</span>
                    </div>
                    {parseInt(financial.late_payments) > 0 && (
                        <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl justify-center text-[10px] font-extrabold uppercase tracking-wider">
                            <AlertCircle size={14} /> {financial.late_payments} Overdue Defaulter Invoices
                        </div>
                    )}
                </div>
            </div>
        </WidgetCard>
    );
};

// 3. Curriculum Coverage Widget (Principal)
export const CurriculumCoverageWidget: React.FC<{ data: any }> = ({ data }) => {
    const list = data?.curriculumCoverage || [];

    return (
        <WidgetCard title="Curriculum & Syllabus Coverage" icon={BookOpen}>
            <div className="space-y-5 h-full flex flex-col justify-center">
                {list.length > 0 ? list.map((item: any, idx: number) => {
                    const pct = Math.round(parseFloat(item.completion_percentage || '0'));
                    return (
                        <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                                <span className="text-slate-500">{item.class_name} • <span className="text-slate-800">{item.subject_name}</span></span>
                                <span className={pct < 40 ? 'text-rose-500' : pct < 75 ? 'text-amber-500' : 'text-emerald-500'}>{pct}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${pct < 40 ? 'bg-rose-500' : pct < 75 ? 'bg-amber-500' : 'bg-primary'}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>{item.completed_lessons} of {item.total_lessons} Lessons Completed</span>
                                {pct < 45 && <span className="text-rose-500 flex items-center gap-0.5"><AlertCircle size={8} /> Needs Action</span>}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest italic opacity-50">
                        No syllabus plans generated for this term
                    </div>
                )}
            </div>
        </WidgetCard>
    );
};

// 4. Academic Performance Widget (Principal / Admin)
export const AcademicPerformanceWidget: React.FC<{ data: any }> = ({ data }) => {
    const list = data?.academicPerformance || data?.insights?.gradePerformance || [];
    return (
        <WidgetCard title="Academic Performance Index" icon={BarChart2}>
            <SubjectPerformance data={list} />
        </WidgetCard>
    );
};

// 5. Attendance Trends Widget (Principal / Admin)
export const AttendanceTrendsWidget: React.FC<{ data: any }> = ({ data }) => {
    const trends = data?.attendanceTrends || [];
    return (
        <WidgetCard title="Attendance Dynamics & Trends" icon={CalendarCheck}>
            <div className="h-[250px] flex items-end">
                <AttendanceChart data={trends} />
            </div>
        </WidgetCard>
    );
};

// 6. Notice Board Widget (Principal / Teacher)
export const NoticeBoardWidget: React.FC<{ data: any }> = ({ data }) => {
    const navigate = useNavigate();
    const notices = data?.recentNotices || [];

    return (
        <WidgetCard 
            title="School Announcements Board" 
            icon={Megaphone}
            extra={
                <button onClick={() => navigate('/communications')} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                    Bulletin <ChevronRight size={12} />
                </button>
            }
        >
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {notices.length > 0 ? notices.map((notice: any, i: number) => (
                    <div key={i} className="p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-300 space-y-2 group">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                                {new Date(notice.publish_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                By {notice.publisher_name}
                            </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-800 tracking-tight leading-snug group-hover:text-primary transition-colors">
                            {notice.title}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {notice.content}
                        </p>
                    </div>
                )) : (
                    <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-widest italic opacity-50">
                        No announcements posted recently
                    </div>
                )}
            </div>
        </WidgetCard>
    );
};

// 7. Staff Leaves Widget (Principal Leave Approvals Dashboard)
export const StaffLeavesWidget: React.FC<{ data: any }> = ({ data }) => {
    const navigate = useNavigate();
    const leaves = data?.pendingLeaves || [];

    return (
        <WidgetCard 
            title="Staff Leaves Review" 
            icon={Users}
            extra={
                <button onClick={() => navigate('/admin/leaves')} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                    Approvals Hub <ChevronRight size={12} />
                </button>
            }
        >
            <div className="space-y-3">
                {leaves.length > 0 ? leaves.map((leave: any, i: number) => (
                    <div key={i} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="text-xs font-extrabold text-slate-800 tracking-tight">{leave.name}</h4>
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest rounded border border-amber-100 mt-1 inline-block">
                                    {leave.leave_type}
                                </span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                                {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal italic bg-white p-2 rounded-xl border border-slate-100">
                            "{leave.reason}"
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => navigate('/admin/leaves')}
                                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 shadow-md shadow-emerald-600/10"
                            >
                                <Check size={12} /> Approve
                            </button>
                            <button 
                                onClick={() => navigate('/admin/leaves')}
                                className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center justify-center gap-1 border border-slate-200"
                            >
                                <X size={12} /> Reject
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12 space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-300">
                            <CheckCircle2 size={20} strokeWidth={2.5} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">All leaves indexed & processed</p>
                    </div>
                )}
            </div>
        </WidgetCard>
    );
};

// 8. Admin System Health Widget
export const SystemHealthWidget: React.FC<{ data: any }> = ({ data }) => {
    const navigate = useNavigate();
    const health = data?.insights?.systemHealth || { classes_missing_timetable: 0, students_missing_fees: 0 };
    
    return (
        <WidgetCard title="Operational Completeness" icon={Activity}>
            <div className="space-y-4 h-full flex flex-col justify-center">
                {/* Timetable completeness card */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${health.classes_missing_timetable > 0 ? 'bg-amber-50/50 border-amber-100 text-amber-900' : 'bg-emerald-50/50 border-emerald-100 text-emerald-900'}`}>
                    <div className="space-y-0.5">
                        <h4 className="text-xs font-black uppercase tracking-wider">Timetable Status</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            {health.classes_missing_timetable > 0 
                                ? `${health.classes_missing_timetable} classes missing schedule`
                                : 'All classrooms scheduled'}
                        </p>
                    </div>
                    {health.classes_missing_timetable > 0 ? (
                        <button onClick={() => navigate('/timetable')} className="p-2 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/10 hover:bg-amber-600 transition-colors">
                            <ArrowUpRight size={14} />
                        </button>
                    ) : (
                        <div className="p-2 bg-emerald-500 text-white rounded-xl">
                            <Check size={14} />
                        </div>
                    )}
                </div>

                {/* Fee Allocation status */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${health.students_missing_fees > 0 ? 'bg-rose-50/50 border-rose-100 text-rose-900' : 'bg-emerald-50/50 border-emerald-100 text-emerald-900'}`}>
                    <div className="space-y-0.5">
                        <h4 className="text-xs font-black uppercase tracking-wider">Fee Structuring</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            {health.students_missing_fees > 0 
                                ? `${health.students_missing_fees} students unallocated`
                                : 'All profiles structure allocated'}
                        </p>
                    </div>
                    {health.students_missing_fees > 0 ? (
                        <button onClick={() => navigate('/bulk-fee-allocation')} className="p-2 bg-rose-500 text-white rounded-xl shadow-md shadow-rose-500/10 hover:bg-rose-600 transition-colors">
                            <ArrowUpRight size={14} />
                        </button>
                    ) : (
                        <div className="p-2 bg-emerald-500 text-white rounded-xl">
                            <Check size={14} />
                        </div>
                    )}
                </div>
            </div>
        </WidgetCard>
    );
};

// 9. Admin Admissions Widget
export const AdmissionsWidget: React.FC<{ data: any }> = ({ data }) => {
    const list = data?.insights?.recentAdmissions || [];

    return (
        <WidgetCard title="Recent Admissions" icon={GraduationCap}>
            <div className="space-y-3">
                {list.map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-[var(--card-border)] hover:bg-slate-50 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center uppercase">
                                {s.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-xs font-extrabold text-slate-800 tracking-tight leading-snug group-hover:text-primary transition-colors">{s.name}</h4>
                                <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-0.5">{s.grade}</p>
                            </div>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(s.enrollment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                ))}
                {list.length === 0 && (
                    <div className="text-center py-10 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest italic opacity-50">
                        No admissions registered in past 30 days
                    </div>
                )}
            </div>
        </WidgetCard>
    );
};

// 10. Admin Activity Stream Widget
export const ActivityStreamWidget: React.FC<{ data: any }> = ({ data }) => {
    const stream = data?.activityStream || [];
    const [limit, setLimit] = useState(5);
    const isExpanded = limit > 5;

    return (
        <WidgetCard 
            title="Unified Activity Stream" 
            icon={Activity}
            extra={
                stream.length > 5 && (
                    <button 
                        onClick={() => setLimit(isExpanded ? 5 : stream.length)} 
                        className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                        {isExpanded ? 'Show Less' : 'View More'}
                    </button>
                )
            }
        >
            <ActivityFeed data={stream.slice(0, limit)} />
        </WidgetCard>
    );
};

// 11. Admin Staff Leaves Widget (Active today)
export const StaffLeavesAdminWidget: React.FC<{ data: any }> = ({ data }) => {
    const staff = data?.insights?.staffOnLeave || [];
    return (
        <WidgetCard title="Active Faculty Leaves Today" icon={Users}>
            <div className="space-y-3">
                {staff.map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-[var(--card-border)]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black text-slate-600 uppercase">
                                {s.name.charAt(0)}
                            </div>
                            <span className="text-xs font-extrabold text-slate-700 tracking-tight">{s.name}</span>
                        </div>
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest rounded-lg border border-amber-100">{s.leave_type}</span>
                    </div>
                ))}
                {staff.length === 0 && (
                    <div className="text-center py-10 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest italic opacity-50">
                        Operational capacity at 100%
                    </div>
                )}
            </div>
        </WidgetCard>
    );
};

// 12. Teacher Timeline Widget
export const TimelineWidget: React.FC<{ data: any }> = ({ data }) => {
    const navigate = useNavigate();
    const schedule = [...(data?.todaySchedule || [])].sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    // Find current active index
    const activeIndex = React.useMemo(() => {
        const now = new Date();
        const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

        for (let i = 0; i < schedule.length; i++) {
            const slot = schedule[i];
            const [h, m, s] = slot.start_time.split(':').map(Number);
            const [eh, em, es] = slot.end_time.split(':').map(Number);
            const startTime = h * 3600 + m * 60 + s;
            const endTime = eh * 3600 + em * 60 + es;

            if (currentTime >= startTime && currentTime <= endTime) {
                return i;
            }
        }
        return -1;
    }, [schedule]);

    return (
        <WidgetCard 
            title="Today's Timetable & Timeline" 
            icon={Clock}
            extra={
                <button onClick={() => navigate('/my-timetable')} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                    Schedules <ChevronRight size={12} />
                </button>
            }
        >
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                {schedule.length > 0 ? schedule.map((slot, i) => {
                    const isActive = activeIndex === i;
                    return (
                        <div key={i} className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isActive ? 'bg-slate-900 text-white border-slate-800 shadow-xl' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'}`}>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-white/40' : 'text-slate-400'}`}>
                                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                    </span>
                                    {isActive && <span className="px-2 py-0.5 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded">Active Now</span>}
                                </div>
                                <h4 className="text-sm font-extrabold tracking-tight">{slot.classroom_name} • {slot.subject_name}</h4>
                                <p className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-white/30' : 'text-slate-400'}`}>{slot.grade_name}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {!slot.attendance_taken ? (
                                    <button 
                                        onClick={() => navigate(`/attendance?classId=${slot.classroom_id}`)}
                                        className={`px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${isActive ? 'bg-primary text-white hover:opacity-90' : 'bg-white border border-slate-200 text-slate-700 hover:border-primary/20 shadow-sm'}`}
                                    >
                                        Mark Presence
                                    </button>
                                ) : (
                                    <div className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${isActive ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                        <CheckCircle2 size={12} /> Verified
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-12 space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-300">
                            <Calendar size={20} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No classes scheduled for today</p>
                    </div>
                )}
            </div>
        </WidgetCard>
    );
};

// 13. Teacher Urgent Tasks Widget
export const UrgentTasksWidget: React.FC<{ data: any }> = ({ data }) => {
    const navigate = useNavigate();
    const tasks = data?.insights?.urgentMarking || [];

    return (
        <WidgetCard title="Academic Action Items" icon={AlertCircle}>
            <div className="space-y-4">
                {tasks.length > 0 ? tasks.map((item: any, i: number) => {
                    const completionRate = Math.round((item.marked_students / item.total_students) * 100);
                    return (
                        <div key={i} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-primary/20 hover:bg-slate-50 transition-all duration-300 space-y-4 group">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-white rounded-xl shadow-sm text-primary border border-slate-100"><PenTool size={16} /></div>
                                <button 
                                    onClick={() => navigate(`/exams/mark-entry/${item.paper_id}`)}
                                    className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                                >
                                    Grade Invoices
                                </button>
                            </div>
                            <div>
                                <h4 className="text-xs font-extrabold text-slate-800 tracking-tight leading-tight">{item.exam_name}</h4>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{item.subject_name}</p>
                            </div>
                            <div className="space-y-1.5 pt-2">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-500 tracking-wider">
                                    <span>Grading Index</span>
                                    <span>{completionRate}% Complete</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary transition-all duration-500" 
                                        style={{ width: `${completionRate}%` }} 
                                    />
                                </div>
                                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                    {item.marked_students} of {item.total_students} student papers cataloged
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-12 space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-300">
                            <CheckCircle2 size={20} strokeWidth={2.5} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">All student marking tasks are clean!</p>
                    </div>
                )}
            </div>
        </WidgetCard>
    );
};

// 14. Teacher Syllabus Coverage Widget
export const SyllabusCoverageWidget: React.FC<{ data: any }> = ({ data }) => {
    const list = data?.insights?.syllabusProgress || [];

    return (
        <WidgetCard title="My Courses Syllabus Coverage" icon={BookOpen}>
            <div className="space-y-5 h-full flex flex-col justify-center">
                {list.length > 0 ? list.map((item: any, idx: number) => {
                    const pct = Math.round(parseFloat(item.completion_percentage || '0'));
                    return (
                        <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                                <span className="text-slate-500">{item.classroom_name} • <span className="text-slate-800">{item.subject_name}</span></span>
                                <span className={pct < 40 ? 'text-rose-500' : pct < 75 ? 'text-amber-500' : 'text-emerald-500'}>{pct}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${pct < 40 ? 'bg-rose-500' : pct < 75 ? 'bg-amber-500' : 'bg-primary'}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>{item.completed_lessons} of {item.total_lessons} Lessons Completed</span>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest italic opacity-50">
                        No assigned class schedules mapping syllabus
                    </div>
                )}
            </div>
        </WidgetCard>
    );
};

// 15. Teacher Assigned Courses Widget
export const AssignedCoursesWidget: React.FC<{ data: any }> = ({ data }) => {
    const classes = data?.myClasses || [];

    return (
        <WidgetCard title="Assigned Class Cohorts" icon={Users}>
            <div className="space-y-2.5">
                {classes.length > 0 ? classes.map((cls: any, i: number) => (
                    <div key={i} className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl flex items-center justify-between transition-all duration-300 group cursor-pointer">
                        <div className="space-y-0.5">
                            <h4 className="text-xs font-extrabold text-slate-800 tracking-tight group-hover:text-primary transition-colors">{cls.name} - {cls.section}</h4>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{cls.grade_name}</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-primary transition-all transform group-hover:translate-x-1" />
                    </div>
                )) : (
                    <div className="text-center py-10 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest italic opacity-50">
                        No class records mapped
                    </div>
                )}
            </div>
        </WidgetCard>
    );
};

// 16. Teacher Upcoming Exams Widget (Academic Calendar)
export const UpcomingExamsWidget: React.FC<{ data: any }> = ({ data }) => {
    const exams = data?.upcomingExams || [];

    return (
        <WidgetCard title="Academic Calendar Deadlines" icon={Calendar}>
            <div className="space-y-3.5">
                {exams.length > 0 ? exams.map((exam: any, i: number) => (
                    <div key={i} className="flex items-center gap-3.5 p-3.5 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-300 group">
                        <div className="bg-white p-2.5 rounded-xl shadow-sm text-primary group-hover:bg-primary group-hover:text-white transition-all border border-slate-100">
                            <Calendar size={16} />
                        </div>
                        <div className="space-y-0.5">
                            <h4 className="text-xs font-extrabold text-slate-800 group-hover:text-primary transition-colors leading-tight">{exam.name || exam.exam_name}</h4>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                {exam.subject_name} • {new Date(exam.exam_date || exam.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                )) : (
                    <p className="text-center py-10 text-slate-400 text-[10px] font-black uppercase tracking-widest italic opacity-50">No upcoming exam milestones</p>
                )}
            </div>
        </WidgetCard>
    );
};
