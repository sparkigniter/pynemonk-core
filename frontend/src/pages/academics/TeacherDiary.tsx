import { useState, useEffect } from 'react';
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
    Edit3
} from 'lucide-react';
import { teacherNoteApi, type TeacherNote } from '../../api/teacher-note.api';
import { getClassrooms, type Classroom } from '../../api/classroom.api';
import { getSubjectList, type Subject } from '../../api/subject.api';
import { useNotification } from '../../contexts/NotificationContext';
import { format, addDays, subDays } from 'date-fns';

export default function TeacherDiary() {
    const { notify } = useNotification();
    const [notes, setNotes] = useState<TeacherNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Form State
    const [newNote, setNewNote] = useState({
        content: '',
        classroom_id: undefined as number | undefined,
        subject_id: undefined as number | undefined
    });

    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadNotes();
    }, [selectedDate]);

    const loadInitialData = async () => {
        try {
            const [classesRes, subjectsRes] = await Promise.all([
                getClassrooms(),
                getSubjectList({ limit: 1000 })
            ]);
            setClassrooms(classesRes.data);
            setSubjects(subjectsRes.data);
        } catch (err) {
            notify('error', 'Load Failed', 'Could not load classroom data');
        }
    };

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
            setNewNote({ content: '', classroom_id: undefined, subject_id: undefined });
            setShowAddModal(false);
            loadNotes();
            notify('success', 'Note Created', 'Your smart note has been saved');
        } catch (err) {
            notify('error', 'Failed', 'Could not save your note');
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

    return (
        <div className="p-8 bg-slate-50 min-h-[calc(100vh-100px)] rounded-[3rem] border border-slate-200 shadow-2xl relative flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between mb-12">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm">
                            <StickyNote size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Teacher's Smart Diary</h1>
                            <p className="text-slate-500 font-medium">Your personal companion for session planning and reminders.</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                        <button 
                            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                            className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="px-6 flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(selectedDate, 'EEEE')}</span>
                            <span className="text-sm font-black text-slate-800">{format(selectedDate, 'MMM do, yyyy')}</span>
                        </div>
                        <button 
                            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                            className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-900/20"
                    >
                        <Plus size={18} />
                        New Note
                    </button>
                </div>
            </header>

            {/* Notes Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                    </div>
                ) : notes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <div className="w-24 h-24 bg-slate-200 rounded-[2.5rem] flex items-center justify-center mb-6">
                            <StickyNote size={40} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-black text-slate-600 tracking-tight">No notes for this day</h3>
                        <p className="text-slate-400 font-medium mt-1 text-center max-w-xs">Start planning your lessons or add reminders for your upcoming classes.</p>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="mt-8 text-amber-600 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
                        >
                            <Plus size={14} /> Add your first note
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
                        {notes.map((note) => (
                            <div 
                                key={note.id} 
                                className={`group relative bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 transition-all hover:-translate-y-2 ${note.is_completed ? 'opacity-60 grayscale-[0.5]' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex flex-col gap-2">
                                        {note.classroom_name && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                <Users size={10} />
                                                {note.classroom_name}
                                            </span>
                                        )}
                                        {note.subject_name && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                <BookOpen size={10} />
                                                {note.subject_name}
                                            </span>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => toggleComplete(note)}
                                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${note.is_completed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-50 text-slate-300 hover:text-slate-400'}`}
                                    >
                                        {note.is_completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                    </button>
                                </div>

                                <p className={`text-slate-700 font-bold leading-relaxed mb-8 ${note.is_completed ? 'line-through decoration-slate-300' : ''}`}>
                                    {note.content}
                                </p>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-slate-400 font-black uppercase text-[9px] tracking-widest">
                                        <Clock size={12} />
                                        {format(new Date(note.created_at), 'h:mm a')}
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button className="p-2 text-slate-400 hover:text-slate-900 transition-all">
                                            <Edit3 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => deleteNote(note.id)}
                                            className="p-2 text-slate-400 hover:text-rose-500 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Sticky note corner effect */}
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-slate-50 to-transparent pointer-events-none rounded-tr-[2.5rem]" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Note Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Create Smart Note</h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Context (Optional)</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all appearance-none"
                                            value={newNote.classroom_id || ''}
                                            onChange={(e) => setNewNote({ ...newNote, classroom_id: e.target.value ? parseInt(e.target.value) : undefined })}
                                        >
                                            <option value="">Select Class</option>
                                            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all appearance-none"
                                            value={newNote.subject_id || ''}
                                            onChange={(e) => setNewNote({ ...newNote, subject_id: e.target.value ? parseInt(e.target.value) : undefined })}
                                        >
                                            <option value="">Select Subject</option>
                                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">What's on your mind?</label>
                                    <textarea 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all min-h-[200px] placeholder:text-slate-300"
                                        placeholder="Plan your session, set reminders, or jot down observations..."
                                        value={newNote.content}
                                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mt-10">
                                <button 
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-600 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleAddNote}
                                    className="flex-[2] py-4 bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 active:scale-95 transition-all shadow-xl shadow-amber-500/20"
                                >
                                    Save Note
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
