import React from 'react';
import { Star, TrendingUp } from 'lucide-react';

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
        <div className="card p-6 animate-fade-in-up delay-300">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-base font-semibold text-slate-800 font-heading">Top Students</h3>
                    <p className="text-xs text-slate-400 mt-0.5">By overall score this term</p>
                </div>
                <button className="text-xs font-medium text-primary hover:opacity-80 transition-colors">
                    View all →
                </button>
            </div>

            <div className="space-y-3">
                {students.map((student, idx) => (
                    <div
                        key={student.id}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group animate-fade-in-up"
                        style={{ animationDelay: `${idx * 80}ms` }}
                    >
                        {/* Rank */}
                        <span className="text-sm font-bold text-slate-300 w-5 text-center flex-shrink-0">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                        </span>

                        {/* Avatar */}
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: student.gradient }}
                        >
                            {student.initials}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">
                                {student.name}
                            </p>
                            <p className="text-xs text-slate-400">{student.grade}</p>
                        </div>

                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-1 justify-end">
                                <Star size={11} className="text-amber-400 fill-amber-400" />
                                <span className="text-sm font-bold text-slate-800">{student.score}</span>
                            </div>
                            <div className="flex items-center gap-0.5 justify-end">
                                <TrendingUp size={10} className="text-emerald-500" />
                                <span className="text-xs text-emerald-600 font-medium">+{student.change}%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopStudents;
