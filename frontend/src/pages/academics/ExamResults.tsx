import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Download,
    Printer,
    Search,
    ShieldCheck
} from 'lucide-react';
import { examApi } from '../../api/exam.api';
import { Loader2 } from 'lucide-react';

export default function ExamResults() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [exam, setExam] = useState<any>(null);
    const [marks, setMarks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [examData, marksData] = await Promise.all([
                    examApi.getExamDetails(parseInt(id!)),
                    examApi.getExamResults(parseInt(id!))
                ]);
                setExam(examData);
                setMarks(marksData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
            <Loader2 size={40} className="animate-spin text-indigo-600" />
            <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px]">Generating Grade Sheet...</p>
        </div>
    );

    if (!exam) return null;

    // Filter students by search
    const filteredStudents = exam.students?.filter((s: any) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admission_no.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="p-10 bg-[#FBFBFE] min-h-screen">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(`/exams/${id}/overview`)}
                        className="w-14 h-14 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all shadow-sm active:scale-90"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tighter">Consolidated Marksheet</h1>
                            <span className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center gap-2">
                                <ShieldCheck size={12} /> Results Published
                            </span>
                        </div>
                        <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest mt-2 text-xs">
                            {exam.name} • Academic Year 2026-27
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        <Download size={14} /> Export CSV
                    </button>
                    <button className="flex items-center gap-2 px-6 py-4 bg-surface-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-theme/10">
                        <Printer size={14} /> Print Sheets
                    </button>
                </div>
            </header>

            {/* Controls */}
            <div className="bg-[var(--card-bg)] p-8 rounded-[2.5rem] border border-[var(--card-border)] shadow-sm mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                        type="text"
                        placeholder="Search student or admission no..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Class Average</p>
                        <p className="text-xl font-black text-indigo-600">84.2%</p>
                    </div>
                    <div className="w-px h-10 bg-slate-100" />
                    <div className="text-right">
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Top Performer</p>
                        <p className="text-xl font-black text-emerald-600">98.5%</p>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-[var(--card-bg)] rounded-[3rem] border border-[var(--card-border)] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--card-border)]">Student Info</th>
                                {exam.papers?.map((paper: any) => (
                                    <th key={paper.id} className="px-6 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--card-border)] text-center">
                                        {paper.subject_name}
                                        <span className="block opacity-50 font-bold mt-1">/{paper.max_marks}</span>
                                    </th>
                                ))}
                                <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--card-border)] text-right">Aggregate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredStudents.map((student: any) => {
                                let totalObtained = 0;
                                let totalMax = 0;

                                return (
                                    <tr key={student.student_id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-surface-dark text-white rounded-xl flex items-center justify-center font-black text-xs">
                                                    {student.first_name[0]}{student.last_name?.[0] || ''}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[var(--text-main)]">{student.first_name} {student.last_name}</p>
                                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{student.admission_no}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {exam.papers?.map((paper: any) => {
                                            const studentMark = marks.find(m => m.student_id === student.student_id && m.paper_id === paper.id);
                                            const score = studentMark ? (studentMark.is_absent ? 'AB' : studentMark.marks_obtained) : '-';

                                            if (studentMark && !studentMark.is_absent) {
                                                totalObtained += parseFloat(studentMark.marks_obtained);
                                                totalMax += paper.max_marks;
                                            } else if (!studentMark || studentMark.is_absent) {
                                                // If absent or not marked, treat as 0 for total but don't add to denominator? 
                                                // Actually usually schools treat AB as 0.
                                                totalMax += paper.max_marks;
                                            }

                                            const isFailing = studentMark && !studentMark.is_absent && studentMark.marks_obtained < paper.passing_marks;

                                            return (
                                                <td key={paper.id} className="px-6 py-6 text-center">
                                                    <span className={`text-sm font-black ${isFailing ? 'text-rose-500' : score === 'AB' ? 'text-amber-500' : 'text-[var(--text-main)]'}`}>
                                                        {score}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                        <td className="px-8 py-6 text-right">
                                            <div className="inline-flex flex-col items-end">
                                                <span className="text-sm font-black text-indigo-600">
                                                    {((totalObtained / totalMax) * 100).toFixed(1)}%
                                                </span>
                                                <span className="text-[9px] font-black uppercase text-slate-300">
                                                    {totalObtained}/{totalMax}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredStudents.length === 0 && (
                    <div className="p-20 text-center text-[var(--text-muted)] italic">
                        No students found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
}
