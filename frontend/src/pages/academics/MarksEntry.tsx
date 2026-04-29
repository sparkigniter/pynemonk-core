import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, ChevronRight, Save, Loader2, CheckCircle2, 
    AlertCircle, User, BookOpen, Calculator,
    ShieldCheck, Search
} from 'lucide-react';
import { examApi } from '../../api/exam.api';
import type { Exam, ExamPaper } from '../../api/exam.api';

const PAGE_SIZE = 20;

export default function MarksEntry() {
    const { id, paperId } = useParams<{ id: string; paperId: string }>();
    const navigate = useNavigate();
    
    const [exam, setExam] = useState<Exam | null>(null);
    const [paper, setPaper] = useState<ExamPaper | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [classroomName, setClassroomName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [marks, setMarks] = useState<Record<number, { score: string, isAbsent: boolean }>>({});
    const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());

    // ── Pagination + Search ──────────────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const loadData = async () => {
            const queryParams = new URLSearchParams(window.location.search);
            const classroomId = queryParams.get('classroom');

            try {
                const [examData, studentsData] = await Promise.all([
                    examApi.getExamDetails(parseInt(id!)),
                    examApi.getPaperStudents(parseInt(id!), parseInt(paperId!))
                ]);
                
                setExam(examData);
                const currentPaper = examData.papers.find((p: any) => p.id === parseInt(paperId!));
                setPaper(currentPaper || null);

                // Filter by classroom if parameter exists
                let filtered = studentsData;
                if (classroomId) {
                    filtered = studentsData.filter((s: any) => s.classroom_id === parseInt(classroomId));
                    if (filtered.length > 0) {
                        setClassroomName(`${filtered[0].classroom_name}-${filtered[0].classroom_section}`);
                    }
                }
                setStudents(filtered);

                // Initialize marks state from existing data
                const initialMarks: Record<number, { score: string, isAbsent: boolean }> = {};
                filtered.forEach((s: any) => {
                    initialMarks[s.student_id] = {
                        score: s.marks?.marks_obtained?.toString() || '',
                        isAbsent: s.marks?.is_absent || false
                    };
                });
                setMarks(initialMarks);
                setDirtyIds(new Set()); // Reset dirty state on load
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, paperId]);

    // Reset page when search changes
    useEffect(() => { setCurrentPage(1); }, [search]);

    const handleMarkChange = (studentId: number, score: string) => {
        if (paper && parseFloat(score) > paper.max_marks) return;
        setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], score } }));
        setDirtyIds(prev => new Set(prev).add(studentId));
    };

    const toggleAbsent = (studentId: number) => {
        setMarks(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                isAbsent: !prev[studentId].isAbsent,
                score: !prev[studentId].isAbsent ? '' : prev[studentId].score
            }
        }));
        setDirtyIds(prev => new Set(prev).add(studentId));
    };

    const handleSave = async () => {
        if (dirtyIds.size === 0) {
            alert('No changes to save.');
            return;
        }

        setSaving(true);
        try {
            // OPTIMIZATION: Only send the modified records to avoid 413 Payload Too Large
            const modifiedMarks = Array.from(dirtyIds).map(studentId => {
                const data = marks[studentId];
                return {
                    student_id: studentId,
                    marks_obtained: data.isAbsent ? null : (parseFloat(data.score) || 0),
                    is_absent: data.isAbsent
                };
            });

            await examApi.saveMarks(parseInt(id!), parseInt(paperId!), modifiedMarks);
            setDirtyIds(new Set()); // Clear dirty state after successful save
            alert(`Successfully saved marks for ${modifiedMarks.length} students.`);
        } catch (err) {
            alert('Error saving marks. The payload may still be too large or there is a connection issue.');
        } finally {
            setSaving(false);
        }
    };

    // ── Filtering + Pagination ───────────────────────────────────────────────
    const filteredStudents = useMemo(() => {
        if (!search.trim()) return students;
        const q = search.toLowerCase();
        return students.filter(s =>
            `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
            s.admission_no?.toLowerCase().includes(q)
        );
    }, [students, search]);

    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
    const pagedStudents = filteredStudents.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 size={40} className="animate-spin text-primary" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Gradebook...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(`/exams?id=${id}`)}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <BookOpen size={14} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{exam?.name}</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                            {classroomName ? `${classroomName} Evaluation` : `Evaluation: ${paper?.subject_name}`}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Marks</p>
                        <p className="text-xl font-black text-slate-900">{paper?.max_marks}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200"></div>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary px-8 flex items-center gap-2 py-4"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Progress
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Students', value: students.length, icon: User, color: 'text-primary bg-primary/10' },
                    { label: 'Marks Entered', value: Object.values(marks).filter(m => m.score || m.isAbsent).length, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50' },
                    { label: 'Absent', value: Object.values(marks).filter(m => m.isAbsent).length, icon: AlertCircle, color: 'text-rose-500 bg-rose-50' },
                    { label: 'Pending', value: students.length - Object.values(marks).filter(m => m.score || m.isAbsent).length, icon: Loader2, color: 'text-amber-500 bg-amber-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search + Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative max-w-sm w-full">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                        type="text"
                        placeholder="Search student name or admission no…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                </div>

                {/* Pagination controls */}
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Page {currentPage} of {totalPages} &nbsp;·&nbsp; {filteredStudents.length} students
                    </span>
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-all border-r border-slate-100"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-50 bg-slate-50/50">
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Evaluator</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Attendance</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-48">Score / {paper?.max_marks}</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Result</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {pagedStudents.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-20 text-center">
                                    <p className="text-slate-400 font-bold">No students found matching "{search}"</p>
                                </td>
                            </tr>
                        ) : pagedStudents.map((student) => {
                            const studentMarks = marks[student.student_id] || { score: '', isAbsent: false };
                            const isExcluded = student.is_excluded;
                            const scoreNum = parseFloat(studentMarks.score);
                            const isPassing = paper && !isNaN(scoreNum) && scoreNum >= paper.passing_marks;
                            const evaluatorName = student.marks?.evaluator_name || '—';

                            return (
                                <tr key={student.student_id} className={`group transition-colors ${isExcluded ? 'opacity-50' : 'hover:bg-slate-50/50'}`}>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-primary group-hover:text-white transition-all">
                                                {student.first_name[0]}{student.last_name?.[0] ?? ''}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 tracking-tight">{student.first_name} {student.last_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.admission_no}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-200" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{evaluatorName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <button 
                                            disabled={isExcluded}
                                            onClick={() => toggleAbsent(student.student_id)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
                                                ${studentMarks.isAbsent 
                                                    ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm' 
                                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}
                                        >
                                            {studentMarks.isAbsent ? 'Absent' : 'Present'}
                                        </button>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="relative group/input">
                                            <Calculator size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within/input:text-primary" />
                                            <input 
                                                type="number"
                                                disabled={isExcluded || studentMarks.isAbsent}
                                                value={studentMarks.score}
                                                onChange={(e) => handleMarkChange(student.student_id, e.target.value)}
                                                className={`w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-black text-sm outline-none transition-all
                                                    ${studentMarks.score ? 'bg-white border-slate-200' : ''}
                                                    ${!isNaN(scoreNum) && paper && scoreNum > paper.max_marks ? 'border-rose-300 ring-4 ring-rose-50' : ''}
                                                    focus:border-primary focus:ring-4 focus:ring-primary/5 disabled:bg-slate-100 disabled:text-slate-300`}
                                                placeholder="0.0"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        {isExcluded ? (
                                            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest italic">Excluded</span>
                                        ) : studentMarks.isAbsent ? (
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">N/A</span>
                                        ) : studentMarks.score ? (
                                            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm
                                                ${isPassing ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                                {isPassing ? 'Pass' : 'Fail'}
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Loader2 size={12} className="text-slate-300 animate-spin" />
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Awaiting</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-all"
                    >
                        First
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                        return startPage + i;
                    }).filter(p => p <= totalPages).map(p => (
                        <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${
                                currentPage === p
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-all"
                    >
                        Last
                    </button>
                </div>
            )}

            <div className="bg-amber-50 rounded-[2rem] border border-amber-100 p-8 flex items-start gap-6">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-amber-500/20">
                    <ShieldCheck size={24} />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Finalizing Results</h4>
                    <p className="text-slate-600 text-sm font-medium mt-1">Once marks for all papers are entered, the exam status can be moved to "Published". This will make the results visible to students and parents.</p>
                </div>
                <button className="px-8 py-3 bg-white border border-amber-200 text-amber-600 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all active:scale-95 shadow-sm">
                    Review All Subjects
                </button>
            </div>
        </div>
    );
}
