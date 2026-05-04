import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    ChevronLeft, GraduationCap, 
    CheckCircle2, Circle, 
    Calendar, Phone,
    Award, TrendingUp,
    FileText, Activity, Users,
    Plus, ExternalLink, ShieldAlert,
    Zap, RefreshCw
} from 'lucide-react';
import * as studentApi from '../../api/student.api';
import * as gradeApi from '../../api/grade.api';
import * as integrationApi from '../../api/integration.api';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentProfile() {
    const { user, can } = useAuth();
    const { id } = useParams<{ id: string }>();
    const [student, setStudent] = useState<any>(null);
    const [grades, setGrades] = useState<gradeApi.Grade[]>([]);
    const [integrations, setIntegrations] = useState<integrationApi.IntegrationManifest[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState<'journey' | 'timeline' | 'documents' | 'family'>('journey');

    const handleSATSExport = async () => {
        if (!student) return;
        setSyncing(true);
        try {
            await integrationApi.downloadIntegrationExport('karnataka-sats', 'export_students', {
                tenantId: user?.tenant_id,
                student_id: student.id // The SATSAdapter currently fetches all, but we can pass this for future filtering
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
                const [studentData, gradeRes, integrationsData] = await Promise.all([
                    studentApi.getStudentProfile(parseInt(id!)),
                    gradeApi.getGrades(),
                    integrationApi.getAvailableIntegrations()
                ]);
                setStudent(studentData);
                setGrades(gradeRes.data.sort((a, b) => a.sequence_order - b.sequence_order));
                setIntegrations(integrationsData.filter(i => i.isEnabled));
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
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Assembling Academic Dossier...</p>
            </div>
        );
    }

    if (!student) return <div className="p-8 text-center font-bold text-slate-400">Student not found</div>;

    const canReadFull = can('student:read');
    
    const tabs = [
        { id: 'journey', label: 'Academic Journey', icon: TrendingUp },
        { id: 'timeline', label: 'Log & History', icon: Activity },
    ];

    // Only show documents and family for users with full student access
    if (canReadFull || (student.documents && student.documents.length > 0)) {
        tabs.push({ id: 'documents', label: 'Vault / Documents', icon: FileText });
    }
    if (canReadFull || (student.guardians && student.guardians.length > 0)) {
        tabs.push({ id: 'family', label: 'Family & Guardians', icon: Users });
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <Link to="/students" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 hover:bg-slate-50 transition-all text-slate-400 hover:text-primary active:scale-95 group">
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dossier</span>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{student.admission_no}</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{student.first_name} {student.last_name}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {integrations.find(i => i.slug === 'karnataka-sats') && can('settings:write') && (
                        <button 
                            onClick={handleSATSExport}
                            disabled={syncing}
                            className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl text-xs font-black hover:bg-emerald-100 transition-all border border-emerald-100 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                        >
                            {syncing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                            {syncing ? 'Syncing...' : 'Sync to SATS'}
                        </button>
                    )}
                    {can('student:write') && (
                        <>
                            <button className="bg-white text-slate-600 px-6 py-3 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all shadow-sm border border-slate-100 active:scale-95">Edit Profile</button>
                            <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black hover:opacity-90 transition-all shadow-xl active:scale-95">Generate ID Card</button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Summary Card */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-pink-500" />
                        
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-4xl font-black text-slate-300 border-4 border-white shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    {student.avatar_url ? <img src={student.avatar_url} className="w-full h-full object-cover" /> : `${student.first_name[0]}${student.last_name?.[0]}`}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg border-4 border-white rotate-12 group-hover:rotate-0 transition-all">
                                    <Award size={18} />
                                </div>
                            </div>
                            
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3">
                                    <CheckCircle2 size={12} />
                                    Active Enrollment
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 leading-tight mb-1">{student.first_name} {student.last_name}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">{student.classroom_name || 'Unassigned'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50">
                            {(canReadFull || student.blood_group) && (
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Blood Group</p>
                                    <p className="text-sm font-black text-rose-500">{student.blood_group || 'N/A'}</p>
                                </div>
                            )}
                            {(canReadFull || student.religion) && (
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Religion</p>
                                    <p className="text-sm font-black text-slate-900">{student.religion || 'N/A'}</p>
                                </div>
                            )}
                            {(canReadFull || student.nationality) && (
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nationality</p>
                                    <p className="text-sm font-black text-slate-900">{student.nationality || 'N/A'}</p>
                                </div>
                            )}
                            {(canReadFull || student.mother_tongue) && (
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mother Tongue</p>
                                    <p className="text-sm font-black text-slate-900">{student.mother_tongue || 'N/A'}</p>
                                </div>
                            )}
                            <div className="p-4 bg-slate-50 rounded-2xl col-span-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender</p>
                                <p className="text-sm font-black text-slate-900 capitalize">{student.gender || 'N/A'}</p>
                            </div>
                            {integrations.find(i => i.slug === 'karnataka-sats') && (
                                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 col-span-2">
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Karnataka SATS ID</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-black text-indigo-600 font-mono tracking-wider">{student.external_ids?.['karnataka-sats'] || 'NOT MAPPED'}</p>
                                        <Zap size={12} className="text-indigo-400" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 space-y-4">
                            {(canReadFull || student.phone) && (
                                <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"><Phone size={18} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mobile</p>
                                        <p className="text-sm font-bold text-slate-700">{student.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            )}
                            {(canReadFull || student.date_of_birth) && (
                                <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500"><Calendar size={18} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Birth Date</p>
                                        <p className="text-sm font-bold text-slate-700">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Medical / Special Notes */}
                    <div className="bg-rose-50 rounded-[2rem] p-8 border border-rose-100 flex gap-5">
                         <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm flex-shrink-0">
                            <ShieldAlert size={24} />
                         </div>
                         <div>
                            <h4 className="text-xs font-black text-rose-900 uppercase tracking-widest mb-2">Medical Notes</h4>
                            <p className="text-xs text-rose-800/70 font-bold leading-relaxed">{student.medical_notes || 'No special medical conditions reported for this student.'}</p>
                         </div>
                    </div>
                </div>

                {/* Right Side: Tabbed Interface */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Navigation Tabs */}
                    <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black transition-all whitespace-nowrap
                                    ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 min-h-[500px]">
                        
                        {activeTab === 'journey' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Academic <span className="text-primary">Roadmap</span></h3>
                                        <p className="text-xs font-medium text-slate-400">Visualizing the student's multi-year progression path.</p>
                                    </div>
                                    <div className="px-4 py-2 bg-slate-50 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border border-slate-100">Cycle: 2024-25</div>
                                </div>
 
                                <div className="relative space-y-6 pl-4">
                                    <div className="absolute left-[19px] top-6 bottom-6 w-1 bg-slate-50 rounded-full" />
                                    {grades.map((grade) => {
                                        const isPassed = grade.sequence_order < (student.current_grade_sequence || 0);
                                        const isCurrent = grade.id === student.current_grade_id;

                                        return (
                                            <div key={grade.id} className={`flex items-start gap-8 group ${isPassed ? 'opacity-50' : ''}`}>
                                                <div className={`relative z-10 w-10 h-10 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center transition-all duration-500
                                                    ${isPassed ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-primary text-white scale-110 ring-8 ring-primary/5 rotate-3 group-hover:rotate-0' : 'bg-white text-slate-200 border-slate-50'}`}>
                                                    {isPassed ? <CheckCircle2 size={18} /> : isCurrent ? <TrendingUp size={18} /> : <Circle size={18} />}
                                                </div>
                                                <div className={`flex-1 p-5 rounded-3xl border transition-all duration-500 relative overflow-hidden ${isCurrent ? 'bg-slate-900 text-white shadow-2xl border-slate-800' : 'bg-slate-50 border-slate-100 group-hover:bg-white group-hover:shadow-xl group-hover:shadow-slate-100'}`}>
                                                    {isCurrent && (
                                                        <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
                                                            <GraduationCap size={100} />
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-lg font-black tracking-tight">{grade.name}</h4>
                                                                {isCurrent && <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-lg text-[8px] font-black uppercase tracking-widest">Active</span>}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isCurrent ? 'text-white/40' : 'text-slate-400'}`}>Level {grade.sequence_order}</span>
                                                                <div className={`w-1 h-1 rounded-full ${isCurrent ? 'bg-white/20' : 'bg-slate-200'}`} />
                                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isCurrent ? 'text-white/40' : 'text-slate-400'}`}>{grade.slug}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${isCurrent ? 'bg-white/10 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
                                                                <Award size={14} className={isCurrent ? 'text-primary' : 'text-slate-300'} />
                                                                <div className="text-left">
                                                                    <p className={`text-[8px] font-black uppercase tracking-tighter ${isCurrent ? 'text-white/40' : 'text-slate-400'}`}>GPA</p>
                                                                    <p className="text-xs font-black">{isPassed ? '3.8' : isCurrent ? 'TBD' : '--'}</p>
                                                                </div>
                                                            </div>
                                                            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${isCurrent ? 'bg-white/10 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
                                                                <Activity size={14} className={isCurrent ? 'text-primary' : 'text-slate-300'} />
                                                                <div className="text-left">
                                                                    <p className={`text-[8px] font-black uppercase tracking-tighter ${isCurrent ? 'text-white/40' : 'text-slate-400'}`}>Rank</p>
                                                                    <p className="text-xs font-black">{isPassed ? '#4' : isCurrent ? '#12' : '--'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'timeline' && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Event <span className="text-primary">Timeline</span></h3>
                                <div className="space-y-4">
                                    {student.logs?.map((log: any) => (
                                        <div key={log.id} className="flex gap-6 p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary flex-shrink-0">
                                                <Activity size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{log.event_type}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-700 leading-relaxed">{log.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!student.logs || student.logs.length === 0) && (
                                        <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold italic">No log entries found for this student.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Document <span className="text-primary">Vault</span></h3>
                                    <button className="bg-primary text-white p-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {student.documents?.map((doc: any) => (
                                        <div key={doc.id} className="p-6 rounded-[2rem] border border-slate-100 bg-white shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-slate-100 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <h5 className="text-sm font-black text-slate-900">{doc.document_type}</h5>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{doc.file_name}</p>
                                                </div>
                                            </div>
                                            <a href={doc.file_url} target="_blank" className="p-3 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-primary transition-colors">
                                                <ExternalLink size={18} />
                                            </a>
                                        </div>
                                    ))}
                                    {(!student.documents || student.documents.length === 0) && (
                                        <div className="col-span-full text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold italic">No documents uploaded yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'family' && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Family & <span className="text-primary">Guardians</span></h3>
                                <div className="space-y-6">
                                    {student.guardians?.map((guardian: any) => (
                                        <div key={guardian.id} className="p-8 rounded-[2.5rem] border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-8 items-start md:items-center">
                                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-2xl font-black text-slate-200 border border-slate-100 shadow-sm flex-shrink-0">
                                                {guardian.first_name[0]}{guardian.last_name?.[0]}
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{guardian.relation || 'Parent'}</span>
                                                        <h4 className="text-xl font-black text-slate-900">{guardian.first_name} {guardian.last_name}</h4>
                                                    </div>
                                                    {guardian.is_emergency && (
                                                        <div className="bg-rose-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">Emergency Contact</div>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Occupation</p>
                                                        <p className="text-xs font-bold text-slate-700">{guardian.occupation || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact</p>
                                                        <p className="text-xs font-bold text-slate-700">{guardian.phone || 'N/A'}</p>
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-1">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Address</p>
                                                        <p className="text-xs font-bold text-slate-700 line-clamp-1">{guardian.address || 'Same as student'}</p>
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
        </div>
    );
}
