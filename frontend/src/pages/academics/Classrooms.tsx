import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Plus, School, Edit2, Trash2,
    Search, Loader2, Building2,
    Users, AlertCircle, X, Check, GraduationCap, ChevronRight, ChevronLeft
} from 'lucide-react';
import { getGrades } from '../../api/grade.api';
import type { Grade } from '../../api/grade.api';
import { getClassrooms, createClassroom } from '../../api/classroom.api';
import { useAcademics } from '../../contexts/AcademicsContext';
import type { Classroom } from '../../api/classroom.api';
import Modal from '../../components/ui/Modal';

export default function Classrooms() {
    const { isYearClosed } = useAcademics();
    
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

    const [formData, setFormData] = useState({
        grade_id: 0,
        name: '',
        section: '',
        capacity: 40
    });

    const fetchInitialData = useCallback(async () => {
        try {
            const gradesData = await getGrades();
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
            await createClassroom(formData);
            setIsModalOpen(false);
            setFormData({ grade_id: 0, name: '', section: '', capacity: 40 });
            fetchClassrooms();
        } catch (err: any) {
            setError(err.message || "Failed to save classroom");
        } finally {
            setIsSaving(false);
        }
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
        <div className="flex h-[calc(100vh-120px)] bg-slate-50/50 rounded-[3rem] overflow-hidden border border-slate-200 shadow-2xl animate-fade-in">
            {/* Grade Sidebar Rail */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-8 border-b border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Grades & Levels</h3>
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
                                    <Building2 size={24} />
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight font-heading">
                                    {selectedGrade?.name || 'Classroom Directory'}
                                </h1>
                            </div>
                            <p className="text-slate-400 font-medium tracking-tight">Managing learning spaces for this level.</p>
                        </div>

                        <button
                            onClick={() => {
                                setFormData(prev => ({ ...prev, grade_id: selectedGradeId || 0 }));
                                setIsModalOpen(true);
                            }}
                            disabled={isYearClosed()}
                            className="bg-theme-primary text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-theme-primary/20 flex items-center gap-3 active:scale-95 disabled:opacity-30"
                        >
                            <Plus size={18} />
                            New Classroom
                        </button>
                    </div>

                    {/* Stats Rail */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-theme-primary/5 text-theme-primary flex items-center justify-center">
                                    <School size={24} />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 leading-none mb-1">{stats.total}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Classrooms</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 leading-none mb-1">{stats.avgCapacity}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Capacity</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                    <GraduationCap size={24} />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 leading-none mb-1">Active</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Status</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search bar */}
                    <div className="relative max-w-md group">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-theme-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name or section..."
                            className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-theme-primary/10 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mx-8 mt-6 bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-black uppercase tracking-widest shadow-sm animate-in slide-in-from-top-2">
                        <AlertCircle size={18} />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-rose-100 rounded-lg transition-colors"><X size={16} /></button>
                    </div>
                )}

                {/* Grid Content */}
                <div className="p-8 flex-1">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4">
                            <Loader2 size={32} className="text-theme-primary animate-spin" />
                            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Mapping Facilities...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {classrooms.map((classroom) => (
                                    <div key={classroom.id} className="group bg-white rounded-[2rem] border border-slate-200 p-8 hover:shadow-2xl hover:shadow-theme-primary/10 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                                            <School size={80} />
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-start justify-between">
                                                <div className="w-14 h-14 rounded-2xl bg-theme-primary/10 text-theme-primary flex items-center justify-center shadow-sm">
                                                    <School size={28} />
                                                </div>
                                                <div className="flex gap-1">
                                                    <button className="p-2 text-slate-300 hover:text-theme-primary transition-colors"><Edit2 size={16} /></button>
                                                    <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{classroom.name}</h3>
                                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Section {classroom.section}</p>
                                            </div>

                                            {classroom.teacher_first_name && (
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Class Teacher</p>
                                                    <p className="text-xs font-bold text-slate-700">{classroom.teacher_first_name} {classroom.teacher_last_name}</p>
                                                </div>
                                            )}

                                            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Users size={14} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Cap: {classroom.capacity || 40}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                                    <Check size={10} strokeWidth={3} />
                                                    Ready
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {classrooms.length === 0 && (
                                <div className="py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center px-10 shadow-sm">
                                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-300 mb-6 border border-slate-100">
                                        <Building2 size={48} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">No Classrooms Found</h3>
                                    <p className="text-slate-400 font-medium mt-2 max-w-xs text-sm uppercase tracking-tight">Ready to expand? Setup your first classroom for this grade.</p>
                                    <button
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, grade_id: selectedGradeId || 0 }));
                                            setIsModalOpen(true);
                                        }}
                                        className="mt-8 bg-theme-primary text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-theme-primary/20 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Create First Classroom
                                    </button>
                                </div>
                            )}

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
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Establish New Classroom"
                size="md"
            >
                <form onSubmit={handleSave} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Grade Level</label>
                            <select
                                required
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-theme-primary transition-all"
                                value={formData.grade_id}
                                onChange={(e) => setFormData({ ...formData, grade_id: Number(e.target.value) })}
                            >
                                <option value="">Select Grade Level</option>
                                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Space Name</label>
                                <input
                                    required
                                    placeholder="e.g. 10A"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-theme-primary transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Section</label>
                                <input
                                    required
                                    placeholder="e.g. A"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-theme-primary transition-all uppercase"
                                    value={formData.section}
                                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Student Capacity</label>
                            <input
                                type="number"
                                placeholder="40"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-theme-primary transition-all"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-8 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={isSaving}
                            className="flex-[2] px-8 py-4 bg-theme-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 shadow-xl shadow-theme-primary/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Verify & Create"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
