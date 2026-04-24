import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Users, Plus, Loader2, Layers, 
    AlertCircle, ChevronRight, Search, MoreVertical,
    CheckCircle, Clock, LayoutGrid, Table as TableIcon,
    Check, GraduationCap, ChevronLeft
} from 'lucide-react';
import * as subjectApi from '../../api/subject.api';
import * as gradeApi from '../../api/grade.api';
import * as staffApi from '../../api/staff.api';
import * as classroomApi from '../../api/classroom.api';
import Modal from '../../components/ui/Modal';
import { academicsApi } from '../../api/academics.api';

type ViewMode = 'overview' | 'quick-edit';

export default function Subjects() {
    // Data States
    const [subjects, setSubjects] = useState<subjectApi.Subject[]>([]);
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
            const [gradeData, staffData, classroomData, yearsData] = await Promise.all([
                gradeApi.getGrades(),
                staffApi.getStaffList({ limit: 100 }),
                classroomApi.getClassrooms(),
                academicsApi.getYears()
            ]);
            
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
        if (!selectedGradeId) return;
        setLoading(true);
        try {
            const [subjectRes, assignmentData] = await Promise.all([
                subjectApi.getSubjectList({ 
                    grade_id: selectedGradeId, 
                    search: searchQuery,
                    page: pagination.page,
                    limit: pagination.limit
                }),
                subjectApi.getAssignments()
            ]);
            
            setSubjects(subjectRes.data);
            setAssignments(assignmentData);
            setPagination(prev => ({ ...prev, total: subjectRes.pagination.total }));
        } catch (err) {
            console.error('Failed to fetch subjects/assignments:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedGradeId, searchQuery, pagination.page, pagination.limit]);

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

    // Summary Calculations (Global context)
    const stats = useMemo(() => {
        const total = subjects.length; // Local to grade
        const assignedIds = new Set(assignments.filter(a => subjects.some(s => s.id === a.subject_id)).map(a => a.subject_id));
        const assigned = Array.from(assignedIds).length;
        const missing = total - assigned;
        return { total, assigned, missing };
    }, [subjects, assignments]);

    // Derived Matrix for Quick Edit (Specific to selected grade)
    const matrix = useMemo(() => {
        const rows: any[] = [];
        subjects.forEach(subject => {
            const relevantClassrooms = classrooms.filter(c => c.grade_id === subject.grade_id);
            relevantClassrooms.forEach(classroom => {
                const assignment = assignments.find(a => 
                    a.subject_id === subject.id && a.classroom_id === classroom.id
                );
                rows.push({
                    id: `${subject.id}-${classroom.id}`,
                    subject,
                    classroom,
                    assignment,
                    teacherId: assignment?.staff_id?.toString() || '',
                    isAssigned: !!assignment
                });
            });
        });
        return rows;
    }, [subjects, classrooms, assignments]);

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
        } catch (err: any) {
            alert(err.message);
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
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const selectedGrade = grades.find(g => g.id === selectedGradeId);

    return (
        <div className="flex h-[calc(100vh-120px)] bg-slate-50/50 rounded-[3rem] overflow-hidden border border-slate-200 shadow-2xl">
            {/* Grade Sidebar Rail */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-8 border-b border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Academic Grades</h3>
                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Find grade..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-theme-primary/10 transition-all"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {grades.map((grade) => (
                        <button
                            key={grade.id}
                            onClick={() => {
                                setSelectedGradeId(grade.id);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
                                selectedGradeId === grade.id 
                                ? 'bg-theme-primary text-white shadow-xl shadow-theme-primary/30' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${
                                    selectedGradeId === grade.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'
                                }`}>
                                    {grade.name.match(/\d+/)?.[0] || 'G'}
                                </div>
                                <span className="text-sm font-black tracking-tight">{grade.name}</span>
                            </div>
                            {selectedGradeId === grade.id && <ChevronRight size={16} />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 flex flex-col">
                {/* Dynamic Header */}
                <div className="p-8 pb-0 space-y-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-10 h-10 rounded-2xl bg-theme-primary/10 flex items-center justify-center text-theme-primary">
                                    <GraduationCap size={24} />
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight font-heading">
                                    {selectedGrade?.name || 'Curriculum Matrix'}
                                </h1>
                            </div>
                            <p className="text-slate-500 font-medium">Managing {pagination.total} subjects for this grade level.</p>
                        </div>

                        <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <button
                                onClick={() => setViewMode('overview')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'overview' ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/10' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid size={16} />
                                Overview
                            </button>
                            <button
                                onClick={() => setViewMode('quick-edit')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'quick-edit' ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/10' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <TableIcon size={16} />
                                Quick Edit
                            </button>
                        </div>
                    </div>

                    {/* Stats Rail */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                            label="Total Subjects" 
                            value={stats.total} 
                            icon={Layers} 
                            color="primary" 
                        />
                        <StatCard 
                            label="Assigned" 
                            value={stats.assigned} 
                            icon={CheckCircle} 
                            color="emerald" 
                            percentage={stats.total ? Math.round((stats.assigned / stats.total) * 100) : 0}
                        />
                        <StatCard 
                            label="Missing" 
                            value={stats.missing} 
                            icon={AlertCircle} 
                            color="rose" 
                        />
                    </div>

                    {/* Controls Bar */}
                    <div className="flex gap-4 items-center justify-between">
                        <div className="relative flex-1 max-w-md group">
                            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                                type="text"
                                placeholder="Search by name or code..."
                                className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-theme-primary/10 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setSubjectFormData(prev => ({ ...prev, grade_id: selectedGradeId?.toString() || '' }));
                                    setIsSubjectModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-8 py-3.5 bg-theme-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-theme-primary/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Plus size={16} />
                                Add Subject
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Dynamic View */}
                <div className="p-8 flex-1">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4">
                            <Loader2 size={32} className="text-theme-primary animate-spin" />
                            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Refreshing Matrix...</p>
                        </div>
                    ) : viewMode === 'overview' ? (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {subjects.map((subject) => (
                                    <SubjectCard 
                                        key={subject.id} 
                                        subject={{
                                            ...subject,
                                            assignments: assignments.filter(a => a.subject_id === subject.id),
                                            isAssigned: assignments.some(a => a.subject_id === subject.id)
                                        }} 
                                        onAssign={() => {
                                            setAssignFormData(prev => ({ ...prev, subject_id: subject.id.toString() }));
                                            setIsAssignModalOpen(true);
                                        }}
                                    />
                                ))}
                            </div>
                            
                            {/* Pagination Footer */}
                            {pagination.total > pagination.limit && (
                                <div className="flex justify-center items-center gap-4 pt-8">
                                    <button 
                                        disabled={pagination.page === 1}
                                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                        className="p-3 bg-white border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                        Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                                    </span>
                                    <button 
                                        disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                        className="p-3 bg-white border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/20 mb-20">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Classroom</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subject</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assigned Faculty</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {matrix.map((row) => (
                                        <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800">{row.classroom.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{row.classroom.section} Section</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-theme-primary/10 flex items-center justify-center text-theme-primary font-black text-xs border border-theme-primary/20">
                                                        {row.subject.name[0]}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-800">{row.subject.name}</span>
                                                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{row.subject.code}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <select
                                                    className={`w-full max-w-[280px] px-5 py-3 rounded-2xl text-sm font-bold border focus:outline-none focus:ring-4 focus:ring-theme-primary/10 transition-all ${
                                                        row.isAssigned ? 'bg-white border-slate-200 text-slate-700 shadow-sm' : 'bg-rose-50 border-rose-100 text-rose-600'
                                                    }`}
                                                    value={row.teacherId}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val) {
                                                            handleAssignTeacher(null, {
                                                                staff_id: parseInt(val),
                                                                classroom_id: row.classroom.id,
                                                                subject_id: row.subject.id,
                                                                academic_year_id: parseInt(assignFormData.academic_year_id)
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <option value="">Choose Teacher...</option>
                                                    {staff.map(s => (
                                                        <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {row.isAssigned ? (
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                                                        <Check size={14} strokeWidth={3} />
                                                        Synced
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 text-[10px] font-black uppercase tracking-widest">
                                                        <Clock size={14} strokeWidth={3} />
                                                        Pending
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals remain same as previous version but with grade-awareness */}
            <Modal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title="New Subject Definition">
                <form onSubmit={handleAddSubject} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Name</label>
                            <input
                                required
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-theme-primary/10 transition-all font-bold text-slate-700"
                                value={subjectFormData.name}
                                onChange={e => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                                placeholder="e.g. Mathematics"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Code</label>
                            <input
                                required
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-theme-primary/10 transition-all font-mono font-bold text-slate-700 uppercase"
                                value={subjectFormData.code}
                                onChange={e => setSubjectFormData({ ...subjectFormData, code: e.target.value })}
                                placeholder="MATH-10"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Grade</label>
                        <select
                            required
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-theme-primary/10 transition-all font-bold text-slate-700"
                            value={subjectFormData.grade_id}
                            onChange={e => setSubjectFormData({ ...subjectFormData, grade_id: e.target.value })}
                        >
                            <option value="">Select Grade</option>
                            {grades.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={isSaving} 
                            className="flex-[2] py-4 bg-theme-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-theme-primary/20 hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Create Subject'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Teacher Assignment">
                <form onSubmit={handleAssignTeacher} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pick Subject</label>
                        <select
                            required
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700"
                            value={assignFormData.subject_id}
                            onChange={e => setAssignFormData({ ...assignFormData, subject_id: e.target.value })}
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Educator</label>
                        <select
                            required
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700"
                            value={assignFormData.staff_id}
                            onChange={e => setAssignFormData({ ...assignFormData, staff_id: e.target.value })}
                        >
                            <option value="">Select Teacher</option>
                            {staff.map(s => (
                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.designation})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Classroom</label>
                        <select
                            required
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700"
                            value={assignFormData.classroom_id}
                            onChange={e => setAssignFormData({ ...assignFormData, classroom_id: e.target.value })}
                        >
                            <option value="">Select Classroom</option>
                            {classrooms.filter(c => c.grade_id === selectedGradeId).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={isSaving} 
                            className="flex-[2] py-4 bg-theme-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-theme-primary/30 hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Confirm Assignment'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, percentage }: any) {
    const colors: any = {
        primary: 'bg-theme-primary/5 text-theme-primary border-theme-primary/10',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
    };

    return (
        <div className={`p-6 rounded-[2rem] border ${colors[color]} shadow-sm transition-all hover:shadow-md duration-300`}>
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-white/20">
                    <Icon size={24} />
                </div>
                {percentage !== undefined && (
                    <div className="text-right">
                        <span className="text-2xl font-black block leading-none">{percentage}%</span>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Coverage</span>
                    </div>
                )}
            </div>
            <div>
                <h4 className="text-3xl font-black mb-1">{value}</h4>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
            </div>
        </div>
    );
}

function SubjectCard({ subject, onAssign }: any) {
    return (
        <div className="group bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col">
                        <span className="px-2 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100 w-fit mb-2">
                            {subject.code}
                        </span>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-theme-primary transition-colors">{subject.name}</h3>
                    </div>
                    <button className="p-2 text-slate-300 hover:text-slate-600 rounded-xl transition-all">
                        <MoreVertical size={20} />
                    </button>
                </div>

                <div className="space-y-4 mb-8">
                    {subject.assignments.length > 0 ? (
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Users size={12} />
                                Assigned in {subject.assignments.length} Classes
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {subject.assignments.slice(0, 3).map((a: any) => (
                                    <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 bg-theme-primary/10 text-theme-primary rounded-xl border border-theme-primary/20">
                                        <span className="text-[10px] font-bold">{a.teacher_name}</span>
                                        <span className="text-[10px] opacity-40">•</span>
                                        <span className="text-[10px] opacity-60 font-black">{a.classroom_name}</span>
                                    </div>
                                ))}
                                {subject.assignments.length > 3 && (
                                    <div className="px-3 py-1.5 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase">
                                        +{subject.assignments.length - 3} More
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 px-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
                            <AlertCircle size={16} className="text-rose-500" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Needs Faculty</span>
                                <span className="text-[9px] text-rose-400 font-bold">No assignments yet</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                        {subject.isAssigned ? <Check size={12} /> : <Clock size={12} />}
                        {subject.isAssigned ? 'Active' : 'Awaiting'}
                    </div>
                    <button 
                        onClick={onAssign}
                        className="flex items-center gap-1 text-xs font-black text-slate-400 hover:text-theme-primary uppercase tracking-widest transition-all"
                    >
                        {subject.isAssigned ? "Manage" : "Assign"}
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
