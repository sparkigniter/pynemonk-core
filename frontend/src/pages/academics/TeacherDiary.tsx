import { useState, useEffect, useMemo, useRef } from 'react';
import {
    StickyNote,
    Plus,
    BookOpen,
    Users,
    CheckCircle2,
    Circle,
    Clock,
    ChevronLeft,
    ChevronRight,
    Trash2,
    BookCheck,
    Mic,
    MicOff,
    Image as ImageIcon,
    Sparkles,
    ArrowRight,
    PlayCircle,
    X
} from 'lucide-react';
import { teacherNoteApi, type TeacherNote } from '../../api/teacher-note.api';
import { useNavigate } from 'react-router-dom';
import { getClassrooms, type Classroom } from '../../api/classroom.api';
import { getSubjectList, type Subject } from '../../api/subject.api';
import { TimetableApi, type TimetableEntry } from '../../api/timetable.api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeacherDiary() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { notify } = useNotification();

    // Core State
    const [notes, setNotes] = useState<TeacherNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showAddModal, setShowAddModal] = useState(false);

    // Academic Data
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);

    // Form State
    const [newNote, setNewNote] = useState({
        content: '',
        classroom_id: undefined as number | undefined,
        subject_id: undefined as number | undefined,
        attachment_url: ''
    });

    // Voice State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    // NLP Suggestions
    const [suggestion, setSuggestion] = useState<{ type: 'homework' | 'event', text: string } | null>(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadNotes();
    }, [selectedDate]);

    const loadInitialData = async () => {
        try {
            const [classesRes, subjectsRes, timetableRes] = await Promise.all([
                getClassrooms(),
                getSubjectList({ limit: 1000 }),
                TimetableApi.getGlobalSchedule()
            ]);
            setClassrooms(classesRes.data);
            setSubjects(subjectsRes.data);
            // Filter for current teacher
            const mySchedule = timetableRes.filter((t: any) => String(t.teacher_user_id) === String(user?.sub));
            setTimetable(mySchedule);
        } catch (err) {
            notify('error', 'Load Failed', 'Could not load classroom data');
        }
    };

    const ongoingClass = useMemo(() => {
        if (!timetable.length) return null;
        const now = new Date();
        // Only show contextual class if viewing today
        if (!isSameDay(selectedDate, now)) return null;

        const currentDay = now.getDay() || 7;
        const nowTime = now.getHours() * 60 + now.getMinutes();

        return timetable.find(t => {
            if (t.day_of_week !== currentDay) return false;
            const [sH, sM] = t.start_time.split(':').map(Number);
            const [eH, eM] = t.end_time.split(':').map(Number);
            const startTime = sH * 60 + sM;
            const endTime = eH * 60 + eM;
            // Buffer: consider it ongoing if it finished in the last 30 mins too
            return nowTime >= startTime && nowTime < (endTime + 30);
        });
    }, [timetable, selectedDate]);

    const loadNotes = async () => {
        try {
            setIsLoading(true);
            const data = await teacherNoteApi.list({
                startDate: format(selectedDate, 'yyyy-MM-dd'),
                endDate: format(selectedDate, 'yyyy-MM-dd')
            });
            setNotes(data);
        } catch (err) {
            notify('error', 'Error', 'Failed to fetch notes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.content.trim()) return;
        try {
            await teacherNoteApi.create({
                ...newNote,
                note_date: format(selectedDate, 'yyyy-MM-dd')
            });
            setNewNote({ content: '', classroom_id: undefined, subject_id: undefined, attachment_url: '' });
            setShowAddModal(false);
            setSuggestion(null);
            loadNotes();
            notify('success', 'Note Created', 'Your smart note has been saved');
        } catch (err) {
            notify('error', 'Failed', 'Could not save your note');
        }
    };

    // Contextual Pre-fill
    useEffect(() => {
        if (showAddModal && ongoingClass && !newNote.classroom_id) {
            setNewNote(prev => ({
                ...prev,
                classroom_id: ongoingClass.classroom_id,
                subject_id: ongoingClass.subject_id
            }));
            notify('info', 'Context Detected', `Pre-filling for ${ongoingClass.subject_name} in ${ongoingClass.classroom_name}`);
        }
    }, [showAddModal, ongoingClass]);

    // NLP Intent Detection
    useEffect(() => {
        const content = newNote.content.toLowerCase();
        if (content.includes('remind me to grade') || content.includes('homework') || content.includes('assignment')) {
            setSuggestion({ type: 'homework', text: 'Promote to Homework?' });
        } else if (content.includes('schedule') || content.includes('event') || content.includes('meeting')) {
            setSuggestion({ type: 'event', text: 'Add to Calendar?' });
        } else {
            setSuggestion(null);
        }
    }, [newNote.content]);

    // Voice Integration
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            notify('warning', 'Not Supported', 'Voice recognition is not supported in this browser.');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onerror = () => setIsListening(false);

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setNewNote(prev => ({ ...prev, content: prev.content + ' ' + transcript }));
        };

        recognitionRef.current.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    const toggleComplete = async (note: TeacherNote) => {
        try {
            await teacherNoteApi.update(note.id, { is_completed: !note.is_completed });
            loadNotes();
        } catch (err) {
            notify('error', 'Error', 'Failed to update status');
        }
    };

    const deleteNote = async (id: number) => {
        if (!confirm('Are you sure you want to delete this note?')) return;
        try {
            await teacherNoteApi.update(id, { is_deleted: true });
            loadNotes();
            notify('info', 'Deleted', 'Note removed successfully');
        } catch (err) {
            notify('error', 'Error', 'Failed to delete note');
        }
    };

    const handlePromoteToHomework = (note: TeacherNote) => {
        if (!note.classroom_id || !note.subject_id) {
            notify('warning', 'Context Missing', 'Please set a Class and Subject for this note before promoting.');
            return;
        }

        navigate('/homework/new', {
            state: {
                preFill: {
                    title: `Homework: ${note.subject_name || 'Assignment'}`,
                    description: note.content,
                    classroom_id: note.classroom_id,
                    subject_id: note.subject_id
                }
            }
        });
    };

    return (
        <div className="p-8 bg-[#FBFBFE] min-h-[calc(100vh-100px)] rounded-[3.5rem] border border-[var(--card-border)] shadow-2xl relative flex flex-col overflow-hidden">

            {/* Header */}
            <header className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-amber-500 rounded-[2rem] text-white flex items-center justify-center shadow-2xl shadow-amber-200 rotate-3">
                        <StickyNote size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Smart Session Diary</h1>
                        <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-2">
                            <Sparkles size={14} className="text-amber-500" /> AI-Enhanced Workspace
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] p-2 shadow-sm">
                        <button
                            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                            className="p-3 hover:bg-slate-50 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-2xl transition-all"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="px-8 flex flex-col items-center">
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{format(selectedDate, 'EEEE')}</span>
                            <span className="text-sm font-black text-[var(--text-main)]">{format(selectedDate, 'MMM do, yyyy')}</span>
                        </div>
                        <button
                            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                            className="p-3 hover:bg-slate-50 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-2xl transition-all"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-3 px-10 py-5 bg-surface-dark text-white rounded-[2rem] text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-theme/20"
                    >
                        <Plus size={20} />
                        Quick Note
                    </button>
                </div>
            </header>

            {/* Contextual Intelligence Banner */}
            {ongoingClass && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 p-6 bg-primary rounded-[2.5rem] text-white flex items-center justify-between shadow-2xl shadow-theme/10"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-[var(--card-bg)]/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <PlayCircle size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Active/Recent Class Detected</p>
                            <h3 className="text-lg font-black">{ongoingClass.subject_name} with {ongoingClass.classroom_name}</h3>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3 bg-[var(--card-bg)] text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-colors"
                    >
                        Log Session Notes
                    </button>
                </motion.div>
            )}

            {/* Notes Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader />
                    </div>
                ) : notes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <div className="w-32 h-32 bg-slate-100 rounded-[3.5rem] flex items-center justify-center mb-8">
                            <StickyNote size={56} className="text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Blank Canvas</h3>
                        <p className="text-[var(--text-muted)] font-medium mt-2 text-center max-w-xs leading-relaxed">Your smart notes will appear here. Start by logging your first class session.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-12">
                        <AnimatePresence>
                            {notes.map((note) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    key={note.id}
                                    className={`group relative bg-[var(--card-bg)] rounded-[3rem] border border-[var(--card-border)] shadow-2xl shadow-slate-200/40 p-8 transition-all hover:shadow-theme/10 hover:-translate-y-2 ${note.is_completed ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                >
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="flex flex-col gap-2">
                                            {note.classroom_name && (
                                                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 text-primary rounded-full text-[9px] font-black uppercase tracking-widest">
                                                    <Users size={12} />
                                                    {note.classroom_name}
                                                </span>
                                            )}
                                            {note.subject_name && (
                                                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                    <BookOpen size={12} />
                                                    {note.subject_name}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => toggleComplete(note)}
                                            className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all ${note.is_completed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-300 hover:text-primary hover:bg-primary/5'}`}
                                        >
                                            {note.is_completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                        </button>
                                    </div>

                                    <p className={`text-slate-700 font-bold text-lg leading-relaxed mb-10 ${note.is_completed ? 'line-through decoration-slate-300' : ''}`}>
                                        {note.content}
                                    </p>

                                    <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                                        <div className="flex items-center gap-3 text-[var(--text-muted)] font-black uppercase text-[10px] tracking-[0.2em]">
                                            <Clock size={16} />
                                            {format(new Date(note.created_at), 'h:mm a')}
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => handlePromoteToHomework(note)}
                                                className="w-10 h-10 flex items-center justify-center bg-primary/5 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                                title="Convert to Homework"
                                            >
                                                <BookCheck size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteNote(note.id)}
                                                className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Accent Decoration */}
                                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-50 rounded-full blur-2xl opacity-40 pointer-events-none group-hover:bg-primary/5 transition-colors" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Add Note Modal with Advanced Features */}
            <AnimatePresence>
                {showAddModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setShowAddModal(false); stopListening(); }}
                            className="fixed inset-0 z-[100] modal-overlay backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 40 }}
                            className="fixed inset-0 m-auto w-full max-w-2xl h-fit bg-[var(--card-bg)] rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] z-[110] overflow-hidden"
                        >
                            <div className="p-12">
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tight">Smart Note</h2>
                                        <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-[10px] mt-2">Enhanced with Voice & Context Intelligence</p>
                                    </div>
                                    <button
                                        onClick={() => { setShowAddModal(false); stopListening(); }}
                                        className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    {/* Class Selection Grid */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 block">Classroom</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-slate-50 border border-[var(--card-border)] rounded-[1.5rem] px-8 py-5 text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                                                    value={newNote.classroom_id || ''}
                                                    onChange={(e) => setNewNote({ ...newNote, classroom_id: e.target.value ? parseInt(e.target.value) : undefined })}
                                                >
                                                    <option value="">Select Class</option>
                                                    {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                                <Users size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 block">Subject</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-slate-50 border border-[var(--card-border)] rounded-[1.5rem] px-8 py-5 text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                                                    value={newNote.subject_id || ''}
                                                    onChange={(e) => setNewNote({ ...newNote, subject_id: e.target.value ? parseInt(e.target.value) : undefined })}
                                                >
                                                    <option value="">Select Subject</option>
                                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                                <BookOpen size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Area with Voice Button */}
                                    <div className="relative">
                                        <textarea
                                            className="w-full bg-slate-50 border border-[var(--card-border)] rounded-[2.5rem] px-10 py-8 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all min-h-[250px] placeholder:text-slate-300"
                                            placeholder="Start writing or use voice note..."
                                            value={newNote.content}
                                            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                        />

                                        {/* Voice Button */}
                                        <button
                                            onClick={isListening ? stopListening : startListening}
                                            className={`absolute bottom-6 right-6 w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all shadow-2xl ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-[var(--card-bg)] text-primary hover:bg-slate-50'}`}
                                        >
                                            {isListening ? <MicOff size={28} /> : <Mic size={28} />}
                                        </button>

                                        {/* Media Button */}
                                        <button
                                            className="absolute bottom-6 right-24 w-16 h-16 bg-[var(--card-bg)] rounded-[1.5rem] flex items-center justify-center text-[var(--text-muted)] hover:text-primary transition-all border border-[var(--card-border)]"
                                            onClick={() => notify('info', 'Feature Coming', 'Media upload is being integrated.')}
                                        >
                                            <ImageIcon size={28} />
                                        </button>
                                    </div>

                                    {/* AI Suggestion Banner */}
                                    <AnimatePresence>
                                        {suggestion && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="p-5 bg-amber-50 border border-amber-100 rounded-[1.5rem] flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Sparkles className="text-amber-500" size={20} />
                                                    <span className="text-xs font-black text-amber-700 uppercase tracking-widest">{suggestion.text}</span>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button className="px-4 py-2 bg-amber-200 text-amber-900 rounded-xl text-[10px] font-black uppercase tracking-widest">Yes, Create</button>
                                                    <button onClick={() => setSuggestion(null)} className="px-4 py-2 text-amber-400 text-[10px] font-black uppercase tracking-widest">Ignore</button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="flex items-center gap-6 mt-12">
                                    <button
                                        onClick={() => { setShowAddModal(false); stopListening(); }}
                                        className="flex-1 py-6 text-[var(--text-muted)] font-black uppercase text-xs tracking-widest hover:text-[var(--text-main)] transition-all"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        onClick={handleAddNote}
                                        className="flex-[2] py-6 bg-surface-dark text-white rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-2xl shadow-theme/20 flex items-center justify-center gap-4"
                                    >
                                        Save Smart Note <ArrowRight size={20} />
                                    </button>
                                </div>
                                </div>
                            </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

const Loader = () => (
    <div className="relative">
        <div className="w-16 h-16 border-4 border-amber-50 border-t-amber-500 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
            <StickyNote size={20} className="text-amber-200" />
        </div>
    </div>
);
