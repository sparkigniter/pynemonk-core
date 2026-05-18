import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Plus, ArrowLeft, Send, ShieldAlert, X } from 'lucide-react'
import { api } from '../../api'

interface MobileCommunicationsViewProps {
  onBack: () => void;
  userRole: 'teacher' | 'parent';
}

export const MobileCommunicationsView = ({ onBack, userRole }: MobileCommunicationsViewProps) => {
  const [tickets, setTickets] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [recipients, setRecipients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [creatingTicket, setCreatingTicket] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'open' | 'resolved' | 'closed' | 'all'>('open')

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    title: '',
    category: 'general' as any,
    initialMessage: ''
  })

  useEffect(() => {
    fetchTickets()
    fetchRecipients()
  }, [])

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id)
    }
  }, [selectedTicket])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await api.get('/school/communications/tickets')
      if (res.data.success) {
        setTickets(res.data.data)
      } else {
        setTickets(res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecipients = async () => {
    try {
      const res = await api.get('/school/communications/recipient-options')
      if (res.data.success) {
        setRecipients(res.data.data.options)
      } else {
        setRecipients(res.data.options)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchMessages = async (ticketId: number) => {
    setMessagesLoading(true)
    try {
      const res = await api.get(`/school/communications/tickets/${ticketId}/messages`)
      if (res.data.success) {
        setMessages(res.data.data)
      } else {
        setMessages(res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedTicket) return

    setSendingReply(true)
    try {
      const res = await api.post(`/school/communications/tickets/${selectedTicket.id}/messages`, { message: replyText })
      
      const newMsg = res.data.success ? res.data.data : res.data
      setMessages((prev: any[]) => [...prev, newMsg])
      setReplyText('')
      
      // Update locally
      setTickets((prev: any[]) => prev.map(t => t.id === selectedTicket.id ? { ...t, updated_at: new Date().toISOString() } : t))
    } catch (err) {
      console.error(err)
    } finally {
      setSendingReply(false)
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.student_id || !formData.title || !formData.initialMessage) return

    setCreatingTicket(true)
    try {
      const selectedOpt = recipients.find(o => o.student_id === parseInt(formData.student_id))
      const payload = {
        student_id: parseInt(formData.student_id),
        teacher_id: userRole === 'parent' ? selectedOpt?.teacher_id : undefined,
        guardian_id: userRole === 'teacher' ? selectedOpt?.guardian_id : undefined,
        title: formData.title,
        type: userRole === 'parent' ? ('query' as const) : ('complaint' as const),
        category: formData.category,
        initialMessage: formData.initialMessage
      }

      await api.post('/school/communications/tickets', payload)
      setShowCreate(false)
      setFormData({
        student_id: '',
        title: '',
        category: 'general',
        initialMessage: ''
      })
      fetchTickets()
    } catch (err) {
      console.error(err)
    } finally {
      setCreatingTicket(false)
    }
  }

  const handleUpdateStatus = async (ticketId: number, status: 'open' | 'resolved' | 'closed') => {
    try {
      await api.patch(`/school/communications/tickets/${ticketId}/status`, { status })
      setSelectedTicket((prev: any) => prev ? { ...prev, status } : null)
      setTickets((prev: any[]) => prev.map(t => t.id === ticketId ? { ...t, status } : t))
    } catch (err) {
      console.error(err)
    }
  }

  const filteredTickets = tickets.filter(t => {
    if (activeFilter === 'all') return true
    return t.status === activeFilter
  })

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Tickets...</p>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 bg-slate-50 min-h-0 relative">
      {/* ── Thread List View ── */}
      {!selectedTicket && !showCreate && (
        <>
          <header className="px-6 py-6 bg-white rounded-b-[2.5rem] shadow-sm flex-shrink-0">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="text-brand-600 w-6 h-6" /> Correspondence
              </h1>
              <button onClick={onBack} className="text-brand-600 text-[10px] font-black uppercase tracking-widest">Back</button>
            </div>

            <div className="flex bg-slate-50 p-1 rounded-xl mb-4">
              {(['open', 'resolved', 'closed', 'all'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${activeFilter === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCreate(true)}
              className="w-full py-4 bg-slate-955 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Plus size={16} />
              {userRole === 'parent' ? 'Raise Parent Query' : 'Log Student Complaint'}
            </button>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-6 space-y-4 pb-32 min-h-0">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((t, idx) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedTicket(t)}
                  className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${t.type === 'complaint' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                      {t.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${t.status === 'open' ? 'bg-amber-50 text-amber-600' : t.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {t.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-800 leading-snug line-clamp-1 mb-1">{t.title}</h4>
                  
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase mt-3">
                    <span className="truncate max-w-[150px]">Student: {t.student_name}</span>
                    <span>{new Date(t.updated_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <MessageSquare size={28} />
                </div>
                <h3 className="text-base font-black text-slate-900">No active threads</h3>
                <p className="text-slate-400 text-xs mt-1">Raise a new query or complaint to start correspondence.</p>
              </div>
            )}
          </main>
        </>
      )}

      {/* ── Chat Stream Screen ── */}
      {selectedTicket && !showCreate && (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          <header className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-4 shrink-0">
            <button onClick={() => setSelectedTicket(null)} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 shadow-sm shrink-0">
              <ArrowLeft size={16} />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black text-slate-800 leading-none truncate mb-1">{selectedTicket.title}</h3>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">
                Student: {selectedTicket.student_name}
              </p>
            </div>
            {selectedTicket.status !== 'closed' && (
              <button
                onClick={() => handleUpdateStatus(selectedTicket.id, selectedTicket.status === 'open' ? 'resolved' : 'closed')}
                className="px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[8px] font-black uppercase tracking-wider whitespace-nowrap active:scale-95 transition-transform shrink-0"
              >
                {selectedTicket.status === 'open' ? 'Resolve' : 'Close'}
              </button>
            )}
          </header>

          <main className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 min-h-0">
            {messagesLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              </div>
            ) : (
              messages.map((m, idx) => {
                const isCurrentUser = (userRole === 'parent' && m.sender_role === 'parent') || 
                                      (userRole === 'teacher' && m.sender_role === 'teacher')
                return (
                  <div key={idx} className={`flex flex-col max-w-[85%] ${isCurrentUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    <span className="text-[8px] font-bold text-slate-400 mb-1 px-1">
                      {m.sender_name} ({m.sender_role.toUpperCase()})
                    </span>
                    <div className={`p-4 rounded-[1.5rem] text-xs font-bold leading-relaxed ${isCurrentUser ? 'bg-slate-900 text-white rounded-tr-none shadow-md shadow-slate-900/5' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-sm'}`}>
                      {m.message}
                    </div>
                  </div>
                )
              })
            )}
          </main>

          {selectedTicket.status !== 'closed' ? (
            <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 bg-white flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="Type response..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                disabled={sendingReply}
                className="flex-1 bg-slate-50 px-4 py-3 rounded-xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="w-12 h-12 bg-slate-950 text-white rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-30 shadow-md"
              >
                <Send size={16} />
              </button>
            </form>
          ) : (
            <div className="p-5 bg-slate-100 text-center text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0">
              <ShieldAlert size={14} /> Locked & Closed
            </div>
          )}
        </div>
      )}

      {/* ── Raise Ticket View ── */}
      {showCreate && (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          <header className="px-6 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">
                {userRole === 'parent' ? 'Raise Parent Query' : 'Log Student Complaint'}
              </h3>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Open a direct query channel</p>
            </div>
            <button onClick={() => setShowCreate(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shadow-sm shrink-0">
              <X size={18} />
            </button>
          </header>

          <form onSubmit={handleCreateTicket} className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0 pb-16">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Recipient Student *</label>
              <select
                required
                value={formData.student_id}
                onChange={e => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full bg-slate-50 p-4 rounded-xl border-none text-xs font-bold outline-none"
              >
                <option value="">Select Student</option>
                {recipients.map((opt, i) => (
                  <option key={i} value={opt.student_id}>
                    {userRole === 'parent' 
                      ? `${opt.student_name} — Teacher: ${opt.teacher_name} (${opt.subject_name})` 
                      : `${opt.student_name} — Parent: ${opt.guardian_name}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Category *</label>
              <select
                required
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 p-4 rounded-xl border-none text-xs font-bold outline-none"
              >
                <option value="general">General Matters</option>
                <option value="academic">Academics & Marks</option>
                <option value="behavioral">Student Conduct</option>
                <option value="attendance">Attendance Records</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Subject / Title *</label>
              <input
                type="text"
                required
                placeholder="Topic or main concern..."
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-50 p-4 rounded-xl border-none text-xs font-bold outline-none placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Details / Inquiry *</label>
              <textarea
                required
                rows={4}
                placeholder="Write full message details here..."
                value={formData.initialMessage}
                onChange={e => setFormData({ ...formData, initialMessage: e.target.value })}
                className="w-full bg-slate-50 p-4 rounded-xl border-none text-xs font-bold outline-none resize-none placeholder:text-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={creatingTicket}
              className="w-full py-4 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {creatingTicket ? 'Submitting...' : 'Submit Thread'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
