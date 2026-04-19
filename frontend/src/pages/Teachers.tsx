import {
    Plus, Search, Filter, MoreVertical, MapPin,
    Mail, Phone, BookOpen, Star
} from 'lucide-react';

const teachers = [
    { id: 1, name: 'Dr. Sarah Wilson', subject: 'Mathematics', role: 'Head of Dept', email: 'sarah.w@eduerp.com', phone: '+1 234-567-8901', classes: 4, rating: 4.8, avatar: 'https://i.pravatar.cc/150?u=1' },
    { id: 2, name: 'Prof. James Davis', subject: 'Physics', role: 'Senior Teacher', email: 'james.d@eduerp.com', phone: '+1 234-567-8902', classes: 3, rating: 4.9, avatar: 'https://i.pravatar.cc/150?u=2' },
    { id: 3, name: 'Emily Chen', subject: 'Biology', role: 'Teacher', email: 'emily.c@eduerp.com', phone: '+1 234-567-8903', classes: 5, rating: 4.6, avatar: 'https://i.pravatar.cc/150?u=3' },
    { id: 4, name: 'Michael Brown', subject: 'History', role: 'Teacher', email: 'michael.b@eduerp.com', phone: '+1 234-567-8904', classes: 4, rating: 4.7, avatar: 'https://i.pravatar.cc/150?u=4' },
    { id: 5, name: 'Jessica Taylor', subject: 'Literature', role: 'Senior Teacher', email: 'jessica.t@eduerp.com', phone: '+1 234-567-8905', classes: 3, rating: 4.9, avatar: 'https://i.pravatar.cc/150?u=5' },
    { id: 6, name: 'David Miller', subject: 'Computer Science', role: 'Head of Dept', email: 'david.m@eduerp.com', phone: '+1 234-567-8906', classes: 5, rating: 4.8, avatar: 'https://i.pravatar.cc/150?u=6' },
];

export default function Teachers() {
    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-heading tracking-tight">Staff Directory</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage teachers, staff records, and assignments.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-theme-primary text-white rounded-xl hover:bg-theme-primary/90 transition-colors shadow-sm font-medium text-sm">
                        <Plus size={16} />
                        Add Staff
                    </button>
                </div>
            </div>

            {/* Filters bar */}
            <div className="card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, subject..."
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50/50"
                    />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <select className="flex-1 sm:w-40 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option>All Subjects</option>
                        <option>Mathematics</option>
                        <option>Science</option>
                        <option>Humanities</option>
                    </select>
                    <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">
                        <Filter size={16} />
                        More Filters
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers.map((teacher, i) => (
                    <div key={teacher.id} className={`card p-6 hover-lift delay-${(i % 3) * 100}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <img src={teacher.avatar} alt={teacher.name} className="w-14 h-14 rounded-full border-2 border-slate-100 object-cover" />
                                <div>
                                    <h3 className="font-bold text-slate-800 tracking-tight">{teacher.name}</h3>
                                    <p className="text-sm font-medium text-theme-primary">{teacher.subject}</p>
                                </div>
                            </div>
                            <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors">
                                <MoreVertical size={18} />
                            </button>
                        </div>

                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail size={14} className="text-slate-400" />
                                <span className="truncate">{teacher.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone size={14} className="text-slate-400" />
                                <span>{teacher.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <MapPin size={14} className="text-slate-400" />
                                <span>{teacher.role}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div>
                                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><BookOpen size={12} /> Classes</div>
                                <div className="font-semibold text-slate-800">{teacher.classes} Active</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Star size={12} /> Rating</div>
                                <div className="font-semibold text-slate-800 flex items-center gap-1">
                                    {teacher.rating} <Star size={12} className="fill-amber-400 text-amber-400 inline" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
