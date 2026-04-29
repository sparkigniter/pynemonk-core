import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Calendar,
    Users,
    ChevronRight,
    ArrowLeft,
    CheckCircle2,
    ShieldCheck
} from 'lucide-react';
import { examApi } from '../../api/exam.api';
import { getGrades } from '../../api/grade.api';
import { getClassrooms } from '../../api/classroom.api';
import { useNotification } from '../../contexts/NotificationContext';
import type { Grade } from '../../api/grade.api';
import type { Classroom } from '../../api/classroom.api';
import type { Exam } from '../../api/exam.api';
type Step = 'identity' | 'participants' | 'review';

export default function ExamScheduler() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notify } = useNotification();

    const [currentStep, setCurrentStep] = useState<Step>('identity');
    const [grades, setGrades] = useState<Grade[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Core State
    const [examData, setExamData] = useState({
        name: '',
        exam_type: 'term' as Exam['exam_type'],
        academic_year_id: 1,
        exam_term_id: undefined as number | undefined,
        start_date: '',
        end_date: '',
        description: '',
        invitations: [] as { grade_id: number, classroom_id: number, subject_id?: number }[]
    });

    useEffect(() => {
        loadInitialData();
    }, [id]);

    const loadInitialData = async () => {
        try {
            setIsLoading(true);
            const [gradesData, classroomsData] = await Promise.all([
                getGrades(),
                getClassrooms()
            ]);
            setGrades(gradesData);
            setClassrooms(classroomsData.data);

            if (id) {
                const existing = await examApi.getExamDetails(parseInt(id));
                setExamData({
                    name: existing.name,
                    exam_type: existing.exam_type,
                    academic_year_id: 1, // Existing might not have it in details, default to 1
                    exam_term_id: existing.exam_term_id,
                    start_date: existing.start_date.split('T')[0],
                    end_date: existing.end_date.split('T')[0],
                    description: '', // Not in default details
                    invitations: existing.invitations || []
                });
            }
        } catch (err) {
            notify('error', 'Error', 'Failed to load configuration data');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleInvitation = (gradeId: number, classroomId: number, subjectId?: number) => {
        const exists = examData.invitations.find(inv =>
            inv.classroom_id === classroomId && inv.subject_id === subjectId
        );
        if (exists) {
            setExamData({
                ...examData,
                invitations: examData.invitations.filter(inv =>
                    !(inv.classroom_id === classroomId && inv.subject_id === subjectId)
                )
            });
        } else {
            setExamData({
                ...examData,
                invitations: [...examData.invitations, { grade_id: gradeId, classroom_id: classroomId, subject_id: subjectId }]
            });
        }
    };

    const bulkSelectClassrooms = (gradeId: number, classroomIds: number[]) => {
        const allSelected = classroomIds.every(cid =>
            examData.invitations.some(inv => inv.classroom_id === cid && !inv.subject_id)
        );

        if (allSelected) {
            // Deselect all
            setExamData({
                ...examData,
                invitations: examData.invitations.filter(inv =>
                    !(inv.grade_id === gradeId && !inv.subject_id)
                )
            });
        } else {
            // Select all (avoid duplicates)
            const otherInvs = examData.invitations.filter(inv =>
                !(inv.grade_id === gradeId && !inv.subject_id)
            );
            const newInvs = classroomIds.map(cid => ({ grade_id: gradeId, classroom_id: cid }));
            setExamData({ ...examData, invitations: [...otherInvs, ...newInvs] });
        }
    };


    const handleSave = async () => {
        setIsSaving(true);
        try {
            let savedId = id ? parseInt(id) : null;

            // Map internal state to API Partial<Exam>
            const payload: Partial<Exam> = {
                name: examData.name,
                exam_type: examData.exam_type,
                start_date: examData.start_date,
                end_date: examData.end_date,
                exam_term_id: examData.exam_term_id
            };

            if (id) {
                await examApi.updateExam(parseInt(id), payload);
                notify('success', 'Exam Updated', 'Exam details updated successfully.');
            } else {
                const response = await examApi.createExam(payload);
                savedId = response.id;

                // Add invitations after creation
                await Promise.all(
                    examData.invitations.map(inv => examApi.addInvitation(savedId!, inv))
                );

                notify('success', 'Exam Created', 'Redirecting to Date Sheet Builder...');
            }
            navigate(`/exams/${savedId}/papers`);
        } catch (err: any) {
            notify('error', 'Save Failed', err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const steps: { id: Step; label: string; icon: any }[] = [
        { id: 'identity', label: 'Identity', icon: ShieldCheck },
        { id: 'participants', label: 'Candidates', icon: Users },
        { id: 'review', label: 'Review', icon: CheckCircle2 }
    ];

    if (isLoading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-theme-primary/20 border-t-theme-primary rounded-full animate-spin" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading Wizard...</p>
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
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{id ? 'Refine' : 'Schedule'} Examination</h1>
                        <p className="text-slate-500 font-medium mt-1">Initialize the assessment container and target candidates.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-1.5 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm">
                    {steps.map((s, i) => (
                        <div key={s.id} className="flex items-center">
                            <button
                                disabled={isSaving}
                                onClick={() => setCurrentStep(s.id)}
                                className={`flex items-center gap-3 px-6 py-2.5 rounded-xl transition-all ${currentStep === s.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <s.icon size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                            </button>
                            {i < steps.length - 1 && <ChevronRight size={14} className="mx-2 text-slate-200" />}
                        </div>
                    ))}
                </div>
            </header>

            <div className="flex-1 max-w-6xl mx-auto w-full">
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-12 relative overflow-hidden group">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-theme-primary/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-theme-primary/10 transition-colors duration-1000" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -ml-32 -mb-32 group-hover:bg-indigo-500/10 transition-colors duration-1000" />

                    {/* STEP 1: IDENTITY */}
                    {currentStep === 'identity' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
                            <div className="text-center mb-10">
                                <div className="inline-flex p-4 bg-slate-900 text-white rounded-3xl shadow-xl mb-6 transform -rotate-2">
                                    <ShieldCheck size={32} />
                                </div>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Identity & Purpose</h2>
                                <p className="text-slate-400 font-medium mt-2">Define the core metadata for this assessment container.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Examination Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Mid-Term Assessments 2024"
                                        className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-theme-primary/10 transition-all outline-none text-lg shadow-inner"
                                        value={examData.name}
                                        onChange={e => setExamData({ ...examData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Assessment Classification</label>
                                    <div className="flex p-2 bg-slate-50 border border-slate-100 rounded-[2rem] shadow-inner">
                                        {[
                                            { id: 'term', label: 'Term' },
                                            { id: 'periodic', label: 'Periodic' },
                                            { id: 'annual', label: 'Annual' }
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                onClick={() => setExamData({ ...examData, exam_type: type.id as any })}
                                                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${examData.exam_type === type.id ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Commencement Date</label>
                                    <div className="relative group/date">
                                        <Calendar size={20} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/date:text-theme-primary transition-colors" />
                                        <input
                                            type="date"
                                            className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-slate-700 outline-none focus:bg-white transition-all shadow-inner"
                                            value={examData.start_date}
                                            onChange={e => setExamData({ ...examData, start_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Conclusion Date</label>
                                    <div className="relative group/date">
                                        <Calendar size={20} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/date:text-theme-primary transition-colors" />
                                        <input
                                            type="date"
                                            className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-slate-700 outline-none focus:bg-white transition-all shadow-inner"
                                            value={examData.end_date}
                                            onChange={e => setExamData({ ...examData, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Directives & Context (Optional)</label>
                                <textarea
                                    rows={4}
                                    className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-bold text-slate-700 outline-none focus:bg-white transition-all shadow-inner"
                                    placeholder="Add specific instructions for evaluators or candidates..."
                                    value={examData.description}
                                    onChange={e => setExamData({ ...examData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: AUDIENCE TARGETING */}
                    {currentStep === 'participants' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700 relative z-10">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
                                <div>
                                    <div className="inline-flex p-3 bg-indigo-500 text-white rounded-2xl shadow-lg mb-4">
                                        <Users size={24} />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Audience Targeting</h3>
                                    <p className="text-sm font-medium text-slate-400 mt-1">Select the grades and sections participating in this assessment cycle.</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <button
                                        onClick={() => {
                                            const allIds: { grade_id: number, classroom_id: number }[] = [];
                                            classrooms.forEach(c => allIds.push({ grade_id: c.grade_id, classroom_id: c.id }));
                                            setExamData(prev => ({ ...prev, invitations: allIds }));
                                        }}
                                        className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                                    >
                                        Select All Classes (Global)
                                    </button>
                                    <div className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-800 shadow-xl">
                                        <ShieldCheck size={14} className="text-theme-primary" />
                                        {examData.invitations.length} Sections Targeted
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-8 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar px-1">
                                {grades.map(grade => {
                                    const gradeClassrooms = classrooms.filter(c => c.grade_id === grade.id);
                                    const allClassroomsSelected = gradeClassrooms.length > 0 && gradeClassrooms.every(cid =>
                                        examData.invitations.some(inv => inv.classroom_id === cid.id)
                                    );

                                    return (
                                        <div key={grade.id} className="bg-white border border-slate-100 rounded-[3rem] shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col md:flex-row group/grade hover:border-theme-primary/20 transition-all duration-500">
                                            {/* Grade Sidebar */}
                                            <div className="md:w-[240px] bg-slate-50 p-8 flex flex-col justify-between border-r border-slate-100 group-hover/grade:bg-slate-900 group-hover/grade:text-white transition-all duration-500">
                                                <div>
                                                    <div className="w-14 h-14 bg-white text-slate-900 rounded-2xl flex items-center justify-center font-black text-xl mb-6 shadow-sm group-hover/grade:bg-theme-primary group-hover/grade:text-white transition-all duration-500">{grade.name[0]}</div>
                                                    <h4 className="text-lg font-black tracking-tight">{grade.name}</h4>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">{gradeClassrooms.length} Sections Available</p>
                                                </div>
                                                <button
                                                    onClick={() => bulkSelectClassrooms(grade.id, gradeClassrooms.map(c => c.id))}
                                                    className={`mt-10 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                                                        ${allClassroomsSelected
                                                            ? 'bg-theme-primary border-theme-primary text-white shadow-lg shadow-theme-primary/20'
                                                            : 'bg-white border-slate-200 text-slate-400 hover:text-slate-900 group-hover/grade:bg-white/10 group-hover/grade:border-white/20 group-hover/grade:text-white'}`}
                                                >
                                                    {allClassroomsSelected ? 'All Selected' : 'Select Grade'}
                                                </button>
                                            </div>

                                            {/* Classroom Selection */}
                                            <div className="flex-1 p-10 space-y-8 bg-white">
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Sections</h5>
                                                        <p className="text-[10px] font-medium text-slate-300">Click to include/exclude specific sections</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                                        {gradeClassrooms.map(classroom => {
                                                            const isSelected = examData.invitations.some(inv => inv.classroom_id === classroom.id);
                                                            return (
                                                                <button
                                                                    key={classroom.id}
                                                                    onClick={() => toggleInvitation(grade.id, classroom.id)}
                                                                    className={`px-6 py-4 rounded-[1.5rem] text-sm font-black transition-all border flex flex-col items-center gap-1
                                                                        ${isSelected
                                                                            ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-105'
                                                                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-theme-primary/30 hover:text-theme-primary'}`}
                                                                >
                                                                    <span className="text-[10px] opacity-40 uppercase tracking-widest">Section</span>
                                                                    {classroom.name}-{classroom.section}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: REVIEW */}
                    {currentStep === 'review' && (
                        <div className="space-y-12 animate-in zoom-in-95 duration-700 text-center py-12 relative z-10">
                            <div className="relative">
                                <div className="w-32 h-32 bg-emerald-50 text-emerald-500 rounded-[3.5rem] flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-2xl relative z-10 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <CheckCircle2 size={64} />
                                </div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
                            </div>

                            <div>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight">Configuration Finalized</h3>
                                <p className="text-slate-400 font-medium mt-3 max-w-md mx-auto text-lg leading-relaxed">The examination container is ready. Proceed to build the Date Sheet and schedule individual papers.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto py-12">
                                {[
                                    { label: 'Window', value: `${new Date(examData.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(examData.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
                                    { label: 'Audience', value: `${examData.invitations.length} Sections`, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                                    { label: 'Classification', value: examData.exam_type, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 group/stat hover:-translate-y-2 transition-all duration-500">
                                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover/stat:scale-110 transition-transform duration-500`}>
                                            <stat.icon size={24} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                        <p className="text-lg font-black text-slate-900 uppercase">{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* FOOTER NAVIGATION */}
                    <div className="mt-16 flex items-center justify-between pt-10 border-t border-slate-100 relative z-10">
                        <button
                            disabled={currentStep === 'identity' || isSaving}
                            onClick={() => {
                                if (currentStep === 'participants') setCurrentStep('identity');
                                else if (currentStep === 'review') setCurrentStep('participants');
                            }}
                            className="flex items-center gap-4 px-10 py-5 bg-white border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:text-slate-900 hover:border-slate-300 disabled:opacity-20 transition-all shadow-sm active:scale-95"
                        >
                            <ArrowLeft size={18} />
                            Previous Step
                        </button>

                        {currentStep === 'review' ? (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-4 px-14 py-6 bg-slate-900 text-white rounded-[2.5rem] text-sm font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all disabled:opacity-50 group/save"
                            >
                                {isSaving ? 'Finalizing Assessment...' : 'Initialize & Schedule Papers'}
                                <ChevronRight size={22} className="group-hover/save:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    if (currentStep === 'identity') setCurrentStep('participants');
                                    else if (currentStep === 'participants') setCurrentStep('review');
                                }}
                                className="flex items-center gap-4 px-12 py-5 bg-theme-primary text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 shadow-2xl shadow-theme-primary/30 transition-all group/next"
                            >
                                Next: {currentStep === 'identity' ? 'Candidate Targeting' : 'Review Manifest'}
                                <ChevronRight size={18} className="group-hover/next:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
