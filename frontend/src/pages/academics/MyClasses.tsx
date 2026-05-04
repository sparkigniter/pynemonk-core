import { useState, useEffect, useMemo } from 'react';
import { 
    Clock, CheckCircle2, 
    BookOpen, PenTool,
    CalendarCheck, BookCheck,
    Search, LayoutGrid, List
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as classroomApi from '../../api/classroom.api';
import { getDashboardData } from '../../api/dashboard.api';

type ViewMode = 'class' | 'subject';

export default function MyClasses() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        return (localStorage.getItem('my_classes_view_mode') as ViewMode) || 'class';
    });
    const [classrooms, setClassrooms] = useState<classroomApi.Classroom[]>([]);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [classRes, dashRes] = await Promise.all([
                    classroomApi.getClassrooms(),
                    getDashboardData()
                ]);
                setClassrooms(classRes.data);
                setDashboardData(dashRes);
            } catch (error) {
                console.error('Failed to fetch classes', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        localStorage.setItem('my_classes_view_mode', viewMode);
    }, [viewMode]);

    // ── Grouping Logic ──
    const assignmentsBySubject = useMemo(() => {
        if (!dashboardData?.allAssignments) return [];
        const groups: Record<string, any> = {};
        dashboardData.allAssignments.forEach((a: any) => {
            if (!groups[a.subject_name]) {
                groups[a.subject_name] = {
                    name: a.subject_name,
                    code: a.subject_code,
                    classes: []
                };
            }
            groups[a.subject_name].classes.push(a);
        });
        return Object.values(groups);
    }, [dashboardData]);

    const filteredClasses = classrooms.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.grade_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.section.toLowerCase().includes(search.toLowerCase())
    );

    const filteredSubjects = assignmentsBySubject.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.classes.some((c: any) => c.classroom_name.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Gathering your classes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* ── Action-First Header ── */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-hero rounded-2xl shadow-xl shadow-primary/20">
                            <CalendarCheck className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">My Workload</h1>
                            <p className="text-slate-400 font-medium mt-1">Unified access to all your assigned classes and subjects.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <div className="relative w-full lg:w-96">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder={`Find a ${viewMode === 'class' ? 'class' : 'subject'}...`}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-[1rem] text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300 shadow-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        
                        {/* View Switcher Toggle */}
                        <div className="flex items-center gap-1 p-1 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <button 
                                onClick={() => setViewMode('class')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'class' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid size={14} />
                                Class View
                            </button>
                            <button 
                                onClick={() => setViewMode('subject')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'subject' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List size={14} />
                                Subject View
                            </button>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-4 px-6 py-4 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm">
                   <div className="flex flex-col items-center gap-1">
                       <span className="text-xl font-black text-slate-800">{classrooms.length}</span>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sections</span>
                   </div>
                   <div className="w-px h-8 bg-slate-100" />
                   <div className="flex flex-col items-center gap-1">
                       <span className="text-xl font-black text-rose-500">{dashboardData?.insights?.urgentMarking?.length || 0}</span>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pending</span>
                   </div>
                </div>
            </div>

            {/* ── View: By Class ── */}
            {viewMode === 'class' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredClasses.map((cls) => {
                        const todaySlots = dashboardData?.todaySchedule?.filter((s: any) => s.classroom_id === cls.id) || [];
                        const isMissingAttendance = todaySlots.some((s: any) => !s.attendance_taken);
                        const classAssignments = dashboardData?.allAssignments?.filter((a: any) => a.classroom_id === cls.id) || [];

                        return (
                            <div key={cls.id} className="group bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-500 flex flex-col relative overflow-hidden">
                                <div className="space-y-1 mb-8">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{cls.name} - {cls.section}</h3>
                                        {isMissingAttendance && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {classAssignments.map((a: any) => (
                                            <span key={a.id} className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-100">{a.subject_name}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Today's Context */}
                                <div className="space-y-4 mb-8 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock size={12} /> Today's Sessions
                                        </p>
                                        <span className="text-[9px] font-bold text-slate-400">{todaySlots.length} Scheduled</span>
                                    </div>
                                    <div className="space-y-2">
                                        {todaySlots.map((slot: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-700">{slot.subject_name}</span>
                                                <span className={`text-[9px] font-black uppercase tracking-tight ${slot.attendance_taken ? 'text-emerald-500' : 'text-rose-400'}`}>
                                                    {slot.attendance_taken ? 'Attendance Done' : 'Pending'}
                                                </span>
                                            </div>
                                        ))}
                                        {todaySlots.length === 0 && <p className="text-[9px] text-slate-300 italic">No periods today</p>}
                                    </div>
                                </div>

                                {/* Primary Action Suite */}
                                <div className="grid grid-cols-1 gap-2 mt-auto">
                                    <button 
                                        onClick={() => navigate(`/attendance?classId=${cls.id}`)}
                                        className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 ${isMissingAttendance ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:opacity-90' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                    >
                                        <CalendarCheck size={16} />
                                        Take Attendance
                                    </button>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => navigate(`/homework?classId=${cls.id}`)}
                                            className="py-4 bg-white border border-slate-100 text-slate-500 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:border-primary/20 hover:text-primary transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <BookCheck size={14} />
                                            Homework
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/exams?classId=${cls.id}`)}
                                            className="py-4 bg-white border border-slate-100 text-slate-500 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:border-primary/20 hover:text-primary transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <PenTool size={14} />
                                            Marks
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── View: By Subject ── */}
            {viewMode === 'subject' && (
                <div className="space-y-6">
                    {filteredSubjects.map((subject) => (
                        <div key={subject.name} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                                        {subject.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{subject.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{subject.code}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-black text-slate-800">{subject.classes.length}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Assigned Classes</span>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {subject.classes.map((cls: any) => {
                                    const todaySlot = dashboardData?.todaySchedule?.find((s: any) => s.classroom_id === cls.classroom_id && s.subject_id === cls.subject_id);
                                    return (
                                        <div key={cls.classroom_id} className="p-6 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-8">
                                                <div className="w-24">
                                                    <span className="text-lg font-black text-slate-800">{cls.classroom_name}</span>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{cls.section} Section</p>
                                                </div>
                                                <div className="hidden md:flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Today's Status</span>
                                                    {todaySlot ? (
                                                        <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${todaySlot.attendance_taken ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {todaySlot.attendance_taken ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                            {todaySlot.attendance_taken ? 'Attendance Done' : 'Pending Today'}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-300 italic">No period today</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => navigate(`/attendance?classId=${cls.classroom_id}`)}
                                                    className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                    title="Take Attendance"
                                                >
                                                    <CalendarCheck size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/homework?classId=${cls.classroom_id}`)}
                                                    className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                    title="Assign Homework"
                                                >
                                                    <BookCheck size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/exams?classId=${cls.classroom_id}`)}
                                                    className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                    title="Enter Marks"
                                                >
                                                    <PenTool size={18} />
                                                </button>
                                                <div className="w-px h-6 bg-slate-100 mx-2" />
                                                <button 
                                                    onClick={() => navigate(`/attendance?classId=${cls.classroom_id}`)}
                                                    className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                                                >
                                                    Open Class
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {((viewMode === 'class' && filteredClasses.length === 0) || (viewMode === 'subject' && filteredSubjects.length === 0)) && (
                <div className="py-20 text-center space-y-4 bg-white rounded-[3rem] border border-slate-100 border-dashed border-2">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                        <BookOpen size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800">No {viewMode === 'class' ? 'classes' : 'subjects'} found</h3>
                        <p className="text-xs font-medium text-slate-400">Try adjusting your search or contact the administrator for assignments.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
