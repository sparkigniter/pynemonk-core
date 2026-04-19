import React from 'react';

interface SubjectData {
    subject: string;
    score: number;
    color: string;
    gradient: string;
}

const subjects: SubjectData[] = [
    { subject: 'Mathematics', score: 87, color: '#6366f1', gradient: 'linear-gradient(90deg, #6366f1, #8b5cf6)' },
    { subject: 'Science', score: 92, color: '#10b981', gradient: 'linear-gradient(90deg, #10b981, #34d399)' },
    { subject: 'English', score: 78, color: '#f59e0b', gradient: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
    { subject: 'Social Studies', score: 84, color: '#0ea5e9', gradient: 'linear-gradient(90deg, #0ea5e9, #38bdf8)' },
    { subject: 'Computer Science', score: 95, color: '#8b5cf6', gradient: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' },
];

const SubjectPerformance: React.FC = () => {
    return (
        <div className="card p-6 animate-fade-in-up delay-400">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-base font-semibold text-slate-800 font-heading">Subject Performance</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Average scores this semester</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">
                    This Semester
                </span>
            </div>

            <div className="space-y-4">
                {subjects.map((item, idx) => (
                    <div key={item.subject} className="animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-slate-700">{item.subject}</span>
                            <span className="text-sm font-bold text-slate-800">{item.score}%</span>
                        </div>
                        <div className="progress-bar" style={{ height: '8px' }}>
                            <div
                                className="progress-fill h-full rounded-full"
                                style={{
                                    width: `${item.score}%`,
                                    background: item.gradient,
                                    boxShadow: `0 2px 8px ${item.color}40`
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Overall */}
            <div className="mt-5 p-3 rounded-xl flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))' }}>
                <div>
                    <p className="text-xs font-medium text-slate-500">Overall Average</p>
                    <p className="text-xl font-bold text-slate-800">
                        {Math.round(subjects.reduce((a, b) => a + b.score, 0) / subjects.length)}%
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400">Rank</p>
                    <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>#3 of 12</p>
                </div>
            </div>
        </div>
    );
};

export default SubjectPerformance;
