import {
    GraduationCap, Users, CalendarCheck,
    BookOpen, Award, FileBarChart, ChevronRight, Sparkles,
    BarChart2
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



const miniStats = [
    { label: 'Active Classes', value: '48', icon: BookOpen, color: 'var(--primary)', bg: 'var(--primary-50)' },
    { label: 'Scholarships', value: '32', icon: Award, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Monthly Reports', value: '18', icon: FileBarChart, color: '#10b981', bg: '#ecfdf5' },
];

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
                    title: 'Upcoming Exams',
                    value: data.upcomingExams?.length?.toString() || '0',
                    icon: BarChart2,
                    trend: 'To be invigilated',
                    trendUp: true,
                    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    subtitle: 'Next 7 days',
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
                { label: 'Academic Years', value: '1', icon: BookOpen, color: 'var(--primary)', bg: 'var(--primary-50)' },
                { label: 'Open Inquiries', value: '12', icon: Award, color: '#f59e0b', bg: '#fffbeb' },
                { label: 'Reports Ready', value: '5', icon: FileBarChart, color: '#10b981', bg: '#ecfdf5' },
            ];
        }
        return miniStats; // fallback
    };

    const activeMiniStats = getMiniStats();

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
                                Quick Action Hub
                            </button>
                            <button className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-md active:scale-95">
                                Performance Logs
                            </button>
                        </div>
                    </div>

                    {/* Today at a Glance Panel */}
                    <div className="lg:w-[400px] bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest">Today at a Glance</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        
                        <div className="space-y-4">
                            {activeMiniStats.map((stat) => (
                                <div key={stat.label} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-xl bg-white/5 text-white/70 group-hover:text-white transition-colors">
                                            <stat.icon size={18} />
                                        </div>
                                        <span className="text-sm font-bold text-white/70 group-hover:text-white transition-colors">{stat.label}</span>
                                    </div>
                                    <span className="text-lg font-black text-white">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Key Performance Metrics ── */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Key <span className="text-primary">Performance</span> Metrics</h2>
                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2">
                        View Detailed Audit <ChevronRight size={14} />
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {statsCards.map((stat) => (
                        <StatsCard key={stat.title} {...stat} />
                    ))}
                </div>
            </div>

            {/* ── Visual Insights & Workflows ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Attendance Dynamics</h3>
                                <p className="text-xs font-medium text-slate-400 mt-1">Real-time presence tracking across all levels.</p>
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
                    
                    <QuickActions />
                </div>

                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Recent Activity</h3>
                            <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><BarChart2 size={18} className="text-slate-400" /></button>
                        </div>
                        <ActivityFeed data={data.activityStream || []} />
                    </div>
                </div>
            </div>

            {/* ── Supplementary Dashboards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Academic Events</h3>
                    <UpcomingEvents data={data.upcomingExams || []} />
                </div>
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">
                        {data.type === 'student' ? 'My Performance' : 'Academic Health'}
                    </h3>
                    <SubjectPerformance data={data.insights?.gradePerformance || data.performance || []} />
                </div>
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">
                        {data.type === 'admin' ? 'Recent Exams' : 'Quick Insights'}
                    </h3>
                    <ActivityFeed data={data.insights?.recentExams || []} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;