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


    return (
        <div className="p-10 bg-[#FBFBFE] min-h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/exams')}
                        className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-90"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{exam.name}</h1>
                            <div className="flex gap-2">
                                {exam.is_published ? (
                                    <span className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100">Published</span>
                                ) : (
                                    <span className="px-4 py-1.5 bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">In Progress</span>
                                )}
                            </div>
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-3 text-xs">
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
                            className={`flex items-center gap-3 px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${exam.is_published ? 'bg-white border-2 border-emerald-500 text-emerald-500' : 'bg-slate-900 text-white shadow-slate-200'}`}
                        >
                            <ShieldCheck size={18} />
                            {exam.is_published ? 'Unpublish Results' : 'Publish Results'}
                        </button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 flex-1">
                {/* Left Panel: Target Audience */}
                <div className="lg:col-span-1 space-y-8">
                    <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">
                            <Users size={20} className="text-indigo-600" />
                            Target Audience
                        </h3>
                        
                        <div className="space-y-8">
                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <div className="text-center flex-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Students</p>
                                    <p className="text-3xl font-black text-slate-900">{exam.students?.length || 0}</p>
                                </div>
                                <div className="w-px h-10 bg-slate-200" />
                                <div className="text-center flex-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sections</p>
                                    <p className="text-3xl font-black text-slate-900">
                                        {new Set(exam.invitations?.map((i: any) => i.classroom_id)).size}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Sections</p>
                                <div className="flex flex-wrap gap-2">
                                    {exam.invitations?.reduce((acc: any[], current: any) => {
                                        if (!acc.find(a => a.classroom_id === current.classroom_id)) acc.push(current);
                                        return acc;
                                    }, []).map((inv: any, i: number) => (
                                        <div key={i} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-tight border border-indigo-100">
                                            {inv.classroom_name} {inv.classroom_section}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={() => navigate(`/exams/${id}/invitations`)}
                                className="w-full flex items-center justify-center gap-3 p-5 bg-slate-50 text-slate-900 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95 border border-slate-100"
                            >
                                <Users size={16} />
                                Manage Students
                            </button>
                        </div>
                    </section>

                    <section className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-xl shadow-indigo-100">
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
                            className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            View Full Schedule
                        </button>
                    </section>
                </div>

                {/* Right Area: Evaluation Hub */}
                <div className="lg:col-span-3 space-y-10">
                    <section className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm min-h-full">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                                    <LayoutDashboard size={32} className="text-indigo-600" />
                                    Your Evaluation Work
                                </h3>
                                <p className="text-slate-400 font-medium mt-2">
                                    Focus on pending answer sheets. Results auto-save as you check.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {exam.invitations?.reduce((acc: any[], current: any) => {
                                if (!acc.find(a => a.classroom_id === current.classroom_id)) acc.push(current);
                                return acc;
                            }, []).map((section: any, i: number) => {
                                const checkedCount = 12; // Mock for demo
                                const totalCount = 50; // Mock for demo
                                const progress = (checkedCount / totalCount) * 100;

                                return (
                                    <div key={i} className="bg-[#F8F9FD] p-8 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 flex flex-col">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-900 font-black text-xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                {section.classroom_name[0]}
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${progress > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-2">{section.classroom_name}-{section.classroom_section}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{totalCount} Students • {exam.papers?.length || 0} Papers</p>
                                        </div>

                                        <div className="space-y-4 mb-10">
                                            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <span>Evaluation Progress</span>
                                                <span className="text-slate-900">{checkedCount}/{totalCount} Checked</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => {
                                                if (exam.papers?.length > 0) {
                                                    navigate(`/exams/${id}/papers/${exam.papers[0].id}/marks?classroom=${section.classroom_id}`);
                                                }
                                            }}
                                            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                                        >
                                            <UserCheck size={16} />
                                            {progress > 0 ? 'Continue Checking' : 'Start Checking'}
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
