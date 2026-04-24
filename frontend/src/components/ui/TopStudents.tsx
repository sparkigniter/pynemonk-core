import React from 'react';
import { Star } from 'lucide-react';

interface Student {
    id: number;
    name: string;
    grade: string;
    score: number;
    initials: string;
    gradient: string;
    change: number;
}

const students: Student[] = [
    { id: 1, name: 'Sophia Carter', grade: 'Grade 12-A', score: 98.5, initials: 'SC', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', change: 2.1 },
    { id: 2, name: 'Liam Johnson', grade: 'Grade 11-B', score: 97.2, initials: 'LJ', gradient: 'linear-gradient(135deg, #10b981, #059669)', change: 1.5 },
    { id: 3, name: 'Ava Martinez', grade: 'Grade 12-B', score: 96.8, initials: 'AM', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', change: 0.8 },
    { id: 4, name: 'Noah Williams', grade: 'Grade 10-A', score: 95.4, initials: 'NW', gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)', change: 3.2 },
    { id: 5, name: 'Isabella Brown', grade: 'Grade 11-A', score: 94.9, initials: 'IB', gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)', change: 1.1 },
];

const TopStudents: React.FC = () => {
    return (
        <div className="space-y-4">
            <div className="space-y-1">
                {students.map((student, idx) => (
                    <div
                        key={student.id}
                        className="flex items-center gap-4 p-4 rounded-[1.5rem] hover:bg-slate-50 transition-all duration-300 cursor-pointer group animate-fade-in-up"
                        style={{ animationDelay: `${idx * 80}ms` }}
                    >
                        {/* Rank Icon */}
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-xl">
                            {idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{idx + 1}</span>}
                        </div>

                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-primary font-black text-xs flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            {student.initials}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors tracking-tight">
                                {student.name}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{student.grade}</p>
                        </div>

                        {/* Score & Growth */}
                        <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-2 justify-end">
                                <Star size={14} className="text-amber-400 fill-amber-400" />
                                <span className="text-sm font-black text-slate-900 tracking-tight">{student.score}</span>
                            </div>
                            <div className="flex items-center gap-1.5 justify-end mt-1">
                                <div className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-tighter">
                                    +{student.change}%
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-4 py-4 rounded-2xl border border-dashed border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:border-primary/20 hover:text-primary hover:bg-primary/5 transition-all duration-300">
                View Full Leaderboard
            </button>
        </div>
    );
};

export default TopStudents;
