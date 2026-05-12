import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Calendar as CalendarIcon,
    Users,
    ChevronRight,
    CheckCircle2,
    ShieldCheck,
    BookOpen,
    Clock,
    Layout,
    AlertTriangle,
    Info,
    Calendar,
    Save,
    ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { examApi } from '../../api/exam.api';
import { getGrades } from '../../api/grade.api';
import { getClassrooms } from '../../api/classroom.api';
import { getSubjectList } from '../../api/subject.api';
import { getStaffList } from '../../api/staff.api';
import { useNotification } from '../../contexts/NotificationContext';

type Step = 'details' | 'classes' | 'subjects' | 'schedule' | 'review';

export default function ExamScheduler() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notify } = useNotification();

    // Steps Configuration
    const steps: { id: Step; label: string; icon: any; description: string }[] = [
        { id: 'details', label: 'Details', icon: Info, description: 'Identity & Window' },
        { id: 'classes', label: 'Classes', icon: Users, description: 'Audience Targeting' },
        { id: 'subjects', label: 'Subjects', icon: BookOpen, description: 'Paper Config' },
        { id: 'schedule', label: 'Schedule', icon: Calendar, description: 'Timeline Builder' },
        { id: 'review', label: 'Review', icon: CheckCircle2, description: 'Manifest' }
    ];

    const [currentStep, setCurrentStep] = useState<Step>('details');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Master Data
    const [grades, setGrades] = useState<any[]>([]);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);

    // Wizard State
    const [formData, setFormData] = useState({
        name: '',
        exam_type: 'term' as any,
        start_date: '',
        end_date: '',
        instructions: '',
        selectedClassrooms: [] as number[],
        papers: [] as any[], // { subject_id, max_marks, evaluator_id, type, classroom_id }
        schedule: [] as any[] // { paper_id, date, start_time, end_time }
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [gradeRes, classRes, subRes, staffRes] = await Promise.all([
                getGrades(),
                getClassrooms(),
                getSubjectList(),
                getStaffList()
            ]);
            setGrades(gradeRes.data);
            setClassrooms(classRes.data);
            setSubjects(subRes.data);
            setStaff(staffRes.data);

            if (id) {
                // Load existing exam logic here if needed
                await examApi.getExamDetails(parseInt(id));
                // Map existing to formData...
            }
        } catch (err) {
            notify('error', 'Critical Error', 'Failed to synchronize configuration data.');
        } finally {
            setIsLoading(false);
        }
    };

    // Derived Data for Summary
    const totalSelectedStudents = useMemo(() => {
        return classrooms
            .filter(c => formData.selectedClassrooms.includes(c.id))
            .reduce((acc, c) => acc + (c.student_count || 0), 0);
    }, [formData.selectedClassrooms, classrooms]);

    // const activeSubjects = useMemo(() => {
    //     const gradeIds = Array.from(new Set(
    //         classrooms
    //             .filter(c => formData.selectedClassrooms.includes(c.id))
    //             .map(c => c.grade_id)
    //     ));
    //     const subjectsList = subjects.filter(s => gradeIds.includes(s.grade_id));
    //     console.log('Active Subjects for selected classes:', subjectsList.length);
    //     return subjectsList;
    // }, [formData.selectedClassrooms, subjects, classrooms]);

    // Handlers
    const toggleClassroom = (cid: number) => {
        setFormData(prev => ({
            ...prev,
            selectedClassrooms: prev.selectedClassrooms.includes(cid)
                ? prev.selectedClassrooms.filter(id => id !== cid)
                : [...prev.selectedClassrooms, cid]
        }));
    };

    const updatePaper = (subjectId: number, classroomId: number, field: string, value: any) => {
        setFormData(prev => {
            const existing = prev.papers.find(p => p.subject_id === subjectId && p.classroom_id === classroomId);
            if (existing) {
                return {
                    ...prev,
                    papers: prev.papers.map(p =>
                        p.subject_id === subjectId && p.classroom_id === classroomId
                            ? { ...p, [field]: value }
                            : p
                    )
                };
            }
            return {
                ...prev,
                papers: [...prev.papers, { subject_id: subjectId, classroom_id: classroomId, [field]: value, max_marks: 100 }]
            };
        });
    };

    const handleNext = () => {
        const stepIndex = steps.findIndex(s => s.id === currentStep);
        if (stepIndex < steps.length - 1) {
            const nextStep = steps[stepIndex + 1].id;
            
            // Auto-initialize papers when moving to subjects
            if (nextStep === 'subjects') {
                const newPapers: any[] = [];
                formData.selectedClassrooms.forEach(cid => {
                    const cls = classrooms.find(c => c.id === cid);
                    const clsSubjects = subjects.filter(s => s.grade_id === cls.grade_id);
                    clsSubjects.forEach(sub => {
                        const existing = formData.papers.find(p => p.subject_id === sub.id && p.classroom_id === cid);
                        if (existing) {
                            newPapers.push(existing);
                        } else {
                            newPapers.push({
                                subject_id: sub.id,
                                classroom_id: cid,
                                max_marks: 100,
                                type: 'theory',
                                date: formData.start_date,
                                start_time: '09:00',
                                end_time: '12:00'
                            });
                        }
                    });
                });
                setFormData(prev => ({ ...prev, papers: newPapers }));
            }
            
            setCurrentStep(nextStep);
        }
    };

    const handleBack = () => {
        const stepIndex = steps.findIndex(s => s.id === currentStep);
        if (stepIndex > 0) {
            setCurrentStep(steps[stepIndex - 1].id);
        }
    };

    const handleCreate = async () => {
        setIsSaving(true);
        try {
            // 1. Create Exam Container
            const examPayload = {
                name: formData.name,
                exam_type: formData.exam_type as any,
                start_date: formData.start_date,
                end_date: formData.end_date,
                description: formData.instructions,
            };
            const createdExam = await examApi.createExam(examPayload);
            const examId = createdExam.id;

            // 2. Register Participants (Invitations)
            const invitationPromises = formData.selectedClassrooms.map(cid => {
                const classroom = classrooms.find(c => c.id === cid);
                return examApi.addInvitation(examId, {
                    grade_id: classroom?.grade_id,
                    classroom_id: cid
                });
            });

            // 3. Construct Papers & Schedules
            // Group papers by subject if needed? No, currently paper is per subject per exam.
            // Actually, usually a paper is for a subject across all invited classes of a grade.
            // But let's follow the user's "per class" config if they did that.
            const paperPromises = formData.papers.map(paper => {
                return examApi.addPaper(examId, {
                    subject_id: paper.subject_id,
                    max_marks: parseInt(paper.max_marks) || 100,
                    passing_marks: Math.round((parseInt(paper.max_marks) || 100) * 0.4),
                    supervisor_id: paper.evaluator_id ? parseInt(paper.evaluator_id) : undefined,
                    exam_date: paper.date || formData.start_date,
                    start_time: paper.start_time || '09:00',
                    end_time: paper.end_time || '12:00',
                    room: 'General Hall'
                });
            });

            await Promise.all([...invitationPromises, ...paperPromises]);

            notify('success', 'Exam Created', 'Plan synchronized across all modules.');
            navigate('/exams');
        } catch (err: any) {
            console.error(err);
            notify('error', 'Sync Failed', err.message || 'Could not persist exam configuration.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 border-4 border-primary/10 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em] text-[10px]">Initializing Planner...</p>
        </div>
    );

    return (
        <div className="flex gap-10 p-10 bg-[#FBFBFE] min-h-screen">
            {/* Sidebar Summary (Web) */}
            <aside className="hidden xl:flex flex-col w-[380px] shrink-0 gap-6">
                <div className="bg-[var(--card-bg)] rounded-[3rem] p-10 border border-[var(--card-border)] shadow-xl shadow-slate-200/40 sticky top-10">
                    <div className="mb-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-theme/10">
                                <ShieldCheck size={20} />
                            </div>
                            <h2 className="text-xl font-black text-[var(--text-main)]">Exam Summary</h2>
                        </div>
                        <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${(steps.findIndex(s => s.id === currentStep) + 1) * 20}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Exam Name</p>
                            <p className="font-black text-[var(--text-main)] truncate">{formData.name || 'Untitled Exam'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Type</p>
                                <p className="text-xs font-black text-[var(--text-main)] uppercase">{formData.exam_type}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Learners</p>
                                <p className="text-xs font-black text-[var(--text-main)]">{totalSelectedStudents} Total</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Timeline</p>
                            <p className="text-xs font-black text-[var(--text-main)]">
                                {formData.start_date || 'N/A'} — {formData.end_date || 'N/A'}
                            </p>
                        </div>
                        <div className="pt-8 border-t border-[var(--card-border)]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Papers Configured</span>
                                <span className="text-xs font-black text-primary">{formData.papers.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Conflict Status</span>
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Clear</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/exams')}
                        className="w-full mt-12 py-5 bg-slate-50 text-[var(--text-muted)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center gap-3"
                    >
                        <AlertTriangle size={14} /> Discard Plan
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 max-w-5xl mx-auto flex flex-col">
                {/* Step Indicator */}
                <nav className="mb-12 flex items-center justify-between px-4">
                    {steps.map((s, idx) => {
                        const isActive = currentStep === s.id;
                        const isPast = steps.findIndex(step => step.id === currentStep) > idx;
                        return (
                            <div key={s.id} className="flex items-center flex-1 last:flex-none group">
                                <div className="flex flex-col items-center gap-3 relative">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 
                                        ${isActive ? 'bg-primary text-white border-primary shadow-xl shadow-theme/10 scale-110' :
                                            isPast ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-[var(--card-bg)] text-slate-300 border-[var(--card-border)]'}`}
                                    >
                                        {isPast ? <CheckCircle2 size={24} /> : <s.icon size={24} />}
                                    </div>
                                    <div className="absolute top-16 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                                        <p className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>{s.label}</p>
                                    </div>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className={`h-0.5 flex-1 mx-4 rounded-full transition-all duration-700 
                                        ${isPast ? 'bg-emerald-500' : 'bg-slate-100'}`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Wizard Container */}
                <div className="bg-[var(--card-bg)] rounded-[4rem] p-12 border border-[var(--card-border)] shadow-2xl shadow-slate-200/30 flex-1 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/50/5 rounded-full blur-[100px] -mr-48 -mt-48" />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                            className="relative z-10 flex-1 flex flex-col"
                        >
                            {/* STEP 1: DETAILS */}
                            {currentStep === 'details' && (
                                <div className="space-y-12">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-surface-dark text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl">
                                            <Info size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Exam Fundamentals</h2>
                                            <p className="text-[var(--text-muted)] font-medium">Define the name, scope, and duration of this assessment.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-4">Examination Title</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Annual Proficiency Assessment"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-8 py-6 bg-slate-50 rounded-[2rem] border-none text-lg font-black text-[var(--text-main)] focus:bg-[var(--card-bg)] focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-4">Assessment Category</label>
                                            <div className="flex p-2 bg-slate-50 rounded-[2rem] gap-2">
                                                {['Term', 'Periodic', 'Annual'].map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setFormData({ ...formData, exam_type: t.toLowerCase() })}
                                                        className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.exam_type === t.toLowerCase() ? 'bg-[var(--card-bg)] text-primary shadow-md' : 'text-[var(--text-muted)] hover:text-slate-600'}`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-4">Commences</label>
                                            <input
                                                type="date"
                                                value={formData.start_date}
                                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                                className="w-full px-8 py-6 bg-slate-50 rounded-[2rem] border-none text-lg font-black text-[var(--text-main)] focus:bg-[var(--card-bg)] focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-4">Concludes</label>
                                            <input
                                                type="date"
                                                value={formData.end_date}
                                                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                                className="w-full px-8 py-6 bg-slate-50 rounded-[2rem] border-none text-lg font-black text-[var(--text-main)] focus:bg-[var(--card-bg)] focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-4">Global Directives (Optional)</label>
                                        <textarea
                                            placeholder="General instructions for all students and invigilators..."
                                            rows={4}
                                            value={formData.instructions}
                                            onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                            className="w-full px-8 py-6 bg-slate-50 rounded-[2.5rem] border-none text-base font-medium text-[var(--text-main)] focus:bg-[var(--card-bg)] focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: CLASSES */}
                            {currentStep === 'classes' && (
                                <div className="space-y-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-primary text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl">
                                                <Users size={32} />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Select Target Classes</h2>
                                                <p className="text-[var(--text-muted)] font-medium">Which sections will be participating in this examination cycle?</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Selected</p>
                                            <p className="text-3xl font-black text-primary">{formData.selectedClassrooms.length} Sections</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-8 overflow-y-auto max-h-[500px] pr-4 custom-scrollbar">
                                        {grades.map(grade => {
                                            const gradeSections = classrooms.filter(c => c.grade_id === grade.id);
                                            return (
                                                <div key={grade.id} className="bg-slate-50/50 rounded-[3rem] p-8 border border-[var(--card-border)]">
                                                    <div className="flex items-center justify-between mb-8 px-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-[var(--card-bg)] text-[var(--text-main)] rounded-2xl flex items-center justify-center font-black text-xl shadow-sm">
                                                                {grade.name[0]}
                                                            </div>
                                                            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">{grade.name}</h3>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const sids = gradeSections.map(s => s.id);
                                                                const allSelected = sids.every(id => formData.selectedClassrooms.includes(id));
                                                                if (allSelected) {
                                                                    setFormData(prev => ({ ...prev, selectedClassrooms: prev.selectedClassrooms.filter(id => !sids.includes(id)) }));
                                                                } else {
                                                                    setFormData(prev => ({ ...prev, selectedClassrooms: Array.from(new Set([...prev.selectedClassrooms, ...sids])) }));
                                                                }
                                                            }}
                                                            className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-indigo-800"
                                                        >
                                                            {gradeSections.every(s => formData.selectedClassrooms.includes(s.id)) ? 'Deselect All' : 'Select All'}
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        {gradeSections.map(section => {
                                                            const isSelected = formData.selectedClassrooms.includes(section.id);
                                                            return (
                                                                <button
                                                                    key={section.id}
                                                                    onClick={() => toggleClassroom(section.id)}
                                                                    className={`px-6 py-5 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-1 ${isSelected ? 'bg-primary border-primary text-white shadow-xl shadow-theme/10 scale-105' : 'bg-[var(--card-bg)] border-transparent text-[var(--text-muted)] hover:border-primary/20'}`}
                                                                >
                                                                    <span className="text-[10px] font-black uppercase opacity-50">Section</span>
                                                                    <span className="text-base font-black uppercase">{section.name}-{section.section}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: SUBJECTS */}
                            {currentStep === 'subjects' && (
                                <div className="space-y-10 flex flex-col h-full">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl">
                                            <BookOpen size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Configure Papers</h2>
                                            <p className="text-[var(--text-muted)] font-medium">Assign subjects, max marks, and evaluators per class.</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto max-h-[500px] pr-4 custom-scrollbar">
                                        <div className="space-y-12">
                                            {classrooms.filter(c => formData.selectedClassrooms.includes(c.id)).map(classroom => {
                                                const classroomSubjects = subjects.filter(s => s.grade_id === classroom.grade_id);
                                                return (
                                                    <div key={classroom.id} className="space-y-6">
                                                        <div className="flex items-center gap-4 px-4">
                                                            <div className="w-2 h-8 bg-primary rounded-full" />
                                                            <h3 className="text-xl font-black text-[var(--text-main)]">
                                                                {classroom.name}-{classroom.section}
                                                                <span className="ml-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">{classroomSubjects.length} Subjects</span>
                                                            </h3>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-4">
                                                            {classroomSubjects.map(subject => {
                                                                const paperConfig = formData.papers.find(p => p.subject_id === subject.id && p.classroom_id === classroom.id);
                                                                return (
                                                                    <div key={subject.id} className="bg-slate-50/50 p-6 rounded-[2rem] border border-[var(--card-border)] flex items-center gap-8">
                                                                        <div className="w-1/4">
                                                                            <p className="text-sm font-black text-[var(--text-main)]">{subject.name}</p>
                                                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{subject.code}</p>
                                                                        </div>

                                                                        <div className="w-1/5 space-y-2">
                                                                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Max Marks</label>
                                                                            <input
                                                                                type="number"
                                                                                placeholder="100"
                                                                                value={paperConfig?.max_marks || 100}
                                                                                onChange={e => updatePaper(subject.id, classroom.id, 'max_marks', e.target.value)}
                                                                                className="w-full px-4 py-3 bg-[var(--card-bg)] rounded-xl border-none font-black text-[var(--text-main)] focus:ring-4 focus:ring-indigo-500/5 outline-none"
                                                                            />
                                                                        </div>

                                                                        <div className="flex-1 space-y-2">
                                                                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Lead Evaluator</label>
                                                                            <select
                                                                                value={paperConfig?.evaluator_id || ''}
                                                                                onChange={e => updatePaper(subject.id, classroom.id, 'evaluator_id', e.target.value)}
                                                                                className="w-full px-4 py-3 bg-[var(--card-bg)] rounded-xl border-none font-black text-[var(--text-main)] focus:ring-4 focus:ring-indigo-500/5 outline-none"
                                                                            >
                                                                                <option value="">Select Faculty</option>
                                                                                {staff.map(s => (
                                                                                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>

                                                                        <div className="w-1/6 space-y-2">
                                                                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Type</label>
                                                                            <select
                                                                                value={paperConfig?.type || 'theory'}
                                                                                onChange={e => updatePaper(subject.id, classroom.id, 'type', e.target.value)}
                                                                                className="w-full px-4 py-3 bg-[var(--card-bg)] rounded-xl border-none font-black text-[var(--text-main)] focus:ring-4 focus:ring-indigo-500/5 outline-none"
                                                                            >
                                                                                <option value="theory">Theory</option>
                                                                                <option value="practical">Practical</option>
                                                                                <option value="viva">Viva</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: SCHEDULE */}
                            {currentStep === 'schedule' && (
                                <div className="space-y-10 flex flex-col h-full">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-surface-dark text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl">
                                            <CalendarIcon size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Timeline Builder</h2>
                                            <p className="text-[var(--text-muted)] font-medium">Assign dates and time slots for each paper. No overlaps permitted.</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
                                        <div className="col-span-8 overflow-y-auto pr-4 custom-scrollbar space-y-6">
                                            {/* Weekly Layout Visualization */}
                                            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-[var(--card-border)]">
                                                <div className="grid grid-cols-7 gap-2 mb-4">
                                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                                                        <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">{d}</div>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-7 gap-2">
                                                    {Array.from({ length: 31 }).map((_, i) => (
                                                        <div key={i} className="aspect-square bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)]/50 hover:border-primary transition-all cursor-pointer flex items-center justify-center text-xs font-black text-[var(--text-muted)] hover:text-primary">
                                                            {i + 1}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4">Scheduling Queue</h3>
                                                {formData.papers.map((paper, idx) => {
                                                    const sub = subjects.find(s => s.id === paper.subject_id);
                                                    const cls = classrooms.find(c => c.id === paper.classroom_id);
                                                    return (
                                                        <div key={idx} className="bg-[var(--card-bg)] p-6 rounded-[2rem] border border-[var(--card-border)] flex items-center justify-between group hover:shadow-xl hover:shadow-theme/10/50 transition-all">
                                                            <div className="flex items-center gap-6">
                                                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[var(--text-main)] font-black">
                                                                    {idx + 1}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-[var(--text-main)]">{sub?.name}</p>
                                                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{cls?.name}-{cls?.section}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative">
                                                                    <CalendarIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                                    <input 
                                                                        type="date" 
                                                                        value={paper.date || ''}
                                                                        onChange={e => updatePaper(paper.subject_id, paper.classroom_id, 'date', e.target.value)}
                                                                        className="pl-12 pr-4 py-3 bg-slate-50 rounded-xl border-none text-[10px] font-black text-[var(--text-main)] focus:bg-[var(--card-bg)] outline-none"
                                                                    />
                                                                </div>
                                                                <div className="relative">
                                                                    <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                                    <input 
                                                                        type="time" 
                                                                        value={paper.start_time || ''}
                                                                        onChange={e => updatePaper(paper.subject_id, paper.classroom_id, 'start_time', e.target.value)}
                                                                        className="pl-12 pr-4 py-3 bg-slate-50 rounded-xl border-none text-[10px] font-black text-[var(--text-main)] focus:bg-[var(--card-bg)] outline-none"
                                                                    />
                                                                </div>
                                                                <div className="relative">
                                                                    <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                                    <input 
                                                                        type="time" 
                                                                        value={paper.end_time || ''}
                                                                        onChange={e => updatePaper(paper.subject_id, paper.classroom_id, 'end_time', e.target.value)}
                                                                        className="pl-12 pr-4 py-3 bg-slate-50 rounded-xl border-none text-[10px] font-black text-[var(--text-main)] focus:bg-[var(--card-bg)] outline-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="col-span-4 bg-surface-dark rounded-[3rem] p-8 text-white flex flex-col gap-8 shadow-2xl">
                                            <div className="flex items-center gap-4">
                                                <AlertTriangle className="text-amber-400" size={24} />
                                                <h3 className="text-lg font-black tracking-tight">Logic Engine</h3>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="p-6 bg-[var(--card-bg)]/5 rounded-[2rem] border border-white/10">
                                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Conflicts Detected</p>
                                                    <p className="text-2xl font-black">Zero</p>
                                                </div>
                                                <div className="p-6 bg-[var(--card-bg)]/5 rounded-[2rem] border border-white/10">
                                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Availability</p>
                                                    <p className="text-sm font-medium text-white/60 leading-relaxed">All evaluators are available for the selected time slots.</p>
                                                </div>
                                            </div>
                                            <div className="mt-auto">
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">Pro Tip</p>
                                                <p className="text-xs font-medium text-white/50 leading-relaxed">Ensure a 15-minute buffer between papers for classroom sanitization and transition.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 5: REVIEW */}
                            {currentStep === 'review' && (
                                <div className="space-y-12">
                                    <div className="text-center mb-16">
                                        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-100">
                                            <CheckCircle2 size={48} />
                                        </div>
                                        <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tight">Review Manifest</h2>
                                        <p className="text-[var(--text-muted)] font-medium mt-3 text-lg">Verify all details before finalizing the examination cycle.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-10">
                                        <div className="space-y-8">
                                            <div className="p-8 bg-slate-50 rounded-[3rem] border border-[var(--card-border)]">
                                                <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-6">Core Configuration</h4>
                                                <div className="space-y-6">
                                                    <div className="flex justify-between">
                                                        <span className="text-xs font-bold text-[var(--text-muted)]">Exam Title</span>
                                                        <span className="text-sm font-black text-[var(--text-main)]">{formData.name}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-xs font-bold text-[var(--text-muted)]">Cycle Range</span>
                                                        <span className="text-sm font-black text-[var(--text-main)]">{formData.start_date} — {formData.end_date}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-xs font-bold text-[var(--text-muted)]">Assigned Units</span>
                                                        <span className="text-sm font-black text-[var(--text-main)]">{formData.selectedClassrooms.length} Sections</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="p-8 bg-primary text-white rounded-[3rem] shadow-xl shadow-theme/10">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Papers</p>
                                                    <p className="text-3xl font-black">{formData.papers.length}</p>
                                                </div>
                                                <div className="p-8 bg-emerald-500 text-white rounded-[3rem] shadow-xl shadow-emerald-100">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Candidates</p>
                                                    <p className="text-3xl font-black">{totalSelectedStudents}</p>
                                                </div>
                                            </div>
                                            <div className="p-8 bg-surface-dark text-white rounded-[3rem] shadow-2xl">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <Layout className="text-indigo-400" size={20} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Workload Analysis</p>
                                                </div>
                                                <p className="text-xs font-medium text-white/60 leading-relaxed">Evaluation will require approximately 40 hours of faculty time across 8 evaluators.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Footer */}
                    <footer className="mt-auto pt-10 border-t border-slate-50 flex items-center justify-between">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 'details'}
                            className="flex items-center gap-4 px-10 py-5 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-[var(--text-main)] hover:border-slate-300 disabled:opacity-20 transition-all active:scale-95"
                        >
                            <ChevronLeft size={18} />
                            Back
                        </button>

                        <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 px-8 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--text-main)] transition-all">
                                <Save size={16} /> Save as Draft
                            </button>
                            {currentStep === 'review' ? (
                                <button
                                    onClick={handleCreate}
                                    disabled={isSaving}
                                    className="px-14 py-5 bg-surface-dark text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 shadow-2xl shadow-theme/20 transition-all flex items-center gap-3"
                                >
                                    <ShieldCheck size={18} /> Create Exam Cycle
                                </button>
                            ) : (
                                <button
                                    onClick={handleNext}
                                    className="px-14 py-5 bg-primary text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 shadow-2xl shadow-theme/10 transition-all flex items-center gap-3"
                                >
                                    Next Phase <ChevronRight size={18} />
                                </button>
                            )}
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}
