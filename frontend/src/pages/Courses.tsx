import {
    BookOpen, Users, Plus, Search, Filter,
    ChevronRight, Calendar, Bookmark
} from 'lucide-react';

const courses = [
    { id: 1, name: 'Advanced Mathematics', code: 'MAT-301', instructor: 'Dr. Sarah Wilson', students: 42, term: 'Fall 2025', status: 'active', color: 'blue' },
    { id: 2, name: 'Physics Principles', code: 'PHY-201', instructor: 'Prof. James Davis', students: 38, term: 'Fall 2025', status: 'active', color: 'indigo' },
    { id: 3, name: 'World History', code: 'HIS-101', instructor: 'Michael Brown', students: 55, term: 'Fall 2025', status: 'active', color: 'amber' },
    { id: 4, name: 'Computer Science Fundamentals', code: 'CS-101', instructor: 'David Miller', students: 60, term: 'Fall 2025', status: 'active', color: 'emerald' },
    { id: 5, name: 'English Literature', code: 'LIT-201', instructor: 'Jessica Taylor', students: 35, term: 'Fall 2025', status: 'draft', color: 'rose' },
];

export default function Courses() {
    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-heading tracking-tight">Courses & Curriculum</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage classes, syllabi, and academic schedules.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-theme-primary text-white rounded-xl hover:bg-theme-primary/90 transition-colors shadow-sm font-medium text-sm">
                        <Plus size={16} />
                        New Course
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 flex items-center gap-4 bg-gradient-to-r from-blue-50 to-white">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Courses</p>
                        <h3 className="text-2xl font-bold text-slate-800 font-heading">124</h3>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4 bg-gradient-to-r from-emerald-50 to-white">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Active Enrollments</p>
                        <h3 className="text-2xl font-bold text-slate-800 font-heading">3,842</h3>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4 bg-gradient-to-r from-purple-50 to-white">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Current Term</p>
                        <h3 className="text-xl font-bold text-slate-800 font-heading">Fall 2025</h3>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="card delay-200">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search courses..."
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50/50"
                            />
                        </div>
                        <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium hidden sm:flex items-center gap-2">
                            <Filter size={16} />
                            Filter
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 w-full sm:w-auto justify-between sm:justify-start">
                        <span>Showing 1-5 of 124</span>
                        <div className="flex items-center">
                            <button className="p-1 hover:bg-slate-100 rounded disabled:opacity-50" disabled><ChevronRight className="rotate-180" size={18} /></button>
                            <button className="p-1 hover:bg-slate-100 rounded"><ChevronRight size={18} /></button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Instructor</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Students</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Term</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {courses.map(course => (
                                <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-${course.color}-50 flex items-center justify-center text-${course.color}-600`}>
                                                <Bookmark size={18} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{course.name}</div>
                                                <div className="text-xs font-medium text-slate-500">{course.code}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                        {course.instructor}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                                            <Users size={14} className="text-slate-400" />
                                            {course.students}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {course.term}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${course.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${course.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                            <span className="capitalize">{course.status}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ChevronRight size={18} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
