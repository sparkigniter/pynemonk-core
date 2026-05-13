import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    ChevronLeft, GraduationCap, 
    CheckCircle2, Circle, 
    Calendar, Phone,
    Award, TrendingUp,
    FileText, Users,
    Plus, ExternalLink,
    Zap, RefreshCw, BarChart3, Target,
    ArrowUpRight, Info, CreditCard, X, QrCode, Printer
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import * as studentApi from '../../api/student.api';
import * as gradeApi from '../../api/grade.api';
import * as classroomApi from '../../api/classroom.api';
import * as integrationApi from '../../api/integration.api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

export default function StudentProfile() {
    const { user, can } = useAuth();
    const { notify } = useNotification();
    const { id } = useParams<{ id: string }>();
    const [student, setStudent] = useState<any>(null);
    const [grades, setGrades] = useState<gradeApi.Grade[]>([]);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [performance, setPerformance] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any>(null);
    const [integrations, setIntegrations] = useState<integrationApi.IntegrationManifest[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState<'journey' | 'performance' | 'documents' | 'family'>('journey');
    const [selectedYearIdx, setSelectedYearIdx] = useState(0);
    const [showIDCard, setShowIDCard] = useState(false);
    const [showAddGuardian, setShowAddGuardian] = useState(false);
    const [guardianForm, setGuardianForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        relation: 'Parent',
        address: 'Same as student',
        occupation: '',
        is_emergency: false
    });
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState<any>({});

    const handleSATSExport = async () => {
        if (!student) return;
        setSyncing(true);
        try {
            await integrationApi.downloadIntegrationExport('karnataka-sats', 'export_students', {
                tenantId: user?.tenant_id,
                student_id: student.id 
            }, `sats_export_${student.admission_no}.xlsx`);
        } catch (err) {
            console.error('SATS Export failed:', err);
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const studentId = parseInt(id!);
                const [studentData, gradeRes, perfData, attrData, integrationsData, classroomRes] = await Promise.all([
                    studentApi.getStudentProfile(studentId),
                    gradeApi.getGrades(),
                    studentApi.getStudentPerformance(studentId),
                    studentApi.getStudentAttendanceStats(studentId),
                    integrationApi.getAvailableIntegrations(),
                    classroomApi.getClassrooms({ limit: 100 })
                ]);
                
                setStudent(studentData);
                setGrades(gradeRes.data.sort((a, b) => a.sequence_order - b.sequence_order));
                setPerformance(perfData);
                setAttendance(attrData);
                setIntegrations(integrationsData.filter(i => i.isEnabled));
                setClassrooms(classroomRes.data);
            } catch (err) {
                console.error('Failed to fetch profile data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-primary" />
                    </div>
                </div>
                <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-xs">Assembling Academic Dossier...</p>
            </div>
        );
    }

    if (!student) return <div className="p-8 text-center font-bold text-[var(--text-muted)]">Student not found</div>;

    const canReadFull = can('student:read');
    
    const tabs = [
        { id: 'journey', label: 'Academic Journey', icon: TrendingUp },
        { id: 'performance', label: 'Performance Analytics', icon: BarChart3 },
    ];

    if (canReadFull || (student.documents && student.documents.length > 0)) {
        tabs.push({ id: 'documents', label: 'Document Vault', icon: FileText });
    }
    if (canReadFull || (student.guardians && student.guardians.length > 0)) {
        tabs.push({ id: 'family', label: 'Family & Guardians', icon: Users });
    }

    // Helper to get marks for a specific grade/year from performance data
    const getGradeStats = (gradeName: string) => {
        // Find performance entry matching this grade strictly
        const yearData = performance.find(p => p.year.toLowerCase().includes(gradeName.toLowerCase()));
        
        if (!yearData) return { avg: '--', rank: '--' };

        let totalMarks = 0;
        let totalMax = 0;

        Object.values(yearData.terms).forEach((term: any) => {
            Object.values(term.exams).forEach((exam: any) => {
                exam.subjects.forEach((s: any) => {
                    if (s.marks !== null && s.marks !== undefined) {
                        totalMarks += Number(s.marks);
                        totalMax += Number(s.max);
                    }
                });
            });
        });

        return {
            avg: totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(1) + '%' : '--',
            rank: totalMax > 0 ? 'Top 15%' : '--' 
        };
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <Link to="/students" className="w-12 h-12 bg-[var(--card-bg)] rounded-2xl flex items-center justify-center shadow-sm border border-[var(--card-border)] hover:bg-[var(--background)] transition-all text-[var(--text-muted)] hover:text-primary active:scale-95 group">
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Dossier</span>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{student.admission_no}</span>
                        </div>
                        <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">{student.first_name} {student.last_name}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {integrations.find(i => i.slug === 'karnataka-sats') && can('settings:write') && (
                        <button 
                            onClick={handleSATSExport}
                            disabled={syncing}
                            className="bg-success/10 text-success px-6 py-3 rounded-2xl text-xs font-black hover:bg-emerald-100 transition-all border border-emerald-100 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                        >
                            {syncing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                            {syncing ? 'Syncing...' : 'Sync to SATS'}
                        </button>
                    )}
                    {can('student:write') && (
                        <>
                            <button 
                                onClick={() => {
                                    setEditForm({
                                        first_name: student.first_name,
                                        last_name: student.last_name,
                                        email: student.email,
                                        phone: student.phone,
                                        address: student.address,
                                        blood_group: student.blood_group,
                                        date_of_birth: student.date_of_birth ? new Date(student.date_of_birth).toISOString().split('T')[0] : '',
                                        classroom_id: student.classroom_id,
                                        academic_year_id: student.enrollment_year_id || (grades.length > 0 ? grades[0].id : '')
                                    });
                                    setShowEditModal(true);
                                }}
                                className="bg-[var(--card-bg)] text-[var(--text-main)] px-6 py-3 rounded-2xl text-xs font-black hover:bg-[var(--background)] transition-all shadow-sm border border-[var(--card-border)] active:scale-95"
                            >
                                Edit Profile
                            </button>
                            <button 
                                onClick={() => setShowIDCard(true)}
                                className="bg-surface-dark text-white px-6 py-3 rounded-2xl text-xs font-black hover:opacity-90 transition-all shadow-xl active:scale-95 flex items-center gap-2"
                            >
                                <CreditCard size={14} />
                                Generate ID Card
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Summary Card */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-8 border border-[var(--card-border)] shadow-xl shadow-theme/5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-pink-500" />
                        
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-[var(--background)] flex items-center justify-center text-4xl font-black text-[var(--text-muted)] opacity-50 border-4 border-white shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    {student.avatar_url ? <img src={student.avatar_url} className="w-full h-full object-cover" /> : `${student.first_name[0]}${student.last_name?.[0]}`}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg border-4 border-white rotate-12 group-hover:rotate-0 transition-all">
                                    <Award size={18} />
                                </div>
                            </div>
                            
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-lg text-[10px] font-black uppercase tracking-widest mb-3">
                                    <CheckCircle2 size={12} />
                                    Active Enrollment
                                </div>
                                <h3 className="text-2xl font-black text-[var(--text-main)] leading-tight mb-1">{student.first_name} {student.last_name}</h3>
                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.15em]">{student.classroom_name || 'Unassigned'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-[var(--card-border)]">
                            <div className="p-4 bg-[var(--background)] rounded-2xl">
                                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Attendance</p>
                                <p className="text-sm font-black text-primary">{attendance?.percentage || 0}%</p>
                            </div>
                            <div className="p-4 bg-[var(--background)] rounded-2xl">
                                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Performance</p>
                                <p className="text-sm font-black text-emerald-500">Excellent</p>
                            </div>
                            <div className="p-4 bg-[var(--background)] rounded-2xl col-span-2">
                                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Medical Status</p>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-success/100" />
                                    <p className="text-xs font-bold text-[var(--text-main)]">Fit to Academic Cycle</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            {(canReadFull || student.phone) && (
                                <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[var(--background)] transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"><Phone size={18} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Mobile</p>
                                        <p className="text-sm font-bold text-[var(--text-main)]">{student.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            )}
                            {(canReadFull || student.date_of_birth) && (
                                <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[var(--background)] transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning"><Calendar size={18} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Birth Date</p>
                                        <p className="text-sm font-bold text-[var(--text-main)]">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface-dark p-6 rounded-[2rem] text-white">
                            <Target className="w-6 h-6 mb-4 text-primary" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Rank</p>
                            <p className="text-xl font-black">#04</p>
                        </div>
                        <div className="bg-primary p-6 rounded-[2rem] text-white">
                            <TrendingUp className="w-6 h-6 mb-4 text-white/50" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">GPA</p>
                            <p className="text-xl font-black">3.92</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Tabbed Interface */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Navigation Tabs */}
                    <div className="bg-[var(--card-bg)] p-2 rounded-2xl border border-[var(--card-border)] shadow-sm flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black transition-all whitespace-nowrap
                                    ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--text-main)]'}`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-10 border border-[var(--card-border)] shadow-xl shadow-slate-200/40 min-h-[600px]">
                        
                        {activeTab === 'journey' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Academic <span className="text-primary">Journey</span></h3>
                                        <p className="text-xs font-medium text-[var(--text-muted)]">Historical progression through the institution's pedagogical stages.</p>
                                    </div>
                                    <div className="px-4 py-2 bg-[var(--background)] rounded-xl text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] border border-[var(--card-border)]">Live Metadata</div>
                                </div>
 
                                <div className="relative space-y-12 pl-4">
                                    <div className="absolute left-[19px] top-6 bottom-6 w-1 bg-[var(--background)] rounded-full" />
                                    {grades.map((grade) => {
                                        const isPassed = grade.sequence_order < (student.current_grade_sequence || 0);
                                        const isCurrent = grade.id === student.current_grade_id;
                                        const stats = getGradeStats(grade.name);

                                        return (
                                            <div key={grade.id} className={`flex items-start gap-8 group ${!isPassed && !isCurrent ? 'opacity-40 grayscale' : ''}`}>
                                                <div className={`relative z-10 w-10 h-10 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center transition-all duration-500
                                                    ${isPassed ? 'bg-success/100 text-white' : isCurrent ? 'bg-primary text-white scale-125 ring-8 ring-primary/5 rotate-3 group-hover:rotate-0' : 'bg-[var(--card-bg)] text-slate-200 border-[var(--card-border)]'}`}>
                                                    {isPassed ? <CheckCircle2 size={18} /> : isCurrent ? <TrendingUp size={18} /> : <Circle size={18} />}
                                                </div>
                                                <div className={`flex-1 p-6 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden ${isCurrent ? 'bg-surface-dark text-white shadow-2xl border-slate-800' : 'bg-[var(--background)] border-[var(--card-border)]'}`}>
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="text-xl font-black tracking-tight">{grade.name}</h4>
                                                                {isCurrent && <span className="px-3 py-1 bg-primary text-white rounded-lg text-[8px] font-black uppercase tracking-widest animate-pulse">Active Path</span>}
                                                                {isPassed && <span className="px-3 py-1 bg-success/100/10 text-emerald-500 rounded-lg text-[8px] font-black uppercase tracking-widest">Completed</span>}
                                                            </div>
                                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${isCurrent ? 'text-white/40' : 'text-[var(--text-muted)]'}`}>
                                                                Academic Cycle Level {grade.sequence_order}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-4 rounded-2xl flex flex-col items-center justify-center min-w-[80px] ${isCurrent ? 'bg-white/5 border border-white/10' : 'bg-[var(--card-bg)] border border-[var(--card-border)]'}`}>
                                                                <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isCurrent ? 'text-white/40' : 'text-[var(--text-muted)]'}`}>Aggregate</p>
                                                                <p className="text-lg font-black">{stats.avg}</p>
                                                            </div>
                                                            <div className={`p-4 rounded-2xl flex flex-col items-center justify-center min-w-[80px] ${isCurrent ? 'bg-white/5 border border-white/10' : 'bg-[var(--card-bg)] border border-[var(--card-border)]'}`}>
                                                                <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isCurrent ? 'text-white/40' : 'text-[var(--text-muted)]'}`}>Standing</p>
                                                                <p className="text-lg font-black">{stats.rank}</p>
                                                            </div>
                                                            <button className={`p-3 rounded-xl transition-all ${isCurrent ? 'bg-primary text-white hover:bg-primary/80' : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-primary border border-[var(--card-border)]'}`}>
                                                                <ArrowUpRight size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'performance' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Performance <span className="text-primary">Analytics</span></h3>
                                        <p className="text-xs font-medium text-[var(--text-muted)]">Granular insights into subject-wise mastery and examination trends.</p>
                                    </div>
                                    <select 
                                        value={selectedYearIdx}
                                        onChange={(e) => setSelectedYearIdx(parseInt(e.target.value))}
                                        className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 ring-primary/20 transition-all cursor-pointer"
                                    >
                                        {performance.map((p, idx) => <option key={p.year} value={idx}>{p.year}</option>)}
                                    </select>
                                </div>

                                {performance.length > 0 && performance[selectedYearIdx] ? (
                                    <div className="space-y-10">
                                        {/* Trends Chart */}
                                        <div className="bg-[var(--background)] p-8 rounded-[2.5rem] border border-[var(--card-border)]">
                                            <div className="flex items-center justify-between mb-8">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)] flex items-center gap-2">
                                                    <TrendingUp size={16} className="text-primary" />
                                                    Score Progression Trend
                                                </h4>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-primary" />
                                                        <span className="text-[10px] font-bold text-[var(--text-muted)]">Term Marks</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-[250px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={Object.values(performance[selectedYearIdx].terms).map((t: any) => {
                                                        // Calculate avg for the term
                                                        let sum = 0;
                                                        let count = 0;
                                                        Object.values(t.exams).forEach((exam: any) => {
                                                            exam.subjects.forEach((s: any) => {
                                                                if (s.marks !== null) {
                                                                    sum += (s.marks / s.max) * 100;
                                                                    count++;
                                                                }
                                                            });
                                                        });
                                                        return {
                                                            name: t.name,
                                                            score: count > 0 ? Math.round(sum / count) : 0
                                                        };
                                                    })}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dy={10} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} domain={[0, 100]} />
                                                        <Tooltip 
                                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                            labelStyle={{ fontWeight: 900, marginBottom: '4px' }}
                                                        />
                                                        <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={4} dot={{ r: 6, fill: 'var(--primary)', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Subject Mastery Grid - Show all terms/exams */}
                                        <div className="space-y-12">
                                            {Object.values(performance[selectedYearIdx].terms).map((term: any) => (
                                                <div key={term.name} className="space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-px flex-1 bg-[var(--background)] opacity-50" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">{term.name}</span>
                                                        <div className="h-px flex-1 bg-[var(--background)] opacity-50" />
                                                    </div>
                                                    
                                                    {Object.values(term.exams).map((exam: any) => (
                                                        <div key={exam.name} className="space-y-4">
                                                            <div className="flex items-center justify-between px-2">
                                                                <h5 className="text-xs font-black uppercase tracking-widest text-[var(--text-main)] opacity-70">{exam.name}</h5>
                                                                <span className="px-2 py-0.5 bg-primary/5 text-primary text-[8px] font-black rounded-lg uppercase">{exam.type}</span>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                {exam.subjects.map((s: any) => (
                                                                    <div key={s.code} className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:shadow-lg hover:shadow-slate-100 transition-all group">
                                                                        <div className="flex items-center justify-between mb-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-10 h-10 rounded-xl bg-[var(--background)] flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                                                    <Target size={16} />
                                                                                </div>
                                                                                <div>
                                                                                    <h6 className="text-[12px] font-black text-[var(--text-main)] line-clamp-1">{s.subject}</h6>
                                                                                    <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{s.code}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className="text-sm font-black text-primary">{s.marks}/{s.max}</p>
                                                                                <p className={`text-[8px] font-black uppercase ${s.marks >= s.passing ? 'text-emerald-500' : 'text-error'}`}>
                                                                                    {s.marks >= s.passing ? 'Pass' : 'Fail'}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="h-1.5 bg-[var(--background)] rounded-full overflow-hidden">
                                                                            <div 
                                                                                className={`h-full transition-all duration-1000 ${s.marks >= s.passing ? 'bg-primary' : 'bg-error'}`}
                                                                                style={{ width: `${Math.min(100, (s.marks / s.max) * 100)}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-[var(--background)] rounded-[2.5rem] border border-dashed border-[var(--card-border)]">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[var(--text-muted)] opacity-50 shadow-sm">
                                            <Info size={32} />
                                        </div>
                                        <div>
                                            <p className="text-[var(--text-main)] font-black uppercase tracking-widest text-xs">No Performance Data</p>
                                            <p className="text-[var(--text-muted)] text-xs mt-1">Examination results for this cycle are not yet finalized.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Document <span className="text-primary">Vault</span></h3>
                                        <p className="text-xs font-medium text-[var(--text-muted)]">Secure repository for student credentials, certifications, and compliance filings.</p>
                                    </div>
                                    <button className="bg-primary text-white p-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {student.documents?.map((doc: any) => (
                                        <div key={doc.id} className="p-6 rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-slate-100 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-[var(--background)] rounded-2xl flex items-center justify-center text-[var(--text-muted)] group-hover:bg-primary group-hover:text-white transition-colors">
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <h5 className="text-sm font-black text-[var(--text-main)]">{doc.document_type}</h5>
                                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest truncate max-w-[150px]">{doc.file_name}</p>
                                                </div>
                                            </div>
                                            <a href={doc.file_url} target="_blank" className="p-3 hover:bg-[var(--background)] rounded-xl text-[var(--text-muted)] hover:text-primary transition-colors">
                                                <ExternalLink size={18} />
                                            </a>
                                        </div>
                                    ))}
                                    {(!student.documents || student.documents.length === 0) && (
                                        <div className="col-span-full text-center py-20 bg-[var(--background)] rounded-[2.5rem] border border-dashed border-[var(--card-border)]">
                                            <p className="text-[var(--text-muted)] font-bold italic text-xs">No documents uploaded yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'family' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Family & <span className="text-primary">Guardians</span></h3>
                                        <p className="text-xs font-medium text-[var(--text-muted)]">Primary and secondary point of contact records for this student.</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowAddGuardian(true)}
                                        className="bg-[var(--card-bg)] border border-[var(--card-border)] p-3 rounded-xl shadow-sm hover:bg-[var(--background)] transition-all"
                                    >
                                        <Plus size={20} className="text-[var(--text-muted)]" />
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    {student.guardians?.map((guardian: any) => (
                                        <div key={guardian.id} className="p-8 rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--background)]/50 flex flex-col md:flex-row gap-8 items-start md:items-center group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                                            <div className="w-24 h-24 bg-[var(--card-bg)] rounded-3xl flex items-center justify-center text-3xl font-black text-slate-200 border border-[var(--card-border)] shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                                                {guardian.avatar_url ? <img src={guardian.avatar_url} className="w-full h-full object-cover rounded-3xl" /> : `${guardian.first_name[0]}${guardian.last_name?.[0]}`}
                                            </div>
                                            <div className="flex-1 space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{guardian.relation || 'Parent'}</span>
                                                        <h4 className="text-2xl font-black text-[var(--text-main)]">{guardian.first_name} {guardian.last_name}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {guardian.is_emergency && (
                                                            <div className="bg-error/50 text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20">Emergency Primary</div>
                                                        )}
                                                        <button className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] hover:text-primary transition-all">
                                                            <ArrowUpRight size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                                                    <div>
                                                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 opacity-60">Occupation</p>
                                                        <p className="text-xs font-bold text-[var(--text-main)]">{guardian.occupation || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 opacity-60">Contact Number</p>
                                                        <p className="text-xs font-bold text-[var(--text-main)]">{guardian.phone || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 opacity-60">Email Address</p>
                                                        <p className="text-xs font-bold text-[var(--text-main)] lowercase">{guardian.email || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 opacity-60">Residential Address</p>
                                                        <p className="text-xs font-bold text-[var(--text-main)] line-clamp-1">{guardian.address || 'Same as student'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!student.guardians || student.guardians.length === 0) && (
                                        <div className="text-center py-20 bg-[var(--background)] rounded-[2.5rem] border border-dashed border-[var(--card-border)]">
                                            <p className="text-[var(--text-muted)] font-bold italic text-xs">No guardian records linked to this dossier.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
        </div>

            {/* ID Card Modal */}
            {showIDCard && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden group">
                        {/* Close Button */}
                        <button 
                            onClick={() => setShowIDCard(false)}
                            className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all z-20"
                        >
                            <X size={20} className="text-slate-500" />
                        </button>

                        <div id="id-card-printable" className="relative bg-white border border-slate-100 rounded-[2rem] overflow-hidden aspect-[1/1.6] shadow-xl p-8 flex flex-col items-center">
                            {/* Institutional Branding Header */}
                            <div className="absolute top-0 left-0 w-full h-32 bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
                                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-2">
                                    <GraduationCap size={20} />
                                </div>
                                <h3 className="text-sm font-black tracking-widest uppercase">LuviaEdu Academic</h3>
                                <p className="text-[8px] font-bold opacity-60 uppercase tracking-widest mt-0.5">Excellence in Pedagogy</p>
                            </div>

                            {/* Student Image */}
                            <div className="mt-24 relative">
                                <div className="w-36 h-36 rounded-full border-8 border-white bg-slate-50 shadow-2xl flex items-center justify-center overflow-hidden">
                                    {student.avatar_url ? (
                                        <img src={student.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-black text-slate-300">{student.first_name[0]}{student.last_name?.[0]}</span>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-full border-4 border-white flex items-center justify-center text-white">
                                    <CheckCircle2 size={20} />
                                </div>
                            </div>

                            {/* Student Identity */}
                            <div className="mt-8 text-center space-y-2">
                                <h4 className="text-2xl font-black text-slate-900 tracking-tight">{student.first_name} {student.last_name}</h4>
                                <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {student.classroom_name} • {student.current_grade_name}
                                </div>
                            </div>

                            {/* Metadata Grid */}
                            <div className="mt-10 grid grid-cols-2 gap-x-12 gap-y-6 w-full border-t border-slate-100 pt-8">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Admission No</p>
                                    <p className="text-xs font-black text-slate-800 uppercase">{student.admission_no}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nationality</p>
                                    <p className="text-xs font-black text-slate-800">{student.nationality || 'Indian'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Academic Year</p>
                                    <p className="text-xs font-black text-slate-800">2026-2027</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Validity</p>
                                    <p className="text-xs font-black text-slate-800 uppercase">March 2027</p>
                                </div>
                            </div>

                            {/* Security & Footer */}
                            <div className="mt-auto pt-8 flex items-center justify-between w-full">
                                <div className="w-16 h-16 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-2">
                                    <QrCode size={40} className="text-slate-900" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-900 italic mb-1 opacity-20">Principal Signature</p>
                                    <div className="h-px w-24 bg-slate-200 ml-auto" />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex gap-4">
                            <button 
                                onClick={() => window.print()}
                                className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Printer size={16} />
                                Print Identification
                            </button>
                            <button 
                                onClick={() => setShowIDCard(false)}
                                className="px-6 bg-slate-100 text-slate-600 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Guardian Modal */}
            {showAddGuardian && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add <span className="text-primary">Guardian</span></h3>
                                <p className="text-xs font-medium text-slate-500">Register a new point of contact for this student.</p>
                            </div>
                            <button onClick={() => setShowAddGuardian(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setSyncing(true);
                            try {
                                await studentApi.addGuardian(student.id, guardianForm);
                                const updatedStudent = await studentApi.getStudentProfile(student.id);
                                setStudent(updatedStudent);
                                setShowAddGuardian(false);
                            } catch (err) {
                                console.error('Failed to add guardian:', err);
                            } finally {
                                setSyncing(false);
                            }
                        }} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                                    <input 
                                        type="text" required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all"
                                        placeholder="Enter first name"
                                        value={guardianForm.first_name}
                                        onChange={e => setGuardianForm({...guardianForm, first_name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all"
                                        placeholder="Enter last name"
                                        value={guardianForm.last_name}
                                        onChange={e => setGuardianForm({...guardianForm, last_name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                                    <input 
                                        type="email" required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all"
                                        placeholder="guardian@example.com"
                                        value={guardianForm.email}
                                        onChange={e => setGuardianForm({...guardianForm, email: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                                    <input 
                                        type="tel"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all"
                                        placeholder="+91 XXXXX XXXXX"
                                        value={guardianForm.phone}
                                        onChange={e => setGuardianForm({...guardianForm, phone: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Relation</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all appearance-none"
                                        value={guardianForm.relation}
                                        onChange={e => setGuardianForm({...guardianForm, relation: e.target.value})}
                                    >
                                        <option value="Father">Father</option>
                                        <option value="Mother">Mother</option>
                                        <option value="Guardian">Guardian</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Occupation</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all"
                                        placeholder="Business / Service"
                                        value={guardianForm.occupation}
                                        onChange={e => setGuardianForm({...guardianForm, occupation: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Address</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all"
                                        placeholder="Same as student"
                                        value={guardianForm.address}
                                        onChange={e => setGuardianForm({...guardianForm, address: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <input 
                                    type="checkbox"
                                    id="is_emergency"
                                    className="w-5 h-5 rounded-lg border-slate-200 text-primary focus:ring-primary/20"
                                    checked={guardianForm.is_emergency}
                                    onChange={e => setGuardianForm({...guardianForm, is_emergency: e.target.checked})}
                                />
                                <label htmlFor="is_emergency" className="text-xs font-bold text-slate-600 cursor-pointer select-none">Set as Primary Emergency Contact</label>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="submit"
                                    disabled={syncing}
                                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {syncing ? 'Processing...' : 'Register Guardian'}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setShowAddGuardian(false)}
                                    className="px-8 bg-slate-100 text-slate-600 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Edit Student Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Edit <span className="text-primary">Student</span></h3>
                                <p className="text-xs font-medium text-slate-500">Update academic profile and institutional placement.</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setSyncing(true);
                            try {
                                const { classroom_id, academic_year_id, ...profileData } = editForm;
                                await studentApi.updateStudentProfile(student.id, profileData);
                                
                                if (classroom_id && classroom_id !== '0') {
                                    await studentApi.enrollStudent(student.id, {
                                        classroom_id: parseInt(classroom_id),
                                        academic_year_id: academic_year_id ? parseInt(academic_year_id) : 1 
                                    });
                                }
                                
                                const updatedStudent = await studentApi.getStudentProfile(student.id);
                                setStudent(updatedStudent);
                                notify('success', 'Profile Updated', 'Student records have been successfully synchronized.');
                                setShowEditModal(false);
                            } catch (err: any) {
                                console.error('Failed to update student:', err);
                                notify('error', 'Update Failed', err.message || 'An unexpected error occurred.');
                            } finally {
                                setSyncing(false);
                            }
                        }} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                                    <input 
                                        type="text" required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all"
                                        value={editForm.first_name}
                                        onChange={e => setEditForm({...editForm, first_name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all"
                                        value={editForm.last_name}
                                        onChange={e => setEditForm({...editForm, last_name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mobile Phone</label>
                                    <input 
                                        type="tel"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all"
                                        value={editForm.phone}
                                        onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Classroom Assignment</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all appearance-none"
                                        value={editForm.classroom_id || ''}
                                        onChange={e => setEditForm({...editForm, classroom_id: e.target.value})}
                                    >
                                        <option value="">Unassigned</option>
                                        {classrooms.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.section})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="submit"
                                    disabled={syncing}
                                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {syncing ? 'Saving...' : 'Update Records'}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-10 bg-slate-100 text-slate-600 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
