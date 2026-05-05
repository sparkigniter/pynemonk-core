import React, { useState, useEffect, useMemo } from 'react';
import {
    Clock,
    Plus,
    X,
    CheckCircle2,
    PlayCircle,
    Timer,
    ChevronRight,
    Users,
    ClipboardCheck,
    GraduationCap,
    FileSpreadsheet,
    AlertCircle,
    User,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimetableApi, type TimetableEntry } from '../../api/timetable.api';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const DAYS = [
    { id: 1, name: 'Monday', short: 'Mon' },
    { id: 2, name: 'Tuesday', short: 'Tue' },
    { id: 3, name: 'Wednesday', short: 'Wed' },
    { id: 4, name: 'Thursday', short: 'Thu' },
    { id: 5, name: 'Friday', short: 'Fri' },
    { id: 6, name: 'Saturday', short: 'Sat' }
];

const TIME_SLOTS = Array.from({ length: 9 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
});

const TeacherTimetable: React.FC = () => {
    const { user } = useAuth();
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<TimetableEntry | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [periods, setPeriods] = useState<{ period_number: number, start_time: string, end_time: string }[]>([]);
    const [breaks, setBreaks] = useState<{ id: number, name: string, start_time: string, end_time: string }[]>([]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchSchedule = async () => {
            setLoading(true);
            try {
                const [res, periodData, breakData] = await Promise.all([
                    TimetableApi.getGlobalSchedule(),
                    TimetableApi.getPeriods(),
                    TimetableApi.getBreaks()
                ]);
                // Filter for current teacher
                const mySchedule = res.filter((t: any) => String(t.teacher_user_id) === String(user?.sub));
                setTimetable(mySchedule);
                setPeriods(periodData);
                setBreaks(breakData);
            } catch (err) {
                console.error('Failed to fetch teacher schedule', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, [user]);

    const displayPeriods = useMemo(() => {
        if (periods.length > 0) return periods.map(p => p.start_time.slice(0, 5));
        return TIME_SLOTS.map(t => t.slice(0, 5));
    }, [periods]);

    const ongoingClass = useMemo(() => {
        if (!timetable.length) return null;
        const now = new Date();
        const day = now.getDay() || 7;
        const currentHour = now.getHours();
        
        return timetable.find(t => {
            const startHour = parseInt(t.start_time.split(':')[0]);
            return t.day_of_week === day && currentHour === startHour;
        });
    }, [timetable, currentTime]);

    const nextClass = useMemo(() => {
        if (!timetable.length) return null;
        const now = new Date();
        const day = now.getDay() || 7;
        const currentHour = now.getHours();
        
        return timetable.find(t => {
            const startHour = parseInt(t.start_time.split(':')[0]);
            return t.day_of_week === day && startHour > currentHour;
        }) || timetable.find(t => t.day_of_week > day);
    }, [timetable, currentTime]);

    if (loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Building your live workspace...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* ── Sticky Top Bar ── */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2.5rem] p-6 shadow-2xl shadow-slate-200/40 flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-slate-900 rounded-[1.5rem] text-white shadow-xl rotate-3">
                        <Clock size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">Live Workspace</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                           Teacher Command Center • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {ongoingClass && (
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-emerald-50 border border-emerald-100 px-6 py-4 rounded-[1.5rem] flex items-center gap-4"
                        >
                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                                <PlayCircle size={20} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Ongoing Now</p>
                                <h4 className="text-sm font-bold text-slate-900">{ongoingClass.subject_name} • {ongoingClass.classroom_name}</h4>
                            </div>
                        </motion.div>
                    )}

                    {nextClass && (
                        <div className="bg-slate-50 border border-slate-100 px-6 py-4 rounded-[1.5rem] flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500">
                                <ArrowRight size={20} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Up Next</p>
                                <h4 className="text-sm font-bold text-slate-900">{nextClass.subject_name} at {nextClass.start_time.slice(0,5)}</h4>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Top Widget: Next Class ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Weekly Schedule</h2>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher: {user?.email?.split('@')[0]}</span>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
                            <div className="min-w-[1200px]">
                                <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-50">
                                    <div className="p-4 border-r border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</div>
                                    {DAYS.map(day => (
                                        <div key={day.id} className="p-4 border-r border-slate-100 text-center text-[11px] font-black text-slate-900 uppercase tracking-widest">{day.name}</div>
                                    ))}
                                </div>

                                <div className="relative">
                                {displayPeriods.map((time) => {
                                    const hour = parseInt(time.split(':')[0]);
                                    const breakInfo = breaks.find(b => b.start_time.startsWith(time));
                                    
                                    return (
                                        <div key={time} className={`grid grid-cols-7 border-b border-slate-50 min-h-[140px] ${breakInfo ? 'bg-slate-50/50' : ''}`}>
                                            <div className="p-4 border-r border-slate-100 flex items-center justify-center bg-slate-50/30">
                                                <span className="text-xs font-black text-slate-400 tabular-nums">{time}</span>
                                            </div>
                                            {DAYS.map(day => {
                                                const slotEntries = timetable.filter(e => e.day_of_week === day.id && e.start_time.startsWith(time));
                                                const isCurrent = day.id === (currentTime.getDay() || 7) && hour === currentTime.getHours();
                                                const isPast = day.id < (currentTime.getDay() || 7) || (day.id === (currentTime.getDay() || 7) && hour < currentTime.getHours());

                                                return (
                                                    <div 
                                                        key={`${day.id}-${time}`} 
                                                        className={`p-3 border-r border-slate-50 relative group transition-all duration-500 ${isCurrent ? 'bg-indigo-50/30' : ''}`}
                                                    >
                                                        {breakInfo ? (
                                                            <div className="h-full w-full flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 rotate-90 xl:rotate-0">{breakInfo.name}</span>
                                                            </div>
                                                        ) : slotEntries.length > 0 ? (
                                                            slotEntries.map((entry, idx) => (
                                                                    <motion.div
                                                                        key={idx}
                                                                        whileHover={{ y: -4, scale: 1.02 }}
                                                                        onClick={() => setSelectedPeriod(entry)}
                                                                        className={`
                                                                            h-full w-full rounded-2xl p-4 shadow-sm border-2 cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden
                                                                            ${isCurrent 
                                                                                ? 'bg-white border-indigo-500 shadow-indigo-200/50 shadow-xl ring-4 ring-indigo-50' 
                                                                                : isPast ? 'bg-slate-50/50 border-slate-100 opacity-50 grayscale-[0.5]' : 'bg-white border-white hover:border-slate-200 shadow-slate-200/50'}
                                                                        `}
                                                                    >
                                                                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-600" />
                                                                        
                                                                        {isCurrent && (
                                                                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest z-10">
                                                                                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> LIVE
                                                                            </div>
                                                                        )}

                                                                        <div>
                                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{entry.start_time} - {entry.end_time}</p>
                                                                            <h4 className="font-black text-slate-900 text-sm leading-tight line-clamp-2">{entry.subject_name}</h4>
                                                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 truncate">{entry.classroom_name}</p>
                                                                        </div>

                                                                        <div className="flex items-center justify-between mt-4">
                                                                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-400">TJ</div>
                                                                            <ChevronRight size={14} className="text-slate-200 group-hover:text-indigo-500" />
                                                                        </div>
                                                                    </motion.div>
                                                                ))
                                                            ) : (
                                                                <div className="h-full w-full rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Free Period</span>
                                                                    <Plus size={14} className="text-slate-200" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <aside className="space-y-8">
                    {/* ── Ongoing Class Card ── */}
                    {ongoingClass ? (
                        <div className="bg-indigo-600 rounded-[3rem] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-10">
                                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">Live Session</span>
                                    <div className="flex items-center gap-2 text-[10px] font-black">
                                        <Timer size={16} className="animate-pulse" /> 45:00 Remaining
                                    </div>
                                </div>
                                
                                <h3 className="text-3xl font-black mb-1">{ongoingClass.subject_name}</h3>
                                <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-10">{ongoingClass.classroom_name} • Room 302</p>

                                <div className="space-y-4">
                                    <button className="w-full bg-white text-indigo-600 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-transform">
                                        <CheckCircle2 size={18} />
                                        Mark Attendance
                                    </button>
                                    <button className="w-full bg-indigo-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-indigo-400 transition-colors">
                                        <FileSpreadsheet size={18} />
                                        Post Class Notes
                                    </button>
                                </div>
                            </div>
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
                        </div>
                    ) : (
                        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm text-center py-16">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle size={32} className="text-slate-200" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800">No Ongoing Class</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 px-6 leading-relaxed">You are currently in a break or free period.</p>
                        </div>
                    )}

                    {/* ── Daily Insights ── */}
                    <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Workload Insights</h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <GraduationCap size={24} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Classes</p>
                                    <h4 className="text-lg font-black text-slate-900">{timetable.length} this week</h4>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Students Handled</p>
                                    <h4 className="text-lg font-black text-slate-900">~240 Learners</h4>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                                    <ClipboardCheck size={24} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Marking Duty</p>
                                    <h4 className="text-lg font-black text-slate-900">4 Pending Exams</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* ── Period Detail Modal ── */}
            <AnimatePresence>
                {selectedPeriod && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedPeriod(null)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 m-auto w-[600px] h-fit bg-white rounded-[3rem] p-10 shadow-2xl z-[110] overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">{selectedPeriod.classroom_name}</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12} /> {selectedPeriod.start_time} - {selectedPeriod.end_time}</span>
                                    </div>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">{selectedPeriod.subject_name}</h2>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-3">Scheduled Period • Unified Workflow</p>
                                </div>
                                <button onClick={() => setSelectedPeriod(null)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all">
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-10">
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm"><Users size={20} /></div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Section</p>
                                        <h4 className="font-bold text-slate-900">{selectedPeriod.classroom_name}</h4>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm"><User size={20} /></div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Faculty</p>
                                        <h4 className="font-bold text-slate-900">{selectedPeriod.teacher_name || 'Assigned to You'}</h4>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button className="w-full bg-indigo-600 text-white p-6 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center gap-4 shadow-xl shadow-indigo-100 active:scale-95 transition-transform">
                                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center"><CheckCircle2 size={22} /></div>
                                    Start Attendance
                                </button>
                                <div className="grid grid-cols-2 gap-4">
                                    <button className="bg-white border-2 border-slate-100 text-slate-900 p-6 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 active:bg-slate-50 transition-colors">
                                        <Plus size={18} /> Homework
                                    </button>
                                    <button className="bg-white border-2 border-slate-100 text-slate-900 p-6 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 active:bg-slate-50 transition-colors">
                                        <FileSpreadsheet size={18} /> Notes
                                    </button>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex gap-4">
                                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors">Mark Cancelled</button>
                                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-500 transition-colors">Swap Teacher</button>
                                </div>
                                <button onClick={() => setSelectedPeriod(null)} className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    Close Details <ChevronRight size={14} />
                                </button>
                            </div>
                            
                            {/* Accent blur */}
                            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeacherTimetable;
