import { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, GraduationCap, Download, CheckCircle2, Loader2, UserCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as studentApi from '../api/student.api';
import Modal from '../components/ui/Modal';

const StudentList = () => {
    const [students, setStudents] = useState<studentApi.Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Search & Pagination state
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

    // Admission form state
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '', // for auth account
        password: 'Password123!',
        admission_no: '',
        gender: 'Male',
        classroom_id: 1, // Default for now
        academic_year_id: 2026,
    });

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

    const handleAdmission = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await studentApi.admitStudent(formData);
            await fetchStudents();
            setIsModalOpen(false);
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                password: 'Password123!',
                admission_no: '',
                gender: 'Male',
                classroom_id: 1,
                academic_year_id: 2026,
            });
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

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
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-theme-primary text-white rounded-xl hover:bg-theme-primary/90 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Plus size={16} />
                        New Admission
                    </button>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            id="student-search"
                            type="text"
                            placeholder="Search students..."
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 bg-slate-50/50 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors w-full sm:w-auto justify-center active:scale-95">
                        <Filter size={16} />
                        Filters
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 size={40} className="text-theme-primary animate-spin" />
                            <p className="text-slate-500 font-medium">Loading students...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
                                <GraduationCap size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">No students found</h3>
                            <p className="text-slate-500 max-w-sm mb-6">Start by admitting your first student.</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="btn-primary"
                            >
                                Process Admission
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop View */}
                            <table className="w-full text-left border-collapse hidden md:table">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Profile</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admission No</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {students.map((student) => (
                                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                                                        {student.first_name[0]}{student.last_name[0]}
                                                    </div>
                                                    <div>
                                                        <Link to={`/students/${student.id}`} className="text-sm font-bold text-slate-800 hover:text-theme-primary transition-colors">
                                                            {student.first_name} {student.last_name}
                                                        </Link>
                                                        <p className="text-xs text-slate-400 font-medium">Class: {(student as any).classroom_name || 'Unassigned'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600 font-mono">{student.admission_no}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                                                    {student.gender}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                                    <CheckCircle2 size={14} />
                                                    Enrolled
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

                            {/* Mobile View - Card List */}
                            <div className="md:hidden divide-y divide-slate-100">
                                {students.map((student) => (
                                    <Link 
                                        key={student.id} 
                                        to={`/students/${student.id}`}
                                        className="flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-500 shadow-sm border border-white">
                                                {student.first_name[0]}{student.last_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 leading-tight">{student.first_name} {student.last_name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{(student as any).classroom_name || 'Unassigned'}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <span className="text-[10px] font-mono text-slate-400">{student.admission_no}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                ACTIVE
                                            </span>
                                            <ChevronRight size={14} className="text-slate-300" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Admission Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Student Admission Form"
            >
                <form onSubmit={handleAdmission} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">First Name</label>
                            <input
                                required
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-theme-primary outline-none"
                                value={formData.first_name}
                                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                placeholder="Student's first name"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Last Name</label>
                            <input
                                required
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-theme-primary outline-none"
                                value={formData.last_name}
                                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                placeholder="Student's last name"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Email (for Portal Access)</label>
                        <input
                            required
                            type="email"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-theme-primary outline-none"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="student@school.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Admission No</label>
                            <input
                                required
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-theme-primary outline-none font-mono"
                                value={formData.admission_no}
                                onChange={e => setFormData({ ...formData, admission_no: e.target.value })}
                                placeholder="ADM-2026-001"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
                            <select
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-theme-primary outline-none bg-white"
                                value={formData.gender}
                                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-theme-primary text-white text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                            Confirm Admission
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default StudentList;