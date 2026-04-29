import { useState, useEffect } from 'react';
import { 
    Plus, Filter, MoreHorizontal, 
    CheckCircle2, Clock, Sparkles,
    Loader2, Save
} from 'lucide-react';
import * as onboardingApi from '../../api/onboarding.api';
import { useNotification } from '../../contexts/NotificationContext';

const columns = [
    { id: 'applied', title: 'Applied', color: 'bg-slate-100', text: 'text-slate-600' },
    { id: 'evaluation', title: 'Evaluation', color: 'bg-blue-50', text: 'text-blue-600' },
    { id: 'verification', title: 'Verification', color: 'bg-amber-50', text: 'text-amber-600' },
    { id: 'completed', title: 'Onboarded', color: 'bg-emerald-50', text: 'text-emerald-600' },
];

const OnboardingPipeline = ({ type }: { type?: 'Student' | 'Teacher' }) => {
    const [instances, setInstances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scoringInstance, setScoringInstance] = useState<any>(null);
    const [score, setScore] = useState('');
    const [isSaving, setIsSaving] = useState(false);
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
        <div className="space-y-10 max-w-[1600px] mx-auto pb-10">
            {/* ── Modern Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <Sparkles size={12} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Admission Pipeline</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        {type ? `${type} Intake` : 'Global Pipeline'}
                    </h1>
                    <p className="text-slate-400 font-medium text-sm">
                        Manage leads and track onboarding progress for {type?.toLowerCase() || 'all'} candidates.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="bg-white text-slate-600 px-6 py-3 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all shadow-sm border border-slate-100 flex items-center gap-2">
                        <Filter size={16} />
                        Filters
                    </button>
                    <button className="bg-primary text-white px-6 py-3 rounded-2xl text-xs font-black hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center gap-2">
                        <Plus size={18} />
                        New Lead
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Pipeline...</p>
                </div>
            ) : (
                <div className="flex gap-8 overflow-x-auto pb-10 px-4 snap-x no-scrollbar">
                    {columns.map((col) => {
                        const candidatesInCol = getInstancesByStage(col.id);
                        return (
                            <div key={col.id} className="flex-shrink-0 w-[340px] snap-start space-y-6">
                                {/* Column Header */}
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${col.color.replace('-50', '-500')}`} />
                                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">
                                            {col.title}
                                        </h3>
                                        <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400">
                                            {candidatesInCol.length}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Column Content */}
                                <div className="space-y-4 min-h-[600px] p-2 rounded-[2.5rem] bg-slate-50/50 border border-slate-100/50">
                                    {candidatesInCol.map((candidate) => (
                                        <div key={candidate.id} className="group p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all cursor-pointer">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-300">
                                                        {candidate.target_name[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-sm text-slate-900 truncate tracking-tight">{candidate.target_name}</h4>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                                            {candidate.template_name}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-slate-50 rounded-xl transition-all">
                                                    <MoreHorizontal size={16} className="text-slate-400" />
                                                </button>
                                            </div>
                                            
                                            <div className="mt-6 flex items-center justify-between">
                                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/50">
                                                    <Clock size={12} className="text-slate-400" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                        {new Date(candidate.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                
                                                {candidate.task_type === 'screening' && (
                                                    <button 
                                                        onClick={() => setScoringInstance(candidate)}
                                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all"
                                                    >
                                                        Record Score
                                                    </button>
                                                )}

                                                {candidate.status === 'completed' && (
                                                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                                                        <CheckCircle2 size={14} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Entrance Test Score Modal */}
            {scoringInstance && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Record Entrance Score</h3>
                        <p className="text-slate-400 font-medium mb-8">Enter the assessment result for {scoringInstance.target_name}.</p>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessment Score (0-100)</label>
                                <input 
                                    type="number" 
                                    value={score}
                                    onChange={e => setScore(e.target.value)}
                                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-lg focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                    placeholder="85"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setScoringInstance(null)} className="flex-1 px-8 py-4 rounded-2xl text-xs font-black text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
                                <button 
                                    onClick={handleRecordScore}
                                    disabled={isSaving || !score}
                                    className="flex-1 bg-primary text-white px-8 py-4 rounded-2xl text-xs font-black hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save Score
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
