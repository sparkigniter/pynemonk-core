import { useState, useEffect } from 'react';
import {
    BookOpen, Users, Plus, Search, Filter,
    Calendar, Loader2, GraduationCap,
    Sparkles,
    FileText,
    ArrowUpRight
} from 'lucide-react';
import * as courseApi from '../../api/course.api';
import Modal from '../../components/ui/Modal';

export default function Courses() {
    const [courses, setCourses] = useState<courseApi.Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Search & Pagination state
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
    });

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const response = await courseApi.getCourseList({
                search,
                page: pagination.page,
                limit: pagination.limit
            });
            setCourses(response.data);
            setPagination(response.pagination);
        } catch (err) {
            console.error('Failed to fetch courses:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCourses();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, pagination.page]);

    const handleAddCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await courseApi.createCourse(formData);
            await fetchCourses();
            setIsModalOpen(false);
            setFormData({ name: '', code: '', description: '' });
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const colors = ['bg-primary', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-violet-500'];

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="bg-surface-dark p-4 rounded-3xl shadow-xl shadow-theme/10">
                        <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">Curriculum Central</h1>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Academic Standards & Course Orchestration
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center gap-2 !px-6 !py-3"
                    >
                        <Plus size={18} />
                        Architect New Course
                    </button>
                </div>
            </div>

            {/* Insight Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Active Courses', value: courses.length, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-primary/5', sub: 'Institutional Programs' },
                    { label: 'Total Enrollments', value: '1,284', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Cross-functional Reach' },
                    { label: 'Academic Period', value: '2024-25', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Current Active Term' },
                ].map((stat, i) => (
                    <div key={i} className="premium-card p-6 flex items-center gap-6 group">
                        <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">{stat.value}</h3>
                            <p className="text-[10px] font-medium text-[var(--text-muted)] mt-1">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter & Listing */}
            <div className="space-y-6">
                <div className="flex flex-col xl:flex-row justify-between items-center gap-6 bg-[var(--card-bg)] p-3 rounded-[2.5rem] shadow-sm border border-[var(--card-border)]/60">
                    <div className="flex items-center gap-4 w-full">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                type="text"
                                placeholder="Filter curriculum by name, code or faculty..."
                                className="input-field-modern !pl-12 !py-3.5 !text-xs !bg-slate-50/50 !border-transparent focus:!bg-[var(--card-bg)] focus:!border-[var(--card-border)] w-full"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="btn-dark !p-3.5 shadow-lg shadow-theme/10">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                <div className="premium-card overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                <Loader2 size={48} className="text-primary animate-spin relative z-10" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-[var(--text-main)] tracking-tight">Accessing Curriculum Database</p>
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Syncing pedagogical resources...</p>
                            </div>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="py-32 flex flex-col items-center justify-center text-center px-8">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-8 border border-[var(--card-border)]">
                                <FileText size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">Curriculum Matrix Empty</h3>
                            <p className="text-[var(--text-muted)] text-sm font-medium mt-2 max-w-sm">Define your institution's academic architecture by creating your first standardized course.</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="btn-primary mt-10 !px-10"
                            >
                                <Plus size={18} />
                                Initialize First Course
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-[var(--card-border)]">
                                        <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Pedagogical Unit</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Course Code</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Structural Overview</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Entry Date</th>
                                        <th className="px-8 py-5 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map((course, i) => (
                                        <tr key={course.id} className="hover:bg-slate-50/30 transition-all group cursor-pointer border-b border-slate-50">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${colors[i % colors.length]}`}>
                                                        {course.name[0]}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-[var(--text-main)] group-hover:text-primary transition-colors leading-tight">{course.name}</div>
                                                        <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight mt-1">Core Requirement</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-bold text-[var(--text-main)] bg-slate-100 px-3 py-1.5 rounded-lg border border-[var(--card-border)]/60 font-mono">
                                                    {course.code}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs text-[var(--text-muted)] font-medium line-clamp-1 max-w-xs">
                                                    {course.description || 'No specialized description provided for this academic unit.'}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6 text-xs font-bold text-[var(--text-muted)] uppercase">
                                                {new Date(course.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-2">
                                                    <button className="p-2.5 bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-primary rounded-xl shadow-sm border border-[var(--card-border)]">
                                                        <ArrowUpRight size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* New Course Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Architect Academic Course"
            >
                <form onSubmit={handleAddCourse} className="p-2 space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Institutional Name</label>
                        <input
                            required
                            className="input-field-modern"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Advanced Quantum Mechanics"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Registry Code</label>
                            <input
                                required
                                className="input-field-modern font-mono"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                placeholder="e.g. PHY-402"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Academic Level</label>
                            <div className="h-11 px-4 flex items-center bg-slate-50 border border-[var(--card-border)] rounded-xl text-xs font-bold text-[var(--text-muted)] cursor-not-allowed">
                                Level 4 (Auto-assigned)
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Pedagogical Objectives</label>
                        <textarea
                            rows={4}
                            className="input-field-modern !py-3 resize-none"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Define the core competencies and learning outcomes..."
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="btn-ghost flex-1 !py-3.5"
                        >
                            Abort
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="btn-primary flex-1 !py-3.5"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            Finalize Architecture
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
