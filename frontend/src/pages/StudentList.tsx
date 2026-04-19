import { Search, Plus, Filter, MoreVertical, GraduationCap, Download, CheckCircle2, XCircle } from 'lucide-react';

const mockStudents = [
    { id: 'STU001', name: 'Emma Thompson', grade: '10th', section: 'A', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=a1' },
    { id: 'STU002', name: 'Liam Neeson', grade: '10th', section: 'B', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=a2' },
    { id: 'STU003', name: 'Olivia Davis', grade: '9th', section: 'A', status: 'Inactive', avatar: 'https://i.pravatar.cc/150?u=a3' },
    { id: 'STU004', name: 'Noah Wilson', grade: '11th', section: 'C', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=a4' },
    { id: 'STU005', name: 'Ava Martinez', grade: '12th', section: 'A', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=a5' },
];

const StudentList = () => {
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-heading tracking-tight">Student Directory</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage enrollments, profiles, and academic records.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm">
                        <Download size={16} />
                        Export
                    </button>
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-theme-primary text-white rounded-xl hover:bg-theme-primary/90 transition-colors shadow-sm font-medium text-sm">
                        <Plus size={16} />
                        New Student
                    </button>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search students by name or ID..."
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50/50"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors w-full sm:w-auto justify-center">
                        <Filter size={16} />
                        Advanced Filters
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Profile</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Grade / Section</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {mockStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full border border-slate-200 object-cover" />
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{student.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{student.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                                            <GraduationCap size={14} className="text-slate-400" />
                                            {student.grade} - {student.section}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold ${
                                            student.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {student.status === 'Active' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 gap-4">
                    <span>Showing 1 to 5 of 1,248 entries</span>
                    <div className="flex gap-1.5">
                        <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors" disabled>Prev</button>
                        <button className="px-3 py-1.5 border border-theme rounded-lg bg-theme-primary-50 text-theme-primary font-bold">1</button>
                        <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">2</button>
                        <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentList;