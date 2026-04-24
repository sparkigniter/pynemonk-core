import React from 'react';
import { MapPin, Clock } from 'lucide-react';

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
        <div className="space-y-4">
            <div className="space-y-1">
                {events.map((event, idx) => (
                    <div
                        key={event.id}
                        className="flex items-center gap-4 p-4 rounded-[1.5rem] hover:bg-slate-50 transition-all duration-300 cursor-pointer group animate-fade-in-up"
                        style={{ animationDelay: `${idx * 80}ms` }}
                    >
                        {/* Refined Date badge */}
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{event.date.split(' ')[0]}</span>
                            <span className="text-xl font-black text-slate-900 leading-none mt-1">{event.date.split(' ')[1]}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-slate-900 truncate group-hover:text-primary transition-colors tracking-tight">
                                {event.title}
                            </h4>
                            <div className="flex items-center gap-4 mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5">
                                    <Clock size={12} className="text-slate-300" />
                                    {event.time}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={12} className="text-slate-300" />
                                    {event.location}
                                </span>
                            </div>
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                            <span className="text-[9px] font-black px-3 py-1 bg-slate-50 border border-slate-100 text-slate-400 uppercase tracking-widest rounded-full group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all">
                                {event.tag}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-4 py-4 rounded-2xl border border-dashed border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:border-primary/20 hover:text-primary hover:bg-primary/5 transition-all duration-300">
                Open Full Calendar
            </button>
        </div>
    );
};

export default UpcomingEvents;
