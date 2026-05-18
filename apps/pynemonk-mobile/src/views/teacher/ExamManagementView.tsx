import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Calendar as CalendarIcon, PlayCircle, Inbox, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ExamItem } from '../../types'
import { api } from '../../api'

export const ExamManagementView = ({ onBack, exams, loading: initialLoading }: { onBack: () => void, exams: ExamItem[], loading: boolean }) => {
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
        <header className="px-6 py-8 bg-white rounded-b-[3rem] shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Your Exam Work</h1>
            <button onClick={onBack} className="text-brand-600 text-[10px] font-black uppercase tracking-widest">Back</button>
          </div>
          <div className="flex bg-slate-50 p-1.5 rounded-2xl">
            <button className="flex-1 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Pending</button>
            <button className="flex-1 py-3 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">History</button>
          </div>
        </header>

        <main className="flex-grow overflow-y-auto px-6 py-8 space-y-6 pb-24">
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
        <header className="px-6 pt-12 pb-6 flex-shrink-0">
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

        <main className="flex-grow overflow-y-auto px-6 pb-12 flex flex-col justify-center">
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
