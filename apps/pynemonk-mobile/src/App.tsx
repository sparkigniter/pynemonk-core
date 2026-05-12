import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import {
  Bell,
  Calendar as CalendarIcon,
  CreditCard,
  GraduationCap,
  Home,
  MessageCircle,
  User,
  ShieldCheck,
  Clock,
  LogOut,
  MapPin,
  Baby,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  BookOpen,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Users,
  ClipboardCheck,
  FileSpreadsheet,
  CalendarDays,
  Settings,
  Info,
  Phone,
  Camera,
  FileImage,
  Mic,
  Save,
  Palette,
  Image as ImageIcon,
  PlayCircle,
  Timer,
  X,
  Inbox,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react'

// --- API Config ---
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Types ---
type Role = 'parent' | 'teacher'
type TeacherView = 'home' | 'classes' | 'class_detail' | 'attendance' | 'calendar' | 'exams' | 'profile' | 'homework' | 'homework_new' | 'schedule' | 'inbox' | 'more'
type AssignmentType = 'practice' | 'homework' | 'test' | 'project'
type BlockType = 'instructions' | 'question' | 'mcq' | 'attachment' | 'link'

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

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  admission_no: string;
  classroom_name?: string;
  grade_name?: string;
  roll_number?: string;
  gender?: string;
}

interface Assignment {
  classroom_id: number;
  classroom_name: string;
  grade_name: string;
  subject_name: string;
  subject_id: number;
  is_class_teacher: boolean;
  is_scheduled_today: boolean;
  can_take_attendance: boolean;
}

interface TimetableItem {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  classroom_name: string;
  subject_name: string;
}

interface ExamItem {
  id: number;
  exam_id: number;
  exam_name: string;
  subject_name: string;
  classroom_name: string;
  exam_date: string;
}

interface Homework {
  id: number;
  title: string;
  description: string;
  due_date: string;
  subject_name: string;
  classroom_name: string;
  attachment_url?: string;
  created_at: string;
  status?: string;
}

interface TeacherDashboardData {
  stats: {
    absent_today: number;
    upcoming_exams: number;
    notes_sent_24h: number;
  };
  assignments: Assignment[];
}

// --- Components ---

const Login = ({ onLogin }: { onLogin: (role: Role, token: string) => void }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (selectedRole: Role) => {
    setLoading(true)
    setError('')
    try {
      const response = await api.post('/auth/login', {
        email: email || (selectedRole === 'teacher' ? 'teacher1@demo.edu' : 'parent1@demo.edu'),
        password,
        grant_type: 'password',
        client_id: import.meta.env.VITE_CLIENT_ID,
        client_secret: import.meta.env.VITE_CLIENT_SECRET
      });
      if (response.data.success) {
        const token = response.data.data.access_token;
        localStorage.setItem('token', token);
        onLogin(selectedRole, token);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col px-8 pb-12 min-h-screen bg-white" style={{ paddingTop: 'calc(var(--safe-top) + 2rem)' }}>
      <div className="flex-1 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 bg-brand-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-brand-600/40 mb-12"
        >
          <GraduationCap className="text-white w-12 h-12" />
        </motion.div>

        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Pynemonk</h1>
        <p className="text-slate-400 mb-12 text-lg font-medium leading-relaxed">The unified school experience.</p>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-50 text-rose-600 p-5 rounded-3xl mb-8 text-xs font-black flex items-center gap-3 border border-rose-100"
            >
              <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@school.edu"
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] p-5 text-sm font-bold focus:bg-white focus:border-brand-500 outline-none transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Security Key</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] p-5 text-sm font-bold focus:bg-white focus:border-brand-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-4 pt-6">
            <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Sign in as</p>
            <div className="grid grid-cols-2 gap-5">
              <button
                onClick={() => handleLogin('teacher')}
                disabled={loading}
                className="flex flex-col items-center gap-3 p-8 rounded-[2.5rem] bg-slate-50 border-2 border-transparent hover:border-brand-500 active:scale-95 transition-all group disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:text-brand-600 group-hover:shadow-md transition-all">
                  <Users className="w-6 h-6 text-slate-400 group-hover:text-brand-600" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-600">Staff</span>
              </button>

              <button
                onClick={() => handleLogin('parent')}
                disabled={loading}
                className="flex flex-col items-center gap-3 p-8 rounded-[2.5rem] bg-slate-50 border-2 border-transparent hover:border-brand-500 active:scale-95 transition-all group disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:text-brand-600 group-hover:shadow-md transition-all">
                  <Baby className="w-6 h-6 text-slate-400 group-hover:text-brand-600" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-600">Guardian</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ScheduleView = ({ 
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

  const today = new Date().getDay() || 7
  const filteredTimetable = useMemo(() => {
    let items = timetable.filter(t => t.day_of_week === today)
    if (selectedClassId !== 'all') {
      items = items.filter(t => assignments.find(a => a.classroom_name === t.classroom_name)?.classroom_id === selectedClassId)
    }
    return items.sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [timetable, selectedClassId, today, assignments])

  const ongoingItem = useMemo(() => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    return filteredTimetable.find(t => {
      const [sh, sm] = t.start_time.split(':').map(Number)
      const [eh, em] = t.end_time.split(':').map(Number)
      const start = sh * 60 + sm
      const end = eh * 60 + em
      return currentTime >= start && currentTime <= end
    })
  }, [filteredTimetable])

  const nextItem = useMemo(() => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
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
            const isPast = !isOngoing && item.end_time.localeCompare(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })) < 0
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

// --- Exam Management Components ---

const ExamManagementView = ({ onBack, exams, loading: initialLoading }: { onBack: () => void, exams: ExamItem[], loading: boolean }) => {
  const [viewMode, setViewMode] = useState<'list' | 'evaluate' | 'complete'>('list')
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [students, setStudents] = useState<any[]>([])
  const [marks, setMarks] = useState<Record<number, { score: string, isAbsent: boolean }>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleStartChecking = async (exam: ExamItem) => {
    setSelectedExam(exam)
    setLoading(true)
    try {
      const res = await api.get(`/school/exams/${exam.exam_id}/papers/${exam.id}/students`)
      if (res.data.success) {
        if (res.data.data.length === 0) {
          alert('No students found for this exam paper in your assigned classrooms.')
          setLoading(false)
          return
        }
        setStudents(res.data.data)
        const initialMarks: Record<number, { score: string, isAbsent: boolean }> = {}
        res.data.data.forEach((s: any) => {
          initialMarks[s.student_id] = {
            score: s.marks?.marks_obtained?.toString() || '',
            isAbsent: s.marks?.is_absent || false
          }
        })
        setMarks(initialMarks)
        setActiveIndex(0)
        setViewMode('evaluate')
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const handleMarkChange = async (studentId: number, score: string) => {
    setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], score } }))
    setSaving(true)
    try {
      await api.post(`/school/exams/${selectedExam?.id}/papers/${selectedExam?.id}/marks`, [
        { student_id: studentId, marks_obtained: parseFloat(score) || 0, is_absent: marks[studentId].isAbsent }
      ])
    } catch (err) {
      console.error(err)
    }
    setTimeout(() => setSaving(false), 500)
  }

  const handleNext = () => {
    if (activeIndex < students.length - 1) {
      setActiveIndex(prev => prev + 1)
    } else {
      setViewMode('complete')
    }
  }

  const handlePrev = () => {
    if (activeIndex > 0) setActiveIndex(prev => prev - 1)
  }

  if (loading || initialLoading) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Exams...</p>
    </div>
  )

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col flex-1 bg-slate-50">
        <header className="px-6 py-8 bg-white rounded-b-[3rem] shadow-sm">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Your Exam Work</h1>
          <div className="flex bg-slate-50 p-1.5 rounded-2xl">
            <button className="flex-1 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Pending</button>
            <button className="flex-1 py-3 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">History</button>
          </div>
        </header>

        <main className="px-6 py-8 space-y-6">
          {exams.length > 0 ? (
            exams.map(exam => (
              <motion.div 
                key={`${exam.id}-${exam.classroom_name}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStartChecking(exam)}
                className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-6 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 opacity-5 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
                
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
                    <GraduationCap size={20} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Class</p>
                    <p className="text-sm font-black text-slate-900">{exam.classroom_name}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{exam.exam_name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{exam.subject_name}</p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><CalendarIcon size={12} /> {new Date(exam.exam_date).toLocaleDateString()}</span>
                </div>

                <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <PlayCircle size={16} className="text-indigo-400" />
                  Continue Checking
                </button>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Inbox size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">All caught up!</h3>
              <p className="text-slate-400 font-medium text-sm mt-2">No evaluations assigned to you today.</p>
            </div>
          )}
        </main>
      </div>
    )
  }

  if (viewMode === 'evaluate') {
    const student = students[activeIndex]
    if (!student) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 rounded-t-[3rem] p-10 text-center">
          <AlertCircle className="text-rose-500 w-16 h-16 mb-6" />
          <h2 className="text-2xl font-black text-white mb-2">Queue Error</h2>
          <p className="text-white/40 text-sm mb-10">We couldn't load the next student in the queue.</p>
          <button onClick={() => setViewMode('list')} className="w-full py-4 bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Back to list</button>
        </div>
      )
    }
    const progress = ((activeIndex + 1) / students.length) * 100

    return (
      <div className="flex flex-col flex-1 bg-slate-900 rounded-t-[3rem] overflow-hidden">
        <header className="px-6 pt-12 pb-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setViewMode('list')} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all">
              <X size={20} />
            </button>
            <div className="text-right">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Grading Queue</p>
              <p className="text-lg font-black text-white">{activeIndex + 1} / {students.length}</p>
            </div>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-indigo-500" 
            />
          </div>
        </header>

        <main className="flex-1 flex flex-col justify-center px-6 pb-12 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={student.student_id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="text-center space-y-10 relative z-10">
                <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center text-3xl font-black mx-auto shadow-xl">
                  {student.first_name[0]}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-2">Evaluating Now</p>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{student.first_name} {student.last_name}</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Roll No: {student.roll_number || 'N/A'}</p>
                </div>

                <div className="py-8">
                  <input 
                    type="number"
                    autoFocus
                    value={marks[student.student_id]?.score || ''}
                    onChange={(e) => handleMarkChange(student.student_id, e.target.value)}
                    className="w-48 text-center bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] py-8 text-6xl font-black text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-200"
                    placeholder="00"
                  />
                  {saving && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-8 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={12} /> Saving...
                    </motion.p>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 grid grid-cols-2 gap-4">
            <button 
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className="py-5 bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-20 active:scale-95 transition-all"
            >
              Previous
            </button>
            <button 
              onClick={handleNext}
              className="py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-indigo-900/50"
            >
              {activeIndex === students.length - 1 ? 'Finish' : 'Next Student'}
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (viewMode === 'complete') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-indigo-600 rounded-t-[3rem]">
        <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-indigo-600 mb-8 shadow-2xl">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Evaluation Complete!</h2>
        <p className="text-white/70 font-medium mb-12">All papers for this section have been checked and marks recorded.</p>
        <button 
          onClick={() => setViewMode('list')}
          className="w-full py-5 bg-white text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
        >
          Return to Queue
        </button>
      </div>
    )
  }

  return null
}

const TeacherDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [view, setView] = useState<TeacherView>('home')
  const [selectedClass, setSelectedClass] = useState<Assignment | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [data, setData] = useState<TeacherDashboardData | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [timetable, setTimetable] = useState<TimetableItem[]>([])
  const [exams, setExams] = useState<ExamItem[]>([])
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, 'present' | 'absent'>>({})
  const [loading, setLoading] = useState(true)
  const [hwMode, setHwMode] = useState<'text' | 'snap' | 'voice'>('text')
  const [showStartClass, setShowStartClass] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<TimetableItem | null>(null)
  
  // Homework Wizard State
  const [hwStep, setHwStep] = useState(0)
  const [showBlockSheet, setShowBlockSheet] = useState(false)
  const [hwFormData, setHwFormData] = useState({
    title: '',
    assignment_type: 'homework' as AssignmentType,
    classroom_id: undefined as number | undefined,
    subject_id: undefined as number | undefined,
    due_date: new Date().toISOString().split('T')[0],
    due_time: '23:59',
    blocks: [] as Block[],
    submission_type: 'both' as 'file' | 'text' | 'both',
    max_score: 10,
    is_graded: true,
    allow_late: false,
    auto_close: true
  })

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const nextClass = useMemo(() => {
    if (!timetable.length) return null;
    const now = new Date();
    const day = now.getDay() || 7;
    // Simple mock logic for "next class" - in production this would be calculated from real time
    return timetable.find(t => t.day_of_week === day) || timetable[0];
  }, [timetable]);

  useEffect(() => {
    fetchMainData()
  }, [])

  const fetchMainData = async () => {
    setLoading(true)
    try {
      const [dashRes, ttRes] = await Promise.all([
        api.get('/school/staff/teacher/dashboard'),
        api.get('/school/staff/teacher/timetable')
      ]);
      if (dashRes.data.success) setData(dashRes.data.data)
      if (ttRes.data.success) setTimetable(ttRes.data.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const fetchClassStudents = async (classroomId: number) => {
    setLoading(true)
    try {
      const res = await api.get(`/school/staff/teacher/class/${classroomId}/students`)
      if (res.data.success) {
        setStudents(res.data.data)
        const initial: Record<number, 'present' | 'absent'> = {}
        res.data.data.forEach((s: any) => { initial[s.id] = 'present' })
        setAttendanceRecords(initial)
      }
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const submitAttendance = async () => {
    if (!selectedClass) return
    setLoading(true)
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        status
      }))

      const res = await api.post('/school/attendance', {
        date: new Date().toISOString().split('T')[0],
        classroom_id: selectedClass.classroom_id,
        subject_id: selectedClass.subject_id,
        records
      })

      if (res.data.success) {
        alert('Attendance submitted successfully!')
        setView('class_detail')
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit attendance')
    }
    setLoading(false)
  }

  const fetchTimetable = async () => {
    setLoading(true)
    try {
      const res = await api.get('/school/staff/teacher/timetable')
      if (res.data.success) setTimetable(res.data.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const fetchExams = async () => {
    setLoading(true)
    try {
      const res = await api.get('/school/staff/teacher/exams')
      if (res.data.success) setExams(res.data.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const fetchHomework = async () => {
    setLoading(true)
    try {
      const res = await api.get('/school/homework')
      if (res.data.success) setHomeworks(res.data.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const handleClassClick = (cls: Assignment) => {
    setSelectedClass(cls)
    fetchClassStudents(cls.classroom_id)
    setView('class_detail')
  }

  const [mobileViewMode, setMobileViewMode] = useState<'class' | 'subject'>(() => {
    return (localStorage.getItem('mobile_teacher_view_mode') as 'class' | 'subject') || 'class';
  });

  useEffect(() => {
    localStorage.setItem('mobile_teacher_view_mode', mobileViewMode);
  }, [mobileViewMode]);

  const assignmentsBySubject = useMemo(() => {
    if (!data?.assignments) return [];
    const groups: Record<string, any> = {};
    data.assignments.forEach((a: any) => {
      if (!groups[a.subject_name]) {
        groups[a.subject_name] = {
          name: a.subject_name,
          classes: []
        };
      }
      groups[a.subject_name].classes.push(a);
    });
    return Object.values(groups);
  }, [data]);

  const handleScheduleAction = (item: TimetableItem, action: string) => {
    const assignment = data?.assignments.find(a => a.classroom_name === item.classroom_name)
    if (!assignment) return

    if (action === 'attendance' || action === 'start') {
      setSelectedClass(assignment)
      fetchClassStudents(assignment.classroom_id)
      setView('attendance')
    } else if (action === 'homework') {
      setSelectedClass(assignment)
      setView('homework_new')
    }
  }

  const navigateTo = (newView: TeacherView) => {
    setView(newView)
    if (newView === 'calendar' || newView === 'schedule') fetchTimetable()
    if (newView === 'exams') fetchExams()
    if (newView === 'classes') fetchMainData()
    if (newView === 'profile') fetchProfile()
    if (newView === 'homework') fetchHomework()
  }

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await api.get('/school/staff/profile/me')
      if (res.data.success) setProfile(res.data.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }


  if (loading && view === 'home') return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl px-6 pb-6 flex items-center justify-between border-b border-slate-100 shrink-0 sticky top-0 z-20" style={{ paddingTop: 'calc(var(--safe-top) + 1.5rem)' }}>
        <div className="flex items-center gap-3">
          {view !== 'home' && (
            <button onClick={() => navigateTo('home')} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 transition-transform">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <p className="text-brand-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
              {view === 'home' ? 'Command Center' : view === 'classes' ? 'My Workload' : view.toUpperCase()}
            </p>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {view === 'home' ? 'Hello, Professor' : selectedClass && view !== 'classes' ? selectedClass.classroom_name : 'My Workload'}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onLogout} className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 active:scale-90 transition-transform">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="px-6 py-6 space-y-6 pb-32">
              {/* Dynamic Header Insight */}
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 leading-tight">{greeting}, Professor</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {data?.assignments.length || 0} Classes Today
                    </span>
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      <Clock size={10} /> Next in 15m
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-3xl bg-slate-100 border-2 border-white shadow-sm overflow-hidden active:scale-95 transition-transform" onClick={() => navigateTo('profile')}>
                  <User className="w-full h-full p-2 text-slate-400" />
                </div>
              </div>

              {/* Focus Card: Next Class */}
              {nextClass && (
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="bg-indigo-600 rounded-[2.5rem] p-7 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group"
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Upcoming Session</span>
                      <div className="flex items-center gap-1 text-[10px] font-black text-white/80">
                        <Timer size={14} className="animate-pulse" /> Starts in 14:52
                      </div>
                    </div>

                    <h3 className="text-2xl font-black mb-1">{nextClass.subject_name}</h3>
                    <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-8">{nextClass.classroom_name}</p>

                    <div className="flex items-center gap-4 mb-8 text-xs font-bold text-white/80">
                      <span className="flex items-center gap-1.5"><Clock size={14} /> {nextClass.start_time} - {nextClass.end_time}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={14} /> Room 302</span>
                    </div>

                    <button
                      onClick={() => setShowStartClass(true)}
                      className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg group-active:scale-95 transition-transform"
                    >
                      <PlayCircle size={18} />
                      Start Class Now
                    </button>
                  </div>
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                </motion.div>
              )}

              {/* Actionable Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col gap-4 active:scale-95 transition-transform cursor-pointer" onClick={() => navigateTo('attendance')}>
                  <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500"><Users className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">92%</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Attendance</p>
                  </div>
                  <div className="flex items-center gap-1 text-brand-600 text-[10px] font-black uppercase tracking-widest mt-1">
                    Mark Now <ChevronRight size={12} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col gap-4 active:scale-95 transition-transform cursor-pointer" onClick={() => navigateTo('homework')}>
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><ClipboardCheck className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{data?.stats.notes_sent_24h || 12}</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Grading</p>
                  </div>
                  <div className="flex items-center gap-1 text-brand-600 text-[10px] font-black uppercase tracking-widest mt-1">
                    Review <ChevronRight size={12} />
                  </div>
                </div>
              </div>

              {/* Timeline Schedule */}
              <div className="space-y-4 pb-10">
                <div className="flex justify-between items-center px-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Timeline</h4>
                  <button onClick={() => navigateTo('classes')} className="text-brand-600 text-[10px] font-black uppercase tracking-widest">View All</button>
                </div>

                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100"></div>

                  {timetable.filter(t => t.day_of_week === (new Date().getDay() || 7)).map((item, i) => {
                    const isCompleted = i === 0; // Mock logic
                    const isActive = i === 1; // Mock logic

                    return (
                      <div key={i} className="relative">
                        <div className={`absolute -left-[24px] top-1.5 w-4 h-4 rounded-full border-4 border-white z-10 ${isCompleted ? 'bg-emerald-500 shadow-lg shadow-emerald-100' : isActive ? 'bg-indigo-600 shadow-lg shadow-indigo-100 ring-4 ring-indigo-50' : 'bg-slate-200'}`}></div>
                        <div className={`bg-white p-5 rounded-[2rem] border shadow-sm flex items-center justify-between ${isActive ? 'border-indigo-100 ring-1 ring-indigo-50' : 'border-slate-50'}`}>
                          <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">{item.start_time} - {item.end_time}</p>
                            <h5 className="font-bold text-slate-900 text-sm">{item.subject_name}</h5>
                            <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">{item.classroom_name}</p>
                          </div>
                          {isCompleted && <CheckCircle2 className="text-emerald-500 w-5 h-5" />}
                          {isActive && <span className="bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase px-2 py-1 rounded-full">Active</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'schedule' && (
            <motion.div key="schedule" className="flex-1 flex flex-col overflow-hidden pb-32" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ScheduleView 
                timetable={timetable} 
                assignments={data?.assignments || []} 
                onAction={handleScheduleAction} 
              />
            </motion.div>
          )}

          {view === 'inbox' && (
            <motion.div key="inbox" className="flex-1 p-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <Inbox size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-900">No new messages</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your inbox is empty.</p>
            </motion.div>
          )}

          {view === 'exams' && (
            <motion.div key="exams" className="flex-1 flex flex-col overflow-hidden pb-32" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ExamManagementView 
                exams={exams} 
                loading={loading} 
                onBack={() => navigateTo('home')} 
              />
            </motion.div>
          )}
          {view === 'more' && (
            <motion.div key="more" className="flex-1 p-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <MoreHorizontal size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-900">More Options</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Coming soon.</p>
              <button onClick={onLogout} className="mt-8 bg-rose-50 text-rose-500 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Sign Out</button>
            </motion.div>
          )}

          {view === 'classes' && (
            <motion.div key="classes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-6 py-6 space-y-6 pb-32">
              {/* View Switcher */}
              <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <button
                  onClick={() => setMobileViewMode('class')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mobileViewMode === 'class' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
                >
                  By Class
                </button>
                <button
                  onClick={() => setMobileViewMode('subject')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mobileViewMode === 'subject' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
                >
                  By Subject
                </button>
              </div>

              {mobileViewMode === 'class' ? (
                <div className="space-y-4">
                  {data?.assignments.map((cls, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                      <div className="flex items-center gap-5" onClick={() => handleClassClick(cls)}>
                        <div className="w-16 h-16 bg-brand-50 rounded-3xl flex items-center justify-center text-brand-600 text-xl font-black">{cls.classroom_name}</div>
                        <div className="flex-1">
                          <h5 className="text-lg font-bold text-slate-900">{cls.subject_name}</h5>
                          <div className="flex items-center gap-2">
                            <p className="text-slate-400 text-xs font-medium">{cls.grade_name}</p>
                            {cls.is_class_teacher && <span className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Class Teacher</span>}
                          </div>
                        </div>
                        <ChevronRight className="text-slate-200 w-5 h-5" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          onClick={() => { setSelectedClass(cls); setView('attendance'); fetchClassStudents(cls.classroom_id); }}
                          disabled={!cls.can_take_attendance}
                          className={`py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${cls.can_take_attendance ? 'bg-brand-500 text-white shadow-lg shadow-brand-200 active:scale-95' : 'bg-slate-50 text-slate-300 opacity-60 cursor-not-allowed'}`}
                        >
                          <CheckCircle2 size={14} />
                          Attendance
                        </button>
                        <button
                          onClick={() => { setSelectedClass(cls); setView('homework_new'); }}
                          className="py-4 bg-white border border-slate-100 text-slate-500 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:border-brand-500 hover:text-brand-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <FileSpreadsheet size={14} />
                          Homework
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  {assignmentsBySubject.map((subject) => (
                    <div key={subject.name} className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">{subject.name}</h4>
                      <div className="space-y-2">
                        {subject.classes.map((cls: any, i: number) => (
                          <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-600">{cls.classroom_name}</div>
                              <div>
                                <h6 className="font-bold text-slate-900">{cls.classroom_name} - {cls.section}</h6>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cls.grade_name}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setSelectedClass(cls); setView('attendance'); fetchClassStudents(cls.classroom_id); }}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${cls.can_take_attendance ? 'bg-brand-500 text-white shadow-md' : 'bg-slate-50 text-slate-200'}`}
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                onClick={() => { setSelectedClass(cls); setView('homework_new'); }}
                                className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center"
                              >
                                <FileSpreadsheet size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'class_detail' && (
            <motion.div key="class_detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-6 space-y-6">
              <div className="bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-3xl font-black mb-1">{selectedClass?.classroom_name}</h3>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{selectedClass?.subject_name}</p>

                  {selectedClass?.can_take_attendance && (
                    <div className="mt-8 flex gap-3">
                      <button
                        onClick={() => setView('attendance')}
                        className="bg-brand-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Take Attendance
                      </button>
                      <button className="bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest">
                        Materials
                      </button>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl"></div>
              </div>

              <div className="flex items-center justify-between px-2">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Students ({students.length})</h4>
              </div>

              <div className="space-y-3">
                {students.map((student, i) => (
                  <div key={i} className="bg-white p-4 rounded-[2rem] border border-slate-50 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 font-bold">{student.roll_number || i + 1}</div>
                    <div className="flex-1">
                      <h6 className="font-bold text-slate-900 text-sm">{student.first_name} {student.last_name}</h6>
                      <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">{student.admission_no}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'attendance' && (
            <motion.div key="attendance" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-6 space-y-6">
              {!selectedClass ? (
                <div className="space-y-4">
                  <div className="bg-white p-8 rounded-[3rem] text-center border border-slate-100">
                    <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600"><ClipboardCheck size={32} /></div>
                    <h3 className="text-xl font-black text-slate-900">Take Attendance</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Select a class to begin</p>
                  </div>
                  <div className="grid gap-3">
                    {data?.assignments.filter(a => a.can_take_attendance).map((cls, i) => (
                      <button
                        key={i}
                        onClick={() => { setSelectedClass(cls); fetchClassStudents(cls.classroom_id); }}
                        className="bg-white p-5 rounded-[2rem] border border-slate-50 shadow-sm flex items-center justify-between text-left group active:scale-95 transition-all"
                      >
                        <div>
                          <h5 className="font-bold text-slate-900">{cls.classroom_name}</h5>
                          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{cls.subject_name}</p>
                        </div>
                        <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-600 group-hover:text-white transition-all">
                          <ArrowRight size={18} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-1">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <h3 className="text-xl font-black text-slate-900">{selectedClass?.classroom_name} • {selectedClass?.subject_name}</h3>
                  </div>

                  <div className="space-y-2">
                    {students.map((student) => {
                      const status = attendanceRecords[student.id];
                      return (
                        <div key={student.id} className="bg-white h-20 px-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                            {student.roll_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h6 className="font-bold text-slate-900 text-sm truncate">{student.first_name} {student.last_name}</h6>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'present' }))}
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${status === 'present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-400 active:bg-slate-100'}`}
                            >
                              <CheckCircle2 className="w-6 h-6" />
                            </button>
                            <button
                              onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'absent' }))}
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${status === 'absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-50 text-slate-400 active:bg-slate-100'}`}
                            >
                              <XCircle className="w-6 h-6" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-6 pb-20">
                    <button
                      onClick={submitAttendance}
                      disabled={loading}
                      className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-slate-200 active:scale-[0.98] transition-transform disabled:opacity-50"
                    >
                      {loading ? 'Submitting...' : 'Complete Attendance'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {view === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 py-6 space-y-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, dIdx) => (
                <div key={day} className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50 py-2 z-10">{day}</h4>
                  <div className="space-y-2">
                    {timetable.filter(t => t.day_of_week === dIdx + 1).map((item, i) => (
                      <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-4">
                        <div className="w-20 text-center shrink-0">
                          <p className="text-xs font-black text-slate-900">{item.start_time}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">{item.end_time}</p>
                        </div>
                        <div className="w-1 h-10 bg-brand-500 rounded-full"></div>
                        <div>
                          <h6 className="font-bold text-slate-900 text-sm">{item.subject_name}</h6>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{item.classroom_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}


          {view === 'homework' && (
            <motion.div key="homework" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-6 space-y-6">
              <button
                onClick={() => setView('homework_new')}
                className="w-full bg-slate-900 text-white p-6 rounded-[2.5rem] flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-transform"
              >
                <Plus size={20} />
                <span className="text-xs font-black uppercase tracking-widest">New Homework</span>
              </button>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Recent Assignments</h4>
                {homeworks.map((hw, i) => (
                  <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase px-2 py-1 rounded-full mb-2 inline-block">{hw.subject_name}</span>
                        <h5 className="text-lg font-bold text-slate-900">{hw.title}</h5>
                        <p className="text-slate-400 text-xs font-medium">{hw.classroom_name}</p>
                      </div>
                      {hw.attachment_url && <FileImage className="text-slate-200" />}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase">
                        <Clock size={12} /> Due {new Date(hw.due_date).toLocaleDateString()}
                      </div>
                      <button className="text-indigo-600 text-[10px] font-black uppercase">View</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'homework_new' && (
            <motion.div key="homework_new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col bg-slate-50 relative pb-32">
              {/* Header */}
              <div className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-4">
                  <button onClick={() => hwStep === 0 ? setView('homework') : setHwStep(prev => prev - 1)} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl active:scale-95 transition-all">
                    <ArrowLeft size={20} />
                  </button>
                  {hwStep > 0 && (
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">Step {hwStep}</h3>
                      <p className="text-[8px] font-black text-brand-600 uppercase tracking-widest mt-1">Creation Wizard</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`h-1 rounded-full transition-all ${s <= hwStep ? 'w-4 bg-brand-600' : 'w-2 bg-slate-100'}`} />
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Step 0: Quick Start */}
                {hwStep === 0 && (
                  <div className="p-8 space-y-6">
                    <div className="mb-10">
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Assignment</h2>
                      <p className="text-sm font-bold text-slate-400 mt-2">Pick an entry point for your task</p>
                    </div>
                    
                    <button 
                        onClick={() => setHwStep(1)}
                        className="w-full flex items-center justify-between p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 active:scale-95 transition-all"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                <Plus size={28} />
                            </div>
                            <div className="text-left">
                                <span className="text-base font-black text-slate-900 block">From Scratch</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clean Slate</span>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-200" />
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: 'practice', label: 'Worksheet', icon: FileSpreadsheet, color: '#4f46e5' },
                            { id: 'reading', label: 'Reading', icon: BookOpen, color: '#10b981' },
                            { id: 'project', label: 'Project', icon: Trophy, color: '#f59e0b' },
                            { id: 'test', label: 'Quick Test', icon: HelpCircle, color: '#f43f5e' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => {
                                  const template = TEMPLATES[t.id];
                                  setHwFormData(prev => ({ ...prev, title: template.title, blocks: template.blocks.map(b => ({ ...b, id: Math.random().toString(36) })) }));
                                  setHwStep(2);
                                }}
                                className="flex flex-col items-start gap-8 p-8 bg-white rounded-[2.5rem] border border-slate-100 active:scale-95 transition-all"
                            >
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${t.color}10`, color: t.color }}>
                                    <t.icon size={24} />
                                </div>
                                <span className="text-xs font-black text-slate-900">{t.label}</span>
                            </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Step 1: Basics */}
                {hwStep === 1 && (
                  <div className="p-8 space-y-10">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Assignment Title</label>
                      <input 
                        type="text" 
                        value={hwFormData.title}
                        onChange={e => setHwFormData({...hwFormData, title: e.target.value})}
                        placeholder="e.g. Chapter 4 Practice" 
                        className="w-full text-3xl font-black text-slate-900 placeholder:text-slate-100 focus:outline-none bg-transparent" 
                      />
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Classroom & Subject</label>
                        <select 
                          value={hwFormData.classroom_id}
                          onChange={e => setHwFormData({...hwFormData, classroom_id: parseInt(e.target.value)})}
                          className="w-full bg-white border-2 border-slate-50 rounded-[2rem] p-6 text-sm font-bold appearance-none outline-none focus:border-brand-500 shadow-sm"
                        >
                          <option value="">Choose Target</option>
                          {data?.assignments.map((a, i) => <option key={i} value={a.classroom_id}>{a.classroom_name} - {a.subject_name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Deadline</label>
                        <div className="flex gap-2">
                          {['Today', 'Tomorrow'].map(d => (
                            <button 
                              key={d}
                              onClick={() => setHwFormData({...hwFormData, due_date: d === 'Today' ? new Date().toISOString().split('T')[0] : new Date(Date.now() + 86400000).toISOString().split('T')[0]})}
                              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${hwFormData.due_date === (d === 'Today' ? new Date().toISOString().split('T')[0] : new Date(Date.now() + 86400000).toISOString().split('T')[0]) ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' : 'bg-white text-slate-400'}`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                        <input 
                          type="date" 
                          value={hwFormData.due_date}
                          onChange={e => setHwFormData({...hwFormData, due_date: e.target.value})}
                          className="w-full bg-white border-2 border-slate-50 rounded-[2rem] p-6 text-sm font-bold outline-none focus:border-brand-500 shadow-sm" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Content */}
                {hwStep === 2 && (
                  <div className="p-8 space-y-6">
                    <AnimatePresence>
                      {hwFormData.blocks.map((block) => (
                        <motion.div 
                          key={block.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden"
                        >
                          <div className="flex items-center justify-between mb-6">
                            <span className="text-[9px] font-black text-brand-600 uppercase tracking-[0.3em]">{block.type} Block</span>
                            <button onClick={() => setHwFormData(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== block.id) }))}><X size={18} className="text-rose-400" /></button>
                          </div>
                          {block.type === 'instructions' && (
                            <textarea 
                              className="w-full text-sm font-bold text-slate-700 bg-transparent focus:outline-none resize-none leading-relaxed"
                              rows={3}
                              value={block.content}
                              onChange={e => setHwFormData(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === block.id ? { ...b, content: e.target.value } : b) }))}
                              placeholder="Type instructions here..."
                            />
                          )}
                          {block.type === 'question' && (
                            <input 
                              className="w-full text-sm font-black text-slate-900 bg-transparent focus:outline-none"
                              value={block.content}
                              onChange={e => setHwFormData(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === block.id ? { ...b, content: e.target.value } : b) }))}
                              placeholder="Enter your question..."
                            />
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    <button 
                        onClick={() => setShowBlockSheet(true)}
                        className="w-full py-10 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center gap-3 text-slate-300 font-black uppercase text-[10px] tracking-widest hover:border-brand-300 hover:bg-brand-50 transition-all"
                    >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-brand-600 mb-2"><Plus size={24} /></div>
                        Add Content Block
                    </button>
                  </div>
                )}

                {/* Step 3: Settings */}
                {hwStep === 3 && (
                  <div className="p-8 space-y-8">
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Submission Policy</h4>
                      <div className="flex p-1.5 bg-slate-50 rounded-2xl">
                        {['file', 'text', 'both'].map(m => (
                          <button
                            key={m}
                            onClick={() => setHwFormData({...hwFormData, submission_type: m as any})}
                            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${hwFormData.submission_type === m ? 'bg-white text-brand-600 shadow-md' : 'text-slate-400'}`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">Grading Enabled</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mark assignments</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setHwFormData({...hwFormData, is_graded: !hwFormData.is_graded})}
                        className={`w-14 h-7 rounded-full relative transition-all ${hwFormData.is_graded ? 'bg-brand-600' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${hwFormData.is_graded ? 'left-8' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Review */}
                {hwStep === 4 && (
                  <div className="p-8 space-y-8">
                    <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/20 rounded-full blur-3xl" />
                      <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-400 mb-2">Review Draft</p>
                        <h3 className="text-3xl font-black mb-10 leading-tight">{hwFormData.title}</h3>
                        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Target</p>
                            <p className="text-sm font-black">{data?.assignments.find(a => a.classroom_id === hwFormData.classroom_id)?.classroom_name || 'Classroom'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Due Date</p>
                            <p className="text-sm font-black">{new Date(hwFormData.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Action Bar */}
              <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex items-center gap-4 z-40">
                {hwStep < 4 ? (
                  <button 
                    onClick={() => setHwStep(prev => prev + 1)}
                    disabled={hwStep === 0}
                    className={`flex-1 py-6 bg-slate-900 text-white rounded-[2.5rem] text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl shadow-slate-200 ${hwStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                  >
                    Next Phase <ArrowRight size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const payload = {
                          ...hwFormData,
                          due_date: `${hwFormData.due_date}T${hwFormData.due_time}:00`,
                          description: JSON.stringify(hwFormData.blocks),
                          subject_id: data?.assignments.find(a => a.classroom_id === hwFormData.classroom_id)?.subject_id
                        };
                        const res = await api.post('/school/homework', payload);
                        if (res.data.success) {
                          setHwStep(0);
                          setView('homework');
                          fetchMainData();
                        }
                      } catch (err) { console.error(err); }
                      setSaving(false);
                    }}
                    className="flex-1 py-6 bg-brand-600 text-white rounded-[2.5rem] text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl shadow-brand-100"
                  >
                    {saving ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                    Dispatch Now
                  </button>
                )}
              </div>

              {/* Block Bottom Sheet */}
              <AnimatePresence>
                {showBlockSheet && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBlockSheet(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]" />
                    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3.5rem] p-10 z-[70] shadow-2xl">
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-10" />
                      <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Add Content</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { id: 'instructions', label: 'Instructions', icon: ClipboardCheck, color: '#4f46e5' },
                          { id: 'question', label: 'Question', icon: HelpCircle, color: '#10b981' },
                          { id: 'mcq', label: 'MCQ', icon: Layout, color: '#f59e0b' },
                          { id: 'attachment', label: 'Attachment', icon: Paperclip, color: '#f43f5e' }
                        ].map(b => (
                          <button
                            key={b.id}
                            onClick={() => {
                              const newBlock: Block = { id: Math.random().toString(36), type: b.id as any, content: b.id === 'mcq' ? { question: '', options: ['', '', '', ''], correct: 0 } : '' };
                              setHwFormData(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
                              setShowBlockSheet(false);
                            }}
                            className="flex items-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 active:scale-95 transition-all"
                          >
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${b.color}10`, color: b.color }}><b.icon size={20} /></div>
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{b.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {view === 'homework' && (
            <motion.div key="homework" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-6 space-y-6">
              <button
                onClick={() => setView('homework_new')}
                className="w-full bg-slate-900 text-white p-6 rounded-[2.5rem] flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-transform"
              >
                <Plus size={20} />
                <span className="text-xs font-black uppercase tracking-widest">New Homework</span>
              </button>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Recent Assignments</h4>
                {homeworks.map((hw, i) => (
                  <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase px-2 py-1 rounded-full mb-2 inline-block">{hw.subject_name}</span>
                        <h5 className="text-lg font-bold text-slate-900">{hw.title}</h5>
                        <p className="text-slate-400 text-xs font-medium">{hw.classroom_name}</p>
                      </div>
                      {hw.attachment_url && <FileImage className="text-slate-200" />}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase">
                        <Clock size={12} /> Due {new Date(hw.due_date).toLocaleDateString()}
                      </div>
                      <button className="text-indigo-600 text-[10px] font-black uppercase">View</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'homework_new' && (
            <motion.div key="homework_new" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-6 py-6 space-y-8 pb-32">
              <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col items-center gap-6 text-center overflow-hidden relative">
                <div className="flex gap-4 p-1 bg-white/10 rounded-2xl relative z-10">
                  <button 
                    onClick={() => setHwMode('text')} 
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${hwMode === 'text' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60'}`}
                  >
                    Type
                  </button>
                  <button 
                    onClick={() => setHwMode('snap')} 
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${hwMode === 'snap' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60'}`}
                  >
                    Snap
                  </button>
                  <button 
                    onClick={() => setHwMode('voice')} 
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${hwMode === 'voice' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60'}`}
                  >
                    Voice
                  </button>
                </div>

                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    {hwMode === 'text' && <ClipboardCheck size={32} className="text-white" />}
                    {hwMode === 'snap' && <Camera size={32} className="text-white" />}
                    {hwMode === 'voice' && <Mic size={32} className="text-white" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black">
                      {hwMode === 'text' ? 'Type Instructions' : hwMode === 'snap' ? 'Snap Blackboard' : 'Record Message'}
                    </h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Zero-friction assignment</p>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-500/20 rounded-full blur-3xl"></div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Class & Subject</label>
                  <select className="w-full bg-white border-2 border-slate-100 rounded-[1.5rem] p-4 text-sm font-bold appearance-none outline-none focus:border-indigo-500 shadow-sm">
                    <option>Select Target Class</option>
                    {data?.assignments.map((a, i) => <option key={i}>{a.classroom_name} - {a.subject_name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Homework Title</label>
                  <input type="text" placeholder="e.g. Chapter 4 Practice" className="w-full bg-white border-2 border-slate-100 rounded-[1.5rem] p-4 text-sm font-bold outline-none focus:border-indigo-500 shadow-sm" />
                </div>

                {hwMode === 'text' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Description</label>
                    <textarea 
                      placeholder="Type homework instructions here..." 
                      className="w-full bg-white border-2 border-slate-100 rounded-[1.5rem] p-6 text-sm font-bold outline-none focus:border-indigo-500 shadow-sm min-h-[150px]"
                    />
                  </div>
                )}

                {hwMode === 'snap' && (
                  <div className="bg-indigo-50 p-8 rounded-[2.5rem] border-2 border-dashed border-indigo-200 flex flex-col items-center gap-4 transition-all hover:bg-indigo-100/50">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-500">
                      <Camera size={24} />
                    </div>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Tap to capture blackboard</p>
                  </div>
                )}

                {hwMode === 'voice' && (
                  <div className="bg-rose-50 p-8 rounded-[2.5rem] border-2 border-dashed border-rose-200 flex flex-col items-center gap-4 transition-all hover:bg-rose-100/50">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-rose-500 animate-pulse">
                      <Mic size={24} />
                    </div>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Hold to record instructions</p>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-1 bg-rose-200 rounded-full" style={{ height: Math.random() * 20 + 10 + 'px' }}></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="fixed bottom-10 left-6 right-6">
                <button
                  onClick={() => navigateTo('homework')}
                  className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl active:scale-[0.98] transition-transform"
                >
                  Publish to Students
                </button>
              </div>
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-6 py-8 space-y-8">
              {/* Profile Card */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                <div className="w-24 h-24 bg-brand-100 rounded-[2.5rem] flex items-center justify-center mb-6 border-4 border-white shadow-lg relative z-10">
                  <User className="text-brand-600 w-12 h-12" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">{profile?.first_name} {profile?.last_name}</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">{profile?.staff_no || 'EMP-2026-001'}</p>

                <div className="flex gap-2 mb-2">
                  <span className="bg-brand-50 text-brand-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Permanent</span>
                  <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>
                </div>

                <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-50 rounded-full blur-3xl opacity-50"></div>
              </div>

              {/* Header Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-4 rounded-[2rem] border border-slate-50 shadow-sm">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Absent Today</p>
                  <h4 className="text-xl font-black text-slate-900">{data?.stats.absent_today}</h4>
                </div>
                <div className="bg-white p-4 rounded-[2rem] border border-slate-50 shadow-sm">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Upcoming Exams</p>
                  <h4 className="text-xl font-black text-slate-900">{data?.stats.upcoming_exams}</h4>
                </div>
              </div>

              {/* Info Rows */}
              <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
                <div className="p-6 flex items-center justify-between border-b border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><GraduationCap className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Primary Subject</p>
                      <p className="text-sm font-bold text-slate-900">{profile?.designation || 'Physics Specialist'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><CalendarIcon className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Joining Date</p>
                      <p className="text-sm font-bold text-slate-900">{profile?.joining_date ? new Date(profile.joining_date).toLocaleDateString() : 'August 14, 2024'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Settings */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                  <Palette size={12} /> Personalization
                </h4>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm">
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { id: 'indigo', color: '#4f46e5', label: 'Indigo' },
                      { id: 'amber', color: '#d97706', label: 'Amber' },
                      { id: 'emerald', color: '#059669', label: 'Emerald' },
                      { id: 'ocean', color: '#0284c7', label: 'Ocean' },
                      { id: 'midnight', color: '#0f172a', label: 'Midnight' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          localStorage.setItem('pynemonk-theme', t.id);
                          document.documentElement.setAttribute('data-theme', t.id);
                        }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl border-2 transition-all ${document.documentElement.getAttribute('data-theme') === t.id || (!document.documentElement.getAttribute('data-theme') && t.id === 'indigo') ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent'}`}
                          style={{ backgroundColor: t.color }}
                        />
                        <span className="text-[7px] font-black uppercase tracking-tighter text-slate-400">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <button onClick={onLogout} className="w-full bg-rose-50 text-rose-600 p-6 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all">
                <LogOut className="w-5 h-5" />
                Sign Out from Device
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="mobile-bottom-nav">
        <button onClick={() => navigateTo('home')} className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-brand-600' : 'text-slate-400'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => navigateTo('exams')} className={`flex flex-col items-center gap-1 ${view === 'exams' ? 'text-brand-600' : 'text-slate-400'}`}>
          <GraduationCap className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Exams</span>
        </button>
        <button onClick={() => navigateTo('classes')} className={`flex flex-col items-center gap-1 ${view === 'classes' ? 'text-brand-600' : 'text-slate-400'}`}>
          <Users className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Classes</span>
        </button>
        <button onClick={() => navigateTo('calendar')} className={`flex flex-col items-center gap-1 ${view === 'calendar' ? 'text-brand-600' : 'text-slate-400'}`}>
          <CalendarDays className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Schedule</span>
        </button>
        <button onClick={() => navigateTo('profile')} className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-brand-600' : 'text-slate-400'}`}>
          <User className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Profile</span>
        </button>
      </nav>
    </div>
  )
}

type ParentView = 'home' | 'attendance' | 'exams' | 'faculty' | 'homework'

const ParentDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [view, setView] = useState<ParentView>('home')
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [attendance, setAttendance] = useState<any>(null)
  const [exams, setExams] = useState<any>(null)
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [classroom, setClassroom] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    if (selectedStudent) {
      fetchAllStudentData(selectedStudent.id)
    }
  }, [selectedStudent])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await api.get('/school/guardian/my-students')
      if (res.data.success) {
        setStudents(res.data.data)
        if (res.data.data.length > 0) setSelectedStudent(res.data.data[0])
      }
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const fetchAllStudentData = async (studentId: number) => {
    setLoading(true)
    try {
      const [attRes, examRes, classRes] = await Promise.all([
        api.get(`/school/guardian/student/${studentId}/attendance`),
        api.get(`/school/guardian/student/${studentId}/exams`),
        api.get(`/school/guardian/student/${studentId}/classroom`)
      ])
      if (attRes.data.success) setAttendance(attRes.data.data)
      if (examRes.data.success) setExams(examRes.data.data)
      if (classRes.data.success) setClassroom(classRes.data.data)

      const hwRes = await api.get(`/school/homework?classroomId=${classRes.data.data.classroom.id}`)
      if (hwRes.data.success) setHomeworks(hwRes.data.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  if (loading && !selectedStudent) return <div className="flex-1 flex items-center justify-center"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
      {/* Dynamic Header */}
      <header className="bg-white/80 backdrop-blur-xl px-6 pb-6 border-b border-slate-100 shrink-0 sticky top-0 z-20" style={{ paddingTop: 'calc(var(--safe-top) + 1.5rem)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view !== 'home' && (
              <button onClick={() => setView('home')} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 transition-transform">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <p className="text-brand-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                {view === 'home' ? 'Parent Portal' : view.toUpperCase()}
              </p>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                {selectedStudent?.first_name}'s {view === 'home' ? 'Dashboard' : view}
              </h2>
            </div>
          </div>
          <button onClick={onLogout} className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 active:scale-90 transition-transform">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Student Switcher (only if multiple) */}
        {students.length > 1 && view === 'home' && (
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1 no-scrollbar">
            {students.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedStudent?.id === s.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
              >
                {s.first_name}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-6 space-y-8">
              {/* Profile Overview Card */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 relative overflow-hidden">
                <div className="w-20 h-20 bg-brand-100 rounded-[2rem] flex items-center justify-center shrink-0 border-4 border-white shadow-inner relative z-10">
                  <Baby className="text-brand-600 w-10 h-10" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-slate-900 leading-none mb-1">{selectedStudent?.first_name} {selectedStudent?.last_name}</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{selectedStudent?.grade_name} • {selectedStudent?.classroom_name}</p>
                  <div className="flex items-center gap-1 mt-3 text-[10px] font-black text-emerald-600 bg-emerald-100/50 px-3 py-1 rounded-full w-fit">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Roll No: {selectedStudent?.roll_number || 'N/A'}
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-50 rounded-full blur-3xl opacity-50"></div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setView('attendance')} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm text-left group active:scale-95 transition-all">
                  <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><CheckCircle2 className="text-emerald-500 w-5 h-5" /></div>
                  <h3 className="text-2xl font-black text-slate-900">
                    {attendance?.summary.find((s: any) => s.status === 'present')?.count || 0}
                  </h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Days Present</p>
                </button>
                <button onClick={() => setView('exams')} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm text-left group active:scale-95 transition-all">
                  <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><TrendingUp className="text-indigo-600 w-5 h-5" /></div>
                  <h3 className="text-2xl font-black text-slate-900">{exams?.upcoming.length || 0}</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Upcoming Exams</p>
                </button>
                <button onClick={() => setView('homework')} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm text-left group active:scale-95 transition-all col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><ClipboardCheck className="text-brand-600 w-5 h-5" /></div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900">{homeworks.length}</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Pending Homework</p>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-200" />
                  </div>
                </button>
              </div>

              {/* Class Teacher Quick View */}
              <div onClick={() => setView('faculty')} className="bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer">
                <div className="relative z-10">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Class Mentor</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                      {classroom?.classroom.teacher_first_name?.[0]}{classroom?.classroom.teacher_last_name?.[0] || 'T'}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-none">{classroom?.classroom.teacher_first_name} {classroom?.classroom.teacher_last_name || 'Not Assigned'}</h4>
                      <p className="text-white/60 text-xs mt-1">Class Teacher • Contactable</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={60} />
                </div>
              </div>

              {/* Recent Activity / Feed */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Latest Results</h4>
                <div className="space-y-3">
                  {exams?.past.slice(0, 3).map((res: any, i: number) => (
                    <div key={i} className="bg-white p-5 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xs">
                          {res.grade}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-sm">{res.subject_name}</h5>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{res.exam_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">{res.marks}/{res.max_marks}</p>
                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{new Date(res.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {exams?.past.length === 0 && (
                    <div className="py-10 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No results published yet</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'homework' && (
            <motion.div key="homework" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-6 space-y-4">
              {homeworks.map((hw, i) => (
                <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase px-2 py-1 rounded-full mb-2 inline-block">{hw.subject_name}</span>
                      <h5 className="text-lg font-bold text-slate-900">{hw.title}</h5>
                      <p className="text-slate-400 text-xs font-medium">Assigned on {new Date(hw.created_at).toLocaleDateString()}</p>
                    </div>
                    {hw.attachment_url && <FileImage className="text-brand-600" />}
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                    {hw.description || 'View details for assignment instructions.'}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-[8px] font-black text-rose-500 uppercase">
                      <Clock size={12} /> Due {new Date(hw.due_date).toLocaleDateString()}
                    </div>
                    <button className="bg-brand-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Submit</button>
                  </div>
                </div>
              ))}
              {homeworks.length === 0 && (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardCheck className="text-slate-200" size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">All caught up!</p>
                </div>
              )}
            </motion.div>
          )}

          {view === 'attendance' && (
            <motion.div key="attendance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-6 py-6 space-y-8">
              <div className="grid grid-cols-3 gap-3">
                {['present', 'absent', 'late'].map(status => {
                  const count = attendance?.summary.find((s: any) => s.status === status)?.count || 0;
                  return (
                    <div key={status} className="bg-white p-4 rounded-3xl border border-slate-100 text-center">
                      <p className={`text-[8px] font-black uppercase mb-1 ${status === 'present' ? 'text-emerald-500' : status === 'absent' ? 'text-rose-500' : 'text-amber-500'}`}>
                        {status}
                      </p>
                      <h4 className="text-xl font-black text-slate-900">{count}</h4>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Recent Records</h4>
                <div className="space-y-2">
                  {attendance?.recent.map((rec: any, i: number) => (
                    <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-50 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{new Date(rec.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        {rec.remarks && <p className="text-[10px] text-slate-400 italic mt-0.5">{rec.remarks}</p>}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${rec.status === 'present' ? 'bg-emerald-50 text-emerald-600' :
                        rec.status === 'absent' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                        {rec.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'exams' && (
            <motion.div key="exams" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-6 py-6 space-y-8">
              {/* Upcoming Schedule */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-brand-600 uppercase tracking-widest px-2">Upcoming Schedule</h4>
                <div className="space-y-3">
                  {exams?.upcoming.map((paper: any, i: number) => (
                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center text-indigo-600 shrink-0">
                        <p className="text-[8px] font-black uppercase">{new Date(paper.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                        <p className="text-lg font-black leading-none">{new Date(paper.date).getDate()}</p>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-slate-900">{paper.subject_name}</h5>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{paper.exam_name} • {paper.start_time}</p>
                      </div>
                    </div>
                  ))}
                  {exams?.upcoming.length === 0 && (
                    <div className="py-12 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                      <CalendarIcon className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No upcoming exams</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Comprehensive Results */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Performance History</h4>
                <div className="space-y-3">
                  {exams?.past.map((res: any, i: number) => (
                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h5 className="font-bold text-slate-900">{res.subject_name}</h5>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{res.exam_name}</p>
                        </div>
                        <div className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black uppercase">
                          Grade: {res.grade}
                        </div>
                      </div>
                      <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${(res.marks / res.max_marks) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(res.date).toLocaleDateString()}</p>
                        <p className="text-xs font-black text-slate-900">{res.marks} / {res.max_marks}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'faculty' && (
            <motion.div key="faculty" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-6 py-6 space-y-8">
              {/* Class Teacher Card */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center space-y-4">
                <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black mx-auto shadow-xl">
                  {classroom?.classroom.teacher_first_name?.[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{classroom?.classroom.teacher_first_name} {classroom?.classroom.teacher_last_name}</h3>
                  <p className="text-brand-600 text-[10px] font-black uppercase tracking-widest mt-1">Class Teacher</p>
                </div>
                {classroom?.classroom.teacher_phone && (
                  <div className="flex items-center justify-center gap-2 text-slate-400 text-sm font-medium pt-2">
                    <Phone size={14} />
                    {classroom.classroom.teacher_phone}
                  </div>
                )}
              </div>

              {/* Subject Teachers List */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Subject Teachers</h4>
                <div className="space-y-3">
                  {classroom?.subjects.map((sub: any, i: number) => (
                    <div key={i} className="bg-white p-5 rounded-[2.5rem] border border-slate-50 flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs shrink-0">
                        {sub.subject_name[0]}
                      </div>
                      <div className="flex-1">
                        <h6 className="font-bold text-slate-900 text-sm">{sub.subject_name}</h6>
                        <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">{sub.teacher_first_name} {sub.teacher_last_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="mobile-bottom-nav">
        <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-brand-600' : 'text-slate-400'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => setView('attendance')} className={`flex flex-col items-center gap-1 ${view === 'attendance' ? 'text-brand-600' : 'text-slate-400'}`}>
          <CheckCircle2 className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Attendance</span>
        </button>
        <button onClick={() => setView('exams')} className={`flex flex-col items-center gap-1 ${view === 'exams' ? 'text-brand-600' : 'text-slate-400'}`}>
          <GraduationCap className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Exams</span>
        </button>
        <button onClick={() => setView('faculty')} className={`flex flex-col items-center gap-1 ${view === 'faculty' ? 'text-brand-600' : 'text-slate-400'}`}>
          <Users className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Faculty</span>
        </button>
        <button onClick={() => setView('homework')} className={`flex flex-col items-center gap-1 ${view === 'homework' ? 'text-brand-600' : 'text-slate-400'}`}>
          <BookOpen className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Homework</span>
        </button>
      </nav>
    </div>
  )
}

function App() {
  const [role, setRole] = useState<Role | null>(localStorage.getItem('role') as Role)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  useEffect(() => {
    const savedTheme = localStorage.getItem('pynemonk-theme') || 'indigo';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setToken(null)
    setRole(null)
  }

  const handleLogin = (r: Role, t: string) => {
    localStorage.setItem('token', t)
    localStorage.setItem('role', r)
    setRole(r)
    setToken(t)
  }

  return (
    <div className="h-[100dvh] w-full bg-white md:bg-slate-900 flex items-center justify-center p-0 md:p-6 lg:p-10 overflow-hidden fixed inset-0">
      <div className="w-full h-full md:max-w-[420px] bg-white md:h-[880px] md:max-h-[900px] md:rounded-[4rem] shadow-2xl relative overflow-hidden md:border-[12px] md:border-slate-800 flex flex-col transition-all">
        <AnimatePresence mode="wait">
          {!token || !role ? (
            <motion.div key="login" className="flex-1 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Login onLogin={handleLogin} />
            </motion.div>
          ) : role === 'teacher' ? (
            <motion.div key="teacher" className="flex-1 flex flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TeacherDashboard onLogout={handleLogout} />
            </motion.div>
          ) : role === 'parent' ? (
            <motion.div key="parent" className="flex-1 flex flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ParentDashboard onLogout={handleLogout} />
            </motion.div>
          ) : (
            <motion.div key="fallback" className="flex-1 flex items-center justify-center p-10 text-center">
              <div>
                <p className="text-slate-400 text-sm font-bold mb-4">Account session error. Please log in again.</p>
                <button onClick={handleLogout} className="bg-brand-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase">Sign Out</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
