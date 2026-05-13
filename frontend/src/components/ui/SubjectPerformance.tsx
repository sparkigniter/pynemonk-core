import React from 'react';
import { TrendingUp } from 'lucide-react';

interface SubjectPerformanceProps {
    data?: any[];
}

const SubjectPerformance: React.FC<SubjectPerformanceProps> = ({ data = [] }) => {
    const displaySubjects = data.length > 0 ? data.map(item => ({
        subject: item.subject_name || item.grade_name || 'General',
        score: Math.round(item.average || item.average_percentage || 0),
        color: 'var(--primary)',
        gradient: 'linear-gradient(90deg, var(--primary), var(--primary-light))'
    })) : [];

    const averageScore = displaySubjects.length > 0
        ? Math.round(displaySubjects.reduce((a, b) => a + b.score, 0) / displaySubjects.length)
        : null;

    return (
        <div className="space-y-6">
            <div className="space-y-5">
                {displaySubjects.length > 0 ? displaySubjects.slice(0, 5).map((item, idx) => (
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
                )) : (
                    <div className="py-12 text-center space-y-3 opacity-40">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                            <TrendingUp size={24} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest">No exam data available yet</p>
                    </div>
                )}
            </div>

            {/* Overall Metric Section */}
            <div className="mt-8 p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Global Average</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">
                            {averageScore !== null ? averageScore : '--'}
                        </span>
                        <span className="text-sm font-black text-primary/40">%</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-xl font-black text-emerald-600 tracking-tight">Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubjectPerformance;
