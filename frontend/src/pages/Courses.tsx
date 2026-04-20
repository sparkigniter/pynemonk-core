import { useState, useEffect } from 'react';
import {
    BookOpen, Users, Plus, Search, Filter,
    ChevronRight, Calendar, Loader2, GraduationCap
} from 'lucide-react';
import * as courseApi from '../api/course.api';
import Modal from '../components/ui/Modal';

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

    const colors = ['blue', 'indigo', 'amber', 'emerald', 'rose', 'purple'];

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-heading tracking-tight">Courses & Curriculum</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage classes, syllabi, and academic schedules.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-theme-primary text-white rounded-xl hover:bg-theme-primary/90 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Plus size={16} />
                        New Course
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 flex items-center gap-4 bg-gradient-to-r from-blue-50 to-white">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Courses</p>
                        <h3 className="text-2xl font-bold text-slate-800 font-heading">{courses.length}</h3>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4 bg-gradient-to-r from-emerald-50 to-white">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Active Enrollments</p>
                        <h3 className="text-2xl font-bold text-slate-800 font-heading">0</h3>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4 bg-gradient-to-r from-purple-50 to-white">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Current Term</p>
                        <h3 className="text-xl font-bold text-slate-800 font-heading">Academic 2026</h3>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="card delay-200">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search courses..."
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50/50"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium hidden sm:flex items-center gap-2">
                            <Filter size={16} />
                            Filter
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 size={40} className="text-theme-primary animate-spin" />
                            <p className="text-slate-500 font-medium">Loading courses...</p>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
                                <GraduationCap size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Curriculum is empty</h3>
                            <p className="text-slate-500 max-w-sm mb-6">Create your first course to start defining your school's academic programs.</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="btn-primary"
                            >
                                Create First Course
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {courses.map((course, i) => (
                                    <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white uppercase bg-${colors[i % colors.length]}-500 shadow-sm`}>
                                                    {course.name[0]}
                                                </div>
                                                <div className="text-sm font-bold text-slate-800">{course.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-slate-600">
                                            {course.code}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">
                                            {course.description}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(course.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ChevronRight size={18} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* New Course Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Course"
            >
                <form onSubmit={handleAddCourse} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course Name</label>
                        <input
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-theme-primary transition-all focus:ring-4 focus:ring-primary/10"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Advanced Mathematics"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course Code</label>
                        <input
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono outline-none focus:border-theme-primary transition-all focus:ring-4 focus:ring-primary/10"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                            placeholder="MAT-301"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                        <textarea
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-theme-primary transition-all focus:ring-4 focus:ring-primary/10 resize-none"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief overview of course objectives..."
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-theme-primary text-white text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Create Course
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
