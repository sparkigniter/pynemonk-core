import { useState, useEffect } from 'react';
import { 
    Search, Plus, Filter, GraduationCap, AlertCircle, ChevronRight, 
    CheckCircle2, FileSpreadsheet, RefreshCw, 
    UserX, LayoutGrid, List, DollarSign, Upload
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as studentApi from '../../api/student.api';
import { downloadIntegrationExport } from '../../api/integration.api';
import { useAuth } from '../../contexts/AuthContext';
import { useAcademics } from '../../contexts/AcademicsContext';
import AdvancedFilters from '../../components/ui/AdvancedFilters';
import type { FilterField } from '../../components/ui/AdvancedFilters';
import { getClassrooms } from '../../api/classroom.api';
import { useNotification } from '../../contexts/NotificationContext';
import type { Classroom } from '../../api/classroom.api';
import { getGrades } from '../../api/grade.api';
import BulkImportWizard from '../../components/students/BulkImportWizard';

export default function StudentList() {
    const { notify } = useNotification();
    const { isYearClosed } = useAcademics();
    const [students, setStudents] = useState<studentApi.Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [showImportWizard, setShowImportWizard] = useState(false);
    const navigate = useNavigate();
    const { user, can } = useAuth();
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
    const [showAuditOnly, setShowAuditOnly] = useState(false);
    const [showUnenrolledOnly, setShowUnenrolledOnly] = useState(false);
    const [unenrolledCount, setUnenrolledCount] = useState(0);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState<any>({});
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [activeTab, setActiveTab] = useState<'directory' | 'admissions'>('directory');
    const [applications, setApplications] = useState<any[]>([]);
    const [pipelineStudents, setPipelineStudents] = useState<studentApi.Student[]>([]);
    const [gradeSearch, setGradeSearch] = useState('');

    const filterFields: FilterField[] = [
        { 
            id: 'classroom_id', 
            label: 'Classroom', 
            type: 'select', 
            options: classrooms.map(c => ({ value: c.id, label: `${c.name}${c.section}` }))
        },
        { 
            id: 'gender', 
            label: 'Gender', 
            type: 'select', 
            options: [
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' }
            ]
        },
        { 
            id: 'blood_group', 
            label: 'Blood Group', 
            type: 'select', 
            options: [
                { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' }
            ]
        },
        { id: 'nationality', label: 'Nationality', type: 'text', placeholder: 'e.g. Indian' },
        { id: 'religion', label: 'Religion', type: 'text', placeholder: 'e.g. Hindu' }
    ];

    const handleSATSExport = async () => {
        setExporting(true);
        try {
            await downloadIntegrationExport('karnataka-sats', 'export_students', {
                tenantId: user?.tenant_id,
                search: search || undefined
            });
        } catch (err) {
            console.error('SATS Export failed:', err);
        } finally {
            setExporting(false);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await studentApi.getStudentList({
                search,
                page: pagination.page,
                limit: viewMode === 'grid' ? 12 : pagination.limit,
                grade_id: showUnenrolledOnly ? undefined : (selectedGradeId || undefined),
                unenrolled: showUnenrolledOnly ? true : undefined,
                ...advancedFilters
            });
            setStudents(response.data);
            setPagination(response.pagination);

            // If we are in admissions tab, fetch ALL unplaced students for the pipeline
            if (activeTab === 'admissions') {
                const pipelineRes = await studentApi.getStudentList({
                    unenrolled: true,
                    limit: 100 // Fetch a larger batch for the kanban
                });
                setPipelineStudents(pipelineRes.data);
            }
        } catch (err) {
            console.error('Failed to fetch students:', err);
        } finally {
            setLoading(false);
        }
    };

    const isSatsReady = (data: any) => {
        // Handle both Student objects and AdmissionApplication drafts
        const student = data.student_data || data;
        
        // Required fields for SATS/Identity
        const requiredFields = [
            'mother_tongue', 'nationality', 'religion', 
            'phone', 'address', 'date_of_birth', 
            'gender'
        ];
        return requiredFields.every(field => student[field] && student[field].toString().trim() !== '');
    };

    const fetchApplications = async () => {
        try {
            const res = await studentApi.listAdmissionApplications();
            setApplications(res || []);
        } catch (err) {
            console.error('Failed to fetch applications:', err);
        }
    };

    const fetchUnenrolledCount = async () => {
        try {
            const res = await studentApi.getStudentList({ unenrolled: true, limit: 1 });
            setUnenrolledCount(res.pagination.total);
        } catch {}
    };

    const handleFinalize = async (id: number) => {
        setLoading(true);
        try {
            await studentApi.finalizeAdmissionWorkflow(id);
            notify('success', 'Admission Finalized', 'Student has been officially admitted and added to the directory.');
            fetchStudents();
            fetchApplications();
            fetchUnenrolledCount();
        } catch (err: any) {
            console.error('Finalization failed', err);
            notify('error', 'Finalization Failed', err.message || 'Check if all required fields (Mother Tongue, Address, etc.) are filled.');
        } finally {
            setLoading(false);
        }
    };

    const loadInitialData = async () => {
        try {
            const [classRes, gradeRes] = await Promise.all([
                getClassrooms({ limit: 100 }),
                getGrades({ limit: 100, ignoreScope: true })
            ]);
            setClassrooms(classRes.data);
            const sortedGrades = (gradeRes.data || []).sort((a: any, b: any) => a.sequence_order - b.sequence_order);
            setGrades(sortedGrades);
            
            if (sortedGrades.length > 0 && !selectedGradeId) {
                setSelectedGradeId(sortedGrades[0].id);
            }
        } catch (err) {
            console.error('Failed to load initial data', err);
        }
    };

    useEffect(() => {
        loadInitialData();
        fetchUnenrolledCount();
        fetchApplications();
    }, []);

    useEffect(() => {
        if (!showUnenrolledOnly && selectedGradeId === null && grades.length > 0) return;
        const timer = setTimeout(() => fetchStudents(), 300);
        return () => clearTimeout(timer);
    }, [search, pagination.page, advancedFilters, selectedGradeId, showUnenrolledOnly, viewMode, activeTab]);

    const handleUnenrolledToggle = () => {
        const next = !showUnenrolledOnly;
        setShowUnenrolledOnly(next);
        setShowAuditOnly(false);
        setSelectedGradeId(next ? null : (grades[0]?.id ?? null));
        setPagination(p => ({ ...p, page: 1 }));
    };

    const canAdmit = can('student:admin');
    const canSeeFees = can('fee:read');
    const canSyncSats = can('report:export') || can('student:admin');
    const canAdminAdmissions = can('student:admin');

    const readyCount = students.filter(isSatsReady).length;
    const attentionCount = students.length - readyCount;

    const filteredStudents = showAuditOnly ? students.filter(s => !isSatsReady(s)) : students;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">Students</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1 font-medium">Manage all your students and their admission records here.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {canSyncSats && (
                        <button
                            onClick={handleSATSExport}
                            disabled={exporting}
                            className="btn-dark flex items-center gap-2 !px-6 !py-3 !text-xs disabled:opacity-50"
                        >
                            {exporting ? <RefreshCw size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                            {exporting ? 'Syncing...' : 'Export SATS'}
                        </button>
                    )}
                    {canAdmit && (
                        <button
                            onClick={() => setShowImportWizard(true)}
                            disabled={isYearClosed()}
                            className="btn-dark flex items-center gap-2 !px-6 !py-3 !text-xs disabled:opacity-30 disabled:grayscale"
                        >
                            <Upload size={16} />
                            Bulk Import
                        </button>
                    )}
                    {canAdmit && (
                        <button
                            onClick={() => navigate('/students/register')}
                            disabled={isYearClosed()}
                            className="btn-primary flex items-center gap-2 !px-6 !py-3 !text-xs disabled:opacity-30 disabled:grayscale"
                        >
                            <Plus size={18} />
                            Admit Student
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="premium-card p-6 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <GraduationCap size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Total Students</p>
                        <h4 className="text-2xl font-bold text-slate-800">{pagination.total}</h4>
                    </div>
                </div>
                <div className="premium-card p-6 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">SATS Ready</p>
                        <h4 className="text-2xl font-bold text-slate-800">{readyCount}</h4>
                    </div>
                </div>
                <button
                    onClick={() => { setShowAuditOnly(!showAuditOnly); setShowUnenrolledOnly(false); }}
                    className={`premium-card p-6 flex items-center gap-5 text-left transition-all ${showAuditOnly ? 'ring-2 ring-rose-500 bg-rose-50/30' : ''}`}
                >
                    <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Missing Info</p>
                        <h4 className="text-2xl font-bold text-slate-800">{attentionCount}</h4>
                    </div>
                </button>
                <button
                    onClick={handleUnenrolledToggle}
                    className={`premium-card p-6 flex items-center gap-5 text-left transition-all ${showUnenrolledOnly ? 'ring-2 ring-amber-500 bg-amber-50/30' : ''}`}
                >
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                        <UserX size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Unenrolled</p>
                        <h4 className="text-2xl font-bold text-slate-800">{unenrolledCount}</h4>
                    </div>
                </button>
            </div>

            {/* View Switching Tabs */}
            {canAdminAdmissions && (
                <div className="bg-[var(--card-bg)] p-1.5 rounded-2xl border border-[var(--card-border)] shadow-sm flex items-center gap-1 w-fit">
                    <button
                        onClick={() => setActiveTab('directory')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all
                            ${activeTab === 'directory' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--text-main)]'}`}
                    >
                        <List size={16} />
                        Active Directory
                    </button>
                    <button
                        onClick={() => setActiveTab('admissions')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all
                            ${activeTab === 'admissions' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--text-main)]'}`}
                    >
                        <GraduationCap size={16} />
                        New Admissions
                    </button>
                </div>
            )}

            {activeTab === 'directory' || !canAdminAdmissions ? (
                <div className="flex flex-col lg:flex-row gap-8">
                    {!showUnenrolledOnly && (
                        <div className="w-full lg:w-72 flex-shrink-0">
                            <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)] shadow-xl overflow-hidden lg:sticky lg:top-28">
                                <div className="p-6 border-b border-[var(--card-border)] bg-slate-50/30">
                                    <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Grades / Classes</h3>
                                    <div className="relative group">
                                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Find grade level..."
                                            className="w-full bg-slate-100/50 border-transparent focus:bg-white focus:border-primary/20 rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold transition-all outline-none"
                                            value={gradeSearch}
                                            onChange={(e) => setGradeSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="p-3 space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar">
                                    {grades
                                        .filter(g => g.name.toLowerCase().includes(gradeSearch.toLowerCase()))
                                        .map((grade) => (
                                        <button
                                            key={grade.id}
                                            onClick={() => { setSelectedGradeId(grade.id); setPagination(p => ({ ...p, page: 1 })); }}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                                                selectedGradeId === grade.id
                                                ? 'bg-surface-dark text-white shadow-xl shadow-theme/10'
                                                : 'text-[var(--text-muted)] hover:bg-slate-50 hover:text-[var(--text-main)]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[10px] transition-colors ${
                                                    selectedGradeId === grade.id ? 'bg-[var(--card-bg)]/10 text-white' : 'bg-slate-100 text-[var(--text-muted)] group-hover:bg-[var(--card-bg)]'
                                                }`}>
                                                    {grade.name.match(/\d+/)?.[0] || 'G'}
                                                </div>
                                                <span className="text-sm font-bold tracking-tight">{grade.name}</span>
                                            </div>
                                            {selectedGradeId === grade.id && <ChevronRight size={16} className="text-primary" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-6">
                        <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)] shadow-xl">
                            <div className="p-5 border-b border-[var(--card-border)] flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/30 rounded-t-[2rem]">
                                <div className="relative w-full md:w-96 group">
                                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                                    <input
                                        id="student-search"
                                        type="text"
                                        placeholder="Search name, ID or admission..."
                                        className="input-field-modern !pl-11 !py-3 !text-xs !bg-slate-50/50 !border-transparent focus:!bg-[var(--card-bg)] focus:!border-[var(--card-border)] w-full"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="flex items-center gap-1.5 p-1.5 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)]/60 shadow-sm">
                                        <button 
                                            onClick={() => setViewMode('grid')}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'grid' ? 'bg-surface-dark text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-slate-600'}`}
                                        >
                                            <LayoutGrid size={14} />
                                            Grid
                                        </button>
                                        <button 
                                            onClick={() => setViewMode('table')}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'table' ? 'bg-surface-dark text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-slate-600'}`}
                                        >
                                            <List size={14} />
                                            List
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <button 
                                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                                            className={`p-3.5 flex items-center gap-2 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                Object.keys(advancedFilters).length > 0 ? 'btn-dark' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:bg-slate-50 shadow-sm'
                                            }`}
                                        >
                                            <Filter size={16} />
                                            Filters {Object.keys(advancedFilters).length > 0 && `(${Object.keys(advancedFilters).length})`}
                                        </button>
                                        
                                        <AdvancedFilters 
                                            isOpen={isFilterOpen}
                                            onClose={() => setIsFilterOpen(false)}
                                            fields={filterFields}
                                            currentFilters={advancedFilters}
                                            onFilter={(f) => { setAdvancedFilters(f); setPagination(prev => ({ ...prev, page: 1 })); }}
                                            onReset={() => { setAdvancedFilters({}); setPagination(prev => ({ ...prev, page: 1 })); }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-5">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                                        <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                                        <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Loading directory...</p>
                                    </div>
                                ) : filteredStudents.length === 0 ? (
                                    <div className="py-32 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                                            <GraduationCap size={32} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800">No students found</h3>
                                        <p className="text-[var(--text-muted)] text-sm max-w-xs mt-1 font-medium">Try adjusting your filters or search query to find who you're looking for.</p>
                                    </div>
                                ) : viewMode === 'grid' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                                        {filteredStudents.map((student) => (
                                            <div key={student.id} className="premium-card group relative overflow-hidden flex flex-col h-full">
                                                <div className="p-5 flex-1">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                            {student.avatar_url ? (
                                                                <img src={student.avatar_url} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <span className="text-lg font-bold text-[var(--text-muted)]">
                                                                    {student.first_name[0]}{student.last_name?.[0]}
                                                                </span>
                                                            )}
                                                        </div>

                                                    </div>
                                                    <div className="space-y-1 mb-4">
                                                        <h4 className="text-[15px] font-bold text-[var(--text-main)] group-hover:text-primary transition-colors truncate">
                                                            {student.first_name} {student.last_name}
                                                        </h4>
                                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{student.admission_no}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                                                        <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{student.classroom_name || 'Unassigned'}</span>
                                                        {isSatsReady(student) ? (
                                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 size={10} /> Ready</span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 bg-rose-50 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><AlertCircle size={10} /> Incomplete</span>
                                                        )}
                                                        {canSeeFees && (
                                                            <div
                                                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                                                                    student.fee_status === 'paid' 
                                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                                    : student.fee_status === 'no_invoices'
                                                                    ? 'bg-slate-50 text-slate-400 border border-slate-100'
                                                                    : 'bg-rose-50 text-rose-600 border border-rose-100 shadow-sm'
                                                                }`}
                                                            >
                                                                <DollarSign size={10} />
                                                                {student.fee_status === 'no_invoices' ? 'NO FEES' : student.fee_status === 'paid' ? 'PAID' : 'PENDING'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                                                    <Link to={`/students/${student.id}`} className="text-[11px] font-bold text-primary hover:underline">
                                                        View Profile
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto -mx-5">
                                        <table className="w-full text-left border-collapse min-w-[800px]">
                                            <thead>
                                                <tr className="bg-slate-50 border-y border-[var(--card-border)]">
                                                    <th className="pl-5 pr-4 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Student</th>
                                                    <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Admission No</th>
                                                    <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Grade · Class</th>
                                                    <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">SATS Status</th>
                                                    {canSeeFees && <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Finance</th>}
                                                    <th className="pl-4 pr-5 py-3 text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredStudents.map((student) => (
                                                    <tr key={student.id} className="group hover:bg-slate-50/80 transition-colors">
                                                        <td className="pl-5 pr-4 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-[var(--text-muted)] text-xs shadow-sm border border-white">
                                                                    {student.avatar_url ? <img src={student.avatar_url} className="w-full h-full object-cover rounded-xl" alt="" /> : student.first_name[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-800">{student.first_name} {student.last_name}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.gender || '--'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-xs font-black text-slate-600">{student.admission_no}</td>
                                                        <td className="px-4 py-4 text-xs font-black text-slate-600">{student.classroom_name || '--'}</td>
                                                        <td className="px-4 py-4">
                                                            {isSatsReady(student) ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                                    <CheckCircle2 size={12} /> Ready
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                                    <AlertCircle size={12} /> Incomplete
                                                                </span>
                                                            )}
                                                        </td>
                                                        {canSeeFees && (
                                                            <td className="px-4 py-4 text-xs font-black text-slate-600">
                                                                <div
                                                                    className={`inline-flex px-2 py-1 rounded-lg transition-all ${
                                                                        student.fee_status === 'paid' 
                                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                                        : student.fee_status === 'no_invoices'
                                                                        ? 'bg-slate-50 text-slate-400 border border-slate-100'
                                                                        : 'bg-rose-50 text-rose-600 border border-rose-100 shadow-sm'
                                                                    }`}
                                                                >
                                                                    {student.fee_status === 'no_invoices' ? 'NO FEES' : student.fee_status === 'paid' ? 'PAID' : 'PENDING'}
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className="pl-4 pr-5 py-4 text-right">
                                                            <Link to={`/students/${student.id}`} className="inline-flex items-center p-2 text-[var(--text-muted)] hover:text-primary transition-all rounded-lg hover:bg-primary/5">
                                                                <ChevronRight size={18} />
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {pagination.pages > 1 && (
                                <div className="px-5 py-4 border-t border-[var(--card-border)] bg-slate-50/30 flex items-center justify-between rounded-b-[2rem]">
                                    <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                        Total <span className="text-[var(--text-main)]">{pagination.total}</span> students
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={pagination.page === 1}
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                            className="p-2 border border-[var(--card-border)] rounded-lg text-[var(--text-muted)] hover:bg-[var(--card-bg)] disabled:opacity-30 shadow-sm"
                                        >
                                            <ChevronRight size={16} className="rotate-180" />
                                        </button>
                                        <span className="text-[13px] font-bold text-slate-700 px-3">
                                            {pagination.page} / {pagination.pages}
                                        </span>
                                        <button
                                            disabled={pagination.page === pagination.pages}
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                            className="p-2 border border-[var(--card-border)] rounded-lg text-[var(--text-muted)] hover:bg-[var(--card-bg)] disabled:opacity-30 shadow-sm"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Admissions Pipeline View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">1. Leads</h3>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded-lg">
                                {applications.filter(a => a.status === 'draft' && a.current_stage !== 'finance').length}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {applications.filter(a => a.status === 'draft' && a.current_stage !== 'finance').map((app: any) => (
                                <div key={app.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl transition-all group relative">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400">
                                            {app.first_name?.[0]}{app.last_name?.[0]}
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${isSatsReady(app) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {isSatsReady(app) ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                            {isSatsReady(app) ? 'Ready' : 'Incomplete'}
                                        </div>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800">{app.first_name} {app.last_name}</h4>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stage: {app.current_stage}</p>
                                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{app.grade_name || '--'}</p>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button 
                                            onClick={() => navigate(`/students/register?application=${app.id}`)}
                                            className="flex-1 py-2 bg-slate-50 text-slate-600 text-[10px] font-black rounded-xl hover:bg-slate-100 transition-all"
                                        >
                                            Resume
                                        </button>
                                        {app.current_stage === 'finance' && (
                                            <button 
                                                onClick={() => handleFinalize(app.id)}
                                                className="flex-1 py-2 bg-primary text-white text-[10px] font-black rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 transition-all"
                                            >
                                                Finalize
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-rose-500">2. Unpaid</h3>
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[9px] font-black rounded-lg">
                                {pipelineStudents.filter(s => s.fee_status === 'unpaid').length + applications.filter(a => a.current_stage === 'finance').length}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {/* Render Finance Stage Applications first */}
                            {applications.filter(a => a.current_stage === 'finance').map((app: any) => (
                                <div key={`app-${app.id}`} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl transition-all group border-l-4 border-l-amber-400">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black rounded uppercase">Awaiting Finalization</div>
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${isSatsReady(app) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {isSatsReady(app) ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                            {isSatsReady(app) ? 'Ready' : 'Incomplete'}
                                        </div>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800">{app.first_name} {app.last_name}</h4>
                                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{app.grade_name || '--'}</p>
                                    
                                    <div className="flex gap-2 mt-4">
                                        <button 
                                            onClick={() => navigate(`/students/register?application=${app.id}`)}
                                            className="flex-1 py-2 bg-slate-50 text-slate-600 text-[10px] font-black rounded-xl hover:bg-slate-100 transition-all"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleFinalize(app.id)}
                                            className="flex-2 py-2 bg-primary text-white text-[10px] font-black rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            Finalize & Pay
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Render Finalized Unpaid Students */}
                            {pipelineStudents.filter(s => s.fee_status === 'unpaid').map((student: any) => (
                                <div key={student.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl transition-all group border-l-4 border-l-rose-500">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800">{student.first_name} {student.last_name}</h4>
                                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{student.grade_name || 'No Grade'}</p>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${isSatsReady(student) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {isSatsReady(student) ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                            {isSatsReady(student) ? 'Ready' : 'Incomplete'}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Balance</p>
                                            <p className="text-xs font-black text-rose-600">₹{student.outstanding_balance?.toLocaleString() || '0'}</p>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/students/${student.id}`)}
                                            className="px-3 py-1.5 bg-rose-500 text-white text-[9px] font-black rounded-lg shadow-lg shadow-rose-200"
                                        >
                                            View Profile
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">3. Partial</h3>
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-500 text-[9px] font-black rounded-lg">
                                {pipelineStudents.filter(s => s.fee_status === 'partial').length}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {pipelineStudents.filter(s => s.fee_status === 'partial').map((student: any) => (
                                <div key={student.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl transition-all group border-l-4 border-l-amber-500">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800">{student.first_name} {student.last_name}</h4>
                                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{student.grade_name || 'No Grade'}</p>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${isSatsReady(student) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {isSatsReady(student) ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                            {isSatsReady(student) ? 'Ready' : 'Incomplete'}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Pending</p>
                                            <p className="text-xs font-black text-amber-600">₹{student.outstanding_balance?.toLocaleString() || '0'}</p>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/students/${student.id}`)}
                                            className="px-3 py-1.5 bg-amber-500 text-white text-[9px] font-black rounded-lg shadow-lg shadow-amber-200"
                                        >
                                            Settle
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500">4. Paid</h3>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-500 text-[9px] font-black rounded-lg">
                                {pipelineStudents.filter(s => s.fee_status === 'paid').length}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {pipelineStudents.filter(s => s.fee_status === 'paid').map((student: any) => (
                                <div key={student.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl transition-all group border-l-4 border-l-emerald-500">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800">{student.first_name} {student.last_name}</h4>
                                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{student.grade_name || 'No Grade'}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                                            <CheckCircle2 size={10} />
                                            Ready
                                        </div>
                                    </div>
                                    <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 mb-4">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Clear for Placement</p>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/students/placement')}
                                        className="w-full py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl hover:bg-black transition-all shadow-xl"
                                    >
                                        Place in Class
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            <BulkImportWizard
                isOpen={showImportWizard}
                onClose={() => setShowImportWizard(false)}
                onSuccess={() => {
                    fetchStudents();
                    fetchUnenrolledCount();
                }}
                grades={grades}
                classrooms={classrooms}
            />
        </div>
    );
}
