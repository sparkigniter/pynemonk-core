import { useState, useEffect } from 'react';
import { 
    Calendar, Clock, User, 
    BookOpen, MapPin
} from 'lucide-react';
import { TimetableApi } from '../../api/timetable.api';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentTimetable() {
    const { user } = useAuth();
    const [timetable, setTimetable] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 1); // Default to Monday if Sunday

    const DAYS = [
        { id: 1, name: 'Monday' },
        { id: 2, name: 'Tuesday' },
        { id: 3, name: 'Wednesday' },
        { id: 4, name: 'Thursday' },
        { id: 5, name: 'Friday' },
        { id: 6, name: 'Saturday' },
    ];

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            // If it's a student, we might need a specialized endpoint or use their classroom_id
            // For now, let's assume the API handles student-specific context
            const data = await TimetableApi.getByClassroom(user?.student_profile?.classroom_id || 0);
            setTimetable(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const dayEntries = timetable.filter(e => e.day_of_week === selectedDay)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Weekly Schedule</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Class {user?.student_profile?.classroom_name || 'My Schedule'}</p>
                </div>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                    {DAYS.map(day => (
                        <button
                            key={day.id}
                            onClick={() => setSelectedDay(day.id)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                selectedDay === day.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {day.name.slice(0, 3)}
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Schedule...</div>
            ) : dayEntries.length === 0 ? (
                <div className="p-20 bg-white rounded-[3rem] border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                        <Calendar size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">No Classes Scheduled</h2>
                    <p className="text-slate-400 mt-1 font-medium">Enjoy your break or catch up on assignments!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {dayEntries.map((entry, idx) => (
                        <div 
                            key={entry.id} 
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            {/* Time Badge */}
                            <div className="absolute top-0 right-0 p-8">
                                <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-100 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Clock size={14} className="text-primary group-hover:text-white" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{entry.start_time.slice(0, 5)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col h-full justify-between gap-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                                            <BookOpen size={20} />
                                        </div>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Ongoing Course</p>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{entry.subject_name}</h2>
                                    <p className="text-slate-400 font-medium text-sm leading-relaxed">Advanced academic concepts and practical laboratory sessions.</p>
                                </div>

                                <div className="flex items-center gap-8 border-t border-slate-50 pt-6 mt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Professor</p>
                                            <p className="text-xs font-black text-slate-900">{entry.teacher_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                            <MapPin size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                                            <p className="text-xs font-black text-slate-900">Room {entry.room_no || 'TBA'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Daily Inspiration */}
            <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative z-10 flex flex-col items-center text-center">
                    <Sparkles className="text-primary mb-6" size={40} />
                    <h3 className="text-2xl font-black tracking-tight mb-2">Maximize Your Learning</h3>
                    <p className="text-slate-400 text-sm max-w-md font-medium leading-relaxed">
                        "The beautiful thing about learning is that no one can take it away from you."
                    </p>
                </div>
            </div>
        </div>
    );
}

const Sparkles = ({ size, className }: { size: number, className: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="M5 3v4" />
        <path d="M19 17v4" />
        <path d="M3 5h4" />
        <path d="M17 19h4" />
    </svg>
);
