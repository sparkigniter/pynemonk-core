import { useState } from 'react';
import { 
    CalendarClock, 
    BookOpen, 
    CheckCircle2, 
    Clock, 
    Sparkles, 
    PlayCircle,
    Download
} from 'lucide-react';

export default function SmartPlanner() {
    
    // Mock Data simulating the response from the Auto-Scheduler Engine
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasPlan, setHasPlan] = useState(true);

    const metrics = {
        totalChapters: 12,
        completedTopics: 8,
        totalTopics: 45,
        remainingDays: 120,
        progress: 18 // percentage
    };

    const plannedSessions = [
        {
            id: 1,
            chapter: 'Chapter 1: Real Numbers',
            topic: 'Euclid’s Division Lemma',
            date: 'Today, 10:00 AM',
            status: 'PLANNED',
            type: 'LECTURE',
            resources: ['HOMEWORK']
        },
        {
            id: 2,
            chapter: 'Chapter 1: Real Numbers',
            topic: 'The Fundamental Theorem of Arithmetic',
            date: 'Tomorrow, 11:30 AM',
            status: 'PLANNED',
            type: 'ACTIVITY',
            resources: ['WORKSHEET']
        },
        {
            id: 3,
            chapter: 'Chapter 2: Polynomials',
            topic: 'Geometrical Meaning of Zeroes',
            date: 'Monday, 09:00 AM',
            status: 'PLANNED',
            type: 'LECTURE',
            resources: ['HOMEWORK', 'VIDEO']
        }
    ];

    const generatePlan = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            setHasPlan(true);
        }, 2000);
    };

    return (
        <div className="p-8 bg-slate-50 min-h-[calc(100vh-100px)] rounded-[3rem] border border-[var(--card-border)] shadow-2xl relative flex flex-col overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-5%] left-[-5%] w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full" />

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-600/20 ring-8 ring-indigo-50">
                        <Sparkles size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Smart Syllabus Planner</h1>
                        <p className="text-slate-500 font-semibold mt-1">Auto-generated academic timeline powered by global standards.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md p-2 rounded-[2.5rem] border border-white/60 shadow-xl">
                    <button 
                        onClick={generatePlan}
                        disabled={isGenerating}
                        className="flex items-center gap-3 px-8 py-4 bg-slate-800 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-xl disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <CalendarClock size={20} />
                        )}
                        {hasPlan ? 'Re-Sync Timetable' : 'Auto-Generate Plan'}
                    </button>
                </div>
            </header>

            {!hasPlan ? (
                <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                    <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center mb-8 shadow-2xl border border-slate-100">
                        <BookOpen size={48} className="text-indigo-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">No Active Plan Found</h3>
                    <p className="text-slate-500 font-medium mt-2 max-w-md text-center leading-relaxed">
                        Subscribe this classroom to a Global Syllabus template to automatically generate a day-by-day lesson plan based on your timetable.
                    </p>
                    <button 
                        onClick={generatePlan}
                        className="mt-8 flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-105 shadow-2xl transition-all"
                    >
                        <Sparkles size={18} /> Subscribe & Auto-Plan
                    </button>
                </div>
            ) : (
                <div className="flex-1 relative z-10 flex flex-col">
                    {/* Metrics Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                        {[
                            { label: 'Total Chapters', value: metrics.totalChapters, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Topics Covered', value: `${metrics.completedTopics}/${metrics.totalTopics}`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Remaining Days', value: metrics.remainingDays, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Syllabus Progress', value: `${metrics.progress}%`, icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-lg group hover:bg-white transition-all">
                                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all`}>
                                    <stat.icon size={24} />
                                </div>
                                <div className="text-3xl font-black text-slate-800 mb-1">{stat.value}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Upcoming Sessions</h2>
                        <div className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                            Class 10A • Mathematics
                        </div>
                    </div>

                    {/* Timeline List */}
                    <div className="grid grid-cols-1 gap-6">
                        {plannedSessions.map((session) => (
                            <div key={session.id} className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 flex flex-col md:flex-row md:items-center gap-6 hover:border-indigo-100 hover:shadow-indigo-100/40 transition-all">
                                {/* Date Block */}
                                <div className="w-full md:w-48 flex-shrink-0 bg-slate-50 rounded-3xl p-4 flex flex-col items-center justify-center border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scheduled</span>
                                    <span className="text-sm font-black text-slate-800 text-center">{session.date}</span>
                                </div>

                                {/* Info Block */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                            {session.type}
                                        </span>
                                        <span className="text-sm font-bold text-slate-400">{session.chapter}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">{session.topic}</h3>
                                </div>

                                {/* Actions Block */}
                                <div className="flex items-center gap-3 md:flex-col md:items-end">
                                    {session.resources.includes('HOMEWORK') && (
                                        <button className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all w-full md:w-auto">
                                            <Download size={14} /> Assign Homework
                                        </button>
                                    )}
                                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg w-full md:w-auto">
                                        <PlayCircle size={14} /> Start Session
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
