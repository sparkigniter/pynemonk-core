import { useState, useEffect } from 'react';
import { 
    Calendar, 
    ArrowRight, 
    CheckCircle2, 
    ChevronRight, 
    Users, 
    Layout as LayoutIcon, 
    BookOpen, 
    Loader2, 
    AlertCircle,
    Zap,
    RefreshCw,
    ShieldCheck,
    Info,
    ArrowLeft
} from 'lucide-react';
import { academicsApi } from '../../api/academics.api';
import { useAcademics } from '../../contexts/AcademicsContext';

type Step = 'select-years' | 'configure' | 'review' | 'success';

export default function Rollover() {
    const { refreshYears } = useAcademics();
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
            
            const current = data.find((y: any) => y.is_current);
            if (current) {
                setSourceYear(current.id);
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
            await refreshYears();
            setStep('success');
        } catch (err: any) {
            setError(err.message || 'Rollover failed');
        } finally {
            setLoading(false);
        }
    };

    const currentYearData = years.find(y => y.is_current);
    const targetYearData = years.find(y => y.id === targetYear);

    return (
        <div className="max-w-6xl mx-auto animate-fade-in pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <RefreshCw className="w-6 h-6 text-white animate-spin-slow" />
                        </div>
                        Academic Session Rollover
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">Transition school data and students to the next academic cycle</p>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-1 bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60 shadow-sm">
                    {[
                        { id: 'select-years', icon: Calendar, label: 'Years' },
                        { id: 'configure', icon: Zap, label: 'Configure' },
                        { id: 'review', icon: ShieldCheck, label: 'Review' }
                    ].map((s, idx) => {
                        const isActive = step === s.id;
                        const isPast = ['configure', 'review', 'success'].includes(step) && s.id === 'select-years' || (step === 'review' && s.id === 'configure');
                        return (
                            <div key={s.id} className="flex items-center">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : isPast ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/20' : isPast ? 'bg-indigo-50' : 'bg-slate-100'}`}>
                                        {isPast ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-3.5 h-3.5" />}
                                    </div>
                                    <span className="text-sm font-bold hidden sm:block">{s.label}</span>
                                </div>
                                {idx < 2 && <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-600 animate-fade-in">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-semibold">{error}</p>
                </div>
            )}

            {/* Main Content Card */}
            <div className="card overflow-hidden border-none shadow-2xl shadow-indigo-100/50 bg-white/80 backdrop-blur-xl relative">
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] -mr-48 -mt-48 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/5 blur-[120px] -ml-48 -mb-48 pointer-events-none" />

                <div className="p-8 md:p-12">
                    {/* ── STEP 1: SELECT YEARS ── */}
                    {step === 'select-years' && (
                        <div className="space-y-12 animate-fade-in-up">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">1</div>
                                        <h3 className="text-xl font-bold text-slate-800">Source Session</h3>
                                    </div>
                                    <p className="text-slate-500 text-sm">Select the current academic session you want to roll over from.</p>
                                    
                                    <div className="space-y-3">
                                        {years.map(y => (
                                            <button
                                                key={y.id}
                                                onClick={() => setSourceYear(y.id)}
                                                className={`w-full p-5 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${sourceYear === y.id ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}
                                            >
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-lg font-bold ${sourceYear === y.id ? 'text-indigo-900' : 'text-slate-700'}`}>{y.name}</span>
                                                        {y.is_current && (
                                                            <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-[10px] text-white font-black uppercase tracking-wider shadow-sm">Active Now</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">{new Date(y.start_date).getFullYear()} — {new Date(y.end_date).getFullYear()}</p>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${sourceYear === y.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                                    {sourceYear === y.id && <CheckCircle2 className="w-4 h-4 text-white" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">2</div>
                                        <h3 className="text-xl font-bold text-slate-800">Target Session</h3>
                                    </div>
                                    <p className="text-slate-500 text-sm">Select or create the next academic session for your school.</p>
                                    
                                    {!showCreateForm ? (
                                        <div className="space-y-3">
                                            {years.filter(y => y.id !== sourceYear).map(y => (
                                                <button
                                                    key={y.id}
                                                    onClick={() => setTargetYear(y.id)}
                                                    className={`w-full p-5 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${targetYear === y.id ? 'border-violet-600 bg-violet-50/50 shadow-lg shadow-violet-100' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}
                                                >
                                                    <div>
                                                        <span className={`text-lg font-bold ${targetYear === y.id ? 'text-violet-900' : 'text-slate-700'}`}>{y.name}</span>
                                                        <p className="text-xs text-slate-400 mt-1">Available for rollover</p>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${targetYear === y.id ? 'border-violet-600 bg-violet-600' : 'border-slate-300'}`}>
                                                        {targetYear === y.id && <CheckCircle2 className="w-4 h-4 text-white" />}
                                                    </div>
                                                </button>
                                            ))}
                                            
                                            <button 
                                                onClick={() => setShowCreateForm(true)}
                                                className="w-full p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-left group flex items-center gap-4"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                                    <Calendar className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">Create New Academic Year</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Quickly set up the next session {newYearForm.name}</p>
                                                </div>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-slate-50/80 rounded-[32px] border border-slate-200/60 space-y-5 animate-scale-in shadow-inner">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">Session Name</label>
                                                <input 
                                                    type="text" 
                                                    value={newYearForm.name}
                                                    onChange={(e) => setNewYearForm({ ...newYearForm, name: e.target.value })}
                                                    className="input-field-modern"
                                                    placeholder="e.g. 2026-2027"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">Start Date</label>
                                                    <input 
                                                        type="date" 
                                                        value={newYearForm.start_date}
                                                        onChange={(e) => setNewYearForm({ ...newYearForm, start_date: e.target.value })}
                                                        className="input-field-modern"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">End Date</label>
                                                    <input 
                                                        type="date" 
                                                        value={newYearForm.end_date}
                                                        onChange={(e) => setNewYearForm({ ...newYearForm, end_date: e.target.value })}
                                                        className="input-field-modern"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3 pt-4">
                                                <button 
                                                    onClick={handleCreateYear}
                                                    disabled={loading}
                                                    className="btn-primary flex-1 py-4 h-auto"
                                                >
                                                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm & Create Session'}
                                                </button>
                                                <button 
                                                    onClick={() => setShowCreateForm(false)}
                                                    className="btn-secondary px-8"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={handleFetchPreview}
                                    disabled={!sourceYear || !targetYear || loading}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-4 px-12 rounded-2xl shadow-xl shadow-indigo-200 transition-all flex items-center gap-3 active:scale-95 h-16 text-lg"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Configuration'}
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: CONFIGURE ── */}
                    {step === 'configure' && (
                        <div className="space-y-10 animate-fade-in-up">
                            <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-indigo-50/50 border border-indigo-100 rounded-[40px]">
                                <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-200 shrink-0">
                                    <Zap className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800">Smart Data Migration</h3>
                                    <p className="text-slate-500 mt-1">
                                        You are rolling over from <span className="text-indigo-600 font-bold">{years.find(y => y.id === sourceYear)?.name}</span> to <span className="text-violet-600 font-bold">{years.find(y => y.id === targetYear)?.name}</span>.
                                        Choose what to carry forward.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { id: 'clone_classrooms', icon: LayoutIcon, title: 'Classrooms', desc: 'Clones sections, rooms and capacities', count: preview?.classrooms?.length || 0 },
                                    { id: 'clone_assignments', icon: BookOpen, title: 'Staff Mapping', desc: 'Carries over teacher-subject assignments', count: preview?.assignments?.length || 0 },
                                    { id: 'promote_students', icon: Users, title: 'Students', desc: 'Automates grade-to-grade promotion', count: 'Active Step' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setOptions({ ...options, [opt.id]: !options[opt.id as keyof typeof options] })}
                                        className={`p-8 rounded-[32px] border-2 transition-all text-left flex flex-col gap-5 h-full ${options[opt.id as keyof typeof options] ? 'border-indigo-600 bg-white shadow-xl shadow-indigo-100/50' : 'border-slate-100 bg-slate-50/30 opacity-60 hover:opacity-100'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${options[opt.id as keyof typeof options] ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                                            <opt.icon className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-black text-slate-800 mb-1">{opt.title}</h4>
                                            <p className="text-sm text-slate-500 leading-relaxed">{opt.desc}</p>
                                        </div>
                                        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impact</span>
                                                <span className="text-sm font-bold text-indigo-600">{opt.count} Items</span>
                                            </div>
                                            <div className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${options[opt.id as keyof typeof options] ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all transform ${options[opt.id as keyof typeof options] ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Detailed Preview Section */}
                            <div className="bg-slate-50/50 rounded-[32px] border border-slate-200/60 p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Info className="w-5 h-5 text-indigo-600" />
                                        Data Preview
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Breakdown</span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <LayoutIcon className="w-3.5 h-3.5 text-indigo-600" /> Classrooms to be Created
                                        </p>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {preview?.classrooms?.length > 0 ? preview.classrooms.map((c: any, i: number) => (
                                                <div key={i} className="px-4 py-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between text-sm shadow-sm">
                                                    <span className="font-bold text-slate-700">{c.name}</span>
                                                    <span className="text-slate-400 text-xs">{c.grade_name} · Cap: {c.capacity}</span>
                                                </div>
                                            )) : (
                                                <div className="py-8 text-center text-slate-400 text-sm font-medium italic bg-white/50 rounded-2xl border border-dashed border-slate-200">No classrooms found to clone</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <BookOpen className="w-3.5 h-3.5 text-violet-600" /> Connect Faculty
                                        </p>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {preview?.assignments?.length > 0 ? preview.assignments.map((a: any, i: number) => (
                                                <div key={i} className="px-4 py-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between text-sm shadow-sm">
                                                    <div>
                                                        <span className="font-bold text-slate-700">{a.staff_name}</span>
                                                        <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded ml-2 font-bold uppercase tracking-tighter">{a.subject_name}</span>
                                                    </div>
                                                    <span className="text-slate-400 text-xs">{a.classroom_name}</span>
                                                </div>
                                            )) : (
                                                <div className="py-8 text-center text-slate-400 text-sm font-medium italic bg-white/50 rounded-2xl border border-dashed border-slate-200">No staff mappings found</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-slate-100 flex justify-between items-center">
                                <button 
                                    onClick={() => setStep('select-years')} 
                                    className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold transition-all group"
                                >
                                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                    Change Sessions
                                </button>
                                <button
                                    onClick={() => setStep('review')}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-12 rounded-2xl shadow-xl shadow-indigo-200 transition-all flex items-center gap-3 active:scale-95 h-16 text-lg"
                                >
                                    Proceed to Review
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: REVIEW ── */}
                    {step === 'review' && (
                        <div className="space-y-10 animate-scale-in">
                            <div className="text-center space-y-3 mb-10 max-w-2xl mx-auto">
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Ready for Rollout?</h2>
                                <p className="text-slate-500 font-medium">Please review the summary below. This action is significant as it will switch the active academic session for the entire school platform.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                                        <RefreshCw className="absolute top-4 right-4 w-32 h-32 text-white/5 rotate-12" />
                                        <p className="text-indigo-100 text-xs font-black uppercase tracking-[0.2em] mb-4">Rollout Summary</p>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="flex flex-col">
                                                <span className="text-2xl font-black">{currentYearData?.name}</span>
                                                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">From Current</span>
                                            </div>
                                            <ArrowRight className="w-6 h-6 text-white/40" />
                                            <div className="flex flex-col">
                                                <span className="text-2xl font-black text-violet-200">{targetYearData?.name}</span>
                                                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">To New Active</span>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between py-3 border-t border-white/10">
                                                <span className="text-indigo-100 text-sm">Classrooms Cloned</span>
                                                <span className="font-bold text-lg">{options.clone_classrooms ? preview?.classrooms?.length : 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-3 border-t border-white/10">
                                                <span className="text-indigo-100 text-sm">Staff Mappings Preserved</span>
                                                <span className="font-bold text-lg">{options.clone_assignments ? preview?.assignments?.length : 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-3 border-t border-white/10">
                                                <span className="text-indigo-100 text-sm">Student Status</span>
                                                <span className="font-bold text-lg">{options.promote_students ? 'Promoting' : 'Holding'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 flex flex-col">
                                    <div className="bg-amber-50 border-2 border-amber-200/50 p-8 rounded-[40px] flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-200">
                                                <AlertCircle className="w-5 h-5 text-white" />
                                            </div>
                                            <h4 className="text-amber-800 font-black">Final Confirmation</h4>
                                        </div>
                                        <p className="text-amber-700/80 text-sm leading-relaxed font-medium">
                                            Completing this rollover will set <span className="font-black underline">{targetYearData?.name}</span> as the **active session**. 
                                            New student admissions, attendance, and exam records will default to this year.
                                            <br /><br />
                                            Historical data from the previous year will remain accessible, but will no longer be the primary workspace.
                                        </p>
                                    </div>
                                    
                                    <div className="pt-4 space-y-4">
                                        <button
                                            onClick={handleExecute}
                                            disabled={loading}
                                            className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-3 text-lg h-20 active:scale-[0.98]"
                                        >
                                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6 text-emerald-400" /> Finalize & Activate Year</>}
                                        </button>
                                        <button 
                                            onClick={() => setStep('configure')} 
                                            className="w-full text-slate-400 hover:text-slate-800 font-bold transition-all py-2 text-sm"
                                        >
                                            Wait, let me modify configurations
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4: SUCCESS ── */}
                    {step === 'success' && (
                        <div className="text-center py-16 space-y-10 animate-scale-in">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-emerald-500 blur-[80px] opacity-20 animate-pulse" />
                                <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200 relative">
                                    <ShieldCheck className="w-16 h-16 text-white" />
                                </div>
                            </div>
                            
                            <div className="space-y-4 max-w-xl mx-auto">
                                <h2 className="text-5xl font-black text-slate-900 tracking-tight">Session Rolled Out!</h2>
                                <p className="text-xl text-slate-500 font-medium">
                                    Academic Year <span className="text-indigo-600 font-black">{targetYearData?.name}</span> is now fully operational and set as the school's primary session.
                                </p>
                            </div>

                            <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={() => window.location.href = '/dashboard'}
                                    className="bg-indigo-600 text-white font-black py-5 px-16 rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 h-20 active:scale-95"
                                >
                                    Go to Dashboard
                                </button>
                                <button
                                    onClick={() => window.location.href = '/settings'}
                                    className="bg-slate-100 text-slate-600 font-black py-5 px-12 rounded-2xl hover:bg-slate-200 transition-all h-20 active:scale-95"
                                >
                                    View Settings
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
