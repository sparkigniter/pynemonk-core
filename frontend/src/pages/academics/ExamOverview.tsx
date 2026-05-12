import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ClipboardList,
    Calendar,
    Users,
    ArrowLeft,
    UserCheck,
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
                    <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Access Restricted</h2>
                    <p className="text-[var(--text-muted)] font-medium mt-2 max-w-sm">You do not have permission to view examination records.</p>
                </div>
                <button 
                    onClick={() => navigate('/')}
                    className="mt-4 px-8 py-4 bg-surface-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
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
            await examApi.updateExam(parseInt(id), { results_published: !exam.results_published });
            notify('success', exam.results_published ? 'Results Hidden' : 'Results Published', 
                exam.results_published ? 'Marks have been hidden from families.' : 'Evaluation records are now visible to students and parents.');
            await loadData();
        } catch (err) {
            notify('error', 'Action Failed', 'Could not update result publication status.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-theme-primary/20 border-t-theme-primary rounded-full animate-spin" />
                <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px]">Loading Exam Mission Control...</p>
            </div>
        );
    }

    if (!exam) return null;


    return (
        <div className="p-10 bg-[#FBFBFE] min-h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/exams')}
                        className="w-14 h-14 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all shadow-sm active:scale-90"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tighter">{exam.name}</h1>
                            <div className="flex gap-2">
                                {exam.results_published ? (
                                    <span className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100">Results Published</span>
                                ) : new Date(exam.end_date) < new Date() ? (
                                    <span className="px-4 py-1.5 bg-amber-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-100">Evaluation Pending</span>
                                ) : (
                                    <span className="px-4 py-1.5 bg-primary/50 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-theme/10">Ongoing</span>
                                )}
                            </div>
                        </div>
                        <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest mt-2 flex items-center gap-3 text-xs">
                            <Calendar size={14} />
                            {new Date(exam.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                            <ArrowRight size={14} className="text-slate-300" />
                            {new Date(exam.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {can('exam:write') && (
                        <button 
                            onClick={handlePublishResults}
                            className={`flex items-center gap-3 px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${exam.results_published ? 'bg-[var(--card-bg)] border-2 border-emerald-500 text-emerald-500' : 'bg-surface-dark text-white shadow-slate-200'}`}
                        >
                            <ShieldCheck size={18} />
                            {exam.results_published ? 'Hide Results' : 'Publish Results'}
                        </button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 flex-1">
                {/* Left Panel: Target Audience */}
                <div className="lg:col-span-1 space-y-8">
                    <section className="bg-[var(--card-bg)] p-10 rounded-[3rem] border border-[var(--card-border)] shadow-sm">
                        <h3 className="text-lg font-black text-[var(--text-main)] mb-8 flex items-center gap-3">
                            <Users size={20} className="text-primary" />
                            Target Audience
                        </h3>
                        
                        <div className="space-y-8">
                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-[var(--card-border)]">
                                <div className="text-center flex-1">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Students</p>
                                    <p className="text-3xl font-black text-[var(--text-main)]">{exam.students?.length || 0}</p>
                                </div>
                                <div className="w-px h-10 bg-slate-200" />
                                <div className="text-center flex-1">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Sections</p>
                                    <p className="text-3xl font-black text-[var(--text-main)]">
                                        {new Set(exam.invitations?.map((i: any) => i.classroom_id)).size}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Active Sections</p>
                                <div className="flex flex-wrap gap-2">
                                    {exam.invitations?.reduce((acc: any[], current: any) => {
                                        if (!acc.find(a => a.classroom_id === current.classroom_id)) acc.push(current);
                                        return acc;
                                    }, []).map((inv: any, i: number) => (
                                        <div key={i} className="px-4 py-2 bg-primary/5 text-primary rounded-xl text-[10px] font-black uppercase tracking-tight border border-indigo-100">
                                            {inv.classroom_name} {inv.classroom_section}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={() => navigate(`/exams/${id}/invitations`)}
                                className="w-full flex items-center justify-center gap-3 p-5 bg-slate-50 text-[var(--text-main)] rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-surface-dark hover:text-white transition-all active:scale-95 border border-[var(--card-border)]"
                            >
                                <Users size={16} />
                                Manage Students
                            </button>
                        </div>
                    </section>

                    <section className="bg-primary p-10 rounded-[3rem] text-white shadow-xl shadow-theme/10">
                        <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                            <ClipboardList size={20} />
                            Date Sheet
                        </h3>
                        <div className="space-y-4 mb-8">
                            {exam.papers?.slice(0, 3).map((paper: any, i: number) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-xs font-bold opacity-80">{paper.subject_name}</span>
                                    <span className="text-[10px] font-black uppercase">{paper.max_marks} pts</span>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => navigate(`/exams/${id}/papers`)}
                            className="w-full py-4 bg-[var(--card-bg)]/10 hover:bg-[var(--card-bg)]/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            View Full Schedule
                        </button>
                    </section>
                </div>

                {/* Right Area: Evaluation Hub */}
                <div className="lg:col-span-3 space-y-10">
                    <section className="bg-[var(--card-bg)] p-12 rounded-[3.5rem] border border-[var(--card-border)] shadow-sm min-h-full">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h3 className="text-3xl font-black text-[var(--text-main)] flex items-center gap-4">
                                    <LayoutDashboard size={32} className="text-primary" />
                                    Your Evaluation Work
                                </h3>
                                <p className="text-[var(--text-muted)] font-medium mt-2">
                                    Focus on pending answer sheets. Results auto-save as you check.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {exam.invitations?.reduce((acc: any[], current: any) => {
                                if (!acc.find(a => a.classroom_id === current.classroom_id)) acc.push(current);
                                return acc;
                            }, []).map((section: any, i: number) => {
                                const studentsInSection = exam.students?.filter((s: any) => s.classroom_id === section.classroom_id && !s.is_excluded) || [];
                                const totalStudentCount = studentsInSection.length;
                                
                                // Calculate progress based on papers marked
                                const totalExpectedMarks = totalStudentCount * (exam.papers?.length || 0);
                                const currentMarksCount = exam.papers?.reduce((acc: number, paper: any) => acc + (paper.marked_count || 0), 0) || 0;
                                
                                // Note: This is an approximation since marked_count is global across sections. 
                                // For a perfect count, we'd need marks per paper per section from backend.
                                // Using a simplified view for now:
                                const progress = totalExpectedMarks > 0 ? Math.min(100, Math.round((currentMarksCount / totalExpectedMarks) * 100)) : 0;

                                return (
                                    <div key={i} className="bg-[#F8F9FD] p-8 rounded-[2.5rem] border border-[var(--card-border)] group hover:bg-[var(--card-bg)] hover:shadow-2xl hover:shadow-theme/10/50 transition-all duration-500 flex flex-col">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="w-14 h-14 bg-[var(--card-bg)] rounded-2xl flex items-center justify-center text-[var(--text-main)] font-black text-xl shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                                                {section.classroom_name[0]}
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${exam.results_published || progress >= 100 ? 'bg-emerald-50 text-emerald-600' : progress > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-[var(--text-muted)]'}`}>
                                                    {exam.results_published || progress >= 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <h4 className="text-2xl font-black text-[var(--text-main)] tracking-tighter leading-none mb-2">{section.classroom_name}-{section.classroom_section}</h4>
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{totalStudentCount} Students • {exam.papers?.length || 0} Papers</p>
                                        </div>

                                        <div className="space-y-4 mb-10">
                                            <div className="flex items-center justify-between text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                                <span>{exam.results_published ? 'Final Assessment' : 'Evaluation Progress'}</span>
                                                <span className={`${exam.results_published ? 'text-emerald-600' : 'text-[var(--text-main)]'}`}>
                                                    {exam.results_published ? '100% Complete' : `${progress}% Complete`}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ${exam.results_published || progress >= 100 ? 'bg-emerald-500' : 'bg-primary'}`} 
                                                    style={{ width: `${exam.results_published ? 100 : progress}%` }} 
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => {
                                                if (exam.results_published) {
                                                    navigate(`/exams/${id}/results`);
                                                } else if (exam.papers?.length > 0) {
                                                    navigate(`/exams/${id}/papers/${exam.papers[0].id}/marks?classroom=${section.classroom_id}`);
                                                }
                                            }}
                                            className={`w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${exam.results_published ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-surface-dark text-white shadow-theme/10 hover:opacity-90'}`}
                                        >
                                            {exam.results_published ? (
                                                <>
                                                    <ShieldCheck size={16} />
                                                    View Final Marks
                                                </>
                                            ) : (
                                                <>
                                                    <UserCheck size={16} />
                                                    {progress > 0 ? 'Continue Checking' : 'Start Checking'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
