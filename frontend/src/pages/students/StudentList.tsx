import { useState, useEffect } from 'react';
import {
    Search, Plus, Filter, GraduationCap,
    Download, AlertCircle, ChevronRight,
    CheckCircle2, Clock as ClockIcon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as studentApi from '../../api/student.api';
import { useAuth } from '../../contexts/AuthContext';
import { useAcademics } from '../../contexts/AcademicsContext';

export default function StudentList() {
    const { isYearClosed } = useAcademics();
    const [students, setStudents] = useState<studentApi.Student[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await studentApi.getStudentList({
                search,
                page: pagination.page,
                limit: pagination.limit
            });
            setStudents(response.data);
            setPagination(response.pagination);
        } catch (err) {
            console.error('Failed to fetch students:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStudents();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, pagination.page]);

    const canAdmit = user?.permissions?.includes('student:write');
    const canSeeFees = user?.permissions?.includes('fee:read');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Student Directory</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage enrollments, dossiers, and academic history.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm font-bold text-xs uppercase tracking-widest active:scale-95">
                        <Download size={16} />
                        Export
                    </button>
                    {canAdmit && (
                        <button
                            onClick={() => navigate('/students/register')}
                            disabled={isYearClosed()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:opacity-90 transition-all shadow-xl font-bold text-xs uppercase tracking-widest active:scale-95 disabled:opacity-30 disabled:grayscale"
                        >
                            <Plus size={16} />
                            New Admission
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/30">
                    <div className="relative w-full sm:w-96">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            id="student-search"
                            type="text"
                            placeholder="Search by name or admission number..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder-slate-400"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all w-full sm:w-auto justify-center active:scale-95 uppercase tracking-widest shadow-sm">
                        <Filter size={16} />
                        Advanced Filters
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Syncing Records...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-300 mb-6 border border-slate-100">
                                <GraduationCap size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">No Students Found</h3>
                            <p className="text-slate-500 max-w-sm mb-8 font-medium">Your directory is currently empty. Start the academic year by processing a new admission.</p>
                            {canAdmit && (
                                <button
                                    onClick={() => navigate('/students/register')}
                                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
                                >
                                    Process Admission
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Student Identity</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Admission Details</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Enrollment Status</th>
                                    {canSeeFees && <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Fee Status</th>}
                                    <th className="px-8 py-5 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {students.map((student) => (
                                    <tr key={student.id} className="group hover:bg-slate-50/50 transition-all cursor-pointer">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 border-2 border-white shadow-sm overflow-hidden">
                                                    {student.first_name[0]}{student.last_name[0]}
                                                </div>
                                                <div>
                                                    <Link to={`/students/${student.id}`} className="text-base font-black text-slate-800 hover:text-primary transition-colors block leading-none mb-1.5">
                                                        {student.first_name} {student.last_name}
                                                    </Link>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.gender}</span>
                                                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{student.blood_group || 'O+'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-black text-slate-700 font-mono tracking-tight mb-1">{student.admission_no}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Registered: {new Date(student.created_at as any).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="inline-flex items-center gap-1.5 w-fit px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                    <CheckCircle2 size={12} />
                                                    Active
                                                </span>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade: {(student as any).classroom_name || 'N/A'}</p>
                                            </div>
                                        </td>
                                        {canSeeFees && (
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    {/* Mocking fee status based on ID for now, should come from API */}
                                                    {student.id % 3 === 0 ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                            <CheckCircle2 size={12} />
                                                            Paid
                                                        </span>
                                                    ) : student.id % 3 === 1 ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">
                                                            <ClockIcon size={12} />
                                                            Pending
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100">
                                                            <AlertCircle size={12} />
                                                            Overdue
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-8 py-5 text-right">
                                            <Link to={`/students/${student.id}`} className="inline-flex items-center gap-2 p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                                                <ChevronRight size={18} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
