import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Users, Plus, Loader2, Layers, 
    AlertCircle, ChevronRight, Search,
    CheckCircle, Clock, LayoutGrid, Table as TableIcon,
    Check, ChevronLeft,
    Sparkles, Filter, ArrowUpRight,
    Library,
    MoreVertical
} from 'lucide-react';
import * as subjectApi from '../../api/subject.api';
import * as gradeApi from '../../api/grade.api';
import * as staffApi from '../../api/staff.api';
import * as classroomApi from '../../api/classroom.api';
import { academicsApi } from '../../api/academics.api';
import { ComboBox } from '../../components/ui/ComboBox';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/ui/Modal';

type ViewMode = 'overview' | 'quick-edit';

export default function Subjects() {
    const { notify } = useNotification();
    const { can, user } = useAuth();
    // Data States
    const [subjects, setSubjects] = useState<subjectApi.Subject[]>([]);
    const [allSubjects, setAllSubjects] = useState<subjectApi.Subject[]>([]);
    const [assignments, setAssignments] = useState<subjectApi.Assignment[]>([]);
    const [grades, setGrades] = useState<gradeApi.Grade[]>([]);
    const [staff, setStaff] = useState<staffApi.Staff[]>([]);
    const [classrooms, setClassrooms] = useState<classroomApi.Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12 });
    
    // UI States
    const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        return (localStorage.getItem('subjects_view_mode') as ViewMode) || 'overview';
    });
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form states
    const [subjectFormData, setSubjectFormData] = useState({
        name: '',
        code: '',
        grade_id: '',
        description: ''
    });

    const [assignFormData, setAssignFormData] = useState({
        staff_id: '',
        classroom_id: '',
        subject_id: '',
        academic_year_id: ''
    });

    const fetchInitialData = useCallback(async () => {
        try {
            const [gradeRes, staffData, classroomData, yearsData] = await Promise.all([
                gradeApi.getGrades(),
                staffApi.getStaffList({ limit: 500 }),
                classroomApi.getClassrooms({ limit: 500 }),
                academicsApi.getYears()
            ]);
            
            const gradeData = gradeRes.data;
            setGrades(gradeData);
            setStaff(staffData.data);
            setClassrooms(classroomData.data);
            
            if (gradeData.length > 0 && !selectedGradeId) {
                setSelectedGradeId(gradeData[0].id);
            }

            if (yearsData && yearsData.length > 0) {
                const activeYear = yearsData.find((y: any) => y.is_current) || yearsData[0];
                setAssignFormData(prev => ({ ...prev, academic_year_id: activeYear.id.toString() }));
            }
        } catch (err) {
            console.error('Failed to fetch initial data:', err);
        }
    }, [selectedGradeId]);

    const fetchSubjectsAndAssignments = useCallback(async () => {
        if (!selectedGradeId || !assignFormData.academic_year_id) return;
        setLoading(true);
        try {
            const [subjectRes, allSubjectRes, assignmentData] = await Promise.all([
                subjectApi.getSubjectList({ 
                    grade_id: selectedGradeId, 
                    search: searchQuery,
                    page: pagination.page,
                    limit: pagination.limit
                }),
                subjectApi.getSubjectList({ 
                    grade_id: selectedGradeId, 
                    limit: 500 // Fetch all for dropdowns
                }),
                subjectApi.getAssignments({
                    academic_year_id: parseInt(assignFormData.academic_year_id)
                })
            ]);
            
            setSubjects(subjectRes.data);
            setAllSubjects(allSubjectRes.data);
            setAssignments(assignmentData);
            setPagination(prev => ({ ...prev, total: subjectRes.pagination.total }));
        } catch (err) {
            console.error('Failed to fetch subjects/assignments:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedGradeId, searchQuery, pagination.page, pagination.limit, assignFormData.academic_year_id]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        fetchSubjectsAndAssignments();
    }, [fetchSubjectsAndAssignments]);

    // Persist view mode
    useEffect(() => {
        localStorage.setItem('subjects_view_mode', viewMode);
    }, [viewMode]);

    // Matrix Calculation (Subject-Classroom pairs)
    const matrix = useMemo(() => {
        const rows: any[] = [];
        subjects.forEach(subject => {
            const relevantClassrooms = classrooms.filter(c => Number(c.grade_id) === Number(subject.grade_id));
            relevantClassrooms.forEach(classroom => {
                const assignment = assignments.find(a => 
                    Number(a.subject_id) === Number(subject.id) && 
                    Number(a.classroom_id) === Number(classroom.id)
                );
                
                // Extremely defensive ID extraction
                const rawId = assignment?.staff_id || (assignment as any)?.teacher_id || (assignment as any)?.staffId || (assignment as any)?.teacherId;
                const teacherId = rawId ? Number(rawId) : null;
                const teacherName = (assignment as any)?.teacher_name || 'Assigned Teacher';

                // Ensure the assigned teacher is in the staff options even if not in the main staff list
                const rowStaffOptions = [...staff];
                if (teacherId && !staff.some(s => Number(s.id) === teacherId)) {
                    rowStaffOptions.push({
                        id: teacherId,
                        first_name: teacherName,
                        last_name: '',
                        designation: 'Assigned'
                    } as any);
                }

                rows.push({
                    id: `${subject.id}-${classroom.id}`,
                    subject,
                    classroom,
                    assignment,
                    teacherId,
                    teacherName,
                    staffOptions: rowStaffOptions,
                    isAssigned: !!assignment && !!teacherId
                });
            });
        });
        return rows;
    }, [subjects, classrooms, assignments, staff]);

    // Summary Calculations (Based on the Matrix)
    const stats = useMemo(() => {
        const total = matrix.length;
        const assigned = matrix.filter(r => r.isAssigned).length;
        const missing = total - assigned;
        return { total, assigned, missing };
    }, [matrix]);

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await subjectApi.createSubject({
                ...subjectFormData,
                grade_id: parseInt(subjectFormData.grade_id)
            });
            await fetchSubjectsAndAssignments();
            setIsSubjectModalOpen(false);
            setSubjectFormData({ name: '', code: '', grade_id: '', description: '' });
            notify('success', 'Subject Created', `${subjectFormData.name} is now part of the curriculum.`);
        } catch (err: any) {
            notify('error', 'Creation Failed', err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAssignTeacher = async (e: React.FormEvent | null, manualData?: any) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            const data = manualData || {
                staff_id: parseInt(assignFormData.staff_id),
                classroom_id: parseInt(assignFormData.classroom_id),
                subject_id: parseInt(assignFormData.subject_id),
                academic_year_id: parseInt(assignFormData.academic_year_id)
            };
            await subjectApi.assignTeacher(data);
            await fetchSubjectsAndAssignments();
            setIsAssignModalOpen(false);
            setAssignFormData(prev => ({ ...prev, staff_id: '', classroom_id: '', subject_id: '' }));
            notify('success', 'Teacher Assigned', 'Curriculum matrix has been updated.');
        } catch (err: any) {
            notify('error', 'Assignment Failed', err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [bulkTeacherId, setBulkTeacherId] = useState<string>('');

    const toggleRow = (id: string) => {
        const next = new Set(selectedRows);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedRows(next);
    };

    const toggleAll = () => {
        if (selectedRows.size === matrix.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(matrix.map(r => r.id)));
    };

    const handleBulkAssign = async () => {
        if (!bulkTeacherId || selectedRows.size === 0) return;
        setIsSaving(true);
        try {
            const payload = Array.from(selectedRows).map(id => {
                const row = matrix.find(r => r.id === id);
                return {
                    staff_id: parseInt(bulkTeacherId),
                    classroom_id: row.classroom.id,
                    subject_id: row.subject.id,
                    academic_year_id: parseInt(assignFormData.academic_year_id)
                };
            });
            await subjectApi.bulkAssignTeachers(payload);
            await fetchSubjectsAndAssignments();
            setSelectedRows(new Set());
            setBulkTeacherId('');
            notify('success', 'Bulk Assignment Update', `${payload.length} assignments updated successfully.`);
        } catch (err: any) {
            notify('error', 'Bulk Update Failed', err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const selectedGrade = grades.find(g => g.id === selectedGradeId);

    return (
        <div className="flex h-[calc(100vh-140px)] bg-slate-50/50 rounded-[2.5rem] overflow-hidden border border-[var(--card-border)] shadow-2xl relative">
            {/* Bulk Action Bar */}
            {selectedRows.size > 0 && can('class:write') && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-surface-dark/95 backdrop-blur-xl border border-white/10 rounded-3xl p-4 flex items-center gap-6 shadow-2xl shadow-theme/40">
                        <div className="px-6 border-r border-white/10">
                            <span className="text-white font-bold text-sm tracking-tight">{selectedRows.size} Selected</span>
                        </div>
                        <div className="w-64">
                            <ComboBox
                                placeholder="Assign Teacher..."
                                value={bulkTeacherId}
                                onChange={val => setBulkTeacherId(val?.toString() || '')}
                                options={staff.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }))}
                                variant="glass"
                                direction="up"
                            />
                        </div>
                        <button
                            onClick={handleBulkAssign}
                            disabled={!bulkTeacherId || isSaving}
                            className="btn-primary !px-8 !py-3 !text-xs"
                        >
                            {isSaving ? 'Updating...' : 'Update All'}
                        </button>
                        <button
                            onClick={() => setSelectedRows(new Set())}
                            className="p-3 text-[var(--text-muted)] hover:text-white transition-colors"
                        >
                            <AlertCircle size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Grade Sidebar Rail */}
            <div className="w-80 bg-[var(--card-bg)] border-r border-[var(--card-border)] flex flex-col">
                <div className="p-8 border-b border-[var(--card-border)] bg-slate-50/30">
                    <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Academic Stages</h3>
                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find grade level..."
                            className="input-field-modern !pl-11 !py-3 !text-xs !bg-[var(--card-bg)] border-[var(--card-border)]"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
                    {grades.map((grade) => (
                        <button
                            key={grade.id}
                            onClick={() => {
                                setSelectedGradeId(grade.id);
                                setPagination(prev => ({ ...prev, page: 1 }));
                                setSelectedRows(new Set());
                            }}
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

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 flex flex-col">
                {/* Dynamic Header */}
                <div className="p-8 pb-4 space-y-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="bg-surface-dark p-4 rounded-3xl shadow-xl shadow-theme/10">
                                <Library className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">
                                    {selectedGrade?.name || 'Academic Matrix'}
                                </h1>
                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Curriculum Mapping & Faculty Provisioning
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 p-1.5 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)]/60 shadow-sm">
                            <button
                                onClick={() => setViewMode('overview')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'overview' ? 'bg-surface-dark text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-slate-600'}`}
                            >
                                <LayoutGrid size={14} />
                                Dashboard
                            </button>
                            <button
                                onClick={() => setViewMode('quick-edit')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'quick-edit' ? 'bg-surface-dark text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-slate-600'}`}
                            >
                                <TableIcon size={14} />
                                Allocation Matrix
                            </button>
                        </div>
                    </div>

                    {/* Stats Rail */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                            label="Institutional Subjects" 
                            value={stats.total} 
                            icon={Layers} 
                            color="indigo" 
                            sub="Curriculum Units"
                        />
                        <StatCard 
                            label="Faculty Allocated" 
                            value={stats.assigned} 
                            icon={CheckCircle} 
                            color="emerald" 
                            percentage={stats.total ? Math.round((stats.assigned / stats.total) * 100) : 0}
                            sub="Assignment Coverage"
                        />
                        <StatCard 
                            label="Pending Allocation" 
                            value={stats.missing} 
                            icon={AlertCircle} 
                            color="rose" 
                            sub="Resource Deficit"
                        />
                    </div>

                    {/* Controls Bar */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--card-bg)] p-3 rounded-3xl border border-[var(--card-border)]/60 shadow-sm">
                        <div className="relative flex-1 w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-50 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Filter pedagogical units by name or reference code..."
                                className="input-field-modern !pl-12 !py-3.5 !text-xs !bg-slate-50/50 !border-transparent focus:!bg-[var(--card-bg)] focus:!border-[var(--card-border)] w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button className="p-3.5 btn-dark !shadow-theme/10">
                                <Filter size={20} />
                            </button>
                            {can('class:write') && (
                                <button
                                    onClick={() => {
                                        setSubjectFormData(prev => ({ ...prev, grade_id: selectedGradeId?.toString() || '' }));
                                        setIsSubjectModalOpen(true);
                                    }}
                                    className="btn-primary flex items-center gap-2 !px-8 !py-3.5 !text-xs"
                                >
                                    <Plus size={18} />
                                    New Subject
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Dynamic View */}
                <div className="p-8 pt-4 flex-1">
                    {loading ? (
                        <div className="h-[40vh] flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                <Loader2 size={48} className="text-primary animate-spin relative z-10" />
                            </div>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Synthesizing Allocation Matrix...</p>
                        </div>
                    ) : viewMode === 'overview' ? (
                        <div className="space-y-8 pb-20">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                                {subjects.map((subject) => (
                                    <SubjectCard 
                                        key={subject.id} 
                                        subject={{
                                            ...subject,
                                            assignments: assignments.filter(a => a.subject_id === subject.id),
                                            isAssigned: assignments.some(a => a.subject_id === subject.id)
                                        }} 
                                        onAssign={can('class:write') ? () => {
                                            setAssignFormData(prev => ({ ...prev, subject_id: subject.id.toString() }));
                                            setIsAssignModalOpen(true);
                                        } : undefined}
                                    />
                                ))}
                            </div>
                            
                            {/* Pagination Footer */}
                            {pagination.total > pagination.limit && (
                                <div className="flex justify-center items-center gap-6 pt-12 pb-20">
                                    <button 
                                        disabled={pagination.page === 1}
                                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                        className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl disabled:opacity-30 hover:bg-[var(--background)] transition-all shadow-sm text-[var(--text-muted)]"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <div className="px-6 py-2.5 bg-surface-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-theme/10">
                                        Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                                    </div>
                                    <button 
                                        disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                        className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl disabled:opacity-30 hover:bg-[var(--background)] transition-all shadow-sm text-[var(--text-muted)]"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="premium-card overflow-hidden mb-20">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-[var(--background)] border-b border-[var(--card-border)]">
                                            <th className="px-8 py-5 w-20">
                                                <button 
                                                    onClick={toggleAll}
                                                    className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${selectedRows.size === matrix.length ? 'bg-primary border-primary' : 'bg-[var(--card-bg)] border-[var(--card-border)]'}`}
                                                >
                                                    {selectedRows.size === matrix.length && <Check size={12} className="text-white" strokeWidth={4} />}
                                                </button>
                                            </th>
                                            <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Organizational Unit</th>
                                            <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Pedagogical Subject</th>
                                            <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Provisioned Faculty</th>
                                            <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Allocation Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matrix.map((row) => (
                                            <tr key={row.id} className={`group border-b border-slate-50 hover:bg-slate-50/30 transition-all ${selectedRows.has(row.id) ? 'bg-primary/5' : ''}`}>
                                                <td className="px-8 py-6">
                                                    <button 
                                                        onClick={() => toggleRow(row.id)}
                                                        className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${selectedRows.has(row.id) ? 'bg-primary border-primary' : 'bg-[var(--card-bg)] border-[var(--card-border)] group-hover:border-slate-300'}`}
                                                    >
                                                        {selectedRows.has(row.id) && <Check size={12} className="text-white" strokeWidth={4} />}
                                                    </button>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-[var(--text-main)] leading-tight">{row.classroom.name}</span>
                                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight mt-1">{row.classroom.section} Division</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-surface-dark flex items-center justify-center text-white font-bold text-[10px] shadow-lg shadow-theme/10">
                                                            {row.subject.name[0]}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-[var(--text-main)] group-hover:text-primary transition-colors leading-tight">{row.subject.name}</span>
                                                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">ID: {row.subject.code}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {can('class:write') && user?.roles.some((r: any) => ['admin', 'school_admin'].includes(r)) ? (
                                                        <div className="max-w-[220px]">
                                                            <ComboBox
                                                                placeholder="Provision Teacher..."
                                                                value={row.teacherId}
                                                                onChange={(val) => {
                                                                    if (val) {
                                                                        handleAssignTeacher(null, {
                                                                            staff_id: Number(val),
                                                                            classroom_id: row.classroom.id,
                                                                            subject_id: row.subject.id,
                                                                            academic_year_id: parseInt(assignFormData.academic_year_id)
                                                                        });
                                                                    }
                                                                }}
                                                                options={row.staffOptions.map((s: any) => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }))}
                                                                direction={matrix.indexOf(row) > matrix.length - 3 ? 'up' : 'down'}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[var(--text-muted)] border border-[var(--card-border)]">
                                                                <Users size={14} />
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-600">
                                                                {row.teacherName || 'Not Provisioned'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider border shadow-sm transition-all
                                                        ${row.isAssigned 
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/5' 
                                                            : 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-500/5'}`}>
                                                        {row.isAssigned ? <Check size={12} strokeWidth={3} /> : <Clock size={12} strokeWidth={3} />}
                                                        {row.isAssigned ? 'Allocated' : 'Pending'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title="Architect New Subject">
                <form onSubmit={handleAddSubject} className="space-y-8 p-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Institutional Name *</label>
                            <input
                                required
                                className="input-field-modern"
                                value={subjectFormData.name}
                                onChange={e => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                                placeholder="e.g. Theoretical Physics"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Subject Identifier *</label>
                            <input
                                required
                                className="input-field-modern font-mono"
                                value={subjectFormData.code}
                                onChange={e => setSubjectFormData({ ...subjectFormData, code: e.target.value })}
                                placeholder="PHYS-402"
                            />
                        </div>
                    </div>
                    
                    <ComboBox
                        label="Academic Stage Placement"
                        value={subjectFormData.grade_id ? Number(subjectFormData.grade_id) : null}
                        onChange={val => setSubjectFormData({ ...subjectFormData, grade_id: val?.toString() || '' })}
                        placeholder="Select Targeted Grade"
                        options={grades.map(g => ({ value: g.id, label: g.name }))}
                    />

                    <div className="pt-6 flex gap-4">
                        <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="btn-ghost flex-1 !py-4">Abort</button>
                        <button 
                            type="submit" 
                            disabled={isSaving} 
                            className="btn-primary flex-[2] !py-4"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            {isSaving ? 'Finalizing...' : 'Finalize Subject Architecture'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Faculty Allocation">
                <form onSubmit={handleAssignTeacher} className="space-y-6 p-2">
                    <ComboBox
                        label="Pedagogical Subject"
                        value={assignFormData.subject_id ? Number(assignFormData.subject_id) : null}
                        onChange={val => setAssignFormData({ ...assignFormData, subject_id: val?.toString() || '' })}
                        placeholder="Select Subject Unit"
                        options={allSubjects.map(s => ({ value: s.id, label: `${s.name} (${s.code})` }))}
                    />

                    <ComboBox
                        label="Provisioned Faculty"
                        value={assignFormData.staff_id ? Number(assignFormData.staff_id) : null}
                        onChange={val => setAssignFormData({ ...assignFormData, staff_id: val?.toString() || '' })}
                        placeholder="Select Faculty Member"
                        options={staff.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name} (${s.designation})` }))}
                    />

                    <ComboBox
                        label="Organizational Unit"
                        value={assignFormData.classroom_id ? Number(assignFormData.classroom_id) : null}
                        onChange={val => setAssignFormData({ ...assignFormData, classroom_id: val?.toString() || '' })}
                        placeholder="Select Classroom Division"
                        options={classrooms.filter(c => Number(c.grade_id) === Number(selectedGradeId)).map(c => ({ value: c.id, label: c.name }))}
                    />

                    <div className="pt-6 flex gap-4">
                        <button type="button" onClick={() => setIsAssignModalOpen(false)} className="btn-ghost flex-1 !py-4">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={isSaving} 
                            className="btn-primary flex-[2] !py-4"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                            {isSaving ? 'Allocating...' : 'Commit Allocation'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, percentage, sub }: any) {
    const colors: any = {
        indigo: 'bg-primary/5 text-indigo-600 border-indigo-100 shadow-indigo-500/5',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/5',
        rose: 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-500/5',
    };

    return (
        <div className={`p-6 rounded-[2rem] border ${colors[color]} shadow-sm transition-all hover:shadow-md duration-300 group`}>
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-[var(--card-bg)] rounded-2xl shadow-sm border border-white/20 group-hover:scale-110 transition-transform duration-500">
                    <Icon size={24} />
                </div>
                {percentage !== undefined && (
                    <div className="text-right">
                        <span className="text-2xl font-bold block leading-none text-[var(--text-main)]">{percentage}%</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1 block">Capacity</span>
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">{label}</p>
                <h4 className="text-3xl font-bold text-[var(--text-main)] tracking-tight mb-1">{value}</h4>
                <p className="text-[10px] font-medium text-[var(--text-muted)] flex items-center gap-1.5 italic">
                    <Sparkles size={10} className="text-amber-500" />
                    {sub}
                </p>
            </div>
        </div>
    );
}

function SubjectCard({ subject, onAssign }: any) {
    return (
        <div className="premium-card p-6 flex flex-col group h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-[var(--text-main)] group-hover:opacity-[0.05] transition-opacity pointer-events-none -mr-6 -mt-6">
                <Library size={120} />
            </div>

            <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex flex-col">
                    <span className="px-2.5 py-1 bg-[var(--background)] text-[var(--text-muted)] rounded-lg text-[9px] font-black uppercase tracking-widest w-fit mb-3 border border-[var(--card-border)]/50">
                        {subject.code}
                    </span>
                    <h3 className="text-lg font-bold text-[var(--text-main)] tracking-tight leading-tight group-hover:text-primary transition-colors">{subject.name}</h3>
                </div>
                <button className="p-2.5 text-[var(--text-muted)] opacity-30 hover:opacity-100 hover:bg-[var(--background)] rounded-xl transition-all">
                    <MoreVertical size={20} />
                </button>
            </div>

            <div className="flex-1 space-y-5 mb-8 relative z-10">
                {subject.assignments.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                <Users size={12} />
                                {subject.assignments.length} Allocation Points
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            {subject.assignments.slice(0, 2).map((a: any) => (
                                <div key={a.id} className="flex items-center justify-between px-4 py-2.5 bg-[var(--background)]/80 rounded-2xl border border-[var(--card-border)] group/item hover:bg-[var(--card-bg)] transition-colors">
                                    <span className="text-[11px] font-bold text-[var(--text-main)]">{a.classroom_name}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-success" />
                                        <span className="text-[10px] font-bold text-[var(--text-muted)] truncate max-w-[90px]">{a.teacher_name}</span>
                                    </div>
                                </div>
                            ))}
                            {subject.assignments.length > 2 && (
                                <div className="px-4 py-2 text-center text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--background)]/30 rounded-xl border border-dashed border-[var(--card-border)]">
                                    +{subject.assignments.length - 2} Additional Units
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="py-6 px-6 bg-error/5 border border-error/10 rounded-[1.5rem] flex flex-col items-center text-center gap-3">
                        <div className="p-2.5 bg-[var(--card-bg)] rounded-xl shadow-sm text-error">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-error uppercase tracking-widest leading-none">Unprovisioned</span>
                            <p className="text-[10px] text-error opacity-60 font-medium mt-1.5">No faculty members currently allocated to this subject.</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-[var(--card-border)]/40 mt-auto relative z-10">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all
                    ${subject.isAssigned ? 'bg-success/10 text-success' : 'bg-[var(--background)] text-[var(--text-muted)] border border-[var(--card-border)]/50'}`}>
                    {subject.isAssigned ? <CheckCircle size={12} strokeWidth={3} /> : <Clock size={12} strokeWidth={3} />}
                    {subject.isAssigned ? 'Active' : 'Pending'}
                </div>
                {onAssign && (
                    <button 
                        onClick={onAssign}
                        className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] hover:text-primary uppercase tracking-widest transition-all group/btn"
                    >
                        {subject.isAssigned ? "Manage" : "Allocate"}
                        <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                )}
            </div>
        </div>
    );
}

const CheckCircle2 = ({ size, className }: { size: number, className?: string }) => (
    <CheckCircle size={size} className={className} />
);
