import {
    GraduationCap, Users, CalendarCheck, DollarSign,
    BookOpen, Award, FileBarChart, ChevronRight, Sparkles
} from 'lucide-react';
import StatsCard from '../components/ui/StatsCard';
import AttendanceChart from '../components/ui/AttendanceChart';
import QuickActions from '../components/ui/QuickActions';
import ActivityFeed from '../components/ui/ActivityFeed';
import UpcomingEvents from '../components/ui/UpcomingEvents';
import TopStudents from '../components/ui/TopStudents';
import SubjectPerformance from '../components/ui/SubjectPerformance';

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
    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Hero Header */}
            <div
                className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white animate-fade-in-up"
                style={{
                    background: 'linear-gradient(135deg, var(--hero-from) 0%, var(--hero-via) 40%, var(--hero-to) 100%)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
                    transition: 'background 0.4s ease'
                }}
            >
                {/* Decorative circles */}
                <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)' }} />
                <div className="absolute right-32 -bottom-20 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #c4b5fd, transparent)' }} />
                <div className="absolute left-1/2 top-0 w-32 h-32 rounded-full opacity-5" style={{ background: 'white' }} />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={16} className="text-yellow-300" />
                            <span className="opacity-80 text-sm font-medium" style={{ color: 'var(--primary-light)' }}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white leading-tight">
                            {greeting()}, Principal! 👋
                        </h1>
                        <p className="opacity-80 text-sm mt-1.5 max-w-md" style={{ color: 'var(--primary-light)' }}>
                            Here's what's happening at EduERP today. All systems operational.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                            id="generate-report-btn"
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur-sm rounded-xl text-sm font-semibold text-white border border-white/20 hover:bg-white/25 transition-all"
                        >
                            <FileBarChart size={16} />
                            Generate Report
                        </button>
                        <button
                            id="view-analytics-btn"
                            className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
                            style={{ color: 'var(--primary-dark)' }}
                        >
                            Analytics
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Mini stats row */}
                <div className="relative z-10 flex flex-wrap items-center gap-6 mt-6 pt-5 border-t border-white/10">
                    {miniStats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                                    <Icon size={15} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-white leading-none">{stat.value}</p>
                                    <p className="text-xs opacity-70" style={{ color: 'var(--primary-light)' }}>{stat.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {statsData.map((stat) => (
                    <StatsCard key={stat.title} {...stat} />
                ))}
            </div>

            {/* Quick Actions */}
            <QuickActions />

            {/* Main grid - chart + activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                    <AttendanceChart />
                </div>
                <div>
                    <ActivityFeed />
                </div>
            </div>

            {/* Bottom grid - events + top students + subject performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                <UpcomingEvents />
                <TopStudents />
                <SubjectPerformance />
            </div>
        </div>
    );
};

export default Dashboard;