import { 
    Plus, Filter, MoreHorizontal, 
    CheckCircle2, Clock, Sparkles
} from 'lucide-react';

const columns = [
    { id: 'pending', title: 'Applied', color: 'bg-slate-100', text: 'text-slate-600' },
    { id: 'screening', title: 'Screening', color: 'bg-blue-50', text: 'text-blue-600' },
    { id: 'interview', title: 'Interview', color: 'bg-purple-50', text: 'text-purple-600' },
    { id: 'verification', title: 'Verification', color: 'bg-amber-50', text: 'text-amber-600' },
    { id: 'finalized', title: 'Onboarded', color: 'bg-emerald-50', text: 'text-emerald-600' },
];

const mockCandidates = [
    { id: 1, name: 'John Smith', type: 'Teacher', grade: 'Grade 10', date: '2 hours ago', status: 'pending', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
    { id: 2, name: 'Emma Wilson', type: 'Student', grade: 'K1', date: '5 hours ago', status: 'screening', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
    { id: 3, name: 'Michael Brown', type: 'Teacher', grade: 'Mathematics', date: 'Yesterday', status: 'interview', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael' },
    { id: 4, name: 'Sarah Davis', type: 'Student', grade: 'Grade 5', date: 'Yesterday', status: 'screening', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 5, name: 'Robert Chen', type: 'Admin', grade: 'Finance', date: '2 days ago', status: 'verification', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert' },
];

const OnboardingPipeline = ({ type }: { type?: 'Student' | 'Teacher' }) => {
    const filteredCandidates = type 
        ? mockCandidates.filter(c => c.type === type)
        : mockCandidates;

    return (
        <div className="space-y-10 max-w-[1600px] mx-auto pb-10">
            {/* ── Modern Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <Sparkles size={12} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Intake Management</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        {type ? `${type} Onboarding` : 'Global Pipeline'}
                    </h1>
                    <p className="text-slate-400 font-medium text-sm">
                        Seamlessly transition candidates through your school's enrollment workflow.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="btn-ghost">
                        <Filter size={16} />
                        Filter View
                    </button>
                    <button className="btn-primary">
                        <Plus size={18} />
                        Add New {type || 'Candidate'}
                    </button>
                </div>
            </div>

            {/* ── Pipeline Board ── */}
            <div className="flex gap-8 overflow-x-auto pb-10 px-4 snap-x no-scrollbar">
                {columns.map((col) => {
                    const candidatesInCol = filteredCandidates.filter(c => c.status === col.id);
                    return (
                        <div key={col.id} className="flex-shrink-0 w-[340px] snap-start space-y-6">
                            {/* Column Header */}
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${col.color.replace('bg-', 'bg-').replace('-50', '-500')}`} />
                                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">
                                        {col.title}
                                    </h3>
                                    <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400">
                                        {candidatesInCol.length}
                                    </span>
                                </div>
                                <button className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-300 hover:text-slate-900">
                                    <Plus size={16} />
                                </button>
                            </div>
                            
                            {/* Column Content */}
                            <div className="space-y-4 min-h-[600px] p-2 rounded-[2.5rem] bg-slate-50/50 border border-slate-100/50">
                                {candidatesInCol.map((candidate) => (
                                    <div key={candidate.id} className="group p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all cursor-grab active:cursor-grabbing">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <img src={candidate.avatar} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100" alt="" />
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${col.color.replace('bg-', 'bg-').replace('-50', '-500')}`} />
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-black text-sm text-slate-900 truncate tracking-tight">{candidate.name}</h4>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                                        {candidate.type} <span className="text-slate-200 mx-1">•</span> {candidate.grade}
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
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{candidate.date}</span>
                                            </div>
                                            <div className="flex -space-x-3">
                                                <div className="w-8 h-8 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=Admin`} alt="" />
                                                </div>
                                                <div className="w-8 h-8 rounded-full border-4 border-white bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                                    <CheckCircle2 size={14} className="text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {candidatesInCol.length === 0 && (
                                    <div className="h-40 border-2 border-dashed border-slate-200/50 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 p-6 text-center space-y-2">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                                            <Plus size={18} className="opacity-20" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Stage Empty</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OnboardingPipeline;
