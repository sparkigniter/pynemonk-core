import React, { useState, useEffect, useMemo } from 'react';
import {
    Clock,
    X,
    CheckCircle2,
    PlayCircle,
    Timer,
    ChevronRight,
    Users,
    GraduationCap,
    FileSpreadsheet,
    AlertCircle,
    ArrowRight,
    BookOpen,
    Trash2,
    CalendarX,
    UserCircle2,
    History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimetableApi, type TimetableEntry } from '../../api/timetable.api';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { eventApi } from '../../api/event.api';
import { useNavigate } from 'react-router-dom';

const DAYS = [
    { id: 1, name: 'Monday', short: 'Mon' },
    { id: 2, name: 'Tuesday', short: 'Tue' },
    { id: 3, name: 'Wednesday', short: 'Wed' },
    { id: 4, name: 'Thursday', short: 'Thu' },
    { id: 5, name: 'Friday', short: 'Fri' },
    { id: 6, name: 'Saturday', short: 'Sat' }
];

const TeacherTimetable: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<TimetableEntry | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [periods, setPeriods] = useState<{ period_number: number, start_time: string, end_time: string }[]>([]);
    const [breaks, setBreaks] = useState<{ id: number, name: string, start_time: string, end_time: string, is_break: boolean }[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);

    const [settings, setSettings] = useState<any>(null);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [myStaffProfile, setMyStaffProfile] = useState<any>(null);
    const [roster, setRoster] = useState<any[]>([]);
    const [loadingRoster, setLoadingRoster] = useState(false);

    const getHolidayForDay = (dayId: number) => {
        const dayOfWeek = currentTime.getDay() || 7;
        const diff = dayId - dayOfWeek;
        const targetDate = new Date(currentTime);
        targetDate.setDate(currentTime.getDate() + diff);
        const dateString = targetDate.toISOString().split('T')[0];

        return holidays.find(h => {
            const start = new Date(h.start_date).toISOString().split('T')[0];
            const end = new Date(h.end_date).toISOString().split('T')[0];
            return dateString >= start && dateString <= end;
        });
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchSchedule = async () => {
            setLoading(true);
            try {
                const [res, periodData, breaksData, eventsRes, settingsRes, classroomsRes, profileRes] = await Promise.all([
                    TimetableApi.getGlobalSchedule(),
                    TimetableApi.getPeriods(),
                    TimetableApi.getPeriods(),
                    eventApi.getEvents().catch(() => []),
                    import('../../api/settings.api').then(m => m.getSettings()).catch(() => null),
                    import('../../api/classroom.api').then(m => m.getClassrooms({ limit: 100 })).catch(() => ({ data: [] })),
                    import('../../api/staff.api').then(m => m.getMyStaffProfile()).catch(() => null)
                ]);
                // Filter for current teacher
                const mySchedule = res.filter((t: any) => String(t.teacher_user_id) === String(user?.sub));
                setTimetable(mySchedule);
                setPeriods((periodData || []).map((p: any, idx: number) => ({
                    period_number: idx + 1,
                    start_time: p.start_time,
                    end_time: p.end_time
                })).sort((a: any, b: any) => a.period_number - b.period_number));
                setBreaks(breaksData || []);
                setHolidays((eventsRes || []).filter((e: any) => e.event_type === 'holiday'));
                setSettings(settingsRes);
                setClassrooms(classroomsRes.data || []);
                setMyStaffProfile(profileRes);
            } catch (err) {
                console.error('Failed to fetch teacher schedule', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, [user]);

    useEffect(() => {
        if (!selectedPeriod) {
            setRoster([]);
            return;
        }
        const fetchRoster = async () => {
            setLoadingRoster(true);
            try {
                const todayStr = new Date().toISOString().split('T')[0];
                const { getAttendanceRoster } = await import('../../api/attendance.api');
                const rosterData = await getAttendanceRoster(selectedPeriod.classroom_id, todayStr);
                setRoster(rosterData || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingRoster(false);
            }
        };
        fetchRoster();
    }, [selectedPeriod]);

    const ongoingClass = useMemo(() => {
        if (!timetable.length || !periods.length) return null;
        const now = new Date();
        const currentDay = now.getDay() || 7;
        const nowTime = now.getHours() * 60 + now.getMinutes();

        return timetable.find(t => {
            if (t.day_of_week !== currentDay) return false;
            const [sH, sM] = t.start_time.split(':').map(Number);
            const [eH, eM] = t.end_time.split(':').map(Number);
            const startTime = sH * 60 + sM;
            const endTime = eH * 60 + eM;
            return nowTime >= startTime && nowTime < endTime;
        });
    }, [timetable, periods, currentTime]);

    const nextClass = useMemo(() => {
        if (!timetable.length) return null;
        const now = new Date();
        const currentDay = now.getDay() || 7;
        const nowTime = now.getHours() * 60 + now.getMinutes();

        // Find next today
        const todayNext = timetable
            .filter(t => t.day_of_week === currentDay)
            .filter(t => {
                const [sH, sM] = t.start_time.split(':').map(Number);
                return (sH * 60 + sM) > nowTime;
            })
            .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];

        if (todayNext) return todayNext;

        // Find first next day
        for (let i = 1; i <= 7; i++) {
            const nextDay = ((currentDay + i - 1) % 7) + 1;
            const dayNext = timetable
                .filter(t => t.day_of_week === nextDay)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];
            if (dayNext) return dayNext;
        }

        return null;
    }, [timetable, currentTime]);

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-[var(--card-bg)] rounded-full border-2 border-indigo-50 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-indigo-400" />
                        </div>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-sm font-black text-[var(--text-main)] tracking-tight">Syncing your schedule...</p>
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-2">Setting up your workspace</p>
                </div>
            </div>
        );
    }

    if (timetable.length === 0) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center p-12 text-center">
                <div className="w-48 h-48 bg-slate-50 rounded-[4rem] flex items-center justify-center mb-10 relative">
                    <CalendarX size={80} className="text-slate-200" />
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--card-border)] flex items-center justify-center">
                        <AlertCircle className="text-rose-400" />
                    </div>
                </div>
                <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">No timetable assigned yet</h2>
                <p className="text-[var(--text-muted)] font-medium mt-3 max-w-sm mx-auto leading-relaxed">
                    Your academic schedule hasn't been configured by the administrator.
                </p>
                <div className="flex gap-4 mt-12">
                    <button className="px-10 py-5 bg-surface-dark text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
                        Request Setup
                    </button>
                    <button className="px-10 py-5 bg-[var(--card-bg)] border border-[var(--card-border)] text-slate-600 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                        Contact Admin
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 bg-[#FBFBFE] min-h-screen">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* ── Top Sticky Command Bar ── */}
                <div className="sticky top-4 z-[40] bg-[var(--card-bg)]/70 backdrop-blur-3xl border border-white/40 rounded-[3rem] p-6 shadow-2xl shadow-slate-200/50 flex flex-col lg:flex-row items-center justify-between gap-8 animate-in slide-in-from-top-10 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-surface-dark rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-theme/20">
                            <Clock size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{format(currentTime, 'EEEE')}</h1>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-1">
                                {format(currentTime, 'h:mm:ss a')} • Current Session
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {ongoingClass ? (
                            <div className="flex items-center gap-4 bg-emerald-50/50 border border-emerald-100/50 px-8 py-4 rounded-[2.5rem]">
                                <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                    <PlayCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Ongoing Class</p>
                                    <h4 className="text-sm font-black text-[var(--text-main)] truncate max-w-[200px]">{ongoingClass.subject_name} • {ongoingClass.classroom_name}</h4>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 bg-slate-50 border border-[var(--card-border)] px-8 py-4 rounded-[2.5rem]">
                                <div className="w-10 h-10 bg-slate-200 rounded-2xl flex items-center justify-center text-[var(--text-muted)]">
                                    <History size={20} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Status</p>
                                    <h4 className="text-sm font-black text-[var(--text-main)]">Current Free Period</h4>
                                </div>
                            </div>
                        )}

                        {nextClass && (
                            <div className="flex items-center gap-4 bg-primary/5/50 border border-indigo-100/50 px-8 py-4 rounded-[2.5rem]">
                                <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-theme/20">
                                    <ArrowRight size={20} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-primary uppercase tracking-widest">Next Class</p>
                                    <h4 className="text-sm font-black text-[var(--text-main)] truncate max-w-[200px]">{nextClass.subject_name} ({nextClass.start_time})</h4>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Quick Action Widget ── */}
                {nextClass && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-primary rounded-[3.5rem] p-10 text-white shadow-2xl shadow-theme/20 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--card-bg)]/10 blur-[100px] rounded-full -mr-64 -mt-64" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                            <div className="flex items-center gap-10">
                                <div className="w-24 h-24 bg-[var(--card-bg)]/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 flex items-center justify-center shadow-inner">
                                    <GraduationCap size={48} className="text-indigo-100" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em] mb-3">Up Next in 15 Minutes</p>
                                    <h2 className="text-4xl font-black tracking-tight">{nextClass.subject_name}</h2>
                                    <p className="text-indigo-100/60 font-bold uppercase tracking-widest text-xs mt-2">{nextClass.classroom_name} • Room 402</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedPeriod(nextClass)}
                                className="px-12 py-6 bg-[var(--card-bg)] text-primary rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                            >
                                <CheckCircle2 size={24} />
                                Start Attendance
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── Timetable Grid ── */}
                <div className="bg-[var(--card-bg)] rounded-[4rem] border border-[var(--card-border)] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Weekly Workspace</h2>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Full 6-Day Academic Schedule</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Active Week</span>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <div className="min-w-[1200px]">
                            {/* Days Header */}
                            <div className="grid grid-cols-7 bg-slate-50/30 border-b border-[var(--card-border)]">
                                <div className="p-3 border-r border-[var(--card-border)] flex items-center justify-center text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                    Time Slot
                                </div>
                                {DAYS.map(day => (
                                    <div key={day.id} className="p-3 border-r border-[var(--card-border)] text-center">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{day.name}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Grid Content */}
                            <div className="relative">
                                {periods.map((period) => {
                                    const time = period.start_time.slice(0, 5);
                                    const breakInfo = breaks.find(b => b.is_break && b.start_time.startsWith(time));

                                    return (
                                        <div key={period.period_number} className={`grid grid-cols-7 border-b border-slate-50 min-h-[85px] ${breakInfo ? 'bg-slate-50/50' : ''}`}>
                                            <div className="p-2 border-r border-[var(--card-border)] flex flex-col items-center justify-center bg-slate-50/20">
                                                <span className="text-sm font-black text-[var(--text-main)] tabular-nums">{time}</span>
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Period {period.period_number}</span>
                                            </div>

                                            {DAYS.map(day => {
                                                const entries = timetable.filter(e => e.day_of_week === day.id && e.start_time.startsWith(time));

                                                // Time comparisons
                                                const now = new Date();
                                                const currentDay = now.getDay() || 7;
                                                const nowTime = now.getHours() * 60 + now.getMinutes();
                                                const [sH, sM] = period.start_time.split(':').map(Number);
                                                const [eH, eM] = period.end_time.split(':').map(Number);
                                                const slotStartTime = sH * 60 + sM;
                                                const slotEndTime = eH * 60 + eM;

                                                const isCurrent = day.id === currentDay && nowTime >= slotStartTime && nowTime < slotEndTime;
                                                const isPast = day.id < currentDay || (day.id === currentDay && nowTime >= slotEndTime);

                                                const holiday = getHolidayForDay(day.id);

                                                return (
                                                    <div key={`${day.id}-${time}`} className={`p-2 border-r border-slate-50 group relative transition-all duration-300 ${isCurrent ? 'bg-primary/5/10' : ''}`}>
                                                        {holiday ? (
                                                            <div className="h-full w-full flex flex-col items-center justify-center bg-amber-50/20 border border-amber-100/50 p-2 text-center select-none overflow-hidden min-h-[98px] rounded-2xl">
                                                                <span className="text-[9px] font-black text-amber-700 tracking-wider uppercase mb-1 flex items-center gap-1">🎉 Holiday</span>
                                                                <span className="text-[9px] font-bold text-slate-800 leading-tight truncate w-full" title={holiday.title}>{holiday.title}</span>
                                                                {holiday.description && <span className="text-[8px] font-medium text-slate-500 truncate w-full mt-0.5" title={holiday.description}>{holiday.description}</span>}
                                                            </div>
                                                        ) : breakInfo ? (
                                                            <div className="h-full w-full flex items-center justify-center opacity-30">
                                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 rotate-90 lg:rotate-0">{breakInfo.name}</span>
                                                            </div>
                                                        ) : entries.length > 0 ? (
                                                            entries.map((entry, idx) => {
                                                                const colorSet = [
                                                                    { border: 'border-l-indigo-500', bg: 'bg-primary/5/10' },
                                                                    { border: 'border-l-emerald-500', bg: 'bg-emerald-50/10' },
                                                                    { border: 'border-l-rose-500', bg: 'bg-rose-50/10' },
                                                                    { border: 'border-l-amber-500', bg: 'bg-amber-50/10' }
                                                                ][idx % 4];

                                                                return (
                                                                    <motion.div
                                                                        key={idx}
                                                                        whileHover={{ y: -2, scale: 1.01 }}
                                                                        onClick={() => setSelectedPeriod(entry)}
                                                                        className={`
                                                                            h-full w-full rounded-2xl p-3.5 border shadow-sm cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden group/card
                                                                            ${isCurrent
                                                                                ? 'bg-[var(--card-bg)] border-indigo-400 shadow-2xl shadow-theme/10 ring-[4px] ring-indigo-50'
                                                                                : isPast
                                                                                    ? 'bg-slate-50/50 border-[var(--card-border)] opacity-40 grayscale-[0.3]'
                                                                                    : 'bg-[var(--card-bg)] border-white hover:border-[var(--card-border)] hover:shadow-xl hover:shadow-slate-100'}
                                                                        `}
                                                                    >
                                                                        {/* Color Indicator */}
                                                                        <div className={`absolute top-0 left-0 bottom-0 w-1 ${colorSet.border}`} />

                                                                        {isCurrent && (
                                                                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest z-10 shadow-sm">
                                                                                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> LIVE
                                                                            </div>
                                                                        )}

                                                                        <div>
                                                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                                                <Clock size={10} /> {entry.start_time}
                                                                            </p>
                                                                            <h4 className="font-black text-[var(--text-main)] text-[13px] leading-tight group-hover/card:text-primary transition-colors line-clamp-1">{entry.subject_name}</h4>
                                                                            <p className="text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-widest mt-1">{entry.classroom_name}</p>
                                                                        </div>

                                                                        <div className="flex items-center justify-between mt-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-black text-[var(--text-muted)] border border-[var(--card-border)]">
                                                                                    {entry.teacher_name?.charAt(0) || 'T'}
                                                                                </div>
                                                                                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{entry.teacher_name?.split(' ')[0] || 'Teacher'}</span>
                                                                            </div>
                                                                            <ChevronRight size={12} className="text-slate-200 group-hover/card:text-primary group-hover/card:translate-x-0.5 transition-all" />
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="h-full w-full rounded-[1.5rem] border border-dashed border-slate-100 flex flex-col items-center justify-center gap-1.5 group-hover:border-[var(--card-border)] transition-colors py-4">
                                                                <span className="text-[9px] font-black text-slate-200 uppercase tracking-[0.2em] group-hover:text-slate-300 transition-colors">Free Period</span>
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

            {/* ── Action-Driven Modal ── */}
            <AnimatePresence>
                {selectedPeriod && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedPeriod(null)}
                            className="fixed inset-0 modal-overlay backdrop-blur-xl z-[100]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="fixed inset-x-4 bottom-4 md:inset-0 m-auto md:w-[480px] h-fit bg-[var(--card-bg)] rounded-[2.5rem] p-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] z-[110] overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-1 bg-primary/5 text-primary rounded-xl text-[9px] font-black uppercase tracking-[0.2em]">Workspace</span>
                                        <span className="px-2.5 py-1 bg-slate-50 text-[var(--text-muted)] rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                                            <Timer size={12} /> {selectedPeriod.start_time} - {selectedPeriod.end_time}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tighter leading-none">{selectedPeriod.subject_name}</h2>
                                    <p className="text-sm font-bold text-[var(--text-muted)] tracking-tight">{selectedPeriod.classroom_name}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedPeriod(null)}
                                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-90"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Status Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-[var(--card-border)] flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[var(--card-bg)] rounded-xl shadow-sm flex items-center justify-center">
                                        <Users className="text-indigo-400" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Strength</p>
                                        <h4 className="text-sm font-black text-[var(--text-main)] tracking-tight">42 Students</h4>
                                    </div>
                                </div>
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-[var(--card-border)] flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[var(--card-bg)] rounded-xl shadow-sm flex items-center justify-center">
                                        <UserCircle2 className="text-emerald-400" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Faculty</p>
                                        <h4 className="text-sm font-black text-[var(--text-main)] tracking-tight">{selectedPeriod.teacher_name || 'Primary Teacher'}</h4>
                                    </div>
                                </div>
                            </div>

                            {/* Primary Actions */}
                            <div className="space-y-4">
                                {loadingRoster ? (
                                    <div className="w-full bg-slate-50 p-5 rounded-2xl flex items-center justify-center gap-3">
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Checking Attendance Logs...</span>
                                    </div>
                                ) : (() => {
                                    const attendanceMode = settings?.attendance_mode || 'DAILY';
                                    const classroom = classrooms.find(c => c.id === selectedPeriod.classroom_id);
                                    const isClassTeacher = classroom?.class_teacher_id && myStaffProfile && Number(classroom.class_teacher_id) === Number(myStaffProfile.id);
                                    const attendanceAlreadyTaken = roster.some((s: any) => (s.status && s.status !== 'not_marked') || (s.attendance_status && s.attendance_status !== 'not_marked'));

                                    if (attendanceAlreadyTaken) {
                                        return (
                                            <div className="w-full bg-emerald-50/50 border border-emerald-100 text-emerald-700 p-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-inner select-none">
                                                <CheckCircle2 size={16} />
                                                Attendance Already Marked
                                            </div>
                                        );
                                    }

                                    if (attendanceMode === 'DAILY' && !isClassTeacher) {
                                        return (
                                            <div className="w-full bg-amber-50/50 border border-amber-100 text-amber-700 p-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-inner select-none text-center">
                                                <AlertCircle size={16} />
                                                Daily Mode (Class Teacher Only)
                                            </div>
                                        );
                                    }

                                    return (
                                        <button 
                                            onClick={() => {
                                                setSelectedPeriod(null);
                                                navigate(`/attendance?classId=${selectedPeriod.classroom_id}`);
                                            }}
                                            className="w-full bg-surface-dark text-white p-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-xl hover:brightness-110 active:scale-95 transition-all"
                                        >
                                            <CheckCircle2 size={18} />
                                            Start Attendance
                                        </button>
                                    );
                                })()}

                                <div className="grid grid-cols-2 gap-4">
                                    <button className="bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] p-4 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] flex flex-col items-center gap-2.5 hover:border-primary/20 hover:bg-primary/5 transition-all active:scale-95">
                                        <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                                            <BookOpen size={18} />
                                        </div>
                                        Add Homework
                                    </button>
                                    <button className="bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] p-4 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] flex flex-col items-center gap-2.5 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all active:scale-95">
                                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                            <FileSpreadsheet size={18} />
                                        </div>
                                        Class Notes
                                    </button>
                                </div>
                            </div>

                            {/* Secondary Footer Actions */}
                            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex gap-6">
                                    <button className="group flex items-center gap-2 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-primary transition-colors">
                                        <UserCircle2 size={14} className="group-hover:animate-bounce" /> Swap Teacher
                                    </button>
                                    <button className="group flex items-center gap-2 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-rose-500 transition-colors">
                                        <X size={14} className="group-hover:rotate-90 transition-transform" /> Cancel
                                    </button>
                                </div>
                                <button className="group flex items-center gap-2 text-[9px] font-black text-rose-500 uppercase tracking-widest hover:scale-110 transition-all">
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>

                            {/* Background Decoration */}
                            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-primary/5 rounded-full blur-[80px] opacity-60 pointer-events-none" />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeacherTimetable;
