import { useState, useEffect } from 'react';
import { 
    Calendar, BookOpen, Clock, Target, Plus, 
    AlertTriangle, Sparkles, Loader2, Play, Check, 
    TrendingUp, CalendarRange
} from 'lucide-react';
import { get, post, put } from '../../api/base.api';
import { useAuth } from '../../contexts/AuthContext';

export default function AcademicPlanner() {
    const { user } = useAuth();
    const isTeacher = user?.roles?.includes('teacher') || user?.roles?.includes('staff');

    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);

    // Filter states
    const [selectedYearId, setSelectedYearId] = useState<string>('');
    const [selectedGradeId, setSelectedGradeId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

    // Planner details
    const [planner, setPlanner] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'chapters' | 'milestones'>('chapters');

    // Modals
    const [showInitModal, setShowInitModal] = useState(false);
    const [showChapterModal, setShowChapterModal] = useState(false);
    const [showMilestoneModal, setShowMilestoneModal] = useState(false);

    // Form inputs
    const [initData, setInitData] = useState({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
    });

    const [chapterData, setChapterData] = useState({
        name: '',
        description: '',
        estimated_lessons: 5
    });

    const [milestoneData, setMilestoneData] = useState({
        name: '',
        target_date: new Date().toISOString().split('T')[0],
        description: ''
    });

    useEffect(() => {
        loadMetadata();
    }, []);

    useEffect(() => {
        if (selectedYearId && selectedGradeId && selectedSubjectId && selectedTeacherId) {
            loadPlanner();
        } else {
            setPlanner(null);
        }
    }, [selectedYearId, selectedGradeId, selectedSubjectId, selectedTeacherId]);

    const loadMetadata = async () => {
        try {
            const [yearsData, gradesData, subjectsData, staffData] = await Promise.all([
                get<any>('/school/academics/years'),
                get<any>('/school/grades?limit=100'),
                get<any>('/school/subjects?limit=100'),
                get<any>('/school/staff?limit=300')
            ]);

            const yearsList = Array.isArray(yearsData) ? yearsData : (yearsData?.data || yearsData?.items || []);
            const gradesList = Array.isArray(gradesData) ? gradesData : (gradesData?.data || gradesData?.items || []);
            const subjectsList = Array.isArray(subjectsData) ? subjectsData : (subjectsData?.data || subjectsData?.items || []);
            const staffList = Array.isArray(staffData) ? staffData : (staffData?.data || staffData?.items || []);

            setAcademicYears(yearsList);
            setGrades(gradesList);
            setSubjects(subjectsList);
            setTeachers(staffList.filter((s: any) => s.designation?.toLowerCase().includes('teacher') || s.role?.toLowerCase() === 'teacher' || true));

            // Auto-select current active year
            const activeYear = yearsList.find((y: any) => y.status === 'active');
            if (activeYear) setSelectedYearId(activeYear.id.toString());

            // If user is teacher, lock their teacher ID selection
            if (isTeacher && user?.sub) {
                // Find matching staff record for logged-in user
                const matchingStaff = staffList.find((s: any) => s.user_id?.toString() === user.sub?.toString());
                if (matchingStaff) {
                    setSelectedTeacherId(matchingStaff.id.toString());
                }
            }
        } catch (err) {
            console.error('Failed to load metadata', err);
        }
    };

    const loadPlanner = async () => {
        setLoading(true);
        try {
            const res = await get<any>(
                `/school/planners/by-teacher-subject?staff_id=${selectedTeacherId}&subject_id=${selectedSubjectId}&grade_id=${selectedGradeId}`
            );
            if (res) {
                // Fetch full details with chapters & milestones
                const details = await get<any>(`/school/planners/${res.id}`);
                setPlanner(details);
            } else {
                setPlanner(null);
            }
        } catch (err) {
            console.error('Failed to load planner', err);
            setPlanner(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlanner = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                academic_year_id: parseInt(selectedYearId),
                staff_id: parseInt(selectedTeacherId),
                subject_id: parseInt(selectedSubjectId),
                grade_id: parseInt(selectedGradeId),
                start_date: initData.start_date,
                end_date: initData.end_date
            };
            const created = await post<any>('/school/planners', payload);
            setShowInitModal(false);
            // Load full details
            const details = await get<any>(`/school/planners/${created.id}`);
            setPlanner(details);
        } catch (err: any) {
            alert(err.message || 'Failed to initialize academic planner');
        }
    };

    const handleAddChapter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!planner) return;
        try {
            await post(`/school/planners/${planner.id}/chapters`, chapterData);
            setShowChapterModal(false);
            setChapterData({ name: '', description: '', estimated_lessons: 5 });
            loadPlanner();
        } catch (err: any) {
            alert(err.message || 'Failed to add chapter');
        }
    };

    const handleAddMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!planner) return;
        try {
            await post(`/school/planners/${planner.id}/milestones`, milestoneData);
            setShowMilestoneModal(false);
            setMilestoneData({ name: '', target_date: new Date().toISOString().split('T')[0], description: '' });
            loadPlanner();
        } catch (err: any) {
            alert(err.message || 'Failed to add milestone');
        }
    };

    const handleUpdateChapterStatus = async (chapterId: number, currentStatus: string) => {
        let nextStatus = 'pending';
        if (currentStatus === 'pending') nextStatus = 'in_progress';
        else if (currentStatus === 'in_progress') nextStatus = 'completed';

        try {
            await put(`/school/planners/chapters/${chapterId}`, { status: nextStatus });
            loadPlanner();
        } catch (err: any) {
            console.error('Failed to update status', err);
        }
    };

    const handleAutoSchedule = async () => {
        if (!planner) return;
        if (!confirm("This will automatically calculate and evenly schedule chapter completion dates based on lesson durations. Continue?")) return;
        
        try {
            const scheduled = await post<any>(`/school/planners/${planner.id}/auto-schedule`, {});
            setPlanner(scheduled);
        } catch (err: any) {
            alert(err.message || 'Failed to auto-schedule planner');
        }
    };

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'in_progress': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const getProbabilityBadge = (prob: string) => {
        if (prob.includes('High')) {
            return (
                <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <Check className="w-3.5 h-3.5" /> {prob}
                </div>
            );
        } else if (prob.includes('Medium')) {
            return (
                <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <AlertTriangle className="w-3.5 h-3.5" /> {prob}
                </div>
            );
        } else {
            return (
                <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" /> {prob}
                </div>
            );
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Academic Planner</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Smart Syllabus Engine & Target Tracker</p>
                </div>
            </header>

            {/* Filter Hub */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Academic Year</label>
                    <select 
                        value={selectedYearId}
                        onChange={e => setSelectedYearId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    >
                        <option value="">Select Academic Year</option>
                        {academicYears.map(year => (
                            <option key={year.id} value={year.id}>{year.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Class / Grade</label>
                    <select 
                        value={selectedGradeId}
                        onChange={e => setSelectedGradeId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    >
                        <option value="">Select Grade</option>
                        {grades.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subject</label>
                    <select 
                        value={selectedSubjectId}
                        onChange={e => setSelectedSubjectId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    >
                        <option value="">Select Subject</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Assigned Teacher</label>
                    <select 
                        value={selectedTeacherId}
                        disabled={isTeacher}
                        onChange={e => setSelectedTeacherId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all disabled:opacity-75"
                    >
                        <option value="">Select Teacher</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.first_name} {t.last_name || ''}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-20">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            ) : !selectedYearId || !selectedGradeId || !selectedSubjectId || !selectedTeacherId ? (
                <div className="bg-slate-50 rounded-[3rem] p-16 text-center border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mx-auto shadow-sm mb-6">
                        <BookOpen size={30} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Select Subject & Grade</h2>
                    <p className="text-slate-400 mt-2 text-sm max-w-md mx-auto italic">
                        "Give me six hours to chop down a tree and I will spend the first four sharpening the axe." — Select parameters to prepare your academic syllabus structure.
                    </p>
                </div>
            ) : !planner ? (
                <div className="bg-white rounded-[3rem] p-16 text-center border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-6">
                        <Calendar size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">No Active Planner Found</h2>
                    <p className="text-slate-400 mt-2 text-sm max-w-md mx-auto leading-relaxed">
                        An Academic Planner holds syllabus objectives, estimated class periods, dates, and milestones for this class term.
                    </p>
                    <button 
                        onClick={() => setShowInitModal(true)}
                        className="btn-primary mt-8 inline-flex items-center gap-2"
                    >
                        <Plus size={16} /> Initialize Syllabus Planner
                    </button>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Metrics Panel */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex flex-col justify-between shadow-xl relative overflow-hidden group">
                            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/5 rounded-full group-hover:scale-110 transition-transform" />
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syllabus Completion</span>
                                <TrendingUp className="text-emerald-400 w-5 h-5" />
                            </div>
                            <div className="mt-6">
                                <h3 className="text-4xl font-black tracking-tight">{planner.metrics?.progressPercentage}%</h3>
                                <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                                    <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${planner.metrics?.progressPercentage}%` }} />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2.5">
                                    {planner.metrics?.completedChapters} of {planner.metrics?.totalChapters} Chapters Finished
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Lesson Hours</span>
                                <Clock className="text-sky-500 w-5 h-5" />
                            </div>
                            <div className="mt-6">
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{planner.metrics?.completedLessons} / {planner.metrics?.totalLessons}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2.5">
                                    Class hours / lesson periods covered
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining Term Days</span>
                                <CalendarRange className="text-amber-500 w-5 h-5" />
                            </div>
                            <div className="mt-6">
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{planner.metrics?.remainingDays} Days</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2.5">
                                    Ends on {new Date(planner.end_date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Completion Forecast</span>
                                <Target className="text-indigo-500 w-5 h-5" />
                            </div>
                            <div className="mt-6 space-y-2">
                                {getProbabilityBadge(planner.metrics?.probability || 'On Track')}
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    Based on pace rate vs remaining dates
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                        <header className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
                                <button 
                                    onClick={() => setActiveTab('chapters')}
                                    className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'chapters' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Syllabus & Progress
                                </button>
                                <button 
                                    onClick={() => setActiveTab('milestones')}
                                    className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'milestones' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Term Milestones
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                {activeTab === 'chapters' && (
                                    <>
                                        <button 
                                            onClick={handleAutoSchedule}
                                            className="px-5 py-3 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
                                        >
                                            <Sparkles size={14} className="text-amber-400" /> Auto-Schedule Dates
                                        </button>
                                        <button 
                                            onClick={() => setShowChapterModal(true)}
                                            className="btn-primary inline-flex items-center gap-1.5"
                                        >
                                            <Plus size={14} /> Add Chapter
                                        </button>
                                    </>
                                )}
                                {activeTab === 'milestones' && (
                                    <button 
                                        onClick={() => setShowMilestoneModal(true)}
                                        className="btn-primary inline-flex items-center gap-1.5"
                                    >
                                        <Plus size={14} /> Add Milestone
                                    </button>
                                )}
                            </div>
                        </header>

                        <div className="p-8">
                            {activeTab === 'chapters' ? (
                                planner.chapters.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <h3 className="text-base font-black text-slate-950">No Chapters Loaded</h3>
                                        <p className="text-slate-400 text-xs italic mt-1">"A journey of a thousand miles begins with a single step."</p>
                                        <button 
                                            onClick={() => setShowChapterModal(true)}
                                            className="btn-primary mt-6 inline-flex items-center gap-1.5"
                                        >
                                            <Plus size={14} /> Add Chapter
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {planner.chapters.map((ch: any, idx: number) => (
                                            <div 
                                                key={ch.id} 
                                                className="p-6 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <button 
                                                        onClick={() => handleUpdateChapterStatus(ch.id, ch.status)}
                                                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                                                            ch.status === 'completed' 
                                                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                                            : ch.status === 'in_progress'
                                                            ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                                                            : 'bg-white border-slate-200 text-slate-300 hover:border-slate-300'
                                                        }`}
                                                        title="Toggle status: Pending ➡️ In Progress ➡️ Completed"
                                                    >
                                                        {ch.status === 'completed' ? <Check size={16} /> : ch.status === 'in_progress' ? <Play size={14} /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />}
                                                    </button>

                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black uppercase text-slate-400">Chapter {idx + 1}</span>
                                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getStatusStyle(ch.status)}`}>
                                                                {ch.status.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-base font-black text-slate-900 mt-1">{ch.name}</h4>
                                                        <p className="text-slate-400 text-xs mt-0.5">{ch.description || 'No description provided'}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 self-end md:self-center">
                                                    <div className="text-right">
                                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Weight / Periods</span>
                                                        <p className="text-xs font-black text-slate-900">{ch.estimated_lessons} lessons</p>
                                                    </div>

                                                    <div className="text-right border-l border-slate-100 pl-6">
                                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Target Term Dates</span>
                                                        <p className="text-xs font-black text-slate-900">
                                                            {ch.start_date && ch.end_date 
                                                                ? `${new Date(ch.start_date).toLocaleDateString()} - ${new Date(ch.end_date).toLocaleDateString()}`
                                                                : 'Not Scheduled'
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                planner.milestones.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <h3 className="text-base font-black text-slate-950">No Milestones Tagged</h3>
                                        <p className="text-slate-400 text-xs italic mt-1">Register examinations, milestones, or tests along the timeline.</p>
                                    </div>
                                ) : (
                                    <div className="relative border-l border-slate-200 ml-4 space-y-8 py-4">
                                        {planner.milestones.map((mil: any) => (
                                            <div key={mil.id} className="relative pl-8">
                                                <div className="absolute -left-2.5 top-1.5 w-5 h-5 rounded-full bg-slate-900 border-4 border-white flex items-center justify-center" />
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-slate-400">
                                                        {new Date(mil.target_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <h4 className="text-base font-black text-slate-900 mt-1">{mil.name}</h4>
                                                    <p className="text-slate-400 text-xs mt-0.5">{mil.description || 'No description provided'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Initialize Planner Modal */}
            {showInitModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                        <header className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-base font-black text-slate-950">Initialize Planner</h3>
                            <button onClick={() => setShowInitModal(false)} className="text-slate-400 hover:text-slate-950">Cancel</button>
                        </header>
                        <form onSubmit={handleCreatePlanner} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Term Start Date</label>
                                <input 
                                    type="date"
                                    required
                                    value={initData.start_date}
                                    onChange={e => setInitData(prev => ({ ...prev, start_date: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Term End Date</label>
                                <input 
                                    type="date"
                                    required
                                    value={initData.end_date}
                                    onChange={e => setInitData(prev => ({ ...prev, end_date: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <button type="submit" className="w-full btn-primary py-3.5 mt-2 font-black uppercase text-xs tracking-wider">
                                Initialize Now
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Chapter Modal */}
            {showChapterModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                        <header className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-base font-black text-slate-950">Add Chapter / Syllabus Item</h3>
                            <button onClick={() => setShowChapterModal(false)} className="text-slate-400 hover:text-slate-950">Cancel</button>
                        </header>
                        <form onSubmit={handleAddChapter} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Chapter Title</label>
                                <input 
                                    type="text"
                                    required
                                    value={chapterData.name}
                                    onChange={e => setChapterData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Introduction to Organic Chemistry"
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Estimated Lessons / Class Hours</label>
                                <input 
                                    type="number"
                                    required
                                    min={1}
                                    value={chapterData.estimated_lessons}
                                    onChange={e => setChapterData(prev => ({ ...prev, estimated_lessons: parseInt(e.target.value) || 1 }))}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Description</label>
                                <textarea 
                                    value={chapterData.description}
                                    onChange={e => setChapterData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Key learning concepts to be taught..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none resize-none"
                                />
                            </div>
                            <button type="submit" className="w-full btn-primary py-3.5 mt-2 font-black uppercase text-xs tracking-wider">
                                Add Chapter
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Milestone Modal */}
            {showMilestoneModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                        <header className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-base font-black text-slate-950">Add Term Milestone</h3>
                            <button onClick={() => setShowMilestoneModal(false)} className="text-slate-400 hover:text-slate-950">Cancel</button>
                        </header>
                        <form onSubmit={handleAddMilestone} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Milestone Title</label>
                                <input 
                                    type="text"
                                    required
                                    value={milestoneData.name}
                                    onChange={e => setMilestoneData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Midterm Examination Period"
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Target Date</label>
                                <input 
                                    type="date"
                                    required
                                    value={milestoneData.target_date}
                                    onChange={e => setMilestoneData(prev => ({ ...prev, target_date: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Description</label>
                                <textarea 
                                    value={milestoneData.description}
                                    onChange={e => setMilestoneData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Key milestones or evaluation targets..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none resize-none"
                                />
                            </div>
                            <button type="submit" className="w-full btn-primary py-3.5 mt-2 font-black uppercase text-xs tracking-wider">
                                Add Milestone
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
