import {
    GraduationCap, Users, CalendarCheck,
    BookOpen, Award, FileBarChart, ChevronRight, Sparkles,
    BarChart2, PenTool, Calendar, Layout
} from 'lucide-react';
import StatsCard from '../../components/ui/StatsCard';
import AttendanceChart from '../../components/ui/AttendanceChart';
import QuickActions from '../../components/ui/QuickActions';
import ActivityFeed from '../../components/ui/ActivityFeed';
import SubjectPerformance from '../../components/ui/SubjectPerformance';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardData } from '../../api/dashboard.api';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ComboBox } from '../../components/ui/ComboBox';
import TeacherDashboard from './components/TeacherDashboard';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attendanceTimeframe, setAttendanceTimeframe] = useState('30d');
    
    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            try {
                const res = await getDashboardData(attendanceTimeframe.replace('d', ''));
                setData(res);
            } catch (err: any) {
                console.error('Failed to fetch dashboard', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [attendanceTimeframe]);

    if (loading) {
        return (
            <div className="h-[70vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center">
                    <Layout size={40} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Restricted Access</h2>
                    <p className="text-[var(--text-muted)] max-w-md mx-auto">Your current role does not have the permissions required to view the global school dashboard. Please contact your administrator if you believe this is an error.</p>
                </div>
                <button 
                    onClick={() => navigate('/accounting')} 
                    className="btn-primary px-8"
                >
                    Go to Accounting Hub
                </button>
            </div>
        );
    }
    
    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const primaryRole = user?.roles[0] || 'User';
    const capitalizedRole = primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1).replace('_', ' ');

    // Map Backend Stats to UI StatsCards
    const getDynamicStats = () => {
        if (!data) return [];
        
        if (data.type === 'admin') {
            return [
                {
                    title: 'Total Students',
                    value: data.stats?.total_students?.toLocaleString() || '0',
                    icon: GraduationCap,
                    trend: '+12 this month',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                    subtitle: 'Enrolled this year',
                    delay: 'delay-100',
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
                    delay: 'delay-150',
                    path: '/teachers'
                },
                {
                    title: "Today's Attendance",
                    value: (data.attendanceTrends?.slice(-1)[0]?.percentage || '0') + '%',
                    icon: CalendarCheck,
                    trend: 'Across all levels',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    subtitle: 'Real-time presence',
                    delay: 'delay-200',
                    path: '/attendance'
                },
                {
                    title: 'Total Subjects',
                    value: data.stats?.total_subjects?.toLocaleString() || '0',
                    icon: BarChart2,
                    trend: 'Ongoing curriculum',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                    subtitle: 'Active courses',
                    delay: 'delay-300',
                    path: '/subjects'
                },
            ];
        }

        if (data.type === 'teacher') {
            return [
                {
                    title: 'My Classes',
                    value: data.stats?.classCount?.toString() || '0',
                    icon: BookOpen,
                    trend: 'Assigned this term',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                    subtitle: 'Total sections',
                    delay: 'delay-100',
                },
                {
                    title: 'My Students',
                    value: data.stats?.my_students_count?.toString() || '0',
                    icon: Users,
                    trend: 'Under my care',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    subtitle: 'Total enrollment',
                    delay: 'delay-150',
                },
                {
                    title: 'Homeworks Sent',
                    value: data.stats?.my_homework_count?.toString() || '0',
                    icon: CalendarCheck,
                    trend: 'This academic year',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    subtitle: 'Active assignments',
                    delay: 'delay-200',
                },
                {
                    title: 'My Subjects',
                    value: data.stats?.my_subjects_count?.toString() || '0',
                    icon: BarChart2,
                    trend: 'Curriculum coverage',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                    subtitle: 'Unique subjects',
                    delay: 'delay-300',
                },
            ];
        }

        if (data.type === 'parent') {
            return [
                {
                    title: 'Children Enrolled',
                    value: data.stats?.childCount?.toString() || '0',
                    icon: Users,
                    trend: 'In this school',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                    subtitle: 'Total family members',
                    delay: 'delay-100',
                },
                {
                    title: 'Today Attendance',
                    value: '98%',
                    icon: CalendarCheck,
                    trend: 'Regularly attending',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    subtitle: 'Real-time update',
                    delay: 'delay-150',
                },
            ];
        }

        if (data.type === 'student') {
            return [
                {
                    title: 'Average Grade',
                    value: (data.performance?.reduce((acc: any, curr: any) => acc + curr.average, 0) / (data.performance?.length || 1)).toFixed(1) + '%',
                    icon: Award,
                    trend: 'Overall performance',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                    subtitle: 'Current academic standing',
                    delay: 'delay-100',
                },
                {
                    title: 'Scheduled Exams',
                    value: data.upcomingExams?.length?.toString() || '0',
                    icon: CalendarCheck,
                    trend: 'Keep preparing!',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    subtitle: 'Next assessments',
                    delay: 'delay-200',
                },
            ];
        }

        return [];
    };

    const statsCards = getDynamicStats();

    const getMiniStats = () => {
        if (!data) return [];
        
        if (data.type === 'admin') {
            return [
                { label: 'Staff on Leave', value: data.insights?.staffOnLeave?.length?.toString() || '0', icon: Users, color: '#f59e0b' },
                { label: 'New Admissions', value: data.insights?.recentAdmissions?.length?.toString() || '0', icon: GraduationCap, color: 'var(--primary)' },
                { label: 'Today Attendance', value: (data.attendanceTrends?.slice(-1)[0]?.percentage || '0') + '%', icon: CalendarCheck, color: '#10b981' },
            ];
        }

        if (data.type === 'teacher') {
            return [
                { label: 'Urgent Marking', value: data.insights?.urgentMarking?.length?.toString() || '0', icon: PenTool, color: '#f43f5e' },
                { label: 'My Classes Today', value: data.stats?.classCount?.toString() || '0', icon: BookOpen, color: 'var(--primary)' },
                { label: 'Active Homeworks', value: data.stats?.my_homework_count?.toString() || '0', icon: FileBarChart, color: '#10b981' },
            ];
        }

        if (data.type === 'parent') {
            return [
                { label: 'Children Present', value: data.stats?.childCount?.toString() || '0', icon: Users, color: '#10b981' },
                { label: 'Upcoming Exams', value: data.insights?.upcomingExams?.length?.toString() || '0', icon: Calendar, color: '#f59e0b' },
            ];
        }

        return [];
    };

    const activeMiniStats = getMiniStats();

    if (data.type === 'teacher') {
        return <TeacherDashboard data={data} user={user} />;
    }

    return (
        <div className="space-y-10 max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-1000">
            {/* ── Modern Hero Section ── */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-surface-dark p-8 sm:p-12 text-white shadow-2xl shadow-theme/20">
                {/* Visual accents */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)]/5 rounded-full border border-white/10 backdrop-blur-md">
                            <Sparkles size={14} className="text-amber-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        
                        <div className="space-y-2">
                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
                                {greeting()}, <span className="text-primary">{capitalizedRole}</span>.
                            </h1>
                            <p className="text-white/50 text-lg font-medium max-w-xl">
                                Your school's digital command center is ready. Here's what's happening across the campus today.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 pt-4">
                            <button 
                                onClick={() => document.getElementById('quick-actions-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-8 py-4 bg-[var(--card-bg)] text-surface-dark rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl shadow-white/5 active:scale-95"
                            >
                                Home Shortcuts
                            </button>
                        </div>
                    </div>

                    <div className="lg:w-[400px] bg-[var(--card-bg)]/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-widest">Today at a Glance</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        
                        <div className="space-y-4">
                            {activeMiniStats.length > 0 ? activeMiniStats.map((stat) => (
                                <div key={stat.label} className="flex items-center justify-between p-4 bg-[var(--card-bg)]/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-xl bg-[var(--card-bg)]/5 text-white/70 group-hover:text-white transition-colors">
                                            <stat.icon size={18} />
                                        </div>
                                        <span className="text-sm font-bold text-white/70 group-hover:text-white transition-colors">{stat.label}</span>
                                    </div>
                                    <span className="text-lg font-bold text-white">{stat.value}</span>
                                </div>
                            )) : (
                                <div className="text-center py-6 text-white/30 text-xs font-bold uppercase tracking-widest">
                                    No immediate alerts
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Key School Stats ── */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h2 className="text-xl font-bold text-[var(--text-main)] tracking-tight">System <span className="text-primary">Intelligence</span></h2>
                    <button 
                        onClick={() => navigate('/reports')}
                        className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2"
                    >
                        View Detailed Records <ChevronRight size={14} />
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {statsCards.map((stat) => (
                        <StatsCard key={stat.title} {...stat} />
                    ))}
                </div>
                
                {/* ── Role-Specific Overview ── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-6">
                    <div className="xl:col-span-2 space-y-8">
                        {data.type === 'admin' ? (
                            <div className="premium-card p-8">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">Attendance Dynamics</h3>
                                        <p className="text-xs font-medium text-[var(--text-muted)] mt-1">Real-time presence metrics across institutional levels.</p>
                                    </div>
                                    <div className="w-48 relative z-10">
                                        <ComboBox
                                            value={attendanceTimeframe}
                                            onChange={(val) => setAttendanceTimeframe(val as string)}
                                            options={[
                                                { value: '7d', label: 'Last 7 Days' },
                                                { value: '30d', label: 'Last 30 Days' },
                                                { value: '90d', label: 'Last 90 Days' },
                                            ]}
                                            variant="glass"
                                        />
                                    </div>
                                </div>
                                <div className="h-[300px]">
                                    <AttendanceChart data={data.attendanceTrends || []} />
                                </div>
                            </div>
                        ) : data.type === 'teacher' ? (
                            <div className="space-y-8">
                                <div className="premium-card p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">Pending Assessments</h3>
                                        <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full">
                                            {data.insights?.urgentMarking?.length || 0} Required
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {data.insights?.urgentMarking?.map((item: any, i: number) => (
                                            <div key={i} className="p-6 bg-slate-50/50 rounded-3xl border border-[var(--card-border)] hover:border-primary/20 hover:bg-[var(--card-bg)] transition-all group">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="bg-[var(--card-bg)] p-2 rounded-xl shadow-sm text-primary border border-[var(--card-border)]"><PenTool size={18} /></div>
                                                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Entry Missing</span>
                                                </div>
                                                <h4 className="text-sm font-bold text-[var(--text-main)] tracking-tight">{item.exam_name}</h4>
                                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">{item.subject_name}</p>
                                                <div className="mt-6 flex items-center justify-between">
                                                    <div className="flex -space-x-2">
                                                        {[1,2,3].map(j => <div key={j} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />)}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-600">{item.marked_students}/{item.total_students} Indexed</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <QuickActions />
                            </div>
                        ) : <QuickActions />}
                    </div>

                    <div className="space-y-8">
                        <div className="premium-card p-8 flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">Campus Activity</h3>
                                <div className="p-2 bg-slate-50 rounded-xl text-[var(--text-muted)]"><BarChart2 size={18} /></div>
                            </div>
                            <ActivityFeed data={data.activityStream || []} />
                        </div>
                    </div>
                </div>

                {/* ── Supplementary View ── */}
                {data.type === 'admin' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-4">
                        <div className="premium-card p-8">
                            <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight mb-8">Faculty Presence</h3>
                            <div className="space-y-4">
                                {data.insights?.staffOnLeave?.map((s: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-[var(--card-border)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
                                            <span className="text-sm font-bold text-slate-700">{s.name}</span>
                                        </div>
                                        <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[9px] font-bold uppercase tracking-widest rounded-lg border border-amber-100">{s.leave_type}</span>
                                    </div>
                                ))}
                                {(!data.insights?.staffOnLeave || data.insights.staffOnLeave.length === 0) && (
                                    <div className="text-center py-10 text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest italic opacity-50">Operational capacity at 100%</div>
                                )}
                            </div>
                        </div>
                        <div className="premium-card p-8">
                            <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight mb-8">Recent Admissions</h3>
                            <div className="space-y-4">
                                {data.insights?.recentAdmissions?.map((s: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-[var(--card-border)]">
                                        <div>
                                            <h4 className="text-sm font-bold text-[var(--text-main)]">{s.name}</h4>
                                            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{s.grade}</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-primary">{new Date(s.enrollment_date).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="premium-card p-8">
                            <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight mb-8">Performance Index</h3>
                            <SubjectPerformance data={data.insights?.gradePerformance || []} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
