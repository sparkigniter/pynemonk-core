import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    ChevronLeft,
    Paperclip,
    X,
    BookOpen,
    CheckCircle2,
    FileText,
    Plus,
    Settings,
    Mic,
    Layout,
    Link as LinkIcon,
    ListTodo,
    HelpCircle,
    Eye,
    Zap,
    Trophy,
    Target,
    Clock,
    Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { homeworkApi } from '../../api/homework.api';
import { getClassrooms, type Classroom } from '../../api/classroom.api';
import { getSubjectList, type Subject } from '../../api/subject.api';
import { useNotification } from '../../contexts/NotificationContext';
import { format, addDays } from 'date-fns';

type AssignmentType = 'practice' | 'homework' | 'test' | 'project';
type BlockType = 'instructions' | 'question' | 'mcq' | 'attachment' | 'link';

interface Block {
    id: string;
    type: BlockType;
    content: any;
}

const TEMPLATES: Record<string, { title: string; blocks: Block[] }> = {
    practice: {
        title: 'Weekly Practice Worksheet',
        blocks: [
            { id: '1', type: 'instructions', content: 'Complete the following exercises to reinforce this week\'s concepts.' },
            { id: '2', type: 'question', content: 'Solve for x: 2x + 5 = 15' },
            { id: '3', type: 'question', content: 'What is the capital of France?' }
        ]
    },
    reading: {
        title: 'Reading Reflection Task',
        blocks: [
            { id: '1', type: 'instructions', content: 'Read Chapter 4 of the textbook and answer the reflection questions below.' },
            { id: '2', type: 'link', content: { url: 'https://pynemonk.com/library', label: 'E-Library Access' } },
            { id: '3', type: 'question', content: 'Summarize the main conflict in the chapter.' }
        ]
    },
    project: {
        title: 'Mid-Term Research Project',
        blocks: [
            { id: '1', type: 'instructions', content: 'Follow the rubric attached to complete your research project.' },
            { id: '2', type: 'attachment', content: { name: 'Project_Rubric.pdf', url: '#' } },
            { id: '3', type: 'question', content: 'Project Title & Objectives' }
        ]
    },
    test: {
        title: 'Quick Assessment',
        blocks: [
            { id: '1', type: 'mcq', content: { question: 'Which planet is known as the Red Planet?', options: ['Earth', 'Mars', 'Jupiter', 'Saturn'], correct: 1 } },
            { id: '2', type: 'mcq', content: { question: 'What is 15 * 3?', options: ['30', '45', '60', '75'], correct: 1 } }
        ]
    }
};

export default function HomeworkForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const classIdFromUrl = searchParams.get('classId');
    const { notify } = useNotification();

    const [isLoading, setIsLoading] = useState(false);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    // Advanced State
    const [formData, setFormData] = useState({
        title: '',
        assignment_type: 'homework' as AssignmentType,
        classroom_id: classIdFromUrl ? parseInt(classIdFromUrl) : undefined as number | undefined,
        subject_id: undefined as number | undefined,
        due_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        due_time: '23:59',
        blocks: [] as Block[],
        submission_type: 'both' as 'file' | 'text' | 'both',
        max_attempts: 1,
        allow_late: false,
        auto_close: true,
        is_graded: true,
        max_score: 10,
        rubric: ''
    });

    useEffect(() => {
        loadInitialData();
        if (id) {
            loadHomework(parseInt(id));
        } else if (formData.blocks.length === 0) {
            setFormData(prev => ({
                ...prev,
                blocks: [{ id: Math.random().toString(36), type: 'instructions', content: '' }]
            }));
        }
    }, [id]);

    const loadHomework = async (hwId: number) => {
        try {
            setIsLoading(true);
            const res = await homeworkApi.get(hwId);
            const homework = (res as any).data;
            
            // Parse blocks from description
            let blocks: Block[] = [];
            try {
                blocks = JSON.parse(homework.description);
            } catch (e) {
                // Fallback if not JSON
                blocks = [{ id: Math.random().toString(36), type: 'instructions', content: homework.description }];
            }

            setFormData({
                title: homework.title,
                assignment_type: homework.assignment_type || 'homework',
                classroom_id: homework.classroom_id,
                subject_id: homework.subject_id,
                due_date: format(new Date(homework.due_date), 'yyyy-MM-dd'),
                due_time: format(new Date(homework.due_date), 'HH:mm'),
                blocks: blocks,
                submission_type: homework.submission_type || 'both',
                max_attempts: homework.max_attempts || 1,
                allow_late: homework.allow_late || false,
                auto_close: homework.auto_close ?? true,
                is_graded: homework.is_graded ?? true,
                max_score: homework.max_score || 10,
                rubric: homework.rubric || ''
            });
        } catch (err) {
            notify('error', 'Fetch Failed', 'Could not load assignment details.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadInitialData = async () => {
        try {
            const [classesRes, subjectsRes] = await Promise.all([
                getClassrooms(),
                getSubjectList({ limit: 1000 })
            ]);
            setClassrooms(classesRes.data);
            setSubjects(subjectsRes.data);
        } catch (err) {
            notify('error', 'Sync Failed', 'Failed to synchronize academic data.');
        }
    };

    // Derived Insights
    const targetStudentsCount = useMemo(() => {
        const cls = classrooms.find(c => c.id === formData.classroom_id);
        return cls?.student_count || 0;
    }, [formData.classroom_id, classrooms]);

    // Block Handlers
    const addBlock = (type: BlockType) => {
        const newBlock: Block = {
            id: Math.random().toString(36),
            type,
            content: type === 'mcq' ? { question: '', options: ['', '', '', ''], correct: 0 } :
                type === 'link' ? { url: '', label: '' } :
                    type === 'attachment' ? { name: '', url: '' } : ''
        };
        setFormData(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
    };

    const updateBlock = (id: string, content: any) => {
        setFormData(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === id ? { ...b, content } : b)
        }));
    };

    const removeBlock = (id: string) => {
        setFormData(prev => ({
            ...prev,
            blocks: prev.blocks.filter(b => b.id !== id)
        }));
    };

    const applyTemplate = (key: keyof typeof TEMPLATES) => {
        const template = TEMPLATES[key];
        setFormData(prev => ({
            ...prev,
            title: template.title,
            blocks: template.blocks.map(b => ({ ...b, id: Math.random().toString(36) }))
        }));
        notify('success', 'Template Applied', `Switched to ${key} structure.`);
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            notify('warning', 'Missing Title', 'Please define a title for the assignment.');
            return;
        }

        try {
            setIsLoading(true);

            // Combine date and time for the backend
            const combinedDue = `${formData.due_date}T${formData.due_time}:00`;

            const payload = {
                ...formData,
                due_date: combinedDue,
                description: JSON.stringify(formData.blocks),
            };

            if (id) {
                await homeworkApi.update(parseInt(id), payload);
            } else {
                await homeworkApi.create(payload);
            }

            notify('success', 'Assignment Dispatched', 'Changes synchronized across all student accounts.');
            navigate('/homework');
        } catch (err) {
            notify('error', 'Dispatch Error', 'Could not persist assignment data.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FBFBFE] flex flex-col font-sans selection:bg-primary/10 selection:text-indigo-900">
            {/* Unified Top Navigation */}
            <header className="bg-[var(--card-bg)]/80 backdrop-blur-xl border-b border-[var(--card-border)] px-10 py-5 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 flex items-center justify-center bg-slate-50 text-[var(--text-muted)] rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight flex items-center gap-3">
                            {id ? 'Refine Assignment' : 'Craft Assignment'}
                            <span className="px-3 py-1 bg-primary/5 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.1em]">Beta v2</span>
                        </h1>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">
                            {formData.assignment_type} • {targetStudentsCount} Learners Affected
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-3 px-6 py-3 text-[var(--text-muted)] hover:text-[var(--text-main)] text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        <Eye size={18} /> Preview As Student
                    </button>

                    <div className="h-8 w-px bg-slate-100 mx-2" />

                    <button
                        onClick={handleSave}
                        className="group flex items-center gap-4 px-10 py-4 bg-surface-dark text-white rounded-[1.5rem] text-xs font-black uppercase tracking-[0.15em] hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-theme/20"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Zap size={18} className="group-hover:animate-pulse" />
                        )}
                        Assign to Students
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-[1600px] mx-auto flex gap-12 p-12">
                {/* 1. Left Sidebar: Smart Templates */}
                <aside className="w-[280px] shrink-0 flex flex-col gap-8">
                    <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-8 border border-[var(--card-border)] shadow-xl shadow-slate-200/40">
                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-8 flex items-center gap-2">
                            <Zap size={14} className="text-primary" /> Start Faster
                        </h3>
                        <div className="space-y-4">
                            {[
                                { id: 'practice', label: 'Practice Worksheet', icon: ListTodo, color: 'indigo' },
                                { id: 'reading', label: 'Reading Task', icon: BookOpen, color: 'emerald' },
                                { id: 'project', label: 'Project Work', icon: Trophy, color: 'amber' },
                                { id: 'test', label: 'Quick Test', icon: HelpCircle, color: 'rose' }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => applyTemplate(t.id as any)}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-50 hover:border-primary/20 hover:bg-primary/5/30 transition-all group"
                                >
                                    <div className={`w-10 h-10 bg-${t.color}-50 text-${t.color}-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <t.icon size={20} />
                                    </div>
                                    <span className="text-xs font-black text-slate-700">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-primary rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--card-bg)]/10 blur-3xl rounded-full -mr-16 -mt-16" />
                        <h4 className="text-lg font-black tracking-tight mb-4 flex items-center gap-2">
                            <Mic size={20} className="text-indigo-200" /> Voice Input
                        </h4>
                        <p className="text-[10px] text-white/60 leading-relaxed font-bold uppercase tracking-widest mb-6">
                            Tap to dictate instructions
                        </p>
                        <button className="w-full py-4 bg-[var(--card-bg)]/10 hover:bg-[var(--card-bg)]/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                            Hold to speak
                        </button>
                    </div>
                </aside>

                {/* 2. Main Content: Block Builder */}
                <section className="flex-1 space-y-12 max-w-4xl">
                    {/* Basic Context */}
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Enter Assignment Title..."
                            className="w-full text-5xl font-black text-[var(--text-main)] placeholder:text-slate-100 focus:outline-none bg-transparent"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <div className="flex items-center gap-6">
                            <div className="flex p-1 bg-slate-100 rounded-xl">
                                {['practice', 'homework', 'test', 'project'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setFormData({ ...formData, assignment_type: t as any })}
                                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.assignment_type === t ? 'bg-[var(--card-bg)] text-primary shadow-sm' : 'text-[var(--text-muted)] hover:text-slate-600'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Block Area */}
                    <div className="space-y-6 min-h-[600px]">
                        <AnimatePresence>
                            {formData.blocks.map((block) => (
                                <motion.div
                                    key={block.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group relative"
                                >
                                    {/* Block Actions */}
                                    <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={() => removeBlock(block.id)}
                                            className="w-10 h-10 bg-[var(--card-bg)] text-rose-500 border border-[var(--card-border)] rounded-xl flex items-center justify-center shadow-lg hover:bg-rose-50 transition-all"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Block Content */}
                                    <div className={`bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)] shadow-sm p-8 focus-within:shadow-xl focus-within:shadow-theme/10/50 focus-within:border-indigo-200 transition-all`}>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 bg-slate-50 text-[var(--text-muted)] rounded-lg flex items-center justify-center">
                                                {block.type === 'instructions' && <FileText size={16} />}
                                                {block.type === 'question' && <HelpCircle size={16} />}
                                                {block.type === 'mcq' && <Layout size={16} />}
                                                {block.type === 'attachment' && <Paperclip size={16} />}
                                                {block.type === 'link' && <LinkIcon size={16} />}
                                            </div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{block.type} Block</span>
                                        </div>

                                        {block.type === 'instructions' && (
                                            <textarea
                                                className="w-full text-lg font-medium text-slate-700 focus:outline-none resize-none leading-relaxed"
                                                placeholder="Write instructions here..."
                                                rows={3}
                                                value={block.content}
                                                onChange={e => updateBlock(block.id, e.target.value)}
                                            />
                                        )}

                                        {block.type === 'question' && (
                                            <div className="space-y-4">
                                                <input
                                                    className="w-full text-xl font-black text-[var(--text-main)] focus:outline-none"
                                                    placeholder="Type your question..."
                                                    value={block.content}
                                                    onChange={e => updateBlock(block.id, e.target.value)}
                                                />
                                                <div className="flex items-center gap-4 text-slate-300">
                                                    <button className="p-2 hover:text-[var(--text-main)] transition-all font-serif font-black">B</button>
                                                    <button className="p-2 hover:text-[var(--text-main)] transition-all font-serif italic">I</button>
                                                    <button className="p-2 hover:text-[var(--text-main)] transition-all"><LinkIcon size={16} /></button>
                                                </div>
                                            </div>
                                        )}

                                        {block.type === 'mcq' && (
                                            <div className="space-y-8">
                                                <input
                                                    className="w-full text-xl font-black text-[var(--text-main)] focus:outline-none"
                                                    placeholder="Question description..."
                                                    value={block.content.question}
                                                    onChange={e => updateBlock(block.id, { ...block.content, question: e.target.value })}
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    {block.content.options.map((opt: string, i: number) => (
                                                        <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-[var(--card-border)] group/opt">
                                                            <button
                                                                onClick={() => updateBlock(block.id, { ...block.content, correct: i })}
                                                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${block.content.correct === i ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-[var(--card-bg)]'}`}
                                                            >
                                                                {block.content.correct === i && <CheckCircle2 size={12} />}
                                                            </button>
                                                            <input
                                                                className="flex-1 bg-transparent text-sm font-bold text-slate-700 focus:outline-none"
                                                                placeholder={`Option ${i + 1}`}
                                                                value={opt}
                                                                onChange={e => {
                                                                    const opts = [...block.content.options];
                                                                    opts[i] = e.target.value;
                                                                    updateBlock(block.id, { ...block.content, options: opts });
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {block.type === 'link' && (
                                            <div className="flex items-center gap-6">
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2">Label</label>
                                                    <input
                                                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-[var(--text-main)] focus:ring-4 focus:ring-indigo-500/5 outline-none"
                                                        placeholder="e.g. Reference Video"
                                                        value={block.content.label}
                                                        onChange={e => updateBlock(block.id, { ...block.content, label: e.target.value })}
                                                    />
                                                </div>
                                                <div className="flex-[2] space-y-2">
                                                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2">URL</label>
                                                    <input
                                                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-[var(--text-main)] focus:ring-4 focus:ring-indigo-500/5 outline-none"
                                                        placeholder="https://..."
                                                        value={block.content.url}
                                                        onChange={e => updateBlock(block.id, { ...block.content, url: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Block Inserter */}
                        <div className="py-12 flex flex-col items-center gap-8 group">
                            <div className="h-px w-full bg-slate-100 group-hover:bg-primary/10 transition-all relative">
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FBFBFE] px-6">
                                    <Plus className="text-slate-300 group-hover:text-indigo-400 transition-all" size={24} />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {[
                                    { id: 'instructions', label: 'Instructions', icon: FileText },
                                    { id: 'question', label: 'Question', icon: HelpCircle },
                                    { id: 'mcq', label: 'MCQ', icon: Layout },
                                    { id: 'attachment', label: 'File', icon: Paperclip },
                                    { id: 'link', label: 'Link', icon: LinkIcon }
                                ].map(b => (
                                    <button
                                        key={b.id}
                                        onClick={() => addBlock(b.id as any)}
                                        className="flex flex-col items-center gap-3 px-6 py-4 rounded-2xl hover:bg-[var(--card-bg)] hover:shadow-xl hover:shadow-theme/10/50 transition-all group/btn"
                                    >
                                        <div className="w-12 h-12 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl flex items-center justify-center text-[var(--text-muted)] group-hover/btn:text-primary group-hover/btn:border-indigo-100 transition-all">
                                            <b.icon size={20} />
                                        </div>
                                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest group-hover/btn:text-[var(--text-main)] transition-all">{b.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Right Sidebar: Dispatch Settings */}
                <aside className="w-[380px] shrink-0 space-y-10">
                    <div className="bg-[var(--card-bg)] rounded-[3rem] p-10 border border-[var(--card-border)] shadow-2xl shadow-slate-200/30 space-y-12 sticky top-28">
                        <div className="space-y-10">
                            <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[0.2em] flex items-center gap-4">
                                <Target size={20} className="text-primary" /> Target Audience
                            </h3>

                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Classroom Selection</label>
                                    <select
                                        className="w-full bg-slate-50 border border-[var(--card-border)] rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all appearance-none"
                                        value={formData.classroom_id || ''}
                                        onChange={(e) => setFormData({ ...formData, classroom_id: e.target.value ? parseInt(e.target.value) : undefined })}
                                    >
                                        <option value="">Choose Classroom</option>
                                        {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Subject Category</label>
                                    <select
                                        className="w-full bg-slate-50 border border-[var(--card-border)] rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all appearance-none"
                                        value={formData.subject_id || ''}
                                        onChange={(e) => setFormData({ ...formData, subject_id: e.target.value ? parseInt(e.target.value) : undefined })}
                                    >
                                        <option value="">Choose Subject</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>

                                <div className="p-6 bg-primary/5 rounded-[2rem] border border-indigo-100 flex items-center gap-6">
                                    <div className="w-14 h-14 bg-[var(--card-bg)] rounded-2xl shadow-lg flex items-center justify-center text-primary font-black text-xl">
                                        {targetStudentsCount}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Active Learners</p>
                                        <p className="text-xs font-medium text-primary mt-1">Will receive immediate push notification.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10 pt-12 border-t border-slate-50">
                            <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[0.2em] flex items-center gap-4">
                                <Clock size={20} className="text-rose-500" /> Deadline Policy
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Due Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-[var(--card-border)] rounded-2xl px-6 py-4 text-xs font-bold focus:outline-none transition-all"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Due Time</label>
                                    <input
                                        type="time"
                                        className="w-full bg-slate-50 border border-[var(--card-border)] rounded-2xl px-6 py-4 text-xs font-bold focus:outline-none transition-all"
                                        value={formData.due_time}
                                        onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${formData.allow_late ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Allow Late Submission</span>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, allow_late: !formData.allow_late })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${formData.allow_late ? 'bg-primary' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-[var(--card-bg)] rounded-full transition-all ${formData.allow_late ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${formData.auto_close ? 'bg-rose-500' : 'bg-slate-300'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Auto-Close on Due</span>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, auto_close: !formData.auto_close })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${formData.auto_close ? 'bg-primary' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-[var(--card-bg)] rounded-full transition-all ${formData.auto_close ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10 pt-12 border-t border-slate-50">
                            <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[0.2em] flex items-center gap-4">
                                <Trophy size={20} className="text-emerald-500" /> Evaluation
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Enable Grading</span>
                                    <button
                                        onClick={() => setFormData({ ...formData, is_graded: !formData.is_graded })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${formData.is_graded ? 'bg-primary' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-[var(--card-bg)] rounded-full transition-all ${formData.is_graded ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                {formData.is_graded && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2">Max Points</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border border-[var(--card-border)] rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none transition-all"
                                                value={formData.max_score}
                                                onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            {/* Student Preview Modal */}
            <AnimatePresence>
                {showPreview && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-20">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 modal-overlay backdrop-blur-md"
                            onClick={() => setShowPreview(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="bg-[#F8F9FD] w-full max-w-[420px] h-[850px] rounded-[4rem] border-[12px] border-slate-900 shadow-2xl relative overflow-hidden flex flex-col"
                        >
                            {/* iPhone-style top */}
                            <div className="h-10 w-40 bg-surface-dark absolute top-0 left-1/2 -translate-x-1/2 rounded-b-3xl z-50 flex items-center justify-center">
                                <div className="w-12 h-1 bg-[var(--card-bg)]/20 rounded-full" />
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-16">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-10 h-10 bg-[var(--card-bg)] rounded-xl shadow-sm flex items-center justify-center">
                                        <ChevronLeft size={20} className="text-[var(--text-muted)]" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Assignment Details</span>
                                    <div className="w-10 h-10" />
                                </div>

                                <div className="space-y-8">
                                    <div className="p-6 bg-primary rounded-[2.5rem] text-white shadow-xl shadow-theme/10">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{formData.assignment_type}</p>
                                        <h3 className="text-2xl font-black leading-tight">{formData.title || 'Untitled Assignment'}</h3>
                                        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/10">
                                            <div className="flex items-center gap-2">
                                                <Clock size={12} className="opacity-60" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Due {formData.due_date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {formData.blocks.map(block => (
                                            <div key={block.id} className="p-6 bg-[var(--card-bg)] rounded-3xl shadow-sm border border-[var(--card-border)]">
                                                {block.type === 'instructions' && (
                                                    <p className="text-sm font-medium text-slate-600 leading-relaxed">{block.content}</p>
                                                )}
                                                {block.type === 'question' && (
                                                    <div className="space-y-4">
                                                        <p className="text-sm font-black text-[var(--text-main)]">{block.content}</p>
                                                        <textarea className="w-full bg-slate-50 rounded-2xl p-4 text-xs font-medium border-none h-24 placeholder:text-slate-300" placeholder="Type your answer..." />
                                                    </div>
                                                )}
                                                {block.type === 'mcq' && (
                                                    <div className="space-y-4">
                                                        <p className="text-sm font-black text-[var(--text-main)]">{block.content.question}</p>
                                                        <div className="space-y-2">
                                                            {block.content.options.map((opt: string, i: number) => (
                                                                <div key={i} className="p-4 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-600 border border-transparent hover:border-primary/20 hover:bg-primary/5/50 transition-all cursor-pointer">
                                                                    {opt}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <button className="w-full py-5 bg-surface-dark text-white rounded-3xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 mt-8">
                                        Submit Assignment
                                    </button>
                                </div>
                            </div>

                            {/* Sticky Bottom bar for mobile preview */}
                            <div className="p-8 bg-[var(--card-bg)] border-t border-slate-50 flex items-center justify-around">
                                <Smartphone size={20} className="text-primary" />
                                <Layout size={20} className="text-slate-200" />
                                <CheckCircle2 size={20} className="text-slate-200" />
                                <Settings size={20} className="text-slate-200" />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
