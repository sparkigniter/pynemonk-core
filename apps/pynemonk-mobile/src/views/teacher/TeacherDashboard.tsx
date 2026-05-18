import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, LogOut, Clock, User, Timer, MapPin, Users, ChevronRight, 
  ClipboardCheck, BookOpen, Megaphone, MessageSquare, CheckCircle2, 
  FileSpreadsheet, ArrowRight, XCircle, MoreHorizontal, Plus, 
  HelpCircle, Trophy, FileImage, Camera, Mic, Palette, Home, GraduationCap, CalendarDays, Layout, Paperclip, Send,
  PlayCircle, Calendar as CalendarIcon, X
} from 'lucide-react'
import { api } from '../../api'
import { Assignment, TimetableItem, ExamItem, Homework, Student, AssignmentType } from '../../types'
import { ScheduleView } from './ScheduleView'
import { ExamManagementView } from './ExamManagementView'
import { AcademicPlannerView } from './AcademicPlannerView'
import { MobileNoticeBoardView } from '../shared/MobileNoticeBoardView'
import { MobileCommunicationsView } from '../shared/MobileCommunicationsView'

type TeacherView = 'home' | 'schedule' | 'classes' | 'class_detail' | 'attendance' | 'homework' | 'homework_new' | 'calendar' | 'profile' | 'inbox' | 'notices' | 'exams' | 'planner' | 'more'

interface TeacherDashboardData {
  assignments: Assignment[]
  stats: {
    absent_today: number
    upcoming_exams: number
    notes_sent_24h: number
  }
}

interface Block {
  id: string
  type: 'instructions' | 'question' | 'mcq' | 'attachment'
  content: any
}

const TEMPLATES: Record<string, { title: string; blocks: Omit<Block, 'id'>[] }> = {
  practice: {
    title: 'Daily Practice Worksheet',
    blocks: [
      { type: 'instructions', content: 'Complete the following practice problems in your notebook.' },
      { type: 'question', content: 'Solve for x: 3x + 7 = 22' },
      { type: 'question', content: 'Find the area of a triangle with base 6cm and height 8cm.' }
    ]
  },
  reading: {
    title: 'Required Reading Session',
    blocks: [
      { type: 'instructions', content: 'Read Chapter 4 of your textbook, focusing on the core summary.' },
      { type: 'question', content: 'Summarize the main argument in 3 sentences.' }
    ]
  },
  project: {
    title: 'Mini Research Project',
    blocks: [
      { type: 'instructions', content: 'Gather data and prepare a 1-page report.' },
      { type: 'question', content: 'List 3 primary sources you plan to use.' }
    ]
  },
  test: {
    title: 'Revision Mini-Test',
    blocks: [
      { type: 'instructions', content: 'Answer the revision question without looking at your notes.' },
      { type: 'question', content: 'Explain the difference between weather and climate.' }
    ]
  }
}

export const TeacherDashboard = ({ onLogout }: { onLogout: () => void }) => {
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
  const [saving, setSaving] = useState(false)
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
      const res = await api.get(`/school/staff/teacher/class/\${classroomId}/students`)
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

  if (loading && view === 'home') return <div className="flex-grow flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>

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
      <main className="flex-grow overflow-y-auto custom-scrollbar pb-32">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="px-6 py-6 space-y-6">
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
                      onClick={() => {
                        const asgn = data?.assignments.find(a => a.classroom_name === nextClass.classroom_name);
                        if (asgn) {
                          setSelectedClass(asgn);
                          fetchClassStudents(asgn.classroom_id);
                          setView('attendance');
                        }
                      }}
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
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col gap-4 active:scale-95 transition-transform cursor-pointer" onClick={() => navigateTo('classes')}>
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

              {/* Academic Syllabus Planner Widget */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => navigateTo('planner')}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-emerald-100 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <BookOpen size={22} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-base font-black">Academic Planner</h4>
                    <p className="text-white/70 text-[9px] font-black uppercase tracking-wider mt-0.5">Syllabus Engine & Target Tracker</p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <ChevronRight size={18} className="text-white" />
                </div>
              </motion.div>

              {/* Notice Board & Correspondence Widgets */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigateTo('notices')}
                  className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-3 active:scale-95 transition-transform cursor-pointer group hover:border-brand-300"
                >
                  <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <Megaphone size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Notice Board</h4>
                    <p className="text-slate-400 text-[8px] font-bold uppercase tracking-wider mt-0.5">School Announcements</p>
                  </div>
                </motion.div>

                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigateTo('inbox')}
                  className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-3 active:scale-95 transition-transform cursor-pointer group hover:border-brand-300"
                >
                  <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Correspondence</h4>
                    <p className="text-slate-400 text-[8px] font-bold uppercase tracking-wider mt-0.5">Parent-Teacher Desk</p>
                  </div>
                </motion.div>
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
                    const isCompleted = i === 0;
                    const isActive = i === 1;

                    return (
                      <div key={i} className="relative">
                        <div className={`absolute -left-[24px] top-1.5 w-4 h-4 rounded-full border-4 border-white z-10 \${isCompleted ? 'bg-emerald-500 shadow-lg shadow-emerald-100' : isActive ? 'bg-indigo-600 shadow-lg shadow-indigo-100 ring-4 ring-indigo-50' : 'bg-slate-200'}`}></div>
                        <div className={`bg-white p-5 rounded-[2rem] border shadow-sm flex items-center justify-between \${isActive ? 'border-indigo-100 ring-1 ring-indigo-50' : 'border-slate-50'}`}>
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
            <motion.div key="schedule" className="flex-1 flex flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ScheduleView 
                timetable={timetable} 
                assignments={data?.assignments || []} 
                onAction={handleScheduleAction} 
              />
            </motion.div>
          )}

          {view === 'inbox' && (
            <motion.div key="inbox" className="flex-1 flex flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MobileCommunicationsView 
                onBack={() => navigateTo('home')} 
                userRole="teacher"
              />
            </motion.div>
          )}

          {view === 'notices' && (
            <motion.div key="notices" className="flex-1 flex flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MobileNoticeBoardView 
                onBack={() => navigateTo('home')} 
                userRole="teacher"
              />
            </motion.div>
          )}

          {view === 'exams' && (
            <motion.div key="exams" className="flex-1 flex flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ExamManagementView 
                exams={exams} 
                loading={loading} 
                onBack={() => navigateTo('home')} 
              />
            </motion.div>
          )}
          {view === 'planner' && (
            <motion.div key="planner" className="flex-1 flex flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AcademicPlannerView 
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
            <motion.div key="classes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-6 py-6 space-y-6">
              {/* View Switcher */}
              <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <button
                  onClick={() => setMobileViewMode('class')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all \${mobileViewMode === 'class' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
                >
                  By Class
                </button>
                <button
                  onClick={() => setMobileViewMode('subject')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all \${mobileViewMode === 'subject' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
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
                          className={`py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all \${cls.can_take_attendance ? 'bg-brand-500 text-white shadow-lg shadow-brand-200 active:scale-95' : 'bg-slate-50 text-slate-300 opacity-60 cursor-not-allowed'}`}
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
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all \${cls.can_take_attendance ? 'bg-brand-500 text-white shadow-md' : 'bg-slate-50 text-slate-200'}`}
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
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors \${status === 'present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-400 active:bg-slate-100'}`}
                            >
                              <CheckCircle2 className="w-6 h-6" />
                            </button>
                            <button
                              onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'absent' }))}
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors \${status === 'absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-50 text-slate-400 active:bg-slate-100'}`}
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
                    <div key={s} className={`h-1 rounded-full transition-all \${s <= hwStep ? 'w-4 bg-brand-600' : 'w-2 bg-slate-100'}`} />
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
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
                                  setHwFormData(prev => ({ ...prev, title: template.title, blocks: template.blocks.map(b => ({ ...b, id: Math.random().toString(36) })) as Block[] }));
                                  setHwStep(2);
                                }}
                                className="flex flex-col items-start gap-8 p-8 bg-white rounded-[2.5rem] border border-slate-100 active:scale-95 transition-all"
                            >
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `\${t.color}10`, color: t.color }}>
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
                          value={hwFormData.classroom_id || ''}
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
                              type="button"
                              onClick={() => setHwFormData({...hwFormData, due_date: d === 'Today' ? new Date().toISOString().split('T')[0] : new Date(Date.now() + 86400000).toISOString().split('T')[0]})}
                              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all \${hwFormData.due_date === (d === 'Today' ? new Date().toISOString().split('T')[0] : new Date(Date.now() + 86400000).toISOString().split('T')[0]) ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' : 'bg-white text-slate-400'}`}
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
                            <button type="button" onClick={() => setHwFormData(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== block.id) }))}><X size={18} className="text-rose-400" /></button>
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
                        type="button"
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
                            type="button"
                            onClick={() => setHwFormData({...hwFormData, submission_type: m as any})}
                            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all \${hwFormData.submission_type === m ? 'bg-white text-brand-600 shadow-md' : 'text-slate-400'}`}
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
                        type="button"
                        onClick={() => setHwFormData({...hwFormData, is_graded: !hwFormData.is_graded})}
                        className={`w-14 h-7 rounded-full relative transition-all \${hwFormData.is_graded ? 'bg-brand-600' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all \${hwFormData.is_graded ? 'left-8' : 'left-1'}`} />
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
                    type="button"
                    onClick={() => setHwStep(prev => prev + 1)}
                    disabled={hwStep === 0}
                    className={`flex-1 py-6 bg-slate-900 text-white rounded-[2.5rem] text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl shadow-slate-200 \${hwStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                  >
                    Next Phase <ArrowRight size={18} />
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const payload = {
                          ...hwFormData,
                          due_date: `\${hwFormData.due_date}T\${hwFormData.due_time}:00`,
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
                            type="button"
                            onClick={() => {
                              const newBlock: Block = { id: Math.random().toString(36), type: b.id as any, content: b.id === 'mcq' ? { question: '', options: ['', '', '', ''], correct: 0 } : '' };
                              setHwFormData(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
                              setShowBlockSheet(false);
                            }}
                            className="flex items-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 active:scale-95 transition-all"
                          >
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `\${b.color}10`, color: b.color }}><b.icon size={20} /></div>
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
                        type="button"
                        onClick={() => {
                          localStorage.setItem('pynemonk-theme', t.id);
                          document.documentElement.setAttribute('data-theme', t.id);
                        }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl border-2 transition-all \${document.documentElement.getAttribute('data-theme') === t.id || (!document.documentElement.getAttribute('data-theme') && t.id === 'indigo') ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent'}`}
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
        <button onClick={() => navigateTo('home')} className={`flex flex-col items-center gap-1 \${view === 'home' ? 'text-brand-600' : 'text-slate-400'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => navigateTo('exams')} className={`flex flex-col items-center gap-1 \${view === 'exams' ? 'text-brand-600' : 'text-slate-400'}`}>
          <GraduationCap className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Exams</span>
        </button>
        <button onClick={() => navigateTo('classes')} className={`flex flex-col items-center gap-1 \${view === 'classes' ? 'text-brand-600' : 'text-slate-400'}`}>
          <Users className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Classes</span>
        </button>
        <button onClick={() => navigateTo('calendar')} className={`flex flex-col items-center gap-1 \${view === 'calendar' ? 'text-brand-600' : 'text-slate-400'}`}>
          <CalendarDays className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Schedule</span>
        </button>
        <button onClick={() => navigateTo('profile')} className={`flex flex-col items-center gap-1 \${view === 'profile' ? 'text-brand-600' : 'text-slate-400'}`}>
          <User className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Profile</span>
        </button>
      </nav>
    </div>
  )
}
