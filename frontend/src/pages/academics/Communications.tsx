import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { communicationApi, type CommunicationTicket, type CommunicationMessage, type RecipientOption } from '../../api/communication.api';
import { 
    MessageSquare, Plus, Search, X, CheckCircle2, 
    Send, ShieldAlert 
} from 'lucide-react';

export default function Communications() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<CommunicationTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<CommunicationTicket | null>(null);
    const [messages, setMessages] = useState<CommunicationMessage[]>([]);
    const [recipientOptions, setRecipientOptions] = useState<RecipientOption[]>([]);
    const [userRole, setUserRole] = useState<'guardian' | 'teacher' | 'admin'>('admin');
    
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'open' | 'resolved' | 'closed' | 'all'>('open');

    // Message reply state
    const [replyText, setReplyText] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        student_id: '',
        teacher_id: '',
        guardian_id: '',
        title: '',
        category: 'general' as any,
        initialMessage: ''
    });

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        fetchTickets();
        fetchRecipientOptions();
    }, []);

    useEffect(() => {
        if (selectedTicket) {
            fetchMessages(selectedTicket.id);
        } else {
            setMessages([]);
        }
    }, [selectedTicket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const data = await communicationApi.listTickets();
            setTickets(data);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecipientOptions = async () => {
        try {
            const response = await communicationApi.getRecipientOptions();
            setUserRole(response.role);
            setRecipientOptions(response.options);
        } catch (error) {
            console.error('Failed to fetch recipient options:', error);
        }
    };

    const fetchMessages = async (ticketId: number) => {
        setMessagesLoading(true);
        try {
            const data = await communicationApi.listMessages(ticketId);
            setMessages(data);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedTicket) return;

        setIsReplying(true);
        try {
            const newMsg = await communicationApi.reply(selectedTicket.id, replyText);
            
            // Format message to display immediately
            const mockMsg: CommunicationMessage = {
                id: newMsg.id,
                ticket_id: selectedTicket.id,
                sender_id: parseInt(user?.sub || '0'),
                message: replyText,
                sender_email: user?.email || '',
                sender_name: user?.email || 'Me',
                sender_role: userRole === 'guardian' ? 'parent' : userRole === 'teacher' ? 'teacher' : 'admin',
                created_at: new Date().toISOString()
            };

            setMessages([...messages, mockMsg]);
            setReplyText('');
            
            // Update tickets list locally
            setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, updated_at: new Date().toISOString() } : t));
        } catch (error) {
            console.error('Failed to reply:', error);
        } finally {
            setIsReplying(false);
        }
    };

    const handleUpdateStatus = async (ticketId: number, status: 'open' | 'resolved' | 'closed') => {
        try {
            await communicationApi.updateStatus(ticketId, status);
            const updated = { ...selectedTicket!, status };
            setSelectedTicket(updated);
            setTickets(tickets.map(t => t.id === ticketId ? { ...t, status } : t));
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.student_id || !formData.title || !formData.initialMessage) return;

        setIsSaving(true);
        try {
            // Find selected recipient option to populate missing FK
            const selectedOpt = recipientOptions.find(o => o.student_id === parseInt(formData.student_id));
            const payload = {
                student_id: parseInt(formData.student_id),
                teacher_id: userRole === 'guardian' ? selectedOpt?.teacher_id : undefined,
                guardian_id: userRole === 'teacher' ? selectedOpt?.guardian_id : undefined,
                title: formData.title,
                type: userRole === 'guardian' ? 'query' as const : 'complaint' as const,
                category: formData.category,
                initialMessage: formData.initialMessage
            };

            await communicationApi.createTicket(payload);
            setShowModal(false);
            setFormData({
                student_id: '',
                teacher_id: '',
                guardian_id: '',
                title: '',
                category: 'general',
                initialMessage: ''
            });
            fetchTickets();
        } catch (error) {
            console.error('Failed to create ticket:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                              t.student_name.toLowerCase().includes(search.toLowerCase());
        
        if (activeTab === 'all') return matchesSearch;
        return matchesSearch && t.status === activeTab;
    });

    return (
        <div className="h-[82vh] flex flex-col gap-6 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <MessageSquare className="text-primary w-8 h-8" />
                        Communication Hub
                    </h1>
                    <p className="text-[var(--text-muted)] font-medium mt-1">Direct query desk and complaint logging between teachers, parents, and administrative directors.</p>
                </div>

                {userRole !== 'admin' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center justify-center gap-3 px-8 py-4 btn-primary rounded-xl hover:opacity-90 transition-all shadow-xl shadow-primary/20 font-bold text-xs uppercase tracking-wider group"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        {userRole === 'guardian' ? 'Ask Teacher / Raise Query' : 'Log Student Complaint'}
                    </button>
                )}
            </div>

            {/* Split double column dashboard */}
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Tickets column (Left) */}
                <div className="w-full lg:w-96 flex flex-col gap-4 bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] p-5 min-h-0 shadow-sm">
                    {/* Search & Filters */}
                    <div className="relative group flex-shrink-0">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search tickets or student..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-[var(--text-muted)]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Quick Filters */}
                    <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl flex-shrink-0">
                        {(['open', 'resolved', 'closed', 'all'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg tracking-wider transition-all ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-grow overflow-y-auto space-y-3 pr-1">
                        {loading ? (
                            <div className="py-20 text-center flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Loading Threads...</span>
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="py-20 text-center text-slate-400">
                                <MessageSquare size={36} className="mx-auto text-slate-200 mb-3" />
                                <p className="text-xs font-bold uppercase tracking-wider">No Tickets Found</p>
                            </div>
                        ) : (
                            filteredTickets.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => setSelectedTicket(t)}
                                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${selectedTicket?.id === t.id ? 'bg-slate-50 border-primary/20 shadow-md' : 'bg-white border-slate-100 hover:bg-slate-50/50'}`}
                                >
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${t.type === 'complaint' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {t.type}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${t.status === 'open' ? 'bg-amber-50 text-amber-600' : t.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {t.status}
                                        </span>
                                    </div>

                                    <h4 className="text-sm font-black text-slate-800 leading-snug line-clamp-2 mb-1.5">{t.title}</h4>
                                    
                                    <div className="flex justify-between items-center text-[10px] font-semibold text-[var(--text-muted)]">
                                        <span className="truncate max-w-[140px]">Student: {t.student_name}</span>
                                        <span>{new Date(t.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Conversation/Thread Column (Right) */}
                <div className="flex-1 flex flex-col bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] overflow-hidden shadow-sm min-w-0">
                    {selectedTicket ? (
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Chat Header */}
                            <div className="px-8 py-5 border-b border-[var(--card-border)] bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 flex-shrink-0">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black bg-slate-900 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                            Category: {selectedTicket.category}
                                        </span>
                                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${selectedTicket.type === 'complaint' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {selectedTicket.type}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight mt-1.5 leading-snug line-clamp-1">{selectedTicket.title}</h3>
                                    <p className="text-[11px] font-semibold text-[var(--text-muted)] mt-0.5">
                                        Student: <strong className="text-slate-700">{selectedTicket.student_name}</strong> · Teacher: <strong className="text-slate-700">{selectedTicket.teacher_name}</strong> · Parent: <strong className="text-slate-700">{selectedTicket.guardian_name}</strong>
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {selectedTicket.status !== 'closed' && (
                                        <button
                                            onClick={() => handleUpdateStatus(selectedTicket.id, selectedTicket.status === 'open' ? 'resolved' : 'closed')}
                                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-1.5"
                                        >
                                            <CheckCircle2 size={13} className="text-emerald-500" />
                                            {selectedTicket.status === 'open' ? 'Mark Resolved' : 'Close Ticket'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Message Stream */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
                                {messagesLoading ? (
                                    <div className="h-full flex flex-col items-center justify-center gap-2">
                                        <div className="w-8 h-8 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Loading Conversation...</span>
                                    </div>
                                ) : (
                                    messages.map((m) => {
                                        const isCurrentUser = m.sender_id === parseInt(user?.sub || '0');
                                        return (
                                            <div 
                                                key={m.id}
                                                className={`flex flex-col max-w-[80%] ${isCurrentUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                                            >
                                                {/* Meta */}
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] mb-1 px-1">
                                                    <span>{m.sender_name} ({m.sender_role.toUpperCase()})</span>
                                                    <span>·</span>
                                                    <span>{new Date(m.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>

                                                {/* Bubble */}
                                                <div 
                                                    className={`p-4 rounded-2xl text-[13px] font-medium leading-relaxed ${
                                                        isCurrentUser 
                                                            ? 'bg-slate-900 text-white rounded-tr-none' 
                                                            : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-sm'
                                                    }`}
                                                >
                                                    {m.message}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Input Box */}
                            {selectedTicket.status !== 'closed' ? (
                                <form onSubmit={handleSendReply} className="p-5 border-t border-[var(--card-border)] bg-white flex gap-3 flex-shrink-0">
                                    <input
                                        type="text"
                                        placeholder="Type your response here..."
                                        className="flex-1 bg-slate-50 px-5 py-4 rounded-2xl text-[13px] font-bold border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        disabled={isReplying}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isReplying || !replyText.trim()}
                                        className="p-4 bg-slate-900 text-white rounded-2xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-slate-900/10 disabled:opacity-30"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            ) : (
                                <div className="p-6 bg-slate-100 border-t border-[var(--card-border)] text-center text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2 flex-shrink-0">
                                    <ShieldAlert size={16} />
                                    This ticket has been marked Closed and is locked.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-slate-50/20">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-white flex items-center justify-center text-slate-300 shadow-xl shadow-slate-100 mb-6 border border-slate-50">
                                <MessageSquare size={36} className="text-primary/75 animate-bounce" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">No Thread Selected</h3>
                            <p className="text-[var(--text-muted)] max-w-sm font-medium leading-relaxed text-sm">Select a ticket from the side directory, or raise a new query to start correspondence.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Raise Ticket Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-250 border border-slate-100">
                        <div className="bg-slate-900 text-white px-8 py-6 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-8 -mt-8" />
                            <div className="relative z-10">
                                <h3 className="text-lg font-black uppercase tracking-wider">
                                    {userRole === 'guardian' ? 'Raise Parent Query' : 'Log Student Complaint'}
                                </h3>
                                <p className="text-slate-400 text-xs font-bold tracking-tight mt-1">Initiate a formal query or feedback channel.</p>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white relative z-10"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTicket} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">
                                    {userRole === 'guardian' ? 'Choose Student / Subject Teacher *' : 'Choose Classroom Student *'}
                                </label>
                                <select
                                    required
                                    className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-[13px] font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                    value={formData.student_id}
                                    onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                                >
                                    <option value="">Select Option</option>
                                    {recipientOptions.map((opt, idx) => (
                                        <option key={idx} value={opt.student_id}>
                                            {userRole === 'guardian' 
                                                ? `${opt.student_name} — Teacher: ${opt.teacher_name} (${opt.subject_name})` 
                                                : `${opt.student_name} — Parent: ${opt.guardian_name} (${opt.relation})`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Category</label>
                                    <select
                                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-[13px] font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                                    >
                                        <option value="general">General Matters</option>
                                        <option value="academic">Academics & Marks</option>
                                        <option value="behavioral">Student Conduct & Behavior</option>
                                        <option value="attendance">Attendance Records</option>
                                    </select>
                                </div>
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Ticket Type</label>
                                    <div className="w-full bg-slate-100 p-4 rounded-2xl text-[13px] font-black uppercase text-slate-700 tracking-wider">
                                        {userRole === 'guardian' ? 'Query' : 'Complaint'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Subject / Thread Title *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Brief summary of concern..."
                                    className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-[13px] font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Detailed Message / Description *</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Write details of the inquiry or feedback..."
                                    className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-[13px] font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                    value={formData.initialMessage}
                                    onChange={(e) => setFormData({...formData, initialMessage: e.target.value})}
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
                                        Initiating Thread...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={16} />
                                        Submit Ticket
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
