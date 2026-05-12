import { useState, useEffect } from 'react';
import {
    Plus, Layers, ChevronRight, Edit2, Trash2,
    Loader2, LayoutGrid, Map, Award,
    Users, Building2, BookOpen, GraduationCap,
    Search, Filter, Sparkles, ArrowUpRight
} from 'lucide-react';
import * as gradeApi from '../../api/grade.api';
import Modal from '../../components/ui/Modal';

export default function Grades() {
    const [grades, setGrades] = useState<gradeApi.Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'roadmap' | 'grid'>('grid');
    const [editingGrade, setEditingGrade] = useState<gradeApi.Grade | null>(null);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, pages: 1 });

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        sequence_order: 0
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchGrades();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, pagination.page]);

    const sortedGrades = [...grades].sort((a, b) => a.sequence_order - b.sequence_order);

    const fetchGrades = async () => {
        setLoading(true);
        try {
            const res = await gradeApi.getGrades({
                search,
                page: pagination.page,
                limit: pagination.limit
            });
            setGrades(res.data);
            setPagination(res.pagination);
        } catch (error) {
            console.error('Failed to fetch grades', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingGrade) {
                await gradeApi.updateGrade(editingGrade.id, formData);
            } else {
                await gradeApi.createGrade(formData);
            }
            setIsModalOpen(false);
            setEditingGrade(null);
            setFormData({ name: '', slug: '', sequence_order: 0 });
            fetchGrades();
        } catch (error) {
            console.error('Failed to save grade', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (grade: gradeApi.Grade) => {
        setEditingGrade(grade);
        setFormData({
            name: grade.name,
            slug: grade.slug,
            sequence_order: grade.sequence_order
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this grade? This may affect linked subjects and students.')) return;
        try {
            await gradeApi.deleteGrade(id);
            fetchGrades();
        } catch (error) {
            console.error('Failed to delete grade', error);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="bg-surface-dark p-4 rounded-3xl shadow-xl shadow-theme/10">
                        <Layers className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">Academic Hierarchy</h1>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-success" />
                            Grade & Stage Configuration
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => { setEditingGrade(null); setFormData({ name: '', slug: '', sequence_order: 0 }); setIsModalOpen(true); }}
                        className="btn-primary flex items-center gap-2 !px-6 !py-3"
                    >
                        <Plus size={18} />
                        Define New Level
                    </button>
                </div>
            </div>

            {/* Navigation & Controls */}
            <div className="flex flex-col xl:flex-row justify-between items-center gap-6 bg-[var(--card-bg)] p-3 rounded-[2.5rem] shadow-sm border border-[var(--card-border)]/60">
                <div className="flex items-center gap-1 p-1 bg-[var(--background)] rounded-2xl w-full xl:w-max">
                    <button
                        onClick={() => setViewMode('roadmap')}
                        className={`px-8 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            viewMode === 'roadmap' 
                            ? 'bg-[var(--card-bg)] text-surface-dark shadow-sm border border-[var(--card-border)]' 
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                    >
                        <Map size={14} /> Roadmap
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-8 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            viewMode === 'grid' 
                            ? 'bg-[var(--card-bg)] text-surface-dark shadow-sm border border-[var(--card-border)]' 
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                    >
                        <LayoutGrid size={14} /> Grid View
                    </button>
                </div>

                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <div className="relative flex-1 xl:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-50" size={18} />
                        <input
                            type="text"
                            placeholder="Search by grade name or slug..."
                            className="input-field-modern !pl-12 !py-3.5 !text-xs !bg-[var(--background)] !border-transparent focus:!bg-[var(--card-bg)] focus:!border-[var(--card-border)]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="p-3.5 btn-dark !shadow-theme/10">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="h-[40vh] flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                        <Loader2 size={48} className="text-primary animate-spin relative z-10" />
                    </div>
                    <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">Building Academic Tree...</p>
                </div>
            ) : grades.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-center px-8">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-[var(--background)] flex items-center justify-center text-slate-200 mb-8 border border-[var(--card-border)]">
                        <Map size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">No Grades Defined</h3>
                    <p className="text-[var(--text-muted)] text-sm font-medium mt-2 max-w-sm">Establish your institution's academic structure by creating your first grade level.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary mt-10 !px-10"
                    >
                        <Plus size={18} />
                        Initialize Hierarchy
                    </button>
                </div>
            ) : viewMode === 'roadmap' ? (
                /* Roadmap View */
                <div className="relative pl-0 md:pl-24">
                    <div className="absolute left-[3.4rem] top-12 bottom-12 w-1.5 bg-slate-100 rounded-full hidden md:block" />
                    <div className="space-y-6">
                        {sortedGrades.map((grade, idx) => (
                            <div key={grade.id} className="relative group">
                                <div className="absolute left-[-4.2rem] top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center z-10">
                                    <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-xl border-4 border-white
                                        ${idx === 0 ? 'bg-surface-dark text-white' : 'bg-[var(--card-bg)] text-[var(--text-muted)] border-[var(--card-border)] group-hover:border-[var(--card-border)] group-hover:text-primary'}`}>
                                        {idx === 0 ? <Award size={24} /> : <span className="text-sm font-black">{grade.sequence_order}</span>}
                                    </div>
                                </div>
                                
                                <div className="premium-card p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-8 group/card overflow-hidden">
                                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-[var(--text-main)] group-hover/card:opacity-[0.05] transition-opacity pointer-events-none -mr-8 -mt-8">
                                        <GraduationCap size={160} />
                                    </div>
                                    
                                    <div className="flex items-center gap-8 relative z-10">
                                        <div>
                                            <div className="flex items-center gap-4 mb-2">
                                                <h3 className="text-2xl font-bold text-[var(--text-main)] tracking-tight group-hover/card:text-primary transition-colors">{grade.name}</h3>
                                                <span className="px-3 py-1 bg-slate-100 text-[var(--text-muted)] rounded-lg text-[9px] font-black uppercase tracking-widest border border-[var(--card-border)]/50">{grade.slug}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--background)] rounded-xl text-[10px] font-bold text-[var(--text-muted)] border border-[var(--card-border)]">
                                                    <Users size={14} className="text-[var(--text-muted)]" />
                                                    {grade.student_count || 0} Students Enrolled
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6 relative z-10">
                                        <div className="flex items-center gap-8 px-8 py-4 bg-[var(--background)] rounded-2xl border border-[var(--card-border)]/50 backdrop-blur-sm">
                                            <div className="flex flex-col items-center gap-1.5 group/stat">
                                                <div className="p-2 bg-[var(--card-bg)] rounded-xl shadow-sm text-amber-500 group-hover/stat:scale-110 transition-transform"><Building2 size={16} /></div>
                                                <span className="text-xs font-black text-[var(--text-main)]">{grade.classroom_count || 0} Units</span>
                                            </div>
                                            <div className="w-px h-10 bg-slate-200/60" />
                                            <div className="flex flex-col items-center gap-1.5 group/stat">
                                                <div className="p-2 bg-[var(--card-bg)] rounded-xl shadow-sm text-indigo-500 group-hover/stat:scale-110 transition-transform"><BookOpen size={16} /></div>
                                                <span className="text-xs font-black text-[var(--text-main)]">{grade.subject_count || 0} Courses</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleEdit(grade)} className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-primary hover:border-primary rounded-xl transition-all shadow-sm active:scale-95">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(grade.id)} className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-500 rounded-xl transition-all shadow-sm active:scale-95">
                                                <Trash2 size={18} />
                                            </button>
                                            <button className="flex items-center gap-3 px-6 py-3 btn-dark !text-[10px] !shadow-theme/10 active:scale-95">
                                                Config
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedGrades.map((grade) => (
                        <div key={grade.id} className="premium-card p-6 flex flex-col group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-[var(--text-main)] group-hover:opacity-[0.05] transition-opacity pointer-events-none -mr-8 -mt-8">
                                <GraduationCap size={120} />
                            </div>

                            <div className="flex items-start justify-between mb-8 relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-[var(--background)] flex items-center justify-center text-xl font-black text-[var(--text-muted)] group-hover:bg-surface-dark group-hover:text-white transition-all duration-500 shadow-sm border border-[var(--card-border)]">
                                    {grade.sequence_order}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(grade)} className="p-2.5 text-[var(--text-muted)] opacity-50 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(grade.id)} className="p-2.5 text-[var(--text-muted)] opacity-50 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight mb-1 group-hover:text-primary transition-colors">{grade.name}</h3>
                                <p className="text-[var(--text-muted)] font-bold text-[10px] mb-8 uppercase tracking-widest">{grade.slug}</p>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 bg-[var(--background)] rounded-2xl border border-[var(--card-border)]/50 flex flex-col gap-1.5 group/stat hover:bg-[var(--card-bg)] transition-colors">
                                        <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                            <Users size={14} />
                                            <span className="text-[9px] font-bold uppercase tracking-widest">Enrolled</span>
                                        </div>
                                        <span className="text-lg font-bold text-[var(--text-main)]">{grade.student_count || 0}</span>
                                    </div>
                                    <div className="p-4 bg-[var(--background)] rounded-2xl border border-[var(--card-border)]/50 flex flex-col gap-1.5 group/stat hover:bg-[var(--card-bg)] transition-colors">
                                        <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                            <Building2 size={14} />
                                            <span className="text-[9px] font-bold uppercase tracking-widest">Units</span>
                                        </div>
                                        <span className="text-lg font-bold text-[var(--text-main)]">{grade.classroom_count || 0}</span>
                                    </div>
                                </div>

                                <button className="w-full py-4 bg-[var(--background)] text-[var(--text-muted)] rounded-2xl font-bold text-[10px] uppercase tracking-widest group-hover:bg-surface-dark group-hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2">
                                    Advanced Configuration
                                    <ArrowUpRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[var(--card-bg)] p-4 rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-4">
                        Analysis of <span className="text-[var(--text-main)]">{pagination.total}</span> Total Registry Units
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] hover:bg-[var(--background)] disabled:opacity-30 transition-all shadow-sm"
                        >
                            <ChevronRight size={20} className="rotate-180" />
                        </button>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                                    className={`w-12 h-12 rounded-xl text-xs font-bold transition-all ${pagination.page === p ? 'bg-surface-dark text-white shadow-xl shadow-theme/20 scale-110' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:border-slate-300'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={pagination.page === pagination.pages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] hover:bg-[var(--background)] disabled:opacity-30 transition-all shadow-sm"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingGrade(null); }}
                title={editingGrade ? "Edit Academic Level" : "Define New Level"}
            >
                <form onSubmit={handleSave} className="p-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Institutional Identifier *</label>
                            <input
                                required
                                className="input-field-modern"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Senior Secondary 2"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Registry Slug *</label>
                            <input
                                required
                                className="input-field-modern font-mono"
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                placeholder="senior-sec-2"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Hierarchical Sequence *</label>
                        <input
                            type="number"
                            required
                            className="input-field-modern"
                            value={formData.sequence_order}
                            onChange={e => setFormData({ ...formData, sequence_order: parseInt(e.target.value) })}
                        />
                        <div className="flex items-center gap-2 px-1 mt-3">
                            <Sparkles size={12} className="text-amber-500" />
                            <p className="text-[10px] text-[var(--text-muted)] font-medium italic">Priority weight determines the position in automated schedules and reports.</p>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="btn-ghost flex-1 !py-4"
                        >
                            Abort
                        </button>
                        <button
                            disabled={isSaving}
                            className="btn-primary flex-[2] !py-4"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : editingGrade ? "Commit Update" : "Finalize Level"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
