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
    { subject: 'Social Studies', score: 84, color: 'var(--primary)', gradient: 'linear-gradient(90deg, var(--primary), var(--primary-light))' },
    { subject: 'Computer Science', score: 95, color: 'var(--primary)', gradient: 'linear-gradient(90deg, var(--primary), var(--primary-light))' },
];

interface SubjectPerformanceProps {
    data?: any[];
}

const SubjectPerformance: React.FC<SubjectPerformanceProps> = ({ data = [] }) => {
    const displaySubjects = data.length > 0 ? data.map(item => ({
        subject: item.subject_name || item.grade_name || 'General',
        score: Math.round(item.average || item.average_percentage || 0),
        color: 'var(--primary)',
        gradient: 'linear-gradient(90deg, var(--primary), var(--primary-light))'
    })) : subjects;

    const averageScore = Math.round(displaySubjects.reduce((a, b) => a + b.score, 0) / (displaySubjects.length || 1));

    return (
        <div className="space-y-6">
            <div className="space-y-5">
                {displaySubjects.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
                        <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.subject}</span>
                            <span className="text-xs font-black text-slate-900 tracking-tighter">{item.score}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{
                                    width: `${item.score}%`,
                                    backgroundColor: item.color.startsWith('#') ? item.color : 'var(--primary)'
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Overall Metric Section */}
            <div className="mt-8 p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Global Average</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">
                            {averageScore}
                        </span>
                        <span className="text-sm font-black text-primary/40">%</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Institutional Rank</p>
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-xl font-black text-slate-900 tracking-tight">#3</span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">of 12 Schools</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubjectPerformance;
