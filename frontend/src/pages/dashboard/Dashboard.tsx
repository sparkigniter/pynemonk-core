import {
    GraduationCap, Users, CalendarCheck, DollarSign,
    BookOpen, Award, FileBarChart, ChevronRight, Sparkles,
    BarChart2
} from 'lucide-react';
import StatsCard from '../../components/ui/StatsCard';
import AttendanceChart from '../../components/ui/AttendanceChart';
import QuickActions from '../../components/ui/QuickActions';
import ActivityFeed from '../../components/ui/ActivityFeed';
import UpcomingEvents from '../../components/ui/UpcomingEvents';
import TopStudents from '../../components/ui/TopStudents';
import SubjectPerformance from '../../components/ui/SubjectPerformance';
import { useAuth } from '../../contexts/AuthContext';

const statsData = [
    {
        title: 'Total Students',
        value: '1,248',
        icon: GraduationCap,
        trend: '+12 this month',
        trendUp: true,
        gradient: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
        subtitle: 'Enrolled this year',
        delay: 'delay-100',
    },
    {
        title: 'Total Teachers',
        value: '84',
        icon: Users,
        trend: '+2 this month',
        trendUp: true,
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        subtitle: 'Active faculty',
        delay: 'delay-150',
    },
    {
        title: "Today's Attendance",
        value: '96.4%',
        icon: CalendarCheck,
        trend: '-0.5% from yesterday',
        trendUp: false,
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        subtitle: '1,203 of 1,248 present',
        delay: 'delay-200',
    },
    {
        title: 'Fee Collection',
        value: '$45.2K',
        icon: DollarSign,
        trend: '+8% from last month',
        trendUp: true,
        gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
        subtitle: 'April 2025',
        delay: 'delay-300',
    },
];

const miniStats = [
    { label: 'Active Classes', value: '48', icon: BookOpen, color: 'var(--primary)', bg: 'var(--primary-50)' },
    { label: 'Scholarships', value: '32', icon: Award, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Monthly Reports', value: '18', icon: FileBarChart, color: '#10b981', bg: '#ecfdf5' },
];

const Dashboard = () => {
    const { user } = useAuth();
    
    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const hasPermission = (requiredPermissions: string[]) => {
        if (!user) return false;
        return user.permissions?.some((p: string) => requiredPermissions.includes(p)) ?? false;
    };

    const primaryRole = user?.roles[0] || 'User';
    const capitalizedRole = primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1).replace('_', ' ');

    const filteredStats = statsData.filter(stat => {
        if (stat.title === 'Fee Collection') return hasPermission(['fee:read']);
        if (stat.title === 'Total Teachers') return hasPermission(['staff:read']);
        return true;
    });

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
                            {miniStats.map((stat) => (
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
                    {filteredStats.map((stat) => (
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
                            <select className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none">
                                <option>Last 30 Days</option>
                                <option>This Term</option>
                            </select>
                        </div>
                        <AttendanceChart />
                    </div>
                    
                    <QuickActions />
                </div>

                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Recent Activity</h3>
                            <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><BarChart2 size={18} className="text-slate-400" /></button>
                        </div>
                        <ActivityFeed />
                    </div>
                </div>
            </div>

            {/* ── Supplementary Dashboards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Academic Events</h3>
                    <UpcomingEvents />
                </div>
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Top Scholars</h3>
                    <TopStudents />
                </div>
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Subject Pulse</h3>
                    <SubjectPerformance />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;