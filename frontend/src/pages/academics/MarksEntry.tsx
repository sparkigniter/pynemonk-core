import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, ChevronRight, Loader2, 
    AlertCircle, BookOpen,
    ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { examApi, type Exam, type ExamPaper } from '../../api/exam.api';
import { useAuth } from '../../contexts/AuthContext';


export default function MarksEntry() {
    const { id, paperId } = useParams<{ id: string; paperId: string }>();
    const navigate = useNavigate();
    const { can } = useAuth();
    
    const canWrite = can('mark:write') || can('exam:write');
    const canRead = can('exam:read') || canWrite;

    if (!canRead) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-6 text-center px-4">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-rose-500/10 transform -rotate-12">
                    <ShieldCheck size={40} />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Access Denied</h2>
                    <p className="text-slate-400 font-medium mt-2 max-w-sm">You do not have the required permissions to access the evaluation portal.</p>
                </div>
                <button 
                    onClick={() => navigate('/exams')}
                    className="mt-4 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                    Return to Mission Control
                </button>
            </div>
        );
    }
    
    const [exam, setExam] = useState<Exam | null>(null);
    const [paper, setPaper] = useState<ExamPaper | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [classroomName, setClassroomName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [marks, setMarks] = useState<Record<number, { score: string, isAbsent: boolean }>>({});
    const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());

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

    const [activeIndex, setActiveIndex] = useState(0);
    const activeStudent = useMemo(() => students[activeIndex], [students, activeIndex]);

    const handleMarkChange = (studentId: number, score: string) => {
        if (paper && parseFloat(score) > paper.max_marks) return;
        setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], score } }));
        setDirtyIds(prev => new Set(prev).add(studentId));
        
        // Auto-save logic (debounced or on change)
        clearTimeout((window as any).saveTimeout);
        (window as any).saveTimeout = setTimeout(() => {
            saveSpecific(studentId, score, marks[studentId]?.isAbsent || false);
        }, 1000);
    };

    const saveSpecific = async (studentId: number, score: string, isAbsent: boolean) => {
        try {
            await examApi.saveMarks(parseInt(id!), parseInt(paperId!), [{
                student_id: studentId,
                marks_obtained: isAbsent ? null : (parseFloat(score) || 0),
                is_absent: isAbsent
            }]);
            setDirtyIds(prev => {
                const next = new Set(prev);
                next.delete(studentId);
                return next;
            });
        } catch (err) {
            console.error('Auto-save failed', err);
        }
    };

    const toggleAbsent = (studentId: number) => {
        const newAbsent = !marks[studentId].isAbsent;
        const newScore = newAbsent ? '' : marks[studentId].score;
        setMarks(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], isAbsent: newAbsent, score: newScore }
        }));
        saveSpecific(studentId, newScore, newAbsent);
    };

    const handleNext = () => {
        if (activeIndex < students.length - 1) setActiveIndex(activeIndex + 1);
    };

    const handlePrev = () => {
        if (activeIndex > 0) setActiveIndex(activeIndex - 1);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') handleNext();
            if (e.key === 'ArrowRight' && e.ctrlKey) handleNext();
            if (e.key === 'ArrowLeft' && e.ctrlKey) handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeIndex, students]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4 bg-[#FBFBFE]">
            <Loader2 size={40} className="animate-spin text-indigo-600" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Assembling Evaluation Flow...</p>
        </div>
    );

    if (!activeStudent) return (
        <div className="p-20 text-center bg-[#FBFBFE] min-h-screen">
             <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-slate-200">
                <AlertCircle size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">No students assigned to you</h3>
            <p className="text-slate-400 mt-3 font-medium text-lg max-w-sm mx-auto">Please check your section assignments in the Exam Overview.</p>
            <button onClick={() => navigate(`/exams/${id}/overview`)} className="mt-10 px-12 py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest">Back to Overview</button>
        </div>
    );

    const studentMarks = marks[activeStudent.student_id] || { score: '', isAbsent: false };
    const progress = ((Object.values(marks).filter(m => m.score || m.isAbsent).length) / students.length) * 100;

    return (
        <div className="p-10 bg-[#FBFBFE] min-h-screen flex flex-col">
            {/* Top Bar */}
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate(`/exams/${id}/overview`)}
                        className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-90"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                                {classroomName || paper?.subject_name}
                            </h1>
                            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                {exam?.name}
                            </span>
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-3 text-xs">
                            <BookOpen size={14} /> Evaluating: {paper?.subject_name} • Max {paper?.max_marks} pts
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Progress</p>
                        <div className="flex items-center gap-4">
                            <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-sm font-black text-slate-900">{Math.round(progress)}%</span>
                        </div>
                    </div>
                    {dirtyIds.size > 0 && (
                        <div className="flex items-center gap-2 text-amber-600">
                            <Loader2 size={14} className="animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Saving...</span>
                        </div>
                    )}
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-4xl">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
                        {/* Navigation Prev */}
                        <div className="hidden lg:flex justify-end">
                            <button 
                                onClick={handlePrev}
                                disabled={activeIndex === 0}
                                className="w-16 h-16 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:shadow-xl hover:shadow-indigo-100/50 transition-all disabled:opacity-20 active:scale-90"
                            >
                                <ChevronLeft size={32} />
                            </button>
                        </div>

                        {/* Student Card */}
                        <div className="lg:col-span-3">
                            <motion.div 
                                key={activeStudent.student_id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl shadow-indigo-200/20 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                                
                                <div className="relative z-10 text-center space-y-8">
                                    <div className="w-24 h-24 bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-center text-3xl font-black mx-auto shadow-2xl shadow-slate-900/20">
                                        {activeStudent.first_name[0]}{activeStudent.last_name?.[0] || ''}
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-2">Student Evaluation</p>
                                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{activeStudent.first_name} {activeStudent.last_name}</h2>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest mt-1">Roll No: {activeStudent.admission_no}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className={`p-6 rounded-3xl border transition-all cursor-pointer ${!studentMarks.isAbsent ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                             onClick={() => studentMarks.isAbsent && toggleAbsent(activeStudent.student_id)}>
                                            <p className="text-[10px] font-black uppercase tracking-widest mb-1">Status</p>
                                            <p className="text-xl font-black">Present</p>
                                        </div>
                                        <div className={`p-6 rounded-3xl border transition-all cursor-pointer ${studentMarks.isAbsent ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                             onClick={() => !studentMarks.isAbsent && toggleAbsent(activeStudent.student_id)}>
                                            <p className="text-[10px] font-black uppercase tracking-widest mb-1">Status</p>
                                            <p className="text-xl font-black">Absent</p>
                                        </div>
                                    </div>

                                    <div className="pt-8">
                                        <div className="relative max-w-[200px] mx-auto group">
                                            <input 
                                                type="number"
                                                autoFocus
                                                disabled={studentMarks.isAbsent}
                                                value={studentMarks.score}
                                                onChange={(e) => handleMarkChange(activeStudent.student_id, e.target.value)}
                                                className="w-full text-center bg-slate-50 border-2 border-slate-100 rounded-[2rem] py-8 text-6xl font-black text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-slate-100"
                                                placeholder="00"
                                            />
                                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                Out of {paper?.max_marks}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-12 flex items-center justify-center gap-4 text-slate-400">
                                        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                            <kbd className="px-2 py-1 bg-slate-100 rounded-lg text-slate-500">Enter</kbd> to confirm & next
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Navigation Next */}
                        <div className="hidden lg:flex justify-start">
                            <button 
                                onClick={handleNext}
                                disabled={activeIndex === students.length - 1}
                                className="w-16 h-16 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:shadow-xl hover:shadow-indigo-100/50 transition-all disabled:opacity-20 active:scale-90"
                            >
                                <ChevronRight size={32} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Queue Strip */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-slate-200 p-4 rounded-[2.5rem] shadow-2xl flex items-center gap-4 max-w-4xl w-full">
                <div className="flex -space-x-4 overflow-hidden px-4">
                    {students.slice(Math.max(0, activeIndex - 2), activeIndex + 3).map((s) => {
                        const sIdx = students.indexOf(s);
                        const isDone = marks[s.student_id]?.score || marks[s.student_id]?.isAbsent;
                        return (
                            <div 
                                key={s.student_id}
                                onClick={() => setActiveIndex(sIdx)}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs border-4 border-white cursor-pointer transition-all hover:-translate-y-2
                                    ${activeIndex === sIdx ? 'bg-indigo-600 text-white scale-125 z-10' : isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}
                                `}
                            >
                                {s.first_name[0]}
                            </div>
                        )
                    })}
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="flex-1 px-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grading Queue</p>
                    <p className="text-sm font-black text-slate-900">{activeIndex + 1} of {students.length} Students</p>
                </div>
                <button 
                    onClick={() => navigate(`/exams/${id}/overview`)}
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                    Finish Session
                </button>
            </div>
        </div>
    );
}
