import { useState, useEffect } from 'react';
import { 
    Calendar, 
    ArrowRight, 
    CheckCircle2, 
    ChevronRight, 
    Users, 
    Layout, 
    BookOpen, 
    Loader2, 
    AlertCircle,
    Zap,
    RefreshCw,
    ShieldCheck
} from 'lucide-react';
import { academicsApi } from '../api/academics.api';

type Step = 'select-years' | 'configure' | 'review' | 'success';

export default function Rollover() {
    const [step, setStep] = useState<Step>('select-years');
    const [years, setYears] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [sourceYear, setSourceYear] = useState<number | null>(null);
    const [targetYear, setTargetYear] = useState<number | null>(null);
    
    const [options, setOptions] = useState({
        clone_classrooms: true,
        clone_assignments: true,
        promote_students: false
    });

    const [preview, setPreview] = useState<any>(null);

    const [newYearForm, setNewYearForm] = useState({
        name: '',
        start_date: '',
        end_date: ''
    });
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        loadYears();
    }, []);

    const loadYears = async () => {
        try {
            const data = await academicsApi.getYears();
            setYears(data);
            
            // Default source to current year
            const current = data.find((y: any) => y.is_current);
            if (current) {
                setSourceYear(current.id);
                // Propose next year
                const start = new Date(current.start_date);
                const end = new Date(current.end_date);
                start.setFullYear(start.getFullYear() + 1);
                end.setFullYear(end.getFullYear() + 1);
                
                setNewYearForm({
                    name: `${start.getFullYear()}-${end.getFullYear()}`,
                    start_date: start.toISOString().split('T')[0],
                    end_date: end.toISOString().split('T')[0]
                });
            }
        } catch (err) {
            setError('Failed to load academic years');
        }
    };

    const handleCreateYear = async () => {
        setLoading(true);
        try {
            const year = await academicsApi.createYear(newYearForm);
            setYears([year, ...years]);
            setTargetYear(year.id);
            setShowCreateForm(false);
        } catch (err: any) {
            setError(err.message || 'Failed to create academic year');
        } finally {
            setLoading(false);
        }
    };

    const handleFetchPreview = async () => {
        if (!sourceYear) return;
        setLoading(true);
        try {
            const data = await academicsApi.getRolloverPreview(sourceYear);
            setPreview(data);
            setStep('configure');
        } catch (err) {
            setError('Failed to fetch rollover preview');
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async () => {
        if (!sourceYear || !targetYear) return;
        setLoading(true);
        try {
            await academicsApi.executeRollover({
                source_year_id: sourceYear,
                target_year_id: targetYear,
                options
            });
            setStep('success');
        } catch (err: any) {
            setError(err.message || 'Rollover failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0C10] text-slate-200 p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <RefreshCw className="w-8 h-8 text-primary animate-spin-slow" />
                            Session Rollover
                        </h1>
                        <p className="text-slate-400 mt-2">Transition your school data to the next academic session</p>
                    </div>
                    
                    {/* Stepper */}
                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                        {[
                            { id: 'select-years', icon: Calendar, label: 'Select Year' },
                            { id: 'configure', icon: Layout, label: 'Configure' },
                            { id: 'review', icon: ShieldCheck, label: 'Review' }
                        ].map((s, idx) => {
                            const isActive = step === s.id;
                            return (
                                <div key={s.id} className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/10 text-white/40'}`}>
                                        <s.icon className="w-4 h-4" />
                                    </div>
                                    <span className={`text-sm font-medium hidden md:block ${isActive ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
                                    {idx < 2 && <ChevronRight className="w-4 h-4 text-white/10 ml-2" />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Content Area */}
                <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -ml-32 -mb-32" />

                    {/* ── STEP 1: SELECT YEARS ── */}
                    {step === 'select-years' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-primary rotate-180" />
                                        Source Academic Year (Current)
                                    </label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {years.map(y => (
                                            <button
                                                key={y.id}
                                                onClick={() => setSourceYear(y.id)}
                                                className={`p-5 rounded-2xl border transition-all text-left group ${sourceYear === y.id ? 'bg-primary/10 border-primary shadow-xl shadow-primary/10' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className={`text-lg font-bold ${sourceYear === y.id ? 'text-white' : 'text-slate-300'}`}>{y.name}</span>
                                                        {y.is_current && <span className="ml-3 text-[10px] bg-primary px-2 py-0.5 rounded-full text-white font-bold tracking-tighter uppercase">Current</span>}
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${sourceYear === y.id ? 'border-primary bg-primary' : 'border-white/20'}`}>
                                                        {sourceYear === y.id && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        Target Academic Year (New)
                                        <ArrowRight className="w-4 h-4 text-emerald-500" />
                                    </label>
                                    
                                    {!showCreateForm ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            {years.filter(y => y.id !== sourceYear).map(y => (
                                                <button
                                                    key={y.id}
                                                    onClick={() => setTargetYear(y.id)}
                                                    className={`p-5 rounded-2xl border transition-all text-left group ${targetYear === y.id ? 'bg-emerald-500/10 border-emerald-500 shadow-xl shadow-emerald-500/10' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <span className={`text-lg font-bold ${targetYear === y.id ? 'text-white' : 'text-slate-300'}`}>{y.name}</span>
                                                            <span className="ml-3 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold tracking-tighter uppercase">Available</span>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${targetYear === y.id ? 'border-emerald-500 bg-emerald-500' : 'border-white/20'}`}>
                                                            {targetYear === y.id && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                            
                                            <button 
                                                onClick={() => setShowCreateForm(true)}
                                                className="p-5 rounded-2xl border border-dashed border-white/10 hover:border-white/30 transition-all text-left flex items-center gap-4 group"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                    <RefreshCw className="w-5 h-5 text-slate-500 group-hover:text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">Create Next Session</p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Propose {newYearForm.name}</p>
                                                </div>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-5 animate-in slide-in-from-top-4 duration-300">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Session Name</label>
                                                <input 
                                                    type="text" 
                                                    value={newYearForm.name}
                                                    onChange={(e) => setNewYearForm({ ...newYearForm, name: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Start Date</label>
                                                    <input 
                                                        type="date" 
                                                        value={newYearForm.start_date}
                                                        onChange={(e) => setNewYearForm({ ...newYearForm, start_date: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">End Date</label>
                                                    <input 
                                                        type="date" 
                                                        value={newYearForm.end_date}
                                                        onChange={(e) => setNewYearForm({ ...newYearForm, end_date: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <button 
                                                    onClick={handleCreateYear}
                                                    disabled={loading}
                                                    className="flex-1 bg-primary hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
                                                >
                                                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm & Create'}
                                                </button>
                                                <button 
                                                    onClick={() => setShowCreateForm(false)}
                                                    className="px-6 border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/5 flex justify-end">
                                <button
                                    onClick={handleFetchPreview}
                                    disabled={!sourceYear || !targetYear || loading}
                                    className="bg-primary hover:opacity-90 disabled:opacity-50 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-primary/25 transition-all flex items-center gap-3"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue Configuration'}
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: CONFIGURE ── */}
                    {step === 'configure' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-6 p-6 bg-primary/5 border border-primary/20 rounded-3xl">
                                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                                    <Zap className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Smart Cloning Options</h3>
                                    <p className="text-slate-400">Select which data modules you want to carry forward to {years.find(y => y.id === targetYear)?.name}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { id: 'clone_classrooms', icon: Layout, title: 'Classroom Layout', desc: 'Copy sections, rooms and capacities', count: preview?.classrooms?.length },
                                    { id: 'clone_assignments', icon: BookOpen, title: 'Staff Assignments', desc: 'Keep existing teacher-subject mapping', count: preview?.assignments?.length },
                                    { id: 'promote_students', icon: Users, title: 'Student Promotion', desc: 'Bulk promote students to next grade', count: 'Active Step' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setOptions({ ...options, [opt.id]: !options[opt.id as keyof typeof options] })}
                                        className={`p-6 rounded-3xl border transition-all text-left flex flex-col gap-4 ${options[opt.id as keyof typeof options] ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 opacity-60'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${options[opt.id as keyof typeof options] ? 'bg-primary text-white' : 'bg-white/10'}`}>
                                            <opt.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white mb-1">{opt.title}</h4>
                                            <p className="text-xs text-slate-400 leading-relaxed">{opt.desc}</p>
                                        </div>
                                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{opt.count} Items</span>
                                            <div className={`w-10 h-5 rounded-full p-1 transition-all ${options[opt.id as keyof typeof options] ? 'bg-primary' : 'bg-white/10'}`}>
                                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-all ${options[opt.id as keyof typeof options] ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="pt-8 border-t border-white/5 flex justify-between items-center">
                                <button onClick={() => setStep('select-years')} className="text-slate-400 hover:text-white font-bold transition-colors">Back to selection</button>
                                <button
                                    onClick={() => setStep('review')}
                                    className="bg-primary hover:opacity-90 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-primary/25 transition-all flex items-center gap-3"
                                >
                                    Review Rollover
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: REVIEW ── */}
                    {step === 'review' && (
                        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                            <div className="text-center space-y-3 mb-10">
                                <h2 className="text-2xl font-bold text-white">Final Confirmation</h2>
                                <p className="text-slate-400">You are about to finalize the rollover from <span className="text-primary font-bold">{years.find(y => y.id === sourceYear)?.name}</span> to <span className="text-emerald-400 font-bold">{years.find(y => y.id === targetYear)?.name}</span></p>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex gap-4">
                                <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                                <div>
                                    <h4 className="text-amber-500 font-bold text-sm mb-1">Important Action</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        This will create new classroom and assignment records. Once completed, the target year will be marked as **Active**. You can still modify these records manually later if needed.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                    <span className="text-slate-400">Classrooms to Clone</span>
                                    <span className="text-white font-bold">{options.clone_classrooms ? preview?.classrooms?.length : 0}</span>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                    <span className="text-slate-400">Assignments to Carry Forward</span>
                                    <span className="text-white font-bold">{options.clone_assignments ? preview?.assignments?.length : 0}</span>
                                </div>
                            </div>

                            <div className="pt-10 flex flex-col gap-4">
                                <button
                                    onClick={handleExecute}
                                    disabled={loading}
                                    className="w-full bg-primary hover:opacity-90 text-white font-bold py-5 rounded-2xl shadow-2xl shadow-primary/40 transition-all flex items-center justify-center gap-3 text-lg"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><RefreshCw className="w-6 h-6" /> Complete & Activate Year</>}
                                </button>
                                <button onClick={() => setStep('configure')} className="text-slate-500 hover:text-white font-bold transition-colors py-2 text-sm">Wait, let me change something</button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4: SUCCESS ── */}
                    {step === 'success' && (
                        <div className="text-center py-20 space-y-8 animate-in zoom-in-50 fade-in duration-700">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 animate-pulse" />
                                <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/50 relative">
                                    <CheckCircle2 className="w-12 h-12 text-white" />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <h2 className="text-4xl font-black text-white tracking-tight">Rollover Successful!</h2>
                                <p className="text-xl text-slate-400 max-w-md mx-auto">
                                    {years.find(y => y.id === targetYear)?.name} is now the **Active** session. All data has been successfully cloned.
                                </p>
                            </div>

                            <div className="pt-10">
                                <button
                                    onClick={() => window.location.href = '/dashboard'}
                                    className="bg-white text-slate-900 font-black py-4 px-12 rounded-2xl hover:bg-slate-100 transition-all shadow-xl shadow-white/10"
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
