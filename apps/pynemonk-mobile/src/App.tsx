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
  Image as ImageIcon
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
type TeacherView = 'home' | 'classes' | 'class_detail' | 'attendance' | 'calendar' | 'exams' | 'profile' | 'homework' | 'homework_new'

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
    <div className="flex flex-col px-8 pt-24 pb-12 min-h-screen bg-white">
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

  const navigateTo = (newView: TeacherView) => {
    setView(newView)
    if (newView === 'calendar') fetchTimetable()
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
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="px-6 py-6 space-y-8">
              {/* Stats & Settings Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center mb-4"><Users className="text-rose-500 w-5 h-5" /></div>
                  <h3 className="text-2xl font-black text-slate-900">{data?.stats.absent_today || 0}</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Absent Today</p>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4"><CalendarIcon className="text-indigo-600 w-5 h-5" /></div>
                  <h3 className="text-2xl font-black text-slate-900">{data?.stats.upcoming_exams || 0}</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Pending Exams</p>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4"><CalendarDays className="text-emerald-600 w-5 h-5" /></div>
                  <h3 className="text-2xl font-black text-slate-900">{data?.assignments.length || 0}</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Sessions</p>
                </div>
                <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200 text-left relative overflow-hidden group active:scale-95 transition-all" onClick={() => navigateTo('calendar')}>
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mb-4 relative z-10"><Clock className="text-white/60 w-5 h-5" /></div>
                  <h3 className="text-[12px] font-black text-white uppercase mb-1 relative z-10">Next Period</h3>
                  <p className="text-slate-400 text-[14px] font-bold relative z-10">
                    {timetable.find(t => t.day_of_week === (new Date().getDay() || 7))?.subject_name || 'No more classes'}
                  </p>
                  <p className="text-brand-500 text-[10px] font-black uppercase tracking-widest mt-1 relative z-10">
                    {timetable.find(t => t.day_of_week === (new Date().getDay() || 7))?.classroom_name || 'Today'}
                  </p>
                  <div className="absolute -bottom-5 -right-5 w-20 h-20 bg-brand-500/10 rounded-full blur-2xl"></div>
                </div>
              </div>

              {/* Assignments Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Schedule</h4>
                  <button onClick={() => navigateTo('classes')} className="text-brand-600 text-[10px] font-black uppercase tracking-widest">Full Workload</button>
                </div>
                <div className="space-y-3">
                  {data?.assignments.filter(a => a.is_scheduled_today).slice(0, 3).map((cls, i) => (
                    <div key={i} onClick={() => handleClassClick(cls)} className="bg-white p-5 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center justify-between group active:scale-95 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white text-lg font-black">{cls.classroom_name}</div>
                        <div>
                          <h5 className="font-bold text-slate-900">{cls.subject_name}</h5>
                          <div className="flex items-center gap-2">
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{cls.grade_name}</p>
                            {cls.can_take_attendance && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {cls.can_take_attendance && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedClass(cls); setView('attendance'); fetchClassStudents(cls.classroom_id); }}
                            className="bg-brand-50 text-brand-600 p-3 rounded-2xl"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        <ChevronRight className="text-slate-200 w-5 h-5 group-hover:text-brand-600" />
                      </div>
                    </div>
                  ))}
                  {data?.assignments.filter(a => a.is_scheduled_today).length === 0 && (
                     <div className="bg-white p-8 rounded-[2.5rem] text-center border border-slate-50">
                        <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">No classes scheduled for you today</p>
                     </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'classes' && (
            <motion.div key="classes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-6 py-6 space-y-6">
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

                  <div className="space-y-3">
                    {students.map((student) => (
                      <div key={student.id} className="bg-white p-4 rounded-[2rem] border border-slate-50 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xs">{student.roll_number}</div>
                        <div className="flex-1">
                          <h6 className="font-bold text-slate-900 text-sm">{student.first_name}</h6>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'present' }))}
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${attendanceRecords[student.id] === 'present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-400'}`}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'absent' }))}
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${attendanceRecords[student.id] === 'absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-50 text-slate-400'}`}
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="sticky bottom-4 px-2 pb-10">
                    <button
                      onClick={submitAttendance}
                      disabled={loading}
                      className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-slate-200 active:scale-[0.98] transition-transform disabled:opacity-50"
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

          {view === 'exams' && (
            <motion.div key="exams" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-6 space-y-4">
              {exams.map((exam, i) => (
                <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-2 py-1 rounded-full mb-2 inline-block">Upcoming Exam</span>
                      <h5 className="text-lg font-bold text-slate-900">{exam.exam_name}</h5>
                      <p className="text-slate-400 text-xs font-medium">{exam.subject_name} • {exam.classroom_name}</p>
                    </div>
                    <CalendarIcon className="text-slate-300 w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(exam.exam_date).toLocaleDateString()}</span>
                    <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold">Enter Marks</button>
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
          <ClipboardCheck className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Presence</span>
        </button>
        <button onClick={() => setView('exams')} className={`flex flex-col items-center gap-1 ${view === 'exams' ? 'text-brand-600' : 'text-slate-400'}`}>
          <TrendingUp className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Performance</span>
        </button>
        <button onClick={() => setView('faculty')} className={`flex flex-col items-center gap-1 ${view === 'faculty' ? 'text-brand-600' : 'text-slate-400'}`}>
          <Users className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Faculty</span>
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 md:p-6 lg:p-10">
      <div className="w-full md:max-w-[420px] bg-white min-h-screen md:min-h-[880px] md:max-h-[900px] md:rounded-[4rem] shadow-2xl relative overflow-hidden md:border-[12px] md:border-slate-800 flex flex-col scale-95 md:scale-100 transition-all">
        <AnimatePresence mode="wait">
          {!token || !role ? (
            <motion.div key="login" className="flex-1 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
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
