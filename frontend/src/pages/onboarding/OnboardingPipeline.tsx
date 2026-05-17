import { useState, useEffect } from 'react';
import { 
    Plus, MoreHorizontal, 
    CheckCircle2, Clock, Sparkles,
    Loader2, Save, Search, ChevronRight,
    UserPlus, GraduationCap, ClipboardCheck
} from 'lucide-react';
import * as onboardingApi from '../../api/onboarding.api';
import { useNotification } from '../../contexts/NotificationContext';

const columns = [
    { id: 'applied', title: 'Applied', color: 'slate', icon: UserPlus },
    { id: 'evaluation', title: 'Evaluation', color: 'primary', icon: GraduationCap },
    { id: 'verification', title: 'Verification', color: 'amber', icon: ClipboardCheck },
    { id: 'completed', title: 'Onboarded', color: 'emerald', icon: CheckCircle2 },
];

const OnboardingPipeline = ({ type }: { type?: 'Student' | 'Teacher' }) => {
    const [instances, setInstances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scoringInstance, setScoringInstance] = useState<any>(null);
    const [score, setScore] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { notify } = useNotification();

    const fetchPipeline = async () => {
        setLoading(true);
        try {
            const res = await onboardingApi.getPipeline(type);
            setInstances(res.data);
        } catch (err) {
            console.error('Failed to fetch pipeline:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPipeline();
    }, [type]);

    const handleRecordScore = async () => {
        if (!scoringInstance || !score) return;
        setIsSaving(true);
        try {
            await onboardingApi.updateStep(scoringInstance.id, 'screening', { 
                score: parseInt(score),
                notes: `Entrance test score recorded: ${score}`
            });
            notify('success', 'Score Recorded', 'Candidate has been moved to verification.');
            setScoringInstance(null);
            setScore('');
            fetchPipeline();
        } catch (err: any) {
            notify('error', 'Update Failed', err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const getInstancesByStage = (stageId: string) => {
        return instances.filter(i => {
            const matchesSearch = i.target_name.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;

            if (i.status === 'completed' && stageId === 'completed') return true;
            if (i.status === 'completed') return false;

            const taskType = i.task_type;
            if (stageId === 'applied' && (!taskType || taskType === 'approval')) return true;
            if (stageId === 'evaluation' && (taskType === 'screening' || taskType === 'interview')) return true;
            if (stageId === 'verification' && taskType === 'document_upload') return true;
            return false;
        });
    };

    return (
        <div className="p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <Sparkles size={12} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Admission Funnel</span>
                    </div>
                    <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight leading-none">
                        {type ? `${type} Intake` : 'Global Pipeline'}
                    </h1>
                    <p className="text-[var(--text-muted)] font-medium text-sm mt-1">
                        Institutional lead management and onboarding workflow for LuviaEdu.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                        <input 
                            type="text"
                            placeholder="Search candidates..."
                            className="w-full pl-10 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <Plus size={18} />
                        New Lead
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Mapping Pipeline Channels...</p>
                </div>
            ) : (
                <div className="flex gap-8 overflow-x-auto pb-10 px-2 snap-x no-scrollbar min-h-[70vh]">
                    {columns.map((col) => {
                        const candidatesInCol = getInstancesByStage(col.id);
                        return (
                            <div key={col.id} className="flex-shrink-0 w-80 snap-start space-y-6">
                                {/* Column Header */}
                                <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-2xl bg-${col.color === 'primary' ? 'primary' : col.color + '-500'}/10 text-${col.color === 'primary' ? 'primary' : col.color + '-500'} flex items-center justify-center shadow-sm`}>
                                            <col.icon size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-[var(--text-main)] tracking-tight">{col.title}</h3>
                                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{candidatesInCol.length} Candidates</p>
                                        </div>
                                    </div>
                                    <button className="p-2 text-[var(--text-muted)] hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-colors">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </div>
                                
                                {/* Column Content */}
                                <div className={`space-y-4 min-h-[500px] p-4 rounded-[2.5rem] border border-dashed border-[var(--card-border)] transition-colors ${candidatesInCol.length === 0 ? 'bg-slate-50/20' : 'bg-slate-50/50'}`}>
                                    {candidatesInCol.map((candidate) => (
                                        <div key={candidate.id} className="premium-card p-5 group cursor-pointer hover:border-primary/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all active:scale-[0.98]">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${candidate.status === 'completed' ? 'bg-emerald-500' : 'bg-primary'}`}></div>
                                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest truncate max-w-[150px]">
                                                        {candidate.template_name}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--card-bg)] border border-[var(--card-border)] px-2 py-0.5 rounded shadow-sm">
                                                    {type || 'Lead'}
                                                </span>
                                            </div>

                                            <h4 className="text-base font-black text-[var(--text-main)] tracking-tight group-hover:text-primary transition-colors truncate">{candidate.target_name}</h4>
                                            
                                            <div className="mt-4 flex items-center gap-2 text-[var(--text-muted)]">
                                                <Clock size={14} className="opacity-50" />
                                                <span className="text-[11px] font-bold">Updated: {new Date(candidate.created_at).toLocaleDateString()}</span>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-[var(--card-border)]/50 flex items-center justify-between">
                                                <div className="flex -space-x-2">
                                                    {[1, 2].map(i => (
                                                        <div key={i} className="w-7 h-7 rounded-full border-2 border-[var(--card-bg)] bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400">
                                                            {i === 1 ? candidate.target_name[0] : '?'}
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                {candidate.task_type === 'screening' ? (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setScoringInstance(candidate); }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                                                    >
                                                        Score <ChevronRight size={14} />
                                                    </button>
                                                ) : (
                                                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-[var(--text-muted)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all group/btn shadow-sm">
                                                        View <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {candidatesInCol.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                            <div className="w-12 h-12 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]/50 flex items-center justify-center mb-4 text-slate-200">
                                                <col.icon size={24} />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No candidates in {col.title}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Entrance Test Score Modal */}
            {scoringInstance && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 modal-overlay backdrop-blur-sm" onClick={() => setScoringInstance(null)} />
                    <div className="relative bg-[var(--card-bg)] rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-300 border border-[var(--card-border)]/50">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                            <GraduationCap size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-[var(--text-main)] mb-2 tracking-tight">Record Entrance Score</h3>
                        <p className="text-[var(--text-muted)] font-medium mb-8">Enter the assessment result for <span className="text-primary font-bold">{scoringInstance.target_name}</span>.</p>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Assessment Score (0-100)</label>
                                <input 
                                    type="number" 
                                    value={score}
                                    onChange={e => setScore(e.target.value)}
                                    className="w-full p-5 bg-slate-50 border border-[var(--card-border)] rounded-2xl font-black text-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-200"
                                    placeholder="85"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setScoringInstance(null)} className="flex-1 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-slate-50 transition-all">Cancel</button>
                                <button 
                                    onClick={handleRecordScore}
                                    disabled={isSaving || !score}
                                    className="flex-1 bg-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save Result
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnboardingPipeline;
