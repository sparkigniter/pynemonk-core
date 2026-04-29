import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Users,
    Search,
    UserCheck,
    UserX,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Mail,
    Download,
    Check,
    ChevronLeft,
    ChevronRight,
    Filter
} from 'lucide-react';
import { examApi } from '../../api/exam.api';
import { getGrades, type Grade } from '../../api/grade.api';
import { getClassrooms, type Classroom } from '../../api/classroom.api';
import { getSubjectList, type Subject } from '../../api/subject.api';
import { useNotification } from '../../contexts/NotificationContext';
import type { Exam, ExamStudent } from '../../api/exam.api';

export default function ExamInvitations() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notify } = useNotification();

    const [exam, setExam] = useState<Exam | null>(null);
    const [students, setStudents] = useState<ExamStudent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDataLoading, setIsDataLoading] = useState(false);

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'included' | 'excluded'>('all');
    const [gradeFilter, setGradeFilter] = useState<number | null>(null);
    const [classroomFilter, setClassroomFilter] = useState<number | null>(null);
    const [subjectFilter, setSubjectFilter] = useState<number | null>(null);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 1
    });

    const [grades, setGrades] = useState<Grade[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());

    useEffect(() => {
        initialLoad();
    }, [id]);

    useEffect(() => {
        loadData();
    }, [id, pagination.page, pagination.limit, statusFilter, gradeFilter, classroomFilter, subjectFilter]);

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setPagination(prev => ({ ...prev, page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const initialLoad = async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            const [details, gradesData, classroomsData, subjectsData] = await Promise.all([
                examApi.getExamDetails(parseInt(id)),
                getGrades(),
                getClassrooms(),
                getSubjectList({ limit: 1000 })
            ]);
            setExam(details);
            setGrades(gradesData);
            setClassrooms(classroomsData.data);
            setSubjects(subjectsData.data);
        } catch (err) {
            notify('error', 'Error', 'Failed to load initial configuration');
        } finally {
            setIsLoading(false);
        }
    };

    const loadData = async () => {
        if (!id || isLoading) return;
        try {
            setIsDataLoading(true);
            const response = await examApi.getPaginatedStudents(parseInt(id), {
                page: pagination.page,
                limit: pagination.limit,
                search,
                status: statusFilter,
                grade_id: gradeFilter || undefined,
                classroom_id: classroomFilter || undefined,
                subject_id: subjectFilter || undefined
            });
            setStudents(response.data);
            setPagination(response.pagination);
        } catch (err) {
            notify('error', 'Error', 'Failed to load candidate list');
        } finally {
            setIsDataLoading(false);
        }
    };

    const toggleStudent = (studentId: number) => {
        const next = new Set(selectedStudents);
        if (next.has(studentId)) next.delete(studentId);
        else next.add(studentId);
        setSelectedStudents(next);
    };

    const handleBulkStatusChange = async (isExcluded: boolean) => {
        if (selectedStudents.size === 0 || !id) return;
        try {
            const reason = isExcluded ? prompt("Reason for exclusion?") : "";
            if (isExcluded && reason === null) return;

            await Promise.all(
                Array.from(selectedStudents).map(studentId =>
                    examApi.updateStudentStatus(parseInt(id), studentId, {
                        is_excluded: isExcluded,
                        exclusion_reason: reason || ""
                    })
                )
            );
            notify('success', 'Batch Update', `${selectedStudents.size} candidates updated successfully`);
            setSelectedStudents(new Set());
            loadData();
        } catch (err) {
            notify('error', 'Update Failed', 'Failed to update candidate statuses');
        }
    };

    if (isLoading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-theme-primary/20 border-t-theme-primary rounded-full animate-spin" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Assembling Candidate Matrix...</p>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-50 min-h-[calc(100vh-100px)] rounded-[3rem] border border-slate-200 shadow-2xl relative flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/exams')}
                        className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Exam Invitations</h1>
                            <span className="px-3 py-1 bg-theme-primary/10 text-theme-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                                {exam?.name}
                            </span>
                        </div>
                        <p className="text-slate-500 font-medium mt-1">Manage individual candidate eligibility and invitation status.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={16} />
                        Export List
                    </button>
                    <button className="flex items-center gap-2 px-8 py-3.5 bg-theme-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-theme-primary/20">
                        <Mail size={16} />
                        Notify Candidates
                    </button>
                </div>
            </header>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="bg-theme-primary/5 text-theme-primary p-4 rounded-2xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Candidates</p>
                        <p className="text-2xl font-black text-slate-900">{pagination.total}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 opacity-50">
                    <div className="bg-emerald-50 text-emerald-500 p-4 rounded-2xl">
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Status</p>
                        <p className="text-2xl font-black text-emerald-600">Dynamic</p>
                    </div>
                </div>
                <div className="flex-1" />
                <div className="flex-1" />
            </div>

            {/* Search and Quick Filters */}
            <div className="flex flex-col gap-6 mb-8 px-2">
                <div className="flex items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or admission no..."
                            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-theme-primary/10 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        {(['all', 'included', 'excluded'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Granular Filters */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm overflow-x-auto">
                    <div className="flex items-center gap-2 px-4 text-slate-400 shrink-0">
                        <Filter size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
                    </div>

                    <select
                        className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-theme-primary/20 shrink-0"
                        value={gradeFilter || ''}
                        onChange={(e) => {
                            setGradeFilter(e.target.value ? parseInt(e.target.value) : null);
                            setClassroomFilter(null);
                            setSubjectFilter(null);
                        }}
                    >
                        <option value="">All Grades</option>
                        {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>

                    <select
                        className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-theme-primary/20 shrink-0"
                        value={classroomFilter || ''}
                        onChange={(e) => setClassroomFilter(e.target.value ? parseInt(e.target.value) : null)}
                    >
                        <option value="">All Sections</option>
                        {classrooms.filter(c => !gradeFilter || c.grade_id === gradeFilter).map(c => (
                            <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                        ))}
                    </select>

                    <select
                        className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-theme-primary/20 shrink-0"
                        value={subjectFilter || ''}
                        onChange={(e) => setSubjectFilter(e.target.value ? parseInt(e.target.value) : null)}
                    >
                        <option value="">All Subjects</option>
                        {subjects.filter(s => !gradeFilter || s.grade_id === gradeFilter).map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    <div className="flex-1" />

                    {selectedStudents.size > 0 && (
                        <div className="flex items-center gap-2 pr-4 shrink-0 animate-in slide-in-from-right-4">
                            <button
                                onClick={() => handleBulkStatusChange(false)}
                                className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
                            >
                                Include ({selectedStudents.size})
                            </button>
                            <button
                                onClick={() => handleBulkStatusChange(true)}
                                className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-600 hover:text-white transition-all"
                            >
                                Exclude ({selectedStudents.size})
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2 pr-4 shrink-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {pagination.page} of {pagination.pages}</span>
                        <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                                disabled={pagination.page === 1}
                                className="p-2 hover:bg-white text-slate-400 hover:text-slate-600 disabled:opacity-20 transition-all border-r border-slate-100"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
                                disabled={pagination.page === pagination.pages}
                                className="p-2 hover:bg-white text-slate-400 hover:text-slate-600 disabled:opacity-20 transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/20 overflow-hidden flex flex-col mb-4 relative">
                {isDataLoading && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-20 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-theme-primary/20 border-t-theme-primary rounded-full animate-spin" />
                    </div>
                )}
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md">
                            <tr className="border-b border-slate-100">
                                <th className="px-8 py-6 w-16">
                                    <button
                                        onClick={() => {
                                            if (selectedStudents.size === students.length) setSelectedStudents(new Set());
                                            else setSelectedStudents(new Set(students.map(s => s.student_id)));
                                        }}
                                        className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selectedStudents.size === students.length && students.length > 0 ? 'bg-theme-primary border-theme-primary' : 'bg-white border-slate-200'}`}
                                    >
                                        {selectedStudents.size === students.length && students.length > 0 && <Check size={12} className="text-white" strokeWidth={4} />}
                                    </button>
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade \ Section</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission No</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invitation Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                            <Users className="text-slate-200" size={32} />
                                        </div>
                                        <h4 className="text-lg font-black text-slate-900 tracking-tight">No candidates found</h4>
                                        <p className="text-slate-400 text-sm font-medium mt-1">Adjust your filters to find specific students.</p>
                                    </td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.student_id} className={`group hover:bg-slate-50/50 transition-all ${selectedStudents.has(student.student_id) ? 'bg-theme-primary/5' : ''}`}>
                                        <td className="px-8 py-6">
                                            <button
                                                onClick={() => toggleStudent(student.student_id)}
                                                className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selectedStudents.has(student.student_id) ? 'bg-theme-primary border-theme-primary' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}
                                            >
                                                {selectedStudents.has(student.student_id) && <Check size={12} className="text-white" strokeWidth={4} />}
                                            </button>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${student.is_excluded ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                    {student.first_name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{student.first_name} {student.last_name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Student Profile</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-700">{student.classroom_name}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{student.classroom_section} Section</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 font-mono text-xs font-bold text-slate-500">
                                            {student.admission_no}
                                        </td>
                                        <td className="px-8 py-6">
                                            {student.is_excluded ? (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-[9px] font-black uppercase tracking-widest">
                                                    <XCircle size={14} />
                                                    Excluded
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-[9px] font-black uppercase tracking-widest">
                                                    <CheckCircle2 size={14} />
                                                    Eligible
                                                </div>
                                            )}
                                            {student.exclusion_reason && (
                                                <p className="text-[9px] text-rose-400 font-bold mt-1 max-w-[150px] truncate">{student.exclusion_reason}</p>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={async () => {
                                                    const reason = !student.is_excluded ? prompt("Reason for exclusion?") : "";
                                                    if (!student.is_excluded && reason === null) return;
                                                    await examApi.updateStudentStatus(parseInt(id!), student.student_id, {
                                                        is_excluded: !student.is_excluded,
                                                        exclusion_reason: reason || ""
                                                    });
                                                    loadData();
                                                }}
                                                className={`p-3 rounded-xl transition-all ${student.is_excluded ? 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500'}`}
                                            >
                                                {student.is_excluded ? <UserCheck size={18} /> : <UserX size={18} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
