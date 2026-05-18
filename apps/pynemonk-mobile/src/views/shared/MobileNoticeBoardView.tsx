import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, Search } from 'lucide-react'
import { api } from '../../api'

interface MobileNoticeBoardViewProps {
  onBack: () => void;
  userRole: 'teacher' | 'parent';
}

export const MobileNoticeBoardView = ({ onBack, userRole }: MobileNoticeBoardViewProps) => {
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'school' | 'class'>('all')
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null)

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    setLoading(true)
    try {
      const res = await api.get('/school/announcements')
      if (res.data.success) {
        setNotices(res.data.data)
      } else {
        setNotices(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredNotices = notices.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                          n.content.toLowerCase().includes(search.toLowerCase())
    if (activeTab === 'school') return matchesSearch && !n.classroom_id
    if (activeTab === 'class') return matchesSearch && n.classroom_id
    return matchesSearch
  })

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Notice Board...</p>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 bg-slate-50 min-h-0 relative">
      <header className="px-6 py-6 bg-white rounded-b-[2.5rem] shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="text-brand-600 w-6 h-6" /> Notice Board
          </h1>
          <button onClick={onBack} className="text-brand-600 text-[10px] font-black uppercase tracking-widest">Back</button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-300"
          />
        </div>

        <div className="flex bg-slate-50 p-1 rounded-xl">
          {(['all', 'school', 'class'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
            >
              {tab === 'all' ? 'All' : tab === 'school' ? 'School-Wide' : 'Class-Scoped'}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-4 pb-32 min-h-0">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedNotice(n)}
              className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${n.classroom_id ? 'bg-indigo-50 text-indigo-600' : 'bg-brand-50 text-brand-600'}`}>
                  {n.classroom_id ? `Class: ${n.classroom_name || 'Scoped'}` : 'School-Wide'}
                </span>
                <span className="text-[8px] font-bold text-slate-300 uppercase">{new Date(n.publish_date).toLocaleDateString()}</span>
              </div>

              <h3 className="text-sm font-black text-slate-800 tracking-tight leading-snug line-clamp-1 mb-2">{n.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-3">{n.content}</p>

              <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-3">
                <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-600">
                  {n.publisher_name?.[0] || 'A'}
                </span>
                <span>By {n.publisher_name || 'School Admin'}</span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Megaphone size={28} />
            </div>
            <h3 className="text-base font-black text-slate-900">No Announcements</h3>
            <p className="text-slate-400 text-xs mt-1">There are no notices published under this scope.</p>
          </div>
        )}
      </main>

      {/* Reader Overlay Detail */}
      <AnimatePresence>
        {selectedNotice && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotice(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-6 pb-12 z-[110] shadow-2xl max-h-[85%] flex flex-col min-h-0"
            >
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 shrink-0" />
              
              <div className="overflow-y-auto pr-1 flex-1 min-h-0 space-y-5">
                <div className="flex justify-between items-center shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${selectedNotice.classroom_id ? 'bg-indigo-50 text-indigo-600' : 'bg-brand-50 text-brand-600'}`}>
                    {selectedNotice.classroom_id ? `Class: ${selectedNotice.classroom_name || 'Scoped'}` : 'School-Wide'}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(selectedNotice.publish_date).toLocaleDateString()}</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 leading-snug shrink-0">{selectedNotice.title}</h3>
                
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedNotice.content}</p>

                <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-t border-slate-50 pt-5 shrink-0">
                  <span className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-700">
                    {selectedNotice.publisher_name?.[0] || 'A'}
                  </span>
                  <div>
                    <p className="text-slate-800 leading-none">{selectedNotice.publisher_name || 'School Admin'}</p>
                    <p className="text-[8px] text-slate-400 mt-1">Publisher Authority</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedNotice(null)}
                className="w-full mt-6 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform shrink-0"
              >
                Close Notice
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
