import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Plus, School, Edit2, Trash2,
    Search, Loader2, Building2,
    Users, AlertCircle, X, Check, GraduationCap, ChevronRight, ChevronLeft
} from 'lucide-react';
import { getGrades } from '../../api/grade.api';
import type { Grade } from '../../api/grade.api';
import { getClassrooms, createClassroom, updateClassroom } from '../../api/classroom.api';
import { getStaffList } from '../../api/staff.api';
import type { Staff } from '../../api/staff.api';
import { useAcademics } from '../../contexts/AcademicsContext';
import type { Classroom } from '../../api/classroom.api';
import Modal from '../../components/ui/Modal';
import { ComboBox } from '../../components/ui/ComboBox';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

export default function Classrooms() {
    const { notify } = useNotification();
    const { isYearClosed } = useAcademics();
    const { can } = useAuth();
    
    // Data States
    const [grades, setGrades] = useState<Grade[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12 });
    
    // UI States
    const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        grade_id: 0,
        name: '',
        section: '',
        capacity: 40,
        class_teacher_id: null as number | null
    });
    const [staff, setStaff] = useState<Staff[]>([]);

    const fetchInitialData = useCallback(async () => {
        try {
            const response = await getGrades();
            const gradesData = response.data;
            setGrades(gradesData);
            if (gradesData.length > 0 && !selectedGradeId) {
                setSelectedGradeId(gradesData[0].id);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load grades");
        }
    }, [selectedGradeId]);

    const fetchClassrooms = useCallback(async () => {
        if (!selectedGradeId) return;
        setLoading(true);
        try {
            const response = await getClassrooms({
                grade_id: selectedGradeId,
                search: searchQuery,
                page: pagination.page,
                limit: pagination.limit
            });
            setClassrooms(response.data);
            setPagination(prev => ({ ...prev, total: response.pagination.total }));
        } catch (err) {
            console.error(err);
            setError("Failed to load classrooms");
        } finally {
            setLoading(false);
        }
    }, [selectedGradeId, searchQuery, pagination.page, pagination.limit]);

    useEffect(() => {
        fetchInitialData();
        getStaffList({ status: 'active' }).then(res => setStaff(res.data));
    }, [fetchInitialData]);

    useEffect(() => {
        fetchClassrooms();
    }, [fetchClassrooms]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.grade_id) {
            setError("Please select a grade");
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            if (editingId) {
                await updateClassroom(editingId, formData);
                notify('success', 'Classroom Updated', `Configurations for ${formData.name} have been synchronized.`);
            } else {
                await createClassroom(formData);
                notify('success', 'Classroom Established', `${formData.name} is now ready for enrollment.`);
            }
            setIsModalOpen(false);
            setFormData({ grade_id: 0, name: '', section: '', capacity: 40, class_teacher_id: null });
            setEditingId(null);
            fetchClassrooms();
        } catch (err: any) {
            notify('error', 'Operation Failed', err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (classroom: Classroom) => {
        setEditingId(classroom.id);
        setFormData({
            grade_id: classroom.grade_id,
            name: classroom.name,
            section: classroom.section,
            capacity: classroom.capacity || 40,
            class_teacher_id: classroom.class_teacher_id || null
        });
        setIsModalOpen(true);
    };

    const selectedGrade = grades.find(g => g.id === selectedGradeId);

    // Stats for the selected grade
    const stats = useMemo(() => {
        const total = pagination.total;
        const avgCapacity = classrooms.length > 0 
            ? Math.round(classrooms.reduce((acc, c) => acc + (c.capacity || 0), 0) / classrooms.length)
            : 0;
        return { total, avgCapacity };
    }, [pagination.total, classrooms]);

    return (
        <div className="flex h-[calc(100vh-140px)] bg-slate-50/50 rounded-[2.5rem] overflow-hidden border border-[var(--card-border)] shadow-2xl animate-in fade-in duration-500 relative">
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
                <div className="p-8 pb-6 space-y-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-6 mb-2">
                                <div className="bg-surface-dark p-4 rounded-3xl shadow-xl shadow-theme/10">
                                    <Building2 className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">
                                        {selectedGrade?.name || 'Academic Facilities'}
                                    </h1>
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        Classroom Inventory &amp; Capacity Management
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Stats Rail */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-3xl bg-slate-50/50 border border-[var(--card-border)] transition-all hover:bg-[var(--card-bg)] hover:shadow-lg hover:shadow-slate-200/40 group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <School size={22} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-[var(--text-main)]">{stats.total}</h4>
                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Active Units</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 rounded-3xl bg-slate-50/50 border border-[var(--card-border)] transition-all hover:bg-[var(--card-bg)] hover:shadow-lg hover:shadow-slate-200/40 group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Users size={22} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-[var(--text-main)]">{stats.avgCapacity}</h4>
                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Target Density</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 rounded-3xl bg-slate-50/50 border border-[var(--card-border)] transition-all hover:bg-[var(--card-bg)] hover:shadow-lg hover:shadow-slate-200/40 group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/5 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <GraduationCap size={22} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-[var(--text-main)]">Standard</h4>
                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Compliance</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--card-bg)] p-3 rounded-3xl border border-[var(--card-border)]/60 shadow-sm">
                        <div className="relative flex-1 w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Filter classroom inventory by name..."
                                className="input-field-modern !pl-12 !py-3.5 !text-xs !bg-slate-50/50 !border-transparent focus:!bg-[var(--card-bg)] focus:!border-[var(--card-border)] w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button className="p-3.5 btn-dark !shadow-theme/10">
                                <School size={20} />
                            </button>
                            {can('class:write') && (
                                <button
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, grade_id: selectedGradeId || 0 }));
                                        setIsModalOpen(true);
                                    }}
                                    disabled={isYearClosed()}
                                    className="btn-primary flex items-center gap-2 !px-8 !py-3.5 !text-xs"
                                >
                                    <Plus size={18} />
                                    Add Classroom
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mx-8 mt-4 bg-error/10 border border-error/20 p-4 rounded-2xl flex items-center gap-3 text-error text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                        <AlertCircle size={18} />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-error/10 rounded-lg transition-colors"><X size={16} /></button>
                    </div>
                )}

                {/* Grid Content */}
                <div className="p-8 pt-2 flex-1">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4">
                            <Loader2 size={32} className="text-primary animate-spin" />
                            <p className="text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-widest">Syncing Facilities...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {classrooms.map((classroom) => (
                                    <div key={classroom.id} className="premium-card p-6 flex flex-col group relative">
                                        <div className="space-y-6">
                                            <div className="flex items-start justify-between">
                                                <div className={`w-12 h-12 rounded-xl ${!classroom.teacher_first_name ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'} flex items-center justify-center transition-all group-hover:scale-110`}>
                                                    <School size={24} />
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                                    {can('class:write') && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleEdit(classroom)}
                                                                className="p-2 text-[var(--text-muted)] hover:text-primary transition-colors"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button className="p-2 text-[var(--text-muted)] hover:text-error transition-colors"><Trash2 size={16} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight group-hover:text-primary transition-colors">{classroom.name}</h3>
                                                <p className="text-[var(--text-muted)] text-[9px] font-black uppercase tracking-widest mt-1">Division {classroom.section}</p>
                                            </div>

                                            {classroom.teacher_first_name ? (
                                                <div className="p-4 bg-[var(--background)] rounded-2xl border border-[var(--card-border)]">
                                                    <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Assigned Faculty</p>
                                                    <p className="text-xs font-bold text-[var(--text-main)]">{classroom.teacher_first_name} {classroom.teacher_last_name}</p>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => can('class:write') && handleEdit(classroom)}
                                                    className={`w-full p-4 bg-warning/10 rounded-2xl border border-warning/20 text-left transition-all group/btn ${can('class:write') ? 'hover:bg-warning/20 cursor-pointer' : 'cursor-default'}`}
                                                >
                                                    <p className="text-[8px] font-black text-warning uppercase tracking-widest mb-1 flex items-center gap-1">
                                                        <AlertCircle size={10} /> {can('class:write') ? 'Action Needed' : 'Unassigned'}
                                                    </p>
                                                    <p className={`text-xs font-bold text-warning ${can('class:write') ? 'group-hover/btn:underline' : ''}`}>
                                                        {can('class:write') ? 'Assign Class Teacher' : 'Pending Assignment'}
                                                    </p>
                                                </button>
                                            )}

                                            <div className="pt-6 border-t border-[var(--card-border)] flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                                    <Users size={14} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Max {classroom.capacity || 40} Units</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-success/10 text-success rounded-lg text-[8px] font-black uppercase tracking-widest border border-success/20">
                                                    <Check size={10} strokeWidth={3} />
                                                    Operational
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {classrooms.length === 0 && (
                                <div className="py-24 premium-card border-dashed border-2 flex flex-col items-center justify-center text-center px-10">
                                    <div className="w-20 h-20 bg-[var(--background)] rounded-[2rem] flex items-center justify-center text-[var(--text-muted)] mb-6 border border-[var(--card-border)]">
                                        <Building2 size={40} />
                                    </div>
                                    <h3 className="text-lg font-bold text-[var(--text-main)]">No Inventory Records</h3>
                                    <p className="text-[var(--text-muted)] font-medium mt-2 max-w-xs text-sm">Deploy your first classroom unit for this grade level.</p>
                                    {can('class:write') && (
                                        <button
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, grade_id: selectedGradeId || 0 }));
                                                setIsModalOpen(true);
                                            }}
                                            className="btn-primary mt-8"
                                        >
                                            <Plus size={18} /> Initialize Unit
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Pagination Footer */}
                            {pagination.total > pagination.limit && (
                                <div className="flex justify-center items-center gap-4 pt-8">
                                    <button 
                                        disabled={pagination.page === 1}
                                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                        className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                        {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}
                                    </span>
                                    <button 
                                        disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                        className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Modify Configuration" : "Establish New Unit"}
                size="md"
            >
                <form onSubmit={handleSave} className="p-8 space-y-6 pb-20">
                    <div className="space-y-5">
                        <ComboBox
                            label="Operational Grade"
                            value={formData.grade_id}
                            onChange={val => setFormData({ ...formData, grade_id: val as number })}
                            placeholder="Select Grade Level"
                            options={grades.map(g => ({ value: g.id, label: g.name }))}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 block px-1">Unit Name</label>
                                <input
                                    required
                                    placeholder="e.g. 10A"
                                    className="input-field-modern !py-3"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 block px-1">Section</label>
                                <input
                                    required
                                    placeholder="e.g. A"
                                    className="input-field-modern !py-3 uppercase"
                                    value={formData.section}
                                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 block px-1">Max Capacity</label>
                            <input
                                type="number"
                                placeholder="40"
                                className="input-field-modern !py-3"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                            />
                        </div>

                        <div>
                            <ComboBox
                                label="Responsible Faculty"
                                value={formData.class_teacher_id}
                                onChange={val => setFormData({ ...formData, class_teacher_id: val as number })}
                                placeholder="Assign Class Teacher"
                                options={staff.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }))}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="btn-ghost flex-1 !py-3.5"
                        >
                            Dismiss
                        </button>
                        <button
                            disabled={isSaving}
                            className="btn-primary flex-[2] !py-3.5"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Finalize Config"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
