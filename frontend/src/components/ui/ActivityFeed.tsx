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
        <div className="card p-6 animate-fade-in-up delay-200">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-base font-semibold text-slate-800 font-heading">Recent Activity</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Latest updates from your school</p>
                </div>
                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                    View all →
                </button>
            </div>

            <div className="space-y-1">
                {activities.map((item, idx) => (
                    <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group animate-fade-in-up"
                        style={{ animationDelay: `${idx * 60}ms` }}
                    >
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                            style={{ background: `${item.color}18` }}
                        >
                            {item.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 group-hover:text-indigo-700 transition-colors truncate">
                                {item.title}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                            <Clock size={11} className="text-slate-300" />
                            <span className="text-xs text-slate-400 whitespace-nowrap">{item.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityFeed;
