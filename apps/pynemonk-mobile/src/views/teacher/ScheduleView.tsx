import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Clock, CalendarDays, ChevronRight, CheckCircle2, FileSpreadsheet, BookOpen } from 'lucide-react'
import { TimetableItem, Assignment } from '../../types'

const getISTTime = () => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(new Date());
    const hour = (parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10)) % 24;
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    return { hour, minute };
  } catch (e) {
    const now = new Date();
    return { hour: now.getHours(), minute: now.getMinutes() };
  }
};

const getISTDay = () => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short'
    });
    const weekdayStr = formatter.format(new Date());
    const mapping: Record<string, number> = {
      'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7
    };
    return mapping[weekdayStr] || new Date().getDay() || 7;
  } catch (e) {
    return new Date().getDay() || 7;
  }
};

export const ScheduleView = ({ 
  timetable, 
  assignments, 
  onAction 
}: { 
  timetable: TimetableItem[], 
  assignments: Assignment[],
  onAction: (item: TimetableItem, action: string) => void
}) => {
  const [selectedClassId, setSelectedClassId] = useState<number | 'all'>('all')
  const [activeItem, setActiveItem] = useState<TimetableItem | null>(null)
  const [showActions, setShowActions] = useState(false)

  const today = getISTDay()
  const filteredTimetable = useMemo(() => {
    let items = timetable.filter(t => t.day_of_week === today)
    if (selectedClassId !== 'all') {
      items = items.filter(t => assignments.find(a => a.classroom_name === t.classroom_name)?.classroom_id === selectedClassId)
    }
    return items.sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [timetable, selectedClassId, today, assignments])

  const ongoingItem = useMemo(() => {
    const { hour, minute } = getISTTime()
    const currentTime = hour * 60 + minute
    return filteredTimetable.find(t => {
      const [sh, sm] = t.start_time.split(':').map(Number)
      const [eh, em] = t.end_time.split(':').map(Number)
      const start = sh * 60 + sm
      const end = eh * 60 + em
      return currentTime >= start && currentTime <= end
    })
  }, [filteredTimetable])

  const nextItem = useMemo(() => {
    const { hour, minute } = getISTTime()
    const currentTime = hour * 60 + minute
    return filteredTimetable.find(t => {
      const [sh, sm] = t.start_time.split(':').map(Number)
      const start = sh * 60 + sm
      return start > currentTime
    })
  }, [filteredTimetable])

  const subjectColors: Record<string, string> = {
    'English': '#10b981',
    'Maths': '#4f46e5',
    'Mathematics': '#4f46e5',
    'Science': '#f59e0b',
    'History': '#f43f5e',
    'Geography': '#0ea5e9',
    'Hindi': '#8b5cf6'
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Header Widget */}
      <div className="bg-white px-6 pb-6 pt-2 border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Today</h3>
            <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              {filteredTimetable.length} Classes Scheduled
            </p>
          </div>
          
          <div className="relative">
            <select 
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="appearance-none bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 pr-10 text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand-500 transition-all"
            >
              <option value="all">All Classes</option>
              {assignments.map(a => (
                <option key={a.classroom_id} value={a.classroom_id}>{a.classroom_name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Next Class Sticky Widget */}
        {nextItem && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 rounded-[2rem] p-5 text-white flex items-center justify-between shadow-xl shadow-slate-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Clock size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Next Session</p>
                <h4 className="text-sm font-bold truncate max-w-[150px]">{nextItem.subject_name} • {nextItem.start_time}</h4>
              </div>
            </div>
            <button 
              onClick={() => onAction(nextItem, 'start')}
              className="bg-brand-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
            >
              Start
            </button>
          </motion.div>
        )}
      </div>

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar pb-32">
        {filteredTimetable.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <CalendarDays size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-400">No classes found</h3>
            <button className="text-brand-600 text-[10px] font-black uppercase tracking-widest">Contact Admin</button>
          </div>
        ) : (
          filteredTimetable.map((item, idx) => {
            const isOngoing = ongoingItem?.id === item.id
            
            // Robust numeric comparison using timezone-robust IST time
            const { hour: istH, minute: istM } = getISTTime()
            const currentTime = istH * 60 + istM
            const [eh, em] = item.end_time.split(':').map(Number)
            const endTimeMinutes = eh * 60 + em
            const isPast = !isOngoing && endTimeMinutes < currentTime

            const color = subjectColors[item.subject_name] || '#64748b'

            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative"
              >
                {/* Swipeable Container */}
                <motion.div
                  drag="x"
                  dragConstraints={{ left: -100, right: 100 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.x > 50) onAction(item, 'attendance')
                    if (info.offset.x < -50) onAction(item, 'homework')
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveItem(item)
                    setShowActions(true)
                  }}
                  className={`
                    premium-card p-6 flex items-center gap-6 relative z-10
                    ${isOngoing ? 'ring-4 ring-brand-50 border-brand-500 shadow-xl' : isPast ? 'opacity-50 grayscale' : ''}
                  `}
                >
                  {/* Subject Strip */}
                  <div className="absolute left-0 top-6 bottom-6 w-1.5 rounded-r-full" style={{ backgroundColor: color }} />
                  
                  <div className="w-16 shrink-0 text-center">
                    <p className="text-xs font-black text-slate-900 leading-none">{item.start_time}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{item.end_time}</p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base font-black text-slate-900 tracking-tight truncate">{item.subject_name}</h4>
                      {isOngoing && (
                        <span className="bg-emerald-50 text-emerald-600 text-[7px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Ongoing
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.classroom_name}</p>
                  </div>

                  <ChevronRight size={18} className="text-slate-200" />
                </motion.div>

                {/* Swipe Indicators (Background) */}
                <div className="absolute inset-0 rounded-[2rem] flex items-center justify-between px-8 text-white">
                  <div className="flex items-center gap-2 bg-emerald-500 h-full w-1/2 left-0 absolute -z-10 rounded-l-[2rem] pl-8">
                    <CheckCircle2 size={20} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Attendance</span>
                  </div>
                  <div className="flex items-center gap-2 bg-indigo-500 h-full w-1/2 right-0 absolute -z-10 rounded-r-[2rem] pr-8 flex-row-reverse">
                    <FileSpreadsheet size={20} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Homework</span>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Action Bottom Sheet */}
      <AnimatePresence>
        {showActions && activeItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActions(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 pb-12 z-[70] shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
              
              <div className="mb-10 text-center">
                <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-1">{activeItem.classroom_name}</p>
                <h3 className="text-2xl font-black text-slate-900">{activeItem.subject_name}</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{activeItem.start_time} - {activeItem.end_time}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => { setShowActions(false); onAction(activeItem, 'attendance'); }}
                  className="bg-brand-500 text-white p-6 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center gap-4 shadow-xl shadow-brand-100"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center"><CheckCircle2 size={20} /></div>
                  Start Attendance
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => { setShowActions(false); onAction(activeItem, 'homework'); }}
                    className="bg-slate-50 text-slate-900 p-6 rounded-[2.5rem] font-black uppercase tracking-widest text-[10px] flex flex-col items-center gap-3 border border-slate-100"
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-brand-600"><FileSpreadsheet size={24} /></div>
                    Homework
                  </button>
                  <button 
                    onClick={() => { setShowActions(false); onAction(activeItem, 'notes'); }}
                    className="bg-slate-50 text-slate-900 p-6 rounded-[2.5rem] font-black uppercase tracking-widest text-[10px] flex flex-col items-center gap-3 border border-slate-100"
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600"><BookOpen size={24} /></div>
                    Class Notes
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setShowActions(false)}
                className="w-full mt-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
