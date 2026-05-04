import {
    GraduationCap, Users, CalendarCheck,
    BookOpen, Award, FileBarChart, ChevronRight, Sparkles,
    BarChart2, PenTool, Calendar, Layout
} from 'lucide-react';
import StatsCard from '../../components/ui/StatsCard';
import AttendanceChart from '../../components/ui/AttendanceChart';
import QuickActions from '../../components/ui/QuickActions';
import ActivityFeed from '../../components/ui/ActivityFeed';
import UpcomingEvents from '../../components/ui/UpcomingEvents';
import SubjectPerformance from '../../components/ui/SubjectPerformance';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardData } from '../../api/dashboard.api';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ComboBox } from '../../components/ui/ComboBox';
import TeacherDashboard from './components/TeacherDashboard';

const Dashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await getDashboardData();
                setData(res);
            } catch (err) {
                console.error('Failed to fetch dashboard', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="h-[70vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
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
        <div className="space-y-10 max-w-[1600px] mx-auto pb-10">
            {/* ── Modern Hero Section ── */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 sm:p-12 text-white shadow-2xl shadow-slate-200/50">
                {/* Visual accents */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                            <Sparkles size={14} className="text-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        
                        <div className="space-y-2">
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1]">
                                {greeting()}, <span className="text-primary">{capitalizedRole}</span>.
                            </h1>
                            <p className="text-white/50 text-lg font-medium max-w-xl">
                                Your school's digital command center is ready. Here's what's happening across the campus today.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 pt-4">
                            <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl shadow-white/5 active:scale-95">
                                Home Shortcuts
                            </button>
                        </div>
                    </div>

                    <div className="lg:w-[400px] bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest">Today at a Glance</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        
                        <div className="space-y-4">
                            {activeMiniStats.length > 0 ? activeMiniStats.map((stat) => (
                                <div key={stat.label} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-xl bg-white/5 text-white/70 group-hover:text-white transition-colors">
                                            <stat.icon size={18} />
                                        </div>
                                        <span className="text-sm font-bold text-white/70 group-hover:text-white transition-colors">{stat.label}</span>
                                    </div>
                                    <span className="text-lg font-black text-white">{stat.value}</span>
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
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Main <span className="text-primary">School</span> Stats</h2>
                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2">
                        View Full Records <ChevronRight size={14} />
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {statsCards.map((stat) => (
                        <StatsCard key={stat.title} {...stat} />
                    ))}
                </div>
                {/* ── Role-Specific Overview ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    {data.type === 'admin' ? (
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Student Attendance Trends</h3>
                                    <p className="text-xs font-medium text-slate-400 mt-1">Daily presence tracking across the school.</p>
                                </div>
                                <ComboBox
                                    value="Last 30 Days"
                                    onChange={() => {}}
                                    options={[
                                        { value: 'Last 30 Days', label: 'Last 30 Days' },
                                        { value: 'This Term', label: 'This Term' },
                                        { value: 'Academic Year', label: 'Academic Year' },
                                    ]}
                                    className="w-48"
                                />
                            </div>
                            <AttendanceChart data={data.attendanceTrends || []} />
                        </div>
                    ) : data.type === 'teacher' ? (
                        <div className="space-y-8">
                            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Pending Marks Entry</h3>
                                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                                        {data.insights?.urgentMarking?.length || 0} Records
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.insights?.urgentMarking?.map((item: any, i: number) => (
                                        <div key={i} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100/50 hover:border-primary/20 hover:bg-primary/5 transition-all group">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="bg-white p-2 rounded-xl shadow-sm text-primary"><PenTool size={18} /></div>
                                                <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Entry Missing</span>
                                            </div>
                                            <h4 className="text-sm font-black text-slate-800 tracking-tight">{item.exam_name}</h4>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{item.subject_name}</p>
                                            <div className="mt-6 flex items-center justify-between">
                                                <div className="flex -space-x-2">
                                                    {[1,2,3].map(j => <div key={j} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />)}
                                                </div>
                                                <span className="text-[10px] font-black text-slate-900">{item.marked_students}/{item.total_students} Done</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!data.insights?.urgentMarking || data.insights.urgentMarking.length === 0) && (
                                        <div className="col-span-full py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                            All exams marked. Great job!
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <QuickActions />
                        </div>
                    ) : data.type === 'parent' ? (
                        <div className="space-y-8">
                            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                                <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Academic Progress</h3>
                                <div className="space-y-6">
                                    {data.insights?.performance?.map((p: any, i: number) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{p.student_name} • {p.subject_name}</span>
                                                <span className="text-sm font-black text-primary">{p.score}%</span>
                                            </div>
                                            <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <div className="h-full bg-primary transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)]" style={{ width: `${p.score}%` }} />
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
                    {data.type === 'admin' ? (
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col h-full">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">School Activity</h3>
                                <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><BarChart2 size={18} className="text-slate-400" /></button>
                            </div>
                            <ActivityFeed data={data.activityStream || []} />
                        </div>
                    ) : data.type === 'teacher' ? (
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm h-full">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Daily Schedule</h3>
                            <div className="space-y-4">
                                {data.upcomingExams?.map((exam: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:bg-white transition-all">
                                        <div className="bg-primary/10 p-3 rounded-xl text-primary"><Calendar size={20} /></div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800">{exam.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{exam.subject_name} • {new Date(exam.exam_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Academic Events</h3>
                            <UpcomingEvents data={data.upcomingExams || []} />
                        </div>
                    )}
                </div>
            </div>
            </div>

            {/* ── Supplementary Role-Based Dashboards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {data.type === 'admin' ? (
                    <>
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Staff Status</h3>
                            <div className="space-y-4">
                                {data.insights?.staffOnLeave?.map((s: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200" />
                                            <span className="text-sm font-bold text-slate-700">{s.name}</span>
                                        </div>
                                        <span className="px-2 py-1 bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest rounded-md">{s.leave_type}</span>
                                    </div>
                                ))}
                                {(!data.insights?.staffOnLeave || data.insights.staffOnLeave.length === 0) && (
                                    <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest italic">All staff present today.</div>
                                )}
                            </div>
                        </div>
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">New Student Admissions</h3>
                            <div className="space-y-4">
                                {data.insights?.recentAdmissions?.map((s: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-700">{s.name}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{s.grade}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-primary">{new Date(s.enrollment_date).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Grade Distribution</h3>
                            <SubjectPerformance data={data.insights?.gradePerformance || []} />
                        </div>
                    </>
                ) : data.type === 'teacher' ? (
                    <>
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">My Classes Hub</h3>
                            <div className="space-y-3">
                                {data.myClasses?.map((cls: any, i: number) => (
                                    <div key={i} className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100/50 hover:bg-white transition-all flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary font-black group-hover:bg-primary group-hover:text-white transition-all">
                                                {cls.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800">{cls.name} - {cls.section}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cls.grade_name}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-2 bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden flex items-center justify-between">
                            <div className="relative z-10 space-y-6 max-w-lg">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                                    <Sparkles size={14} className="text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Daily Spotlight</span>
                                </div>
                                <h3 className="text-3xl font-black tracking-tight leading-tight">Focus on Student Well-being.</h3>
                                <p className="text-white/50 text-sm font-medium">Review your daily class logs and check for student attendance streaks to identify those who may need additional academic support this week.</p>
                            </div>
                            <div className="absolute right-0 bottom-0 p-12 opacity-10"><Layout size={200} /></div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Exam Milestones</h3>
                            <UpcomingEvents data={data.insights?.upcomingExams || []} />
                        </div>
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm md:col-span-2">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Subject-wise Progress</h3>
                            <SubjectPerformance data={data.insights?.performance || []} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
