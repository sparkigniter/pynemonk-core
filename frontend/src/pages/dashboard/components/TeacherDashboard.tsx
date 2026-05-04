import React, { useMemo } from 'react';
import { 
    Calendar, Clock, CheckCircle2, AlertCircle, 
    ChevronRight, BookOpen, PenTool, Sparkles 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TeacherDashboardProps {
    data: {
        stats: any;
        myClasses: any[];
        todaySchedule: any[];
        upcomingExams: any[];
        insights: {
            urgentMarking: any[];
        };
    };
    user: any;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ data, user }) => {
    const navigate = useNavigate();

    // Helper to get current and next class
    const currentContext = useMemo(() => {
        const now = new Date();
        const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

        let active = null;
        let next = null;

        const schedule = [...data.todaySchedule].sort((a, b) => a.start_time.localeCompare(b.start_time));

        for (let i = 0; i < schedule.length; i++) {
            const slot = schedule[i];
            const [h, m, s] = slot.start_time.split(':').map(Number);
            const [eh, em, es] = slot.end_time.split(':').map(Number);
            const startTime = h * 3600 + m * 60 + s;
            const endTime = eh * 3600 + em * 60 + es;

            if (currentTime >= startTime && currentTime <= endTime) {
                active = slot;
                next = schedule[i+1] || null;
                break;
            } else if (currentTime < startTime) {
                next = slot;
                break;
            }
        }

        return { active, next };
    }, [data.todaySchedule]);

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* ── Action-First Hero Section ── */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-hero p-8 sm:p-12 text-white shadow-2xl shadow-primary/20">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="space-y-6 flex-1">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                            <Sparkles size={14} className="text-amber-300" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        
                        <div className="space-y-2">
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1]">
                                {greeting()}, <span className="text-white/90">{user?.first_name || 'Teacher'}</span>.
                            </h1>
                            {currentContext.active ? (
                                <p className="text-white/70 text-lg font-medium max-w-xl">
                                    You are currently in <span className="text-white font-bold">{currentContext.active.classroom_name}</span> for <span className="text-white font-bold">{currentContext.active.subject_name}</span>.
                                </p>
                            ) : (
                                <p className="text-white/70 text-lg font-medium max-w-xl">
                                    {currentContext.next 
                                        ? `Your next class is ${currentContext.next.classroom_name} at ${currentContext.next.start_time.slice(0, 5)}.`
                                        : "No more classes scheduled for today. Great job!"}
                                </p>
                            )}
                        </div>

                        {currentContext.active && (
                            <div className="flex flex-wrap items-center gap-4 pt-4">
                                <button 
                                    onClick={() => navigate(`/attendance?classId=${currentContext.active.classroom_id}`)}
                                    className="px-8 py-4 bg-white text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl shadow-white/10 active:scale-95 flex items-center gap-3"
                                >
                                    <Clock size={16} />
                                    Take Attendance
                                </button>
                                <button className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10 active:scale-95">
                                    View Lesson Plan
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 lg:w-[400px]">
                        {[
                            { label: 'Today Classes', value: data.todaySchedule.length, icon: Calendar, color: 'text-white' },
                            { label: 'My Students', value: data.stats.my_students_count, icon: BookOpen, color: 'text-white' },
                            { label: 'Pending Marks', value: data.insights.urgentMarking.length, icon: AlertCircle, color: 'text-white' },
                            { label: 'HW Active', value: data.stats.my_homework_count, icon: CheckCircle2, color: 'text-white' },
                        ].map((s, i) => (
                            <div key={i} className="p-5 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 space-y-2">
                                <s.icon size={20} className={s.color} />
                                <div className="space-y-0.5">
                                    <p className="text-2xl font-black">{s.value}</p>
                                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* ── Left Column: Urgency & Actions ── */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Attention Needed Section */}
                    {data.insights.urgentMarking.length > 0 && (
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                        Attention Needed <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                    </h3>
                                    <p className="text-xs font-medium text-slate-400 mt-1">Pending tasks that require immediate resolution.</p>
                                </div>
                                <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-100">
                                    {data.insights.urgentMarking.length} Items
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.insights.urgentMarking.map((item, i) => (
                                    <div key={i} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100/50 hover:border-primary/20 hover:bg-primary/5 transition-all group">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="bg-white p-2.5 rounded-xl shadow-sm text-primary"><PenTool size={18} /></div>
                                            <button 
                                                onClick={() => navigate(`/exams/mark-entry/${item.paper_id}`)}
                                                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                            >
                                                Resolve Now
                                            </button>
                                        </div>
                                        <h4 className="text-sm font-black text-slate-800 tracking-tight">{item.exam_name}</h4>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{item.subject_name}</p>
                                        <div className="mt-6">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase">Completion</span>
                                                <span className="text-[10px] font-black text-slate-900">{Math.round((item.marked_students / item.total_students) * 100)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary transition-all duration-500" 
                                                    style={{ width: `${(item.marked_students / item.total_students) * 100}%` }} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Today's Timeline */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Today's Timeline</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Actionable Schedule</p>
                        </div>

                        <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                            {data.todaySchedule.length > 0 ? data.todaySchedule.map((slot, i) => {
                                const isActive = currentContext.active?.id === slot.id;
                                return (
                                    <div key={i} className={`relative flex items-start gap-6 group ${isActive ? 'scale-[1.02]' : 'opacity-70 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'} transition-all duration-300`}>
                                        <div className={`mt-1.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-sm ${isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {slot.attendance_taken ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                        </div>
                                        
                                        <div className={`flex-1 p-6 rounded-[2rem] border transition-all ${isActive ? 'bg-gradient-hero text-white border-white/10 shadow-xl' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:border-primary/20'}`}>
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white/60' : 'text-slate-400'}`}>
                                                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                                        </span>
                                                        {isActive && <span className="px-2 py-0.5 bg-white/20 text-white text-[8px] font-black uppercase tracking-widest rounded">Now Active</span>}
                                                    </div>
                                                    <h4 className="text-base font-black tracking-tight">{slot.classroom_name} | {slot.subject_name}</h4>
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-white/40' : 'text-slate-400'}`}>{slot.grade_name}</p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {!slot.attendance_taken ? (
                                                        <button 
                                                            onClick={() => navigate(`/attendance?classId=${slot.classroom_id}`)}
                                                            className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isActive ? 'bg-white text-primary hover:bg-slate-50' : 'bg-primary text-white hover:bg-primary/90'}`}
                                                        >
                                                            Mark Attendance
                                                        </button>
                                                    ) : (
                                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${isActive ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            <CheckCircle2 size={14} />
                                                            Completed
                                                        </div>
                                                    )}
                                                    <button className={`p-2.5 rounded-xl transition-all ${isActive ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white border border-slate-100 hover:border-primary/20 text-slate-400 hover:text-primary shadow-sm'}`}>
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-12 space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                        <Calendar size={32} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No classes scheduled for today.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right Column: Secondary Data ── */}
                <div className="space-y-8">
                    {/* Upcoming Exams Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Exam Schedule</h3>
                        <div className="space-y-4">
                            {data.upcomingExams.map((exam, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:bg-white transition-all group">
                                    <div className="bg-white p-3 rounded-xl shadow-sm text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 group-hover:text-primary transition-colors">{exam.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {exam.subject_name} • {new Date(exam.exam_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {data.upcomingExams.length === 0 && (
                                <p className="text-center py-6 text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">No upcoming exams.</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Class Selector */}
                    <div className="bg-gradient-sidebar rounded-[2.5rem] p-8 text-white">
                        <h3 className="text-lg font-black tracking-tight mb-6 flex items-center justify-between">
                            My Classes
                            <BookOpen size={18} className="text-white/40" />
                        </h3>
                        <div className="space-y-3">
                            {data.myClasses.map((cls, i) => (
                                <button key={i} className="w-full text-left p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all group flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-black group-hover:text-white transition-colors">{cls.name} - {cls.section}</p>
                                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{cls.grade_name}</p>
                                    </div>
                                    <ChevronRight size={14} className="text-white/20 group-hover:text-white transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
