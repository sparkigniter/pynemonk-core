import { useState, useEffect } from 'react';
import {
    Plus, School, Edit2, Trash2,
    Search, Loader2, Building2,
    Users, AlertCircle, X, Check
} from 'lucide-react';
import { getGrades } from '../api/grade.api';
import type { Grade } from '../api/grade.api';
import { getClassrooms, createClassroom } from '../api/classroom.api';
import type { Classroom } from '../api/classroom.api';
import Modal from '../components/ui/Modal';

export default function Classrooms() {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [gradesData, classroomsData] = await Promise.all([
                getGrades(),
                getClassrooms()
            ]);
            setGrades(gradesData);
            setClassrooms(classroomsData);
        } catch (err) {
            console.error(err);
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

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
            loadData();
        } catch (err: any) {
            setError(err.message || "Failed to save classroom");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredClassrooms = classrooms.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.section.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                    <Building2 size={240} className="rotate-12" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            <Building2 size={14} />
                            Facility Management
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Classroom <span className="text-primary">Directory</span></h1>
                        <p className="text-slate-400 font-medium max-w-md">Organize your school's physical and logical learning spaces.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or section..."
                                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 ring-primary/20 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95"
                        >
                            <Plus size={20} />
                            New Classroom
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-bold shadow-sm animate-in slide-in-from-top-2">
                    <AlertCircle size={18} />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-rose-100 rounded-lg"><X size={16} /></button>
                </div>
            )}

            {/* Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-4">
                    <Loader2 size={48} className="text-primary animate-spin" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Assembling Spaces...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredClassrooms.map((classroom) => {
                        const grade = grades.find(g => g.id === classroom.grade_id);
                        return (
                            <div key={classroom.id} className="group bg-white rounded-[2rem] border border-slate-100 p-8 hover:shadow-2xl hover:shadow-primary/20 transition-all hover:-translate-y-1 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                                    <School size={80} />
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                            <School size={28} />
                                        </div>
                                        <div className="flex gap-1">
                                            <button className="p-2 text-slate-300 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                                            <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800">{classroom.name}</h3>
                                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{grade?.name || 'No Grade'} — Section {classroom.section}</p>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Users size={16} />
                                            <span className="text-xs font-bold">Capacity: {classroom.capacity || 40}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            <Check size={10} />
                                            Active
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filteredClassrooms.length === 0 && (
                        <div className="col-span-full py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center px-10">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-300 mb-6">
                                <Building2 size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">No Classrooms Found</h3>
                            <p className="text-slate-400 font-medium mt-2 max-w-xs">Start by creating your first physical or virtual classroom space.</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest"
                            >
                                Setup First Classroom
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Classroom"
                size="md"
            >
                <form onSubmit={handleSave} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Parent Grade</label>
                            <select
                                required
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all"
                                value={formData.grade_id}
                                onChange={(e) => setFormData({ ...formData, grade_id: Number(e.target.value) })}
                            >
                                <option value="">Select Grade Level</option>
                                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Class Name</label>
                                <input
                                    required
                                    placeholder="e.g. 10A"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Section</label>
                                <input
                                    required
                                    placeholder="e.g. A"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all"
                                    value={formData.section}
                                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Student Capacity</label>
                            <input
                                type="number"
                                placeholder="40"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-8 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={isSaving}
                            className="flex-[2] px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 shadow-xl shadow-primary/10 disabled:opacity-50"
                        >
                            {isSaving ? "Saving..." : "Create Classroom"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
