import { useState, useEffect } from 'react';
import { 
    Plus, Layers, ChevronRight, Edit2, Trash2, 
    Loader2, LayoutGrid, Map, Award, TrendingUp,
    Settings2, Users, Building2, BookOpen, GraduationCap
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
    
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        sequence_order: 0
    });

    useEffect(() => {
        fetchGrades();
    }, []);

    const sortedGrades = [...grades].sort((a, b) => a.sequence_order - b.sequence_order);

    const fetchGrades = async () => {
        try {
            const data = await gradeApi.getGrades();
            setGrades(data);
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
        <div className="min-h-screen bg-[#fcfcfd] p-6 lg:p-10 space-y-10 animate-in fade-in duration-700">
            {/* ── Minimalist Premium Header ── */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-theme-primary rounded-2xl shadow-xl shadow-primary/20">
                            <Layers className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">Grade Hierarchy</h1>
                            <p className="text-slate-400 font-medium mt-1">Structure your school's academic progression path.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 pt-2">
                        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/50">
                            <button 
                                onClick={() => setViewMode('roadmap')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'roadmap' ? 'bg-white text-theme-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Map size={14} /> Roadmap
                            </button>
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-white text-theme-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid size={14} /> Grid View
                            </button>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => { setEditingGrade(null); setFormData({ name: '', slug: '', sequence_order: 0 }); setIsModalOpen(true); }}
                    className="flex items-center gap-3 px-8 py-4 bg-theme-primary text-white rounded-[1.25rem] font-black text-xs uppercase tracking-[0.1em] hover:opacity-90 transition-all active:scale-95 shadow-2xl shadow-primary/20 group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    Define New Level
                </button>
            </div>

            {/* ── Main Workspace ── */}
            {loading ? (
                <div className="h-[50vh] flex flex-col items-center justify-center gap-4 bg-white rounded-[3rem] border border-slate-100">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-theme-primary rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Building Roadmap...</p>
                </div>
            ) : grades.length === 0 ? (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center bg-white rounded-[3rem] border border-slate-100 border-dashed border-2">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-300 mb-8">
                        <Map size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">The Roadmap is Empty</h3>
                    <p className="text-slate-400 max-w-sm mb-10 font-medium">Create your first academic grade to start visualizing the student journey.</p>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-10 py-5 bg-theme-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
                    >
                        Initialize First Grade
                    </button>
                </div>
            ) : viewMode === 'roadmap' ? (
                /* ── High-Density Roadmap View ── */
                <div className="relative">
                    <div className="absolute left-[2.25rem] top-8 bottom-8 w-1 bg-slate-100 rounded-full hidden md:block" />
                    <div className="space-y-4">
                        {sortedGrades.map((grade, idx) => (
                            <div key={grade.id} className="relative group pl-0 md:pl-20">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 hidden md:flex flex-col items-center z-10">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${idx === 0 ? 'bg-emerald-500 text-white rotate-12 group-hover:rotate-0' : 'bg-white text-slate-300 border border-slate-100 group-hover:border-theme-primary group-hover:text-theme-primary'}`}>
                                        {idx === 0 ? <Award size={20} /> : <div className="text-sm font-black">{grade.sequence_order}</div>}
                                    </div>
                                </div>
                                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-theme-primary/20 transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-900 group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                                        <GraduationCap size={120} />
                                    </div>
                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="flex-1 min-w-[200px]">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <h3 className="text-xl font-black text-slate-800 tracking-tight">{grade.name}</h3>
                                                <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-tighter border border-slate-100">{grade.slug}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                    <TrendingUp size={10} /> Level {grade.sequence_order}
                                                </div>
                                                <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                    <Users size={10} /> {grade.student_count || 0} Students
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 relative z-10">
                                        <div className="flex items-center gap-4 px-6 py-2 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="p-1.5 bg-white rounded-lg shadow-sm text-amber-500"><Building2 size={12} /></div>
                                                <span className="text-[10px] font-black text-slate-800">{grade.classroom_count || 4}</span>
                                            </div>
                                            <div className="w-px h-8 bg-slate-200/50" />
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="p-1.5 bg-white rounded-lg shadow-sm text-blue-500"><BookOpen size={12} /></div>
                                                <span className="text-[10px] font-black text-slate-800">{grade.subject_count || 6}</span>
                                            </div>
                                            <div className="w-px h-8 bg-slate-200/50" />
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="p-1.5 bg-white rounded-lg shadow-sm text-emerald-500"><Award size={12} /></div>
                                                <span className="text-[10px] font-black text-slate-800">96%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleEdit(grade)} className="p-3 bg-white border border-slate-100 text-slate-400 hover:bg-theme-primary hover:text-white rounded-xl transition-all shadow-sm active:scale-95">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(grade.id)} className="p-3 bg-white border border-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all shadow-sm active:scale-95">
                                                <Trash2 size={16} />
                                            </button>
                                            <button className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                                                Setup
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* ── Visual Grid View ── */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {sortedGrades.map((grade) => (
                        <div key={grade.id} className="group bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-2xl hover:border-theme-primary/20 transition-all duration-500 flex flex-col">
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-lg font-black text-slate-400 group-hover:bg-theme-primary group-hover:text-white transition-all duration-500">
                                    {grade.sequence_order}
                                </div>
                                <div className="flex gap-1.5">
                                    <button onClick={() => handleEdit(grade)} className="p-2 bg-slate-50 text-slate-400 hover:bg-theme-primary hover:text-white rounded-lg transition-all active:scale-95">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(grade.id)} className="p-2 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-all active:scale-95">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-black text-slate-800 mb-0.5">{grade.name}</h3>
                            <p className="text-slate-400 font-bold text-[9px] mb-6 uppercase tracking-widest">{grade.slug}</p>
                            
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50 flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Users size={12} />
                                        <span className="text-[8px] font-black uppercase tracking-tight">Enrolled</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-800">{grade.student_count || 0}</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50 flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Building2 size={12} />
                                        <span className="text-[8px] font-black uppercase tracking-tight">Divisions</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-800">{grade.classroom_count || 0}</span>
                                </div>
                            </div>

                            <button className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest group-hover:bg-theme-primary group-hover:text-white transition-all active:scale-95">
                                Manage Hierarchy
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Side Actions & Insights ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-theme-primary rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-primary/20">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                        <Award className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black">Progression Insight</h4>
                        <p className="text-white/50 text-sm mt-1">Students follow the sequence order defined in this roadmap.</p>
                    </div>
                    <div className="pt-6 border-t border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Current Coverage</span>
                            <span className="text-sm font-black">85%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-white w-[85%] rounded-full" />
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                    <div className="w-full md:w-1/3">
                        <div className="aspect-square bg-slate-50 rounded-3xl flex items-center justify-center p-8 border border-slate-100">
                             <TrendingUp className="text-slate-200 w-full h-full" />
                        </div>
                    </div>
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">
                            <Settings2 size={12} /> Optimization Tip
                        </div>
                        <h4 className="text-2xl font-black text-slate-800">Review Sequence Orders</h4>
                        <p className="text-slate-400 font-medium leading-relaxed">Ensuring your sequence orders are strictly chronological allows the automated **Rollover Service** to promote students to the next level seamlessly.</p>
                        <button className="text-theme-primary font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-70 transition-all flex items-center gap-2 mx-auto md:mx-0">
                            View Promotion Logic <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Create/Edit Modal ── */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingGrade(null); }}
                title={editingGrade ? "Edit Academic Level" : "Define New Level"}
                size="xl"
            >
                <form onSubmit={handleSave} className="space-y-8 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade Name *</label>
                            <input 
                                required 
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-700 placeholder:text-slate-300 focus:bg-white focus:border-theme-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                placeholder="e.g. Grade 10" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Level Slug *</label>
                            <input 
                                required 
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-700 placeholder:text-slate-300 focus:bg-white focus:border-theme-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" 
                                value={formData.slug} 
                                onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} 
                                placeholder="grade-10" 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progression Sequence *</label>
                        <input 
                            type="number"
                            required 
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-700 focus:bg-white focus:border-theme-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" 
                            value={formData.sequence_order} 
                            onChange={e => setFormData({...formData, sequence_order: parseInt(e.target.value)})} 
                        />
                        <p className="text-[10px] text-slate-400 font-medium italic mt-2 leading-relaxed">This determines the promotion order. Level 1 rolls over to Level 2, and so on.</p>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-8 py-4 bg-white border border-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={isSaving}
                            className="flex-[2] px-8 py-4 bg-theme-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-primary/20"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : editingGrade ? "Update Level" : "Finalize Level"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
