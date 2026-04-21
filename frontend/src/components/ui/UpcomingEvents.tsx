import React from 'react';
import { MapPin, Clock, ChevronRight } from 'lucide-react';

interface Event {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    color: string;
    tag: string;
}

const events: Event[] = [
    {
        id: 1,
        title: 'Annual Sports Day',
        date: 'Apr 22',
        time: '8:00 AM',
        location: 'Main Ground',
        color: '#f59e0b',
        tag: 'Sports'
    },
    {
        id: 2,
        title: 'Parent-Teacher Meeting',
        date: 'Apr 24',
        time: '10:00 AM',
        location: 'Auditorium',
        color: '#6366f1',
        tag: 'Meeting'
    },
    {
        id: 3,
        title: 'Grade 12 Final Exams',
        date: 'Apr 28',
        time: '9:00 AM',
        location: 'Exam Halls',
        color: '#f43f5e',
        tag: 'Exam'
    },
    {
        id: 4,
        title: 'Science Exhibition',
        date: 'May 3',
        time: '11:00 AM',
        location: 'Science Block',
        color: '#10b981',
        tag: 'Exhibition'
    },
];

const UpcomingEvents: React.FC = () => {
    return (
        <div className="card p-6 animate-fade-in-up delay-400">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-base font-semibold text-slate-800 font-heading">Upcoming Events</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Next 2 weeks</p>
                </div>
                <button className="text-xs font-medium text-primary hover:opacity-80 transition-colors">
                    View calendar →
                </button>
            </div>

            <div className="space-y-3">
                {events.map((event, idx) => (
                    <div
                        key={event.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group animate-fade-in-up"
                        style={{ animationDelay: `${idx * 80}ms` }}
                    >
                        {/* Date badge */}
                        <div
                            className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                            style={{ background: `${event.color}15`, borderLeft: `3px solid ${event.color}` }}
                        >
                            <span className="text-xs font-bold" style={{ color: event.color }}>{event.date.split(' ')[1]}</span>
                            <span className="text-xs font-medium text-slate-400">{event.date.split(' ')[0]}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">
                                    {event.title}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Clock size={10} />
                                    {event.time}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MapPin size={10} />
                                    {event.location}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span
                                className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: `${event.color}15`, color: event.color }}
                            >
                                {event.tag}
                            </span>
                            <ChevronRight size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UpcomingEvents;
