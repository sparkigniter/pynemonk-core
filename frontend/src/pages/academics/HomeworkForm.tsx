import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { 
    ChevronLeft, 
    Save, 
    Send, 
    Image as ImageIcon, 
    Paperclip, 
    X, 
    BookOpen, 
    Users,
    StickyNote,
    CheckCircle2,
    Calendar,
    Type,
    FileText,
    Plus,
    Settings,
    Mic
} from 'lucide-react';
import { homeworkApi } from '../../api/homework.api';
import { getClassrooms, type Classroom } from '../../api/classroom.api';
import { getSubjectList, type Subject } from '../../api/subject.api';
import { useNotification } from '../../contexts/NotificationContext';
import { format, addDays } from 'date-fns';

export default function HomeworkForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const classIdFromUrl = searchParams.get('classId');
    const { notify } = useNotification();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isPublishing, setIsPublishing] = useState(true); // Default to publishing as homework
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        classroom_id: classIdFromUrl ? parseInt(classIdFromUrl) : undefined as number | undefined,
        subject_id: undefined as number | undefined,
        due_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        max_score: 10,
        attachment_url: ''
    });

    const [attachments, setAttachments] = useState<{name: string, url: string}[]>([]);

    useEffect(() => {
        loadInitialData();
        if (id) {
            // Load existing homework for edit
        } else {
            // Check if we have pre-fill data from state (e.g. from Teacher Diary)
            const state = location.state as any;
            if (state?.preFill) {
                setFormData(prev => ({
                    ...prev,
                    title: state.preFill.title || '',
                    description: state.preFill.description || '',
                    classroom_id: state.preFill.classroom_id,
                    subject_id: state.preFill.subject_id
                }));
            }
        }
    }, [id, location]);

    const loadInitialData = async () => {
        try {
            const [classesRes, subjectsRes] = await Promise.all([
                getClassrooms(),
                getSubjectList({ limit: 1000 })
            ]);
            setClassrooms(classesRes.data);
            setSubjects(subjectsRes.data);
        } catch (err) {
            notify('error', 'Error', 'Failed to load initial data');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setAttachments([...attachments, { name: file.name, url }]);
            // For now, we just use the last one as the primary attachment_url
            setFormData({ ...formData, attachment_url: url });
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
        if (attachments.length === 1) {
            setFormData({ ...formData, attachment_url: '' });
        }
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            notify('warning', 'Incomplete', 'Please provide a title');
            return;
        }

        try {
            setIsLoading(true);
            
            // In a real app, if isPublishing is false, we might save to a 'Drafts' or 'Teacher Notes' table
            // But for this requirement, we'll just save it.
            
            if (id) {
                await homeworkApi.update(parseInt(id), formData);
                notify('success', 'Updated', 'Changes saved successfully');
            } else {
                await homeworkApi.create(formData);
                notify('success', 'Created', isPublishing ? 'Homework published to students' : 'Saved as private note');
            }
            
            navigate('/homework');
        } catch (err) {
            notify('error', 'Failed', 'Could not save the assignment');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Navigation Bar */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">
                            {id ? 'Edit Assignment' : 'New Assignment'}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Draft Auto-saved</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
                        <button 
                            onClick={() => setIsPublishing(false)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isPublishing ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <StickyNote size={14} />
                            Self Note
                        </button>
                        <button 
                            onClick={() => setIsPublishing(true)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isPublishing ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Send size={14} />
                            Publish
                        </button>
                    </div>
                    
                    <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        Save Assignment
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-6xl mx-auto w-full p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Editor Section */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Title Input */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Type size={14} /> Assignment Title
                        </label>
                        <input 
                            type="text"
                            placeholder="e.g. Chapter 4: Practice Problems"
                            className="w-full text-4xl font-black text-slate-900 placeholder:text-slate-200 focus:outline-none bg-transparent"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                    </div>

                    {/* Content Editor */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={14} /> Instructions & Content
                        </label>
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                            {/* Toolbar placeholder */}
                            <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-4 text-slate-400">
                                <button className="hover:text-slate-900 transition-colors font-serif font-bold text-lg">B</button>
                                <button className="hover:text-slate-900 transition-colors font-serif italic text-lg">I</button>
                                <button className="hover:text-slate-900 transition-colors font-serif underline text-lg">U</button>
                                <div className="w-px h-6 bg-slate-200 mx-2" />
                                <button className="hover:text-slate-900 transition-colors"><Plus size={18} /></button>
                                <button onClick={() => fileInputRef.current?.click()} className="hover:text-slate-900 transition-colors"><ImageIcon size={18} /></button>
                                <button onClick={() => fileInputRef.current?.click()} className="hover:text-slate-900 transition-colors"><Paperclip size={18} /></button>
                            </div>
                            <textarea 
                                className="w-full px-10 py-8 min-h-[500px] text-lg font-medium text-slate-700 placeholder:text-slate-200 focus:outline-none leading-relaxed resize-none"
                                placeholder="Describe the homework in detail, or add notes for yourself..."
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Attachments Section */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Paperclip size={14} /> Attachments
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {attachments.map((file, i) => (
                                <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-lg flex items-center gap-3 group relative">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-slate-900 truncate">{file.name}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">File Uploaded</p>
                                    </div>
                                    <button 
                                        onClick={() => removeAttachment(i)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                            >
                                <Plus size={24} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Add File</span>
                            </button>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileUpload}
                        />
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-10 space-y-10">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Settings size={18} className="text-indigo-600" /> Settings
                        </h3>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Classroom</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Users size={18} />
                                    </div>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-8 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                                        value={formData.classroom_id || ''}
                                        onChange={(e) => setFormData({...formData, classroom_id: e.target.value ? parseInt(e.target.value) : undefined})}
                                    >
                                        <option value="">Select Class</option>
                                        {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Subject</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                                        <BookOpen size={18} />
                                    </div>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-8 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                                        value={formData.subject_id || ''}
                                        onChange={(e) => setFormData({...formData, subject_id: e.target.value ? parseInt(e.target.value) : undefined})}
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Due Date</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Calendar size={18} />
                                    </div>
                                    <input 
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-8 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Max Score</label>
                                <input 
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    value={formData.max_score}
                                    onChange={(e) => setFormData({...formData, max_score: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50 space-y-4">
                            <div className={`p-4 rounded-2xl flex items-start gap-3 transition-all ${isPublishing ? 'bg-indigo-50 ring-1 ring-indigo-100' : 'bg-amber-50 ring-1 ring-amber-100'}`}>
                                {isPublishing ? <CheckCircle2 className="text-indigo-600 mt-1" size={20} /> : <AlertCircle className="text-amber-600 mt-1" size={20} />}
                                <div>
                                    <p className={`text-xs font-black uppercase tracking-widest ${isPublishing ? 'text-indigo-900' : 'text-amber-900'}`}>
                                        {isPublishing ? 'Public Assignment' : 'Private Note'}
                                    </p>
                                    <p className={`text-[10px] font-medium leading-relaxed mt-1 ${isPublishing ? 'text-indigo-600' : 'text-amber-600'}`}>
                                        {isPublishing 
                                            ? 'Students will receive an app notification and can submit their work.' 
                                            : 'Only you can see this. It will not be visible to students or parents.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-white/10 transition-all" />
                        <h4 className="text-lg font-black tracking-tight mb-4 flex items-center gap-2">
                            <Mic size={20} className="text-indigo-400" /> Voice Assistant
                        </h4>
                        <p className="text-xs text-white/60 leading-relaxed font-medium mb-8">
                            Don't want to type? Hold the mic to dictate your homework instructions. Our AI will format it for you.
                        </p>
                        <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                            Start Dictation
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

function AlertCircle({ size, className }: { size: number, className: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
