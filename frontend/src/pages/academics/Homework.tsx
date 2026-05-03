import { useState, useEffect, useRef } from 'react';
import { 
    BookCheck, 
    Plus, 
    Calendar, 
    Users, 
    BookOpen, 
    Camera, 
    Trash2, 
    Clock, 
    ChevronRight,
    FileImage
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { homeworkApi, type Homework } from '../../api/homework.api';
import { useNotification } from '../../contexts/NotificationContext';
import { format } from 'date-fns';

export default function HomeworkPage() {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [homeworks, setHomeworks] = useState<Homework[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadHomework();
    }, []);

    const loadHomework = async () => {
        try {
            setIsLoading(true);
            const data = await homeworkApi.list({});
            setHomeworks(data);
        } catch (err) {
            notify('error', 'Error', 'Failed to fetch homeworks');
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickSnap = () => {
        notify('info', 'Scanner Ready', 'Opening camera to scan blackboard...');
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            navigate('/homework/new', { 
                state: { 
                    preFill: { 
                        attachment_url: url,
                        title: `Homework: ${format(new Date(), 'MMM do')}`
                    } 
                } 
            });
            notify('success', 'Image Captured', 'Board photo ready for assignment');
        }
    };

    const deleteHomework = async (id: number) => {
        if (!confirm('Are you sure you want to remove this assignment?')) return;
        try {
            await homeworkApi.delete(id);
            loadHomework();
            notify('info', 'Removed', 'Assignment deleted');
        } catch (err) {
            notify('error', 'Error', 'Failed to delete');
        }
    };

    return (
        <div className="p-8 bg-slate-50 min-h-[calc(100vh-100px)] rounded-[3rem] border border-slate-200 shadow-2xl relative flex flex-col overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full" />

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200 ring-8 ring-indigo-50">
                        <BookCheck size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Smart Homework</h1>
                        <p className="text-slate-500 font-semibold mt-1">Zero-friction assignments for your students.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md p-2 rounded-[2.5rem] border border-white/20 shadow-xl">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <button 
                        onClick={handleQuickSnap}
                        className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20"
                    >
                        <Camera size={20} />
                        Snap Board
                    </button>
                    <button 
                        onClick={() => navigate('/homework/new')}
                        className="flex items-center justify-center w-14 h-14 bg-indigo-100 text-indigo-600 rounded-[2rem] hover:bg-indigo-200 transition-all shadow-lg shadow-indigo-100"
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </header>

            {/* Quick Actions / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 relative z-10">
                {[
                    { label: 'Upcoming', value: homeworks.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Completed', value: 0, icon: BookCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Submissions', value: 0, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Templates', value: '8', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 shadow-lg group hover:bg-white transition-all">
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all`}>
                            <stat.icon size={24} />
                        </div>
                        <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : homeworks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-20">
                        <div className="w-32 h-32 bg-slate-100 rounded-[3rem] flex items-center justify-center mb-8 animate-pulse">
                            <BookCheck size={48} className="text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">No assignments yet</h3>
                        <p className="text-slate-500 font-medium mt-2 max-w-sm text-center">Give your students something to learn! Use "Snap Board" to assign work in seconds.</p>
                        <button 
                            onClick={handleQuickSnap}
                            className="mt-10 flex items-center gap-3 px-10 py-5 bg-indigo-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 shadow-2xl shadow-indigo-200 transition-all"
                        >
                            <Camera size={18} /> Assign First Homework
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                        {homeworks.map((hw) => (
                            <div key={hw.id} className="group bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 p-8 transition-all hover:-translate-y-2 relative overflow-hidden">
                                {hw.attachment_url && (
                                    <div className="absolute top-0 right-0 w-32 h-32 opacity-10 rotate-12 -mr-8 -mt-8">
                                        <FileImage size={120} className="text-indigo-600" />
                                    </div>
                                )}
                                
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex flex-col gap-2">
                                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {hw.classroom_name}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {hw.subject_name}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</span>
                                        <span className="text-sm font-black text-slate-800 bg-slate-50 px-3 py-1 rounded-xl">{format(new Date(hw.due_date), 'MMM do')}</span>
                                    </div>
                                </div>

                                <h4 className="text-xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-indigo-600 transition-colors">{hw.title}</h4>
                                <p className="text-slate-500 font-medium text-sm leading-relaxed line-clamp-3 mb-8">
                                    {hw.description || 'View attachments for instructions.'}
                                </p>

                                {hw.attachment_url && (
                                    <div className="mb-8 p-1 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden group/img relative">
                                        <img 
                                            src={hw.attachment_url} 
                                            alt="Board Scan" 
                                            className="w-full h-32 object-cover rounded-xl transition-all group-hover/img:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                                            <FileImage className="text-white" />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-slate-400 font-black uppercase text-[9px] tracking-widest">
                                        <Clock size={12} />
                                        Assigned {format(new Date(hw.created_at), 'MMM do')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => deleteHomework(hw.id)}
                                            className="p-3 text-slate-300 hover:text-rose-500 transition-all rounded-xl hover:bg-rose-50"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/homework/${hw.id}/edit`)}
                                            className="flex items-center gap-2 px-5 py-2 bg-slate-50 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                                        >
                                            View
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
