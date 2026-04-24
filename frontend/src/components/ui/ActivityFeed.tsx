import React from 'react';
import { Clock } from 'lucide-react';

interface ActivityItem {
    id: number;
    title: string;
    subtitle: string;
    time: string;
    emoji: string;
    color: string;
}

const activities: ActivityItem[] = [
    { id: 1, title: 'Emma Johnson enrolled', subtitle: 'Grade 10 · Section A', time: '2m ago', emoji: '🎓', color: '#6366f1' },
    { id: 2, title: 'Fee payment received', subtitle: '$800 from Sarah Williams', time: '18m ago', emoji: '💰', color: '#10b981' },
    { id: 3, title: 'Attendance marked', subtitle: 'Grade 8-B: 94% present', time: '45m ago', emoji: '✅', color: '#0ea5e9' },
    { id: 4, title: 'New teacher added', subtitle: 'Mr. David Lee · Math', time: '1h ago', emoji: '👨‍🏫', color: '#f59e0b' },
    { id: 5, title: 'Exam result uploaded', subtitle: 'Mid-term: Grade 11', time: '2h ago', emoji: '📝', color: '#8b5cf6' },
    { id: 6, title: 'Parent meeting scheduled', subtitle: 'Tomorrow · 10:00 AM', time: '3h ago', emoji: '📅', color: '#f43f5e' },
];

const ActivityFeed: React.FC = () => {
    return (
        <div className="flex-1 space-y-2">
            <div className="space-y-1">
                {activities.map((item, idx) => (
                    <div
                        key={item.id}
                        className="flex items-start gap-4 p-4 rounded-[1.5rem] hover:bg-slate-50 transition-all duration-300 cursor-pointer group animate-fade-in-up"
                        style={{ animationDelay: `${idx * 60}ms` }}
                    >
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
                            style={{ background: `${item.color}10` }}
                        >
                            {item.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors truncate tracking-tight">
                                {item.title}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{item.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                            <Clock size={12} className="text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.time}</span>
                        </div>
                    </div>
                ))}
            </div>
            
            <button className="w-full mt-4 py-4 rounded-2xl border border-dashed border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:border-primary/20 hover:text-primary hover:bg-primary/5 transition-all duration-300">
                View Full Audit Logs
            </button>
        </div>
    );
};

export default ActivityFeed;
