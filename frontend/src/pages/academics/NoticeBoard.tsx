import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { announcementApi, type Announcement } from '../../api/announcement.api';
import { getClassrooms, type Classroom } from '../../api/classroom.api';
import { 
    Megaphone, Plus, Calendar, User, Search, Trash2, X, 
    BellRing, CheckCircle2, Globe, School 
} from 'lucide-react';

export default function NoticeBoard() {
    const { user, can } = useAuth();
    const [notices, setNotices] = useState<Announcement[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterClass, setFilterClass] = useState<string>('all'); // all, school, class

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        classroom_id: '',
        publish_date: new Date().toISOString().split('T')[0],
        expiry_date: ''
    });

    const isStaff = user?.roles?.some((r: string) => ['school_admin', 'system_admin', 'principal'].includes(r));
    const canWrite = can('settings:write') || isStaff; // Principal/Admin can publish

    useEffect(() => {
        fetchNotices();
        if (canWrite) {
            fetchClassrooms();
        }
    }, []);

    const fetchNotices = async () => {
        setLoading(true);
        try {
            const data = await announcementApi.list();
            setNotices(data);
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClassrooms = async () => {
        try {
            const response = await getClassrooms({ limit: 100 });
            setClassrooms(response.data);
        } catch (error) {
            console.error('Failed to fetch classrooms:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to remove this notice?')) return;
        try {
            await announcementApi.delete(id);
            setNotices(notices.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notice:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                title: formData.title,
                content: formData.content,
                classroom_id: formData.classroom_id ? parseInt(formData.classroom_id) : null,
                publish_date: formData.publish_date,
                expiry_date: formData.expiry_date || null
            };
            await announcementApi.create(payload);
            setShowModal(false);
            setFormData({
                title: '',
                content: '',
                classroom_id: '',
                publish_date: new Date().toISOString().split('T')[0],
                expiry_date: ''
            });
            fetchNotices();
        } catch (error) {
            console.error('Failed to create notice:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredNotices = notices.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                              n.content.toLowerCase().includes(search.toLowerCase());
        
        if (filterClass === 'school') {
            return matchesSearch && !n.classroom_id;
        }
        if (filterClass === 'class') {
            return matchesSearch && !!n.classroom_id;
        }
        return matchesSearch;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-gradient-hero rounded-2xl shadow-xl shadow-primary/20">
                            <Megaphone className="text-white w-7 h-7 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Notice Board</h1>
                            <p className="text-[var(--text-muted)] font-medium mt-1">Official announcements, updates, and communications from the school administration.</p>
                        </div>
                    </div>
                </div>

                {canWrite && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center justify-center gap-3 px-8 py-4 btn-primary rounded-xl hover:opacity-90 transition-all shadow-xl shadow-primary/20 font-bold text-xs uppercase tracking-wider group"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        Publish Notice
                    </button>
                )}
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative w-full lg:w-96 group">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search notices..."
                        className="w-full pl-11 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[13px] font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-[var(--text-muted)] shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl">
                    <button
                        onClick={() => setFilterClass('all')}
                        className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${filterClass === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        All Notices
                    </button>
                    <button
                        onClick={() => setFilterClass('school')}
                        className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${filterClass === 'school' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        School-Wide
                    </button>
                    <button
                        onClick={() => setFilterClass('class')}
                        className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${filterClass === 'class' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Class-Scoped
                    </button>
                </div>
            </div>

            {/* Main notices display */}
            {loading ? (
                <div className="h-[40vh] flex flex-col items-center justify-center gap-6 bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] shadow-sm">
                    <div className="w-10 h-10 border-4 border-[var(--card-border)] border-t-primary rounded-full animate-spin" />
                    <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Loading Notices...</p>
                </div>
            ) : filteredNotices.length === 0 ? (
                <div className="h-[40vh] flex flex-col items-center justify-center text-center bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] border-dashed border-2 p-8">
                    <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-300 mb-6">
                        <BellRing size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">No Active Announcements</h3>
                    <p className="text-[var(--text-muted)] max-w-sm mb-6 font-medium">There are currently no announcements matching your filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredNotices.map((n) => (
                        <div 
                            key={n.id}
                            className="premium-card p-8 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden border border-slate-100"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-hero" />
                            
                            <div>
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {n.classroom_id ? (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase rounded-full tracking-wider">
                                                <School size={12} />
                                                Class: {n.classroom_name}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 border border-primary/10 text-primary text-[10px] font-extrabold uppercase rounded-full tracking-wider">
                                                <Globe size={12} />
                                                School-Wide
                                            </span>
                                        )}
                                    </div>

                                    {canWrite && (
                                        <button 
                                            onClick={() => handleDelete(n.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2.5 bg-slate-50 text-[var(--text-muted)] rounded-xl hover:text-rose-500 hover:bg-rose-50 transition-all"
                                            title="Delete Notice"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </div>

                                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-snug mb-3 group-hover:text-primary transition-colors">
                                    {n.title}
                                </h3>

                                <p className="text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap mb-6">
                                    {n.content}
                                </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-50 pt-5 mt-auto">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[var(--text-muted)]">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wide">Published By</p>
                                        <p className="text-xs font-bold text-slate-700 mt-0.5">{n.publisher_name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[var(--text-muted)]">
                                        <Calendar size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wide">Date Posted</p>
                                        <p className="text-xs font-bold text-slate-700 mt-0.5">
                                            {new Date(n.publish_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Creation Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-250 border border-slate-100">
                        <div className="bg-slate-900 text-white px-8 py-6 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-8 -mt-8" />
                            <div className="relative z-10">
                                <h3 className="text-lg font-black uppercase tracking-wider">Publish New Notice</h3>
                                <p className="text-slate-400 text-xs font-bold tracking-tight mt-1">Broadcast an announcement to the school portal.</p>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white relative z-10"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Notice Title *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter notice title (e.g. Annual Sports Day Postponed)"
                                    className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-[13px] font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Target Audience / Classroom</label>
                                <select
                                    className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-[13px] font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none"
                                    value={formData.classroom_id}
                                    onChange={(e) => setFormData({...formData, classroom_id: e.target.value})}
                                >
                                    <option value="">School-Wide (All Parents, Teachers, Students)</option>
                                    {classrooms.map((c) => (
                                        <option key={c.id} value={c.id}>Specific Class: {c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Publish Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-[13px] font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={formData.publish_date}
                                        onChange={(e) => setFormData({...formData, publish_date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Expiry Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-[13px] font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={formData.expiry_date}
                                        onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Detailed Content *</label>
                                <textarea
                                    required
                                    rows={5}
                                    placeholder="Write full notice context here..."
                                    className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-[13px] font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                    value={formData.content}
                                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 active:scale-[0.99] transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Publishing Announcement...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={16} />
                                        Publish Notice
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
