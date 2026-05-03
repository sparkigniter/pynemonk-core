import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ClipboardList,
    Calendar,
    Users,
    ChevronRight,
    ArrowLeft,
    UserCheck,
    Settings,
    LayoutDashboard,
    ArrowRight,
    ShieldCheck
} from 'lucide-react';
import { examApi } from '../../api/exam.api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

export default function ExamOverview() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notify } = useNotification();
    const { can } = useAuth();

    if (!can('exam:read')) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-6 text-center px-4">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-rose-500/10">
                    <ShieldCheck size={40} />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
                    <p className="text-slate-400 font-medium mt-2 max-w-sm">You do not have permission to view examination records.</p>
                </div>
                <button 
                    onClick={() => navigate('/')}
                    className="mt-4 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                    Return Home
                </button>
            </div>
        );
    }

    const [exam, setExam] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            const details = await examApi.getExamDetails(parseInt(id));
            setExam(details);
        } catch (err) {
            notify('error', 'Error', 'Failed to load exam overview');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublishResults = async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            await examApi.updateExam(parseInt(id), { is_published: !exam.is_published });
            notify('success', exam.is_published ? 'Unpublished' : 'Published', 
                exam.is_published ? 'Results have been hidden.' : 'Results are now visible to students.');
            await loadData();
        } catch (err) {
            notify('error', 'Action Failed', 'Could not update publication status.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-theme-primary/20 border-t-theme-primary rounded-full animate-spin" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading Exam Mission Control...</p>
            </div>
        );
    }

    if (!exam) return null;

    const isStarted = new Date(exam.start_date) <= new Date();
    const isFinished = new Date(exam.end_date) < new Date();
    const hasPapers = exam.papers?.length > 0;
    const canEvaluate = isFinished && hasPapers;

    return (
        <div className="p-8 bg-slate-50 min-h-[calc(100vh-100px)] rounded-[3rem] border border-slate-200 shadow-2xl relative flex flex-col">
            {/* Warning Banner if No Papers */}
            {!hasPapers && (
                <div className="mb-8 p-6 bg-slate-900 text-white rounded-[2rem] flex items-center justify-between border border-slate-800">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                            <ShieldCheck size={24} className="text-theme-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-widest">Schedule Required</p>
                            <p className="text-xs text-slate-400 mt-1 font-medium">Please add subjects to the Date Sheet before beginning evaluation.</p>
                        </div>
                    </div>
                    {can('exam:write') && (
                        <button 
                            onClick={() => navigate(`/exams/${id}/papers`)}
                            className="px-6 py-3 bg-theme-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                        >
                            Configure Schedule
                        </button>
                    )}
                </div>
            )}

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
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{exam.name}</h1>
                            {exam.is_published ? (
                                <span className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-400 shadow-lg shadow-emerald-200">Published</span>
                            ) : isFinished ? (
                                <span className="px-4 py-1.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">Completed</span>
                            ) : isStarted ? (
                                <span className="px-4 py-1.5 bg-amber-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">In Progress</span>
                            ) : (
                                <span className="px-4 py-1.5 bg-slate-100 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">Upcoming</span>
                            )}
                        </div>
                        <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                            <Calendar size={14} />
                            {new Date(exam.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            <ArrowRight size={14} className="text-slate-300" />
                            {new Date(exam.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {can('exam:write') && (
                        <>
                            <Link 
                                to={`/exams/${id}/edit`}
                                className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-theme-primary rounded-2xl transition-all shadow-sm active:scale-95"
                            >
                                <Settings size={20} />
                            </Link>
                            <button 
                                onClick={handlePublishResults}
                                disabled={!canEvaluate}
                                className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-30 disabled:grayscale ${exam.is_published ? 'bg-white border-2 border-emerald-500 text-emerald-500' : 'bg-theme-primary text-white shadow-theme-primary/20'}`}
                            >
                                <ShieldCheck size={18} />
                                {exam.is_published ? 'Unpublish Results' : 'Publish Results'}
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 flex-1 overflow-hidden">
                {/* Left Column: Stats & Candidate Pulse */}
                <div className="space-y-8 overflow-y-auto custom-scrollbar pr-4">
                    <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                        <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                            <Users size={20} className="text-theme-primary" />
                            Target Audience
                        </h3>
                        <div className="grid grid-cols-2 gap-8 mb-10">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invited Students</p>
                                <p className="text-3xl font-black text-slate-900">{exam.students?.length || 0}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Entries</p>
                                <p className="text-3xl font-black text-emerald-600">{exam.students?.filter((s: any) => !s.is_excluded).length || 0}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Impacted Sections</p>
                            <div className="flex flex-wrap gap-2">
                                {(() => {
                                    const sections = exam.invitations?.reduce((acc: any[], current: any) => {
                                        const exists = acc.find(a => a.classroom_id === current.classroom_id);
                                        if (!exists) acc.push(current);
                                        return acc;
                                    }, []) || [];
                                    
                                    const visible = sections.slice(0, 5);
                                    const remaining = sections.length - 5;

                                    return (
                                        <>
                                            {visible.map((inv: any, i: number) => (
                                                <div key={i} className="flex flex-col gap-1 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">
                                                        {inv.classroom_name} {inv.classroom_section}
                                                    </span>
                                                </div>
                                            ))}
                                            {remaining > 0 && (
                                                <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                                                    <span className="text-[8px] font-black uppercase">+{remaining} More</span>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                        {can('exam:write') && (
                            <Link 
                                to={`/exams/${id}/invitations`}
                                className="mt-10 w-full flex items-center justify-between p-5 bg-theme-primary text-white rounded-[1.5rem] group overflow-hidden relative active:scale-95 transition-all shadow-xl shadow-theme-primary/10"
                            >
                                <span className="text-xs font-black uppercase tracking-widest relative z-10">Manage Candidates</span>
                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform relative z-10" />
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                            </Link>
                        )}
                    </section>

                    <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                        <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                            <ClipboardList size={20} className="text-theme-primary" />
                            Date Sheet Summary
                        </h3>
                        {exam.papers && exam.papers.length > 0 ? (
                            <div className="space-y-4">
                                {exam.papers.map((paper: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group/item hover:bg-white hover:shadow-lg transition-all">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{paper.subject_name}</p>
                                            <p className="text-[8px] font-bold text-slate-400 mt-0.5">{new Date(paper.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {paper.start_time?.slice(0, 5)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase">{paper.max_marks} pts</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase">No Papers Scheduled</p>
                            </div>
                        )}
                        {can('exam:write') && (
                            <Link 
                                to={`/exams/${id}/papers`}
                                className="mt-8 w-full flex items-center justify-between p-5 bg-slate-900 text-white rounded-[1.5rem] group overflow-hidden relative active:scale-95 transition-all shadow-xl shadow-slate-900/10"
                            >
                                <span className="text-xs font-black uppercase tracking-widest relative z-10">Manage Schedule</span>
                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform relative z-10" />
                            </Link>
                        )}
                    </section>

                    <section className="bg-theme-primary/5 border border-theme-primary/10 p-10 rounded-[3.5rem]">
                        <h3 className="text-lg font-black text-theme-primary mb-6 flex items-center gap-3">
                            <LayoutDashboard size={20} />
                            Quick Insights
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Term</span>
                                <span className="text-xs font-black text-slate-900 uppercase">{exam.term_name || 'Annual'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Exam Type</span>
                                <span className="text-xs font-black text-slate-900 uppercase">{exam.exam_type}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Scheduling Status</span>
                                <span className={`text-xs font-black uppercase ${hasPapers ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {hasPapers ? 'Complete' : 'No Papers Added'}
                                </span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Evaluation Hub */}
                <div className="lg:col-span-2 space-y-8 overflow-y-auto custom-scrollbar pr-4">
                    <section className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 min-h-full">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                                    <ClipboardList size={28} className="text-theme-primary" />
                                    Evaluation Hub
                                </h3>
                                <p className="text-slate-400 font-medium mt-2">
                                    {!isFinished ? "Evaluation will open once the exam window concludes." : "Manage student assessments by section."}
                                </p>
                            </div>
                            <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                <button className="px-6 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">By Section</button>
                                <button className="px-6 py-3 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-all" onClick={() => navigate(`/exams/${id}/papers`)}>By Paper</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {exam.invitations?.reduce((acc: any[], current: any) => {
                                const exists = acc.find(a => a.classroom_id === current.classroom_id);
                                if (!exists) acc.push(current);
                                return acc;
                            }, []).map((section: any, i: number) => (
                                <div key={i} className={`group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 flex flex-col relative overflow-hidden ${!canEvaluate ? 'opacity-50 grayscale pointer-events-none' : 'hover:shadow-lg hover:shadow-slate-300/20 hover:-translate-y-1'}`}>
                                    {/* Decoration */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-theme-primary/10 transition-colors" />
                                    
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-xl shadow-slate-900/10 group-hover:bg-theme-primary transition-colors">
                                                {section.classroom_name[0]}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${!hasPapers ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {!hasPapers ? 'Missing Schedule' : isFinished ? 'Ready' : 'Locked'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{section.classroom_name}-{section.classroom_section}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{exam.papers?.length || 0} Scheduled Subjects</p>
                                        </div>

                                        <div className="space-y-3 mb-10">
                                            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <span>Progress</span>
                                                <span className="text-slate-900">0%</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                                <div className="h-full bg-slate-200 w-0 group-hover:w-full transition-all duration-1000" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-slate-50 grid grid-cols-1 gap-2 relative z-10">
                                        {(can('mark:write') || can('exam:write')) && (
                                            <button 
                                                disabled={!canEvaluate}
                                                onClick={() => {
                                                    if (exam.papers?.length > 0) {
                                                        navigate(`/exams/${id}/papers/${exam.papers[0].id}/marks?classroom=${section.classroom_id}`);
                                                    }
                                                }}
                                                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-900/10 transition-all disabled:opacity-20"
                                            >
                                                <UserCheck size={16} className="text-theme-primary" />
                                                Enter Class Marks
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            {(!exam.invitations || exam.invitations.length === 0) && (
                                <div className="col-span-full py-32 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[3rem]">
                                    <Users size={48} className="text-slate-200 mx-auto mb-6" />
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">No Sections Invited</h3>
                                    <p className="text-slate-400 mt-2 font-medium max-w-xs mx-auto">Define your target audience to start the evaluation process.</p>
                                    {can('exam:write') && (
                                        <Link to={`/exams/${id}/invitations`} className="mt-8 inline-flex items-center gap-3 px-10 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                            Select Audience
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
