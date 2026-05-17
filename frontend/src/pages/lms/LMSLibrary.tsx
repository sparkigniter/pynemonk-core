import { useState, useEffect } from 'react';
import { 
    FileText, Video, Link as LinkIcon, 
    Search, Plus, Download, 
    MoreVertical, BookOpen,
    LayoutGrid, List as ListIcon,
    File as FileIcon, ExternalLink, X, Check, Lock, Users, Eye
} from 'lucide-react';
import { get, post } from '../../api/base.api';
import { useAuth } from '../../contexts/AuthContext';

export default function LMSLibrary() {
    const { can } = useAuth();
    const canWrite = can('assignment:write');
    
    const [resources, setResources] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('All');

    // Add Resource Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalSubmitting, setModalSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        resource_type: 'pdf',
        url: '',
        subject_id: '',
        access_level: 'public',
        grade_ids: [] as number[],
        tagsString: ''
    });

    useEffect(() => {
        fetchResources();
        if (canWrite) {
            fetchGradesAndSubjects();
        }
    }, [canWrite]);

    const fetchResources = async () => {
        try {
            const data = await get<any[]>('/school/homework/lms/library');
            setResources(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGradesAndSubjects = async () => {
        try {
            const [gradesData, subjectsData] = await Promise.all([
                get<any>('/school/grades?limit=100'),
                get<any>('/school/subjects?limit=100')
            ]);
            setGrades(gradesData.items || gradesData || []);
            setSubjects(subjectsData.items || subjectsData || []);
        } catch (err) {
            console.error('Failed to load grades or subjects', err);
        }
    };

    const handleGradeToggle = (gradeId: number) => {
        setFormData(prev => {
            const alreadySelected = prev.grade_ids.includes(gradeId);
            const newGrades = alreadySelected
                ? prev.grade_ids.filter(id => id !== gradeId)
                : [...prev.grade_ids, gradeId];
            return { ...prev, grade_ids: newGrades };
        });
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.url) return;

        setModalSubmitting(true);
        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                resource_type: formData.resource_type,
                url: formData.url,
                subject_id: formData.subject_id ? parseInt(formData.subject_id) : null,
                access_level: formData.access_level,
                grade_ids: formData.access_level === 'grades' ? formData.grade_ids : null,
                tags: formData.tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0)
            };

            await post('/school/homework/lms/library', payload);
            setShowModal(false);
            // Reset form
            setFormData({
                title: '',
                description: '',
                resource_type: 'pdf',
                url: '',
                subject_id: '',
                access_level: 'public',
                grade_ids: [],
                tagsString: ''
            });
            fetchResources();
        } catch (err: any) {
            alert(err.message || 'Failed to create resource');
        } finally {
            setModalSubmitting(false);
        }
    };

    const filteredResources = resources.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             r.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === 'All' || r.resource_type === selectedType.toLowerCase();
        return matchesSearch && matchesType;
    });

    const getIcon = (type: string) => {
        switch(type) {
            case 'pdf': return <FileText className="text-rose-500" />;
            case 'video': return <Video className="text-amber-500" />;
            case 'link': return <LinkIcon className="text-sky-500" />;
            default: return <FileIcon className="text-slate-500" />;
        }
    };

    const getAccessBadge = (res: any) => {
        if (res.access_level === 'teachers') {
            return (
                <span className="px-3 py-1 bg-rose-50 text-[9px] font-black uppercase text-rose-600 rounded-lg border border-rose-100 flex items-center gap-1 shadow-sm">
                    <Lock size={10} /> Teachers Only
                </span>
            );
        } else if (res.access_level === 'grades') {
            return (
                <span className="px-3 py-1 bg-amber-50 text-[9px] font-black uppercase text-amber-700 rounded-lg border border-amber-100 flex items-center gap-1 shadow-sm max-w-[150px] truncate" title={res.grades_list}>
                    <Users size={10} /> {res.grades_list || 'Specific Grades'}
                </span>
            );
        } else {
            return (
                <span className="px-3 py-1 bg-sky-50 text-[9px] font-black uppercase text-sky-600 rounded-lg border border-sky-100 flex items-center gap-1 shadow-sm">
                    <Eye size={10} /> Public
                </span>
            );
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Digital Library</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Knowledge & Resource Repository</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                    {canWrite && (
                        <button 
                            onClick={() => setShowModal(true)}
                            className="btn-primary"
                        >
                            <Plus size={18} /> Add Resource
                        </button>
                    )}
                </div>
            </header>

            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search resources, titles, tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    {['All', 'PDF', 'Video', 'Link', 'Doc'].map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                selectedType === type 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                                : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Knowledge Hub...</div>
            ) : filteredResources.length === 0 ? (
                <div className="p-20 bg-white rounded-[3rem] border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                        <BookOpen size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">No Resources Found</h2>
                    <p className="text-slate-400 mt-1 font-medium italic">"Knowledge shared is knowledge multiplied." — Be the first to share!</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map((res, idx) => (
                        <div 
                            key={res.id} 
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col justify-between"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div>
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 transition-colors">
                                        {getIcon(res.resource_type)}
                                    </div>
                                    <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                                
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2 group-hover:text-primary transition-colors">{res.title}</h3>
                                    <p className="text-slate-400 text-xs font-medium line-clamp-2 leading-relaxed mb-6">{res.description}</p>
                                    
                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {getAccessBadge(res)}
                                        {res.subject_name && (
                                            <span className="px-3 py-1 bg-emerald-50 text-[9px] font-black uppercase text-emerald-600 rounded-lg border border-emerald-100">
                                                {res.subject_name}
                                            </span>
                                        )}
                                        {res.tags?.map((tag: string) => (
                                            <span key={tag} className="px-3 py-1 bg-slate-50 text-[9px] font-black uppercase text-slate-400 rounded-lg border border-slate-100">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                                        {res.resource_type.slice(0, 1).toUpperCase()}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {new Date(res.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <a 
                                    href={res.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                >
                                    {res.resource_type === 'link' ? <ExternalLink size={16} /> : <Download size={16} />}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource Name</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Control</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredResources.map(res => (
                                <tr key={res.id} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                                                {getIcon(res.resource_type)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{res.title}</p>
                                                <p className="text-[10px] font-bold text-slate-400 truncate max-w-xs">{res.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{res.resource_type}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1.5 bg-emerald-50 text-[9px] font-black uppercase text-emerald-600 rounded-lg">
                                            {res.subject_name || 'General'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        {getAccessBadge(res)}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{new Date(res.created_at).toLocaleDateString()}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-300 hover:text-primary transition-colors">
                                                <Download size={18} />
                                            </a>
                                            <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Premium Add Resource Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-350">
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                        <header className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Add Library Resource</h2>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Share knowledge securely</p>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </header>

                        <form onSubmit={handleFormSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Resource Title *</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. Calculus Midterm Study Guide"
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Resource Type</label>
                                    <select 
                                        value={formData.resource_type}
                                        onChange={e => setFormData(prev => ({ ...prev, resource_type: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                    >
                                        <option value="pdf">📄 PDF Document</option>
                                        <option value="video">🎥 Video URL</option>
                                        <option value="link">🔗 Web URL / Link</option>
                                        <option value="doc">📝 General Document</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Resource URL *</label>
                                <input 
                                    type="url" 
                                    required
                                    value={formData.url}
                                    onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Associated Subject</label>
                                    <select 
                                        value={formData.subject_id}
                                        onChange={e => setFormData(prev => ({ ...prev, subject_id: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                    >
                                        <option value="">General Resource (No Subject)</option>
                                        {subjects.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tags (Comma Separated)</label>
                                    <input 
                                        type="text" 
                                        value={formData.tagsString}
                                        onChange={e => setFormData(prev => ({ ...prev, tagsString: e.target.value }))}
                                        placeholder="study, geometry, algebra"
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Description</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description of the resource..."
                                    rows={2}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                                />
                            </div>

                            {/* Access Control & Permissions Section */}
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Granular Access Level Control</span>
                                    <span className="text-[9px] font-black px-2 py-0.5 bg-slate-200 text-slate-600 rounded uppercase">Security</span>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, access_level: 'public' }))}
                                        className={`p-4 rounded-xl text-left border flex flex-col justify-between h-24 transition-all ${
                                            formData.access_level === 'public' 
                                            ? 'bg-sky-50/50 border-sky-400 text-sky-900 shadow-sm' 
                                            : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        <Eye size={18} className="text-sky-500" />
                                        <div>
                                            <p className="text-xs font-black">Public</p>
                                            <p className="text-[8px] font-bold text-slate-400 mt-0.5">All Grades & Teachers</p>
                                        </div>
                                    </button>

                                    <button 
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, access_level: 'grades' }))}
                                        className={`p-4 rounded-xl text-left border flex flex-col justify-between h-24 transition-all ${
                                            formData.access_level === 'grades' 
                                            ? 'bg-amber-50/50 border-amber-400 text-amber-900 shadow-sm' 
                                            : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        <Users size={18} className="text-amber-500" />
                                        <div>
                                            <p className="text-xs font-black">Grades Only</p>
                                            <p className="text-[8px] font-bold text-slate-400 mt-0.5">Restrict by student grades</p>
                                        </div>
                                    </button>

                                    <button 
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, access_level: 'teachers' }))}
                                        className={`p-4 rounded-xl text-left border flex flex-col justify-between h-24 transition-all ${
                                            formData.access_level === 'teachers' 
                                            ? 'bg-rose-50/50 border-rose-400 text-rose-900 shadow-sm' 
                                            : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        <Lock size={18} className="text-rose-500" />
                                        <div>
                                            <p className="text-xs font-black">Teachers Only</p>
                                            <p className="text-[8px] font-bold text-slate-400 mt-0.5">Staff & Admin visibility</p>
                                        </div>
                                    </button>
                                </div>

                                {formData.access_level === 'grades' && (
                                    <div className="space-y-2 pt-3 border-t border-slate-200/50 animate-in slide-in-from-top duration-300">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Permitted Grades *</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-36 overflow-y-auto p-1">
                                            {grades.map(grade => {
                                                const isChecked = formData.grade_ids.includes(grade.id);
                                                return (
                                                    <button
                                                        key={grade.id}
                                                        type="button"
                                                        onClick={() => handleGradeToggle(grade.id)}
                                                        className={`p-2.5 rounded-lg border text-left text-xs font-bold transition-all flex items-center justify-between ${
                                                            isChecked 
                                                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                                                            : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                                                        }`}
                                                    >
                                                        <span>{grade.name}</span>
                                                        {isChecked && <Check size={12} className="text-emerald-400" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <footer className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={modalSubmitting || !formData.title || !formData.url || (formData.access_level === 'grades' && formData.grade_ids.length === 0)}
                                    className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center gap-2"
                                >
                                    {modalSubmitting ? 'Adding...' : 'Add to Library'}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
