import { useState, useEffect } from 'react';
import { 
    Plus, Layers, ChevronRight, Edit2, Trash2, 
    ArrowUpDown, Loader2, BookOpen, GraduationCap 
} from 'lucide-react';
import * as gradeApi from '../api/grade.api';
import Modal from '../components/ui/Modal';

export default function Grades() {
    const [grades, setGrades] = useState<gradeApi.Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'roadmap'>('roadmap');
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
        <div className="p-8 space-y-8 animate-fade-in">
            {/* Header section with Stats */}
            <div className="relative overflow-hidden bg-gradient-hero rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-black uppercase tracking-widest text-indigo-100">
                            <Layers size={14} className="animate-pulse" />
                            Academic Structure
                        </div>
                        <h1 className="text-5xl font-black tracking-tight leading-none">Grade <span className="text-indigo-200">Management</span></h1>
                        <p className="text-indigo-100/80 text-lg font-medium max-w-xl">Configure academic levels, progression paths, and curriculum mapping.</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex p-1.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-theme-primary shadow-lg' : 'text-white hover:bg-white/5'}`}
                            >
                                List
                            </button>
                            <button 
                                onClick={() => setViewMode('roadmap')}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'roadmap' ? 'bg-white text-theme-primary shadow-lg' : 'text-white hover:bg-white/5'}`}
                            >
                                Roadmap
                            </button>
                        </div>
                        <button 
                            onClick={() => { setEditingGrade(null); setFormData({ name: '', slug: '', sequence_order: 0 }); setIsModalOpen(true); }}
                            className="group relative flex items-center gap-3 px-8 py-4 bg-white text-theme-primary rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-indigo-50 transition-all active:scale-95 shadow-xl shadow-indigo-900/20"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            Create New Grade
                        </button>
                    </div>
                </div>

                {/* Quick Stats Overlays */}
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
                    <GraduationCap size={400} className="-mr-20 -mt-20" />
                </div>
            </div>

            {viewMode === 'roadmap' ? (
                <div className="relative overflow-hidden bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-10 md:p-20">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    
                    <div className="relative flex flex-col items-center gap-20">
                        {sortedGrades.map((grade, idx) => (
                            <div key={grade.id} className="relative w-full max-w-4xl">
                                {/* Connection Line */}
                                {idx < sortedGrades.length - 1 && (
                                    <div className="absolute top-24 left-1/2 -translate-x-1/2 w-1.5 h-20 bg-gradient-to-b from-indigo-500/20 to-indigo-500/50 z-0" 
                                         style={{ marginTop: '1.5rem' }} />
                                )}

                                <div className="group relative z-10 flex flex-col md:flex-row items-center gap-10">
                                    {/* Central Badge */}
                                    <div className="flex-shrink-0 w-24 h-24 rounded-[2.5rem] bg-white border-4 border-indigo-50 shadow-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:border-indigo-500 group-hover:rotate-6">
                                        <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-inner">
                                            {grade.sequence_order}
                                        </div>
                                    </div>

                                    {/* Data Card */}
                                    <div className="flex-grow bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl transition-all group-hover:shadow-2xl group-hover:border-indigo-100 group-hover:-translate-y-1">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">{grade.name}</h3>
                                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-500 rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">{grade.slug}</span>
                                                </div>
                                                <p className="text-slate-400 font-medium">Academic Level {idx + 1} — Primary Progression Path</p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button onClick={() => handleEdit(grade)} className="p-4 bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all">
                                                    <Edit2 size={20} />
                                                </button>
                                                <button onClick={() => handleDelete(grade.id)} className="p-4 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                                            <div className="p-5 rounded-3xl bg-slate-50/50 border border-slate-50 group-hover:bg-indigo-50/30 group-hover:border-indigo-100 transition-colors">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Success Rate</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <p className="text-2xl font-black text-slate-800">98.2%</p>
                                                </div>
                                            </div>
                                            <div className="p-5 rounded-3xl bg-slate-50/50 border border-slate-50 group-hover:bg-indigo-50/30 group-hover:border-indigo-100 transition-colors">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Students</p>
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap size={18} className="text-indigo-500" />
                                                    <p className="text-2xl font-black text-slate-800">{grade.student_count || 0}</p>
                                                </div>
                                            </div>
                                            <div className="p-5 rounded-3xl bg-slate-50/50 border border-slate-50 group-hover:bg-indigo-50/30 group-hover:border-indigo-100 transition-colors">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Subjects</p>
                                                <div className="flex items-center gap-2">
                                                    <BookOpen size={18} className="text-indigo-500" />
                                                    <p className="text-2xl font-black text-slate-800">{grade.subject_count || 0}</p>
                                                </div>
                                            </div>
                                            <div className="p-5 rounded-3xl bg-slate-50/50 border border-slate-50 group-hover:bg-indigo-50/30 group-hover:border-indigo-100 transition-colors">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Classrooms</p>
                                                <div className="flex items-center gap-2">
                                                    <Layers size={18} className="text-indigo-500" />
                                                    <p className="text-2xl font-black text-slate-800">{grade.classroom_count || 0}</p>
                                                </div>
                                            </div>
                                            <div className="p-5 rounded-3xl bg-indigo-600 border border-indigo-500 shadow-lg shadow-indigo-200 flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-all">
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Manage All</span>
                                                <ChevronRight size={16} className="text-white ml-2" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Left Side Label (Desktop Only) */}
                                    <div className="hidden xl:block absolute right-full mr-12 text-right">
                                        <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">PHASE</p>
                                        <p className="text-3xl font-black text-slate-200 group-hover:text-indigo-100 transition-colors">0{idx + 1}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {sortedGrades.length === 0 && (
                            <div className="text-center py-20 space-y-4">
                                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300">
                                    <Layers size={48} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-800">No Roadmap Defined</h3>
                                    <p className="text-slate-400 font-medium">Create your first grade to visualize the academic journey.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Info Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="card p-8 bg-white border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <ArrowUpDown size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">Progression Logic</h3>
                                    <p className="text-sm text-slate-400 font-medium">Define how students move between levels.</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                    <p className="text-xs font-black text-slate-400 uppercase">Total Levels</p>
                                    <p className="text-2xl font-black text-slate-800">{grades.length}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                    <p className="text-xs font-black text-slate-400 uppercase">Top Grade</p>
                                    <p className="text-2xl font-black text-slate-800">{grades[grades.length-1]?.name || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-50">
                                <p className="text-sm text-slate-500 leading-relaxed italic">
                                    "Grades represent the fundamental academic milestones. Ensure sequence orders are correct for promotion workflows."
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Grade List */}
                    <div className="lg:col-span-2 space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-white/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                <Loader2 size={48} className="text-theme-primary animate-spin" />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Academics...</p>
                            </div>
                        ) : grades.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 space-y-6 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                    <Layers size={48} />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-black text-slate-800">No Grades Defined</h3>
                                    <p className="text-slate-400 max-w-xs mx-auto font-medium">Start by defining your school's levels from Primary to High School.</p>
                                </div>
                                <button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="px-8 py-3 bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all"
                                >
                                    Setup First Grade
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {sortedGrades.map((grade) => (
                                    <div key={grade.id} className="group card bg-white p-6 hover-lift flex items-center justify-between gap-6 border-slate-100">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center text-xl font-black group-hover:bg-theme-primary/10 group-hover:text-theme-primary transition-colors">
                                                {grade.sequence_order}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-2xl font-black text-slate-800">{grade.name}</h4>
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">{grade.slug}</span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <ArrowUpDown size={14} />
                                                        <span className="text-xs font-bold uppercase tracking-wider">Order: {grade.sequence_order}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(grade)} className="p-3 bg-slate-50 text-slate-400 hover:bg-theme-primary/10 hover:text-theme-primary rounded-xl transition-all">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(grade.id)} className="p-3 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                                                <Trash2 size={18} />
                                            </button>
                                            <div className="w-px h-8 bg-slate-100 mx-2" />
                                            <button className="flex items-center gap-2 px-5 py-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg shadow-slate-900/10">
                                                Manage Subjects
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingGrade(null); }}
                title={editingGrade ? "Edit Grade" : "Define New Grade"}
                size="xl"
            >
                <form onSubmit={handleSave} className="p-10 space-y-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3 group">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Grade Name</label>
                                <div className="relative">
                                    <Layers size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-theme-primary transition-colors" />
                                    <input 
                                        required 
                                        className="input-field-modern pl-14" 
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})} 
                                        placeholder="e.g. Grade 10" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-3 group">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Grade Slug</label>
                                <div className="relative">
                                    <BookOpen size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-theme-primary transition-colors" />
                                    <input 
                                        required 
                                        className="input-field-modern pl-14" 
                                        value={formData.slug} 
                                        onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} 
                                        placeholder="e.g. grade-10" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 group">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Sequence Order</label>
                            <div className="relative">
                                <ArrowUpDown size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-theme-primary transition-colors" />
                                <input 
                                    type="number"
                                    required 
                                    className="input-field-modern pl-14" 
                                    value={formData.sequence_order} 
                                    onChange={e => setFormData({...formData, sequence_order: parseInt(e.target.value)})} 
                                    placeholder="0" 
                                />
                                <p className="mt-2 text-[10px] text-slate-400 font-medium italic">Higher numbers represent higher grades (used for promotion logic).</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-slate-50">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-8 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={isSaving}
                            className="flex-[2] px-8 py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-slate-900/20"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                editingGrade ? "Update Grade Profile" : "Finalize & Create Grade"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
