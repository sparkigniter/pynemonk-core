import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, LogOut, CheckCircle2, TrendingUp, ClipboardCheck, 
  Baby, ChevronRight, Megaphone, MessageSquare, BookOpen, Clock, FileImage, 
  Phone, ShieldCheck, Home, Users, Calendar as CalendarIcon, GraduationCap
} from 'lucide-react'
import { api } from '../../api'
import { Student, Homework } from '../../types'
import { MobileNoticeBoardView } from '../shared/MobileNoticeBoardView'
import { MobileCommunicationsView } from '../shared/MobileCommunicationsView'

type ParentView = 'home' | 'attendance' | 'exams' | 'faculty' | 'homework' | 'notices' | 'inbox'

export const ParentDashboard = ({ onLogout }: { onLogout: () => void }) => {
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
        api.get(`/school/guardian/student/\${studentId}/attendance`),
        api.get(`/school/guardian/student/\${studentId}/exams`),
        api.get(`/school/guardian/student/\${studentId}/classroom`)
      ])
      if (attRes.data.success) setAttendance(attRes.data.data)
      if (examRes.data.success) setExams(examRes.data.data)
      if (classRes.data.success) setClassroom(classRes.data.data)

      const hwRes = await api.get(`/school/homework?classroomId=\${classRes.data.data.classroom.id}`)
      if (hwRes.data.success) setHomeworks(hwRes.data.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  if (loading && !selectedStudent) return <div className="flex-1 flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>

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
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all \${selectedStudent?.id === s.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
              >
                {s.first_name}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-grow overflow-y-auto custom-scrollbar pb-32">
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

              {/* Notice Board & Correspondence Widgets */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView('notices')}
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
                  onClick={() => setView('inbox')}
                  className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-3 active:scale-95 transition-transform cursor-pointer group hover:border-brand-300"
                >
                  <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Correspondence</h4>
                    <p className="text-slate-400 text-[8px] font-bold uppercase tracking-wider mt-0.5">Message Teacher</p>
                  </div>
                </motion.div>
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
                      <p className={`text-[8px] font-black uppercase mb-1 \${status === 'present' ? 'text-emerald-500' : status === 'absent' ? 'text-rose-500' : 'text-amber-500'}`}>
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
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest \${rec.status === 'present' ? 'bg-emerald-50 text-emerald-600' :
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
                          style={{ width: `\${(res.marks / res.max_marks) * 100}%` }}
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

          {view === 'notices' && (
            <motion.div key="notices" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-grow flex flex-col min-h-0 overflow-hidden pb-12">
              <MobileNoticeBoardView 
                onBack={() => setView('home')} 
                userRole="parent"
              />
            </motion.div>
          )}

          {view === 'inbox' && (
            <motion.div key="inbox" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-grow flex flex-col min-h-0 overflow-hidden pb-12">
              <MobileCommunicationsView 
                onBack={() => setView('home')} 
                userRole="parent"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="mobile-bottom-nav">
        <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 \${view === 'home' ? 'text-brand-600' : 'text-slate-400'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => setView('attendance')} className={`flex flex-col items-center gap-1 \${view === 'attendance' ? 'text-brand-600' : 'text-slate-400'}`}>
          <CheckCircle2 className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Attendance</span>
        </button>
        <button onClick={() => setView('exams')} className={`flex flex-col items-center gap-1 \${view === 'exams' ? 'text-brand-600' : 'text-slate-400'}`}>
          <GraduationCap className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Exams</span>
        </button>
        <button onClick={() => setView('faculty')} className={`flex flex-col items-center gap-1 \${view === 'faculty' ? 'text-brand-600' : 'text-slate-400'}`}>
          <Users className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Faculty</span>
        </button>
        <button onClick={() => setView('homework')} className={`flex flex-col items-center gap-1 \${view === 'homework' ? 'text-brand-600' : 'text-slate-400'}`}>
          <BookOpen className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Homework</span>
        </button>
      </nav>
    </div>
  )
}
