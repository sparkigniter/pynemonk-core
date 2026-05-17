import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, GraduationCap, 
    CheckCircle2, Circle, 
    Calendar, Phone,
    Award, TrendingUp,
    FileText, Users,
    Plus, ExternalLink,
    Zap, RefreshCw, Target,
    ArrowUpRight, Info, CreditCard, X,
    Layers, Activity, ClipboardList, AlertCircle, LogOut
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

// Custom styles to ensure Quill rendering is consistent in previews and print
const DOCUMENT_STYLES = `
  .ql-editor {
    padding: 0;
    height: auto;
    overflow: visible;
  }
  .ql-align-center { text-align: center; }
  .ql-align-right { text-align: right; }
  .ql-align-justify { text-align: justify; }
  .ql-indent-1 { padding-left: 3em; }
  .ql-indent-2 { padding-left: 6em; }
  .ql-indent-3 { padding-left: 9em; }
  .ql-font-serif { font-family: serif; }
  .ql-size-large { font-size: 1.5em; }
  .ql-size-huge { font-size: 2.5em; }
  
  @media print {
    body * { visibility: hidden; }
    .print\\:block, .print\\:block * { visibility: visible; }
    .print\\:block { position: absolute; left: 0; top: 0; width: 100%; }
  }
`;

export default function StudentProfile() {
    const { user, can } = useAuth();
    const { notify } = useNotification();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [student, setStudent] = useState<any>(null);
    const [grades, setGrades] = useState<gradeApi.Grade[]>([]);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [performance, setPerformance] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [integrations, setIntegrations] = useState<integrationApi.IntegrationManifest[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState<'journey' | 'performance' | 'documents' | 'family' | 'dossier'>('journey');
    const [selectedYearIdx, setSelectedYearIdx] = useState(0);
    const [showEditModal, setShowEditModal] = useState(false);
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
        const load = async () => {
            try {
                if (id) {
                    const studentId = parseInt(id);
                    if (isNaN(studentId)) {
                        setLoading(false);
                        return;
                    }

                    const [studentData, gradeRes, perfData, attrData, integrationsData, classroomRes, statsData] = await Promise.all([
                        studentApi.getStudentProfile(studentId),
                        gradeApi.getGrades(),
                        studentApi.getStudentPerformance(studentId),
                        studentApi.getStudentAttendanceStats(studentId),
                        integrationApi.getAvailableIntegrations(),
                        classroomApi.getClassrooms({ limit: 100 }),
                        studentApi.getStudentAnalytics(studentId)
                    ]);
                    
                    setStudent(studentData);
                    setGrades(gradeRes.data.sort((a: any, b: any) => a.sequence_order - b.sequence_order));
                    setPerformance(perfData);
                    setAttendance(attrData);
                    setIntegrations(integrationsData.filter((i: any) => i.isEnabled));
                    setClassrooms(classroomRes.data);
                    setStats(statsData);
                }
            } catch (err) {
                console.error('Failed to load student profile:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
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
    
    const isSatsReady = (data: any) => {
        if (!data) return false;
        const requiredFields = [
            'mother_tongue', 'nationality', 'religion', 
            'phone', 'address', 'date_of_birth', 
            'gender', 'admission_date'
        ];
        return requiredFields.every(field => data[field] && data[field].toString().trim() !== '');
    };

    const getPerformanceStatus = () => {
        if (!performance || performance.length === 0) return 'Pending';
        const latest = performance[0];
        let total = 0, count = 0;
        Object.values(latest.terms || {}).forEach((t: any) => {
            Object.values(t.exams || {}).forEach((e: any) => {
                e.subjects.forEach((s: any) => {
                    if (s.marks !== null) {
                        total += (s.marks / s.max) * 100;
                        count++;
                    }
                });
            });
        });
        const avg = count > 0 ? total / count : 0;
        if (avg >= 90) return 'Outstanding';
        if (avg >= 75) return 'Excellent';
        if (avg >= 60) return 'Good';
        if (avg >= 40) return 'Average';
        return 'Needs Attention';
    };

    const tabs = [
        { id: 'journey', label: 'Class History', icon: Layers },
        { id: 'performance', label: 'Marks & Exams', icon: Activity },
        { id: 'dossier', label: 'Profile Details', icon: ClipboardList },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'family', label: 'Family', icon: Users }
    ];

    const getGradeStats = (gradeName: string) => {
        if (stats && student.current_grade_name === gradeName) {
            return { 
                avg: stats.gpa + (stats.scale === 'PERCENTAGE' ? '%' : ''), 
                rank: `#${stats.rank} of ${stats.total_students}` 
            };
        }

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
            <style>{DOCUMENT_STYLES}</style>
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
                                        gender: student.gender,
                                        blood_group: student.blood_group,
                                        date_of_birth: student.date_of_birth ? new Date(student.date_of_birth).toISOString().split('T')[0] : '',
                                        admission_date: student.admission_date ? new Date(student.admission_date).toISOString().split('T')[0] : '',
                                        religion: student.religion,
                                        nationality: student.nationality,
                                        mother_tongue: student.mother_tongue,
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
                                onClick={() => navigate(`/students/designer/${student.id}?type=TRANSFER_CERTIFICATE`)}
                                className="bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl text-xs font-black hover:bg-rose-100 transition-all border border-rose-100 active:scale-95 flex items-center gap-2"
                            >
                                <LogOut size={14} />
                                Initiate Transfer
                            </button>
                            <button 
                                onClick={() => navigate(`/students/designer/${student.id}?type=ID_CARD`)}
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
                                <div className="w-32 h-32 rounded-[2.5rem] bg-[var(--background)] flex items-center justify-center text-4xl font-black text-[var(--text-muted)] border-4 border-white shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    {student.avatar_url ? (
                                        <img src={student.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="opacity-30">{student.first_name[0]}{student.last_name?.[0]}</span>
                                    )}
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
                                <p className={`text-sm font-black ${getPerformanceStatus() === 'Needs Attention' ? 'text-error' : 'text-emerald-500'}`}>{getPerformanceStatus()}</p>
                            </div>
                            <div className="p-4 bg-[var(--background)] rounded-2xl">
                                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Blood Group</p>
                                <p className="text-sm font-black text-rose-500">{student.blood_group || 'Unknown'}</p>
                            </div>
                            <div className="p-4 bg-[var(--background)] rounded-2xl col-span-2">
                                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Medical & Conduct</p>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${student.medical_notes ? 'bg-warning' : 'bg-success'}`} />
                                    <p className="text-xs font-bold text-[var(--text-main)]">{student.medical_notes || 'General Fitness - Clear'}</p>
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
                            <CreditCard className="w-6 h-6 mb-4 text-primary" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Fees Status</p>
                            <p className="text-xl font-black">{student.outstanding_balance ? `₹${student.outstanding_balance.toLocaleString()}` : 'No Fees'}</p>
                            <p className={`text-[8px] font-bold mt-1 uppercase ${student.fee_status === 'overdue' ? 'text-error' : 'opacity-40'}`}>
                                {student.fee_status === 'no_invoices' ? 'NO FEES' : student.fee_status === 'paid' ? 'PAID' : 'PENDING'}
                            </p>
                        </div>
                        <div className="bg-primary p-6 rounded-[2rem] text-white">
                            <Users className="w-6 h-6 mb-4 text-white/50" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Primary Contact</p>
                            <p className="text-xl font-black truncate">{student.guardians?.[0]?.first_name || 'No Data'}</p>
                            <p className="text-[11px] font-black opacity-80 mt-1 uppercase truncate tracking-widest">
                                {student.guardians?.[0]?.phone || 'Contact Missing'}
                            </p>
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
                                        <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Class <span className="text-primary">History</span></h3>
                                        <p className="text-xs font-medium text-[var(--text-muted)]">Previous grades and classes attended in this school.</p>
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
                                        <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Marks & <span className="text-primary">Exams</span></h3>
                                        <p className="text-xs font-medium text-[var(--text-muted)]">Detailed marks from various examinations and tests.</p>
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
                                        <div className="bg-[var(--background)] p-8 rounded-[2.5rem] border border-[var(--card-border)]">
                                            <div className="flex items-center justify-between mb-8">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)] flex items-center gap-2">
                                                    <TrendingUp size={16} className="text-primary" />
                                                    Score Progression Trend
                                                </h4>
                                            </div>
                                            <div className="h-[250px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={Object.values(performance[selectedYearIdx].terms).map((t: any) => {
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

                        {activeTab === 'dossier' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Profile <span className="text-primary">Details</span></h3>
                                        <p className="text-xs font-medium text-[var(--text-muted)]">Core student information and identity records.</p>
                                    </div>
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${isSatsReady(student) ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                        {isSatsReady(student) ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                        {isSatsReady(student) ? 'Ready for Export' : 'Incomplete Records'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-2">Identity Details</h4>
                                        <div className="bg-[var(--background)] rounded-[2rem] border border-[var(--card-border)] overflow-hidden">
                                            {[
                                                { label: 'Mother Tongue', value: student.mother_tongue },
                                                { label: 'Nationality', value: student.nationality },
                                                { label: 'Religion', value: student.religion },
                                                { label: 'Blood Group', value: student.blood_group },
                                                { label: 'Gender', value: student.gender }
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-5 border-b border-[var(--card-border)] last:border-0 hover:bg-white transition-colors">
                                                    <span className="text-xs font-bold text-[var(--text-muted)]">{item.label}</span>
                                                    <span className="text-xs font-black text-[var(--text-main)] uppercase">{item.value || 'Not Specified'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-2">Academic Registration</h4>
                                        <div className="bg-[var(--background)] rounded-[2rem] border border-[var(--card-border)] overflow-hidden">
                                            {[
                                                { label: 'Admission Number', value: student.admission_no },
                                                { label: 'Admission Date', value: student.admission_date ? new Date(student.admission_date).toLocaleDateString() : null },
                                                { label: 'Current Grade', value: student.current_grade_name },
                                                { label: 'Current Section', value: student.classroom_section },
                                                { label: 'Institutional Status', value: student.status || student.enrollment_status }
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-5 border-b border-[var(--card-border)] last:border-0 hover:bg-white transition-colors">
                                                    <span className="text-xs font-bold text-[var(--text-muted)]">{item.label}</span>
                                                    <span className="text-xs font-black text-[var(--text-main)] uppercase">{item.value || 'N/A'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
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
                                    {student.guardians?.map((guardian: any, idx: number) => (
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
                                                        {idx === 0 && (
                                                            <div className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest">Primary</div>
                                                        )}
                                                        {guardian.is_emergency && (
                                                            <div className="bg-error text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-error/20 flex items-center gap-1.5">
                                                                <AlertCircle size={10} />
                                                                Emergency
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                                                    <div>
                                                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 opacity-60">Occupation</p>
                                                        <p className="text-xs font-bold text-[var(--text-main)]">{guardian.occupation || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 opacity-80">Contact Number</p>
                                                        <p className="text-sm font-black text-[var(--text-main)]">{guardian.phone || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 opacity-60">Email Address</p>
                                                        <p className="text-xs font-bold text-[var(--text-main)] lowercase">{guardian.email || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
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
                                notify('error', 'Update Failed', err.message || 'An error occurred.');
                            } finally {
                                setSyncing(false);
                            }
                        }} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">First Name</label>
                                    <input type="text" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold" value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Name</label>
                                    <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold" value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile Phone</label>
                                    <input type="tel" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classroom</label>
                                    <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold" value={editForm.classroom_id || ''} onChange={e => setEditForm({...editForm, classroom_id: e.target.value})}>
                                        <option value="">Unassigned</option>
                                        {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} ({c.section})</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Residential Address</label>
                                    <textarea className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold min-h-[100px] resize-none" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="submit" disabled={syncing} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl">
                                    {syncing ? 'Saving...' : 'Update Records'}
                                </button>
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-10 bg-slate-100 text-slate-600 py-4 rounded-2xl text-xs font-black uppercase tracking-widest">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Add Guardian Modal */}
            {showAddGuardian && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add <span className="text-primary">Guardian</span></h3>
                            <button onClick={() => setShowAddGuardian(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setSyncing(true);
                            try {
                                await studentApi.addGuardian(student.id, guardianForm);
                                const updated = await studentApi.getStudentProfile(student.id);
                                setStudent(updated);
                                setShowAddGuardian(false);
                            } catch (err) { console.error(err); } finally { setSyncing(false); }
                        }} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <input type="text" required placeholder="First Name" className="w-full bg-slate-50 p-4 rounded-2xl" value={guardianForm.first_name} onChange={e => setGuardianForm({...guardianForm, first_name: e.target.value})} />
                                <input type="text" placeholder="Last Name" className="w-full bg-slate-50 p-4 rounded-2xl" value={guardianForm.last_name} onChange={e => setGuardianForm({...guardianForm, last_name: e.target.value})} />
                                <input type="email" required placeholder="Email" className="w-full bg-slate-50 p-4 rounded-2xl" value={guardianForm.email} onChange={e => setGuardianForm({...guardianForm, email: e.target.value})} />
                                <input type="tel" placeholder="Phone" className="w-full bg-slate-50 p-4 rounded-2xl" value={guardianForm.phone} onChange={e => setGuardianForm({...guardianForm, phone: e.target.value})} />
                            </div>
                            <button type="submit" disabled={syncing} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black">Register Guardian</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
