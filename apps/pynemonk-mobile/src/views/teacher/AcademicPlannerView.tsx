import { useState, useEffect } from 'react'
import { ArrowLeft, ChevronDown, BookOpen, Plus, Calendar as CalendarIcon, TrendingUp, Clock, CalendarDays, Sparkles, CheckCircle2, PlayCircle } from 'lucide-react'
import { api } from '../../api'

export const AcademicPlannerView = ({ onBack }: { onBack: () => void }) => {
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [selectedYearId, setSelectedYearId] = useState<string>('')
  const [selectedGradeId, setSelectedGradeId] = useState<string>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')

  const [planner, setPlanner] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'chapters' | 'milestones'>('chapters')

  // Modals
  const [showInitModal, setShowInitModal] = useState(false)
  const [showChapterModal, setShowChapterModal] = useState(false)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)

  // Form inputs
  const [initData, setInitData] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
  })
  const [chapterData, setChapterData] = useState({
    name: '',
    description: '',
    estimated_lessons: 5
  })
  const [milestoneData, setMilestoneData] = useState({
    name: '',
    target_date: new Date().toISOString().split('T')[0],
    description: ''
  })

  useEffect(() => {
    loadMetadata()
  }, [])

  useEffect(() => {
    if (selectedYearId && selectedGradeId && selectedSubjectId && selectedTeacherId) {
      loadPlanner()
    } else {
      setPlanner(null)
    }
  }, [selectedYearId, selectedGradeId, selectedSubjectId, selectedTeacherId])

  const loadMetadata = async () => {
    setLoading(true)
    try {
      const [yearsData, gradesData, subjectsData, staffData, profileRes] = await Promise.all([
        api.get('/school/academics/years'),
        api.get('/school/grades?limit=100'),
        api.get('/school/subjects?limit=100'),
        api.get('/school/staff?limit=300'),
        api.get('/school/staff/profile/me')
      ])

      const extractArray = (res: any) => {
        if (!res) return []
        if (Array.isArray(res)) return res
        if (res.success && res.data) {
          if (Array.isArray(res.data)) return res.data
          if (res.data.data && Array.isArray(res.data.data)) return res.data.data
          if (res.data.items && Array.isArray(res.data.items)) return res.data.items
        }
        if (res.data && Array.isArray(res.data)) return res.data
        if (res.items && Array.isArray(res.items)) return res.items
        return []
      }

      const yearsList = extractArray(yearsData.data)
      const gradesList = extractArray(gradesData.data)
      const subjectsList = extractArray(subjectsData.data)
      const staffList = extractArray(staffData.data)
      const profileObj = profileRes.data?.success ? profileRes.data.data : null

      setAcademicYears(yearsList)
      setGrades(gradesList)
      setSubjects(subjectsList)
      setTeachers(staffList)

      // Auto-select current active year
      const activeYear = yearsList.find((y: any) => y.status === 'active' || y.status === 'ACTIVE' || y.is_active || y.is_current)
      if (activeYear) {
        setSelectedYearId(activeYear.id.toString())
      } else if (yearsList.length > 0) {
        setSelectedYearId(yearsList[0].id.toString())
      }

      // Auto-select current teacher profile
      if (profileObj) {
        const matchingStaff = staffList.find((s: any) => s.user_id?.toString() === profileObj.user_id?.toString())
        if (matchingStaff) {
          setSelectedTeacherId(matchingStaff.id.toString())
        }
      }
    } catch (err) {
      console.error('Failed to load metadata', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPlanner = async () => {
    setLoading(true)
    try {
      const res = await api.get(
        `/school/planners/by-teacher-subject?staff_id=\${selectedTeacherId}&subject_id=\${selectedSubjectId}&grade_id=\${selectedGradeId}`
      )
      if (res.data?.id || res.data?.data?.id) {
        const id = res.data?.id || res.data?.data?.id
        const details = await api.get(`/school/planners/\${id}`)
        setPlanner(details.data?.success ? details.data.data : details.data)
      } else {
        setPlanner(null)
      }
    } catch (err) {
      console.error('Failed to load planner', err)
      setPlanner(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlanner = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        academic_year_id: parseInt(selectedYearId) || (academicYears[0]?.id ? parseInt(academicYears[0].id) : null),
        staff_id: parseInt(selectedTeacherId) || (teachers[0]?.id ? parseInt(teachers[0].id) : null),
        subject_id: parseInt(selectedSubjectId) || (subjects[0]?.id ? parseInt(subjects[0].id) : null),
        grade_id: parseInt(selectedGradeId) || (grades[0]?.id ? parseInt(grades[0].id) : null),
        start_date: initData.start_date,
        end_date: initData.end_date
      }
      const createdRes = await api.post('/school/planners', payload)
      const createdId = createdRes.data?.id || createdRes.data?.data?.id
      setShowInitModal(false)
      const details = await api.get(`/school/planners/\${createdId}`)
      setPlanner(details.data?.success ? details.data.data : details.data)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to initialize academic planner')
    }
  }

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planner) return
    try {
      await api.post(`/school/planners/\${planner.id}/chapters`, chapterData)
      setShowChapterModal(false)
      setChapterData({ name: '', description: '', estimated_lessons: 5 })
      loadPlanner()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add chapter')
    }
  }

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planner) return
    try {
      await api.post(`/school/planners/\${planner.id}/milestones`, milestoneData)
      setShowMilestoneModal(false)
      setMilestoneData({ name: '', target_date: new Date().toISOString().split('T')[0], description: '' })
      loadPlanner()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add milestone')
    }
  }

  const handleUpdateChapterStatus = async (chapterId: number, currentStatus: string) => {
    let nextStatus = 'pending'
    if (currentStatus === 'pending') nextStatus = 'in_progress'
    else if (currentStatus === 'in_progress') nextStatus = 'completed'

    try {
      await api.put(`/school/planners/chapters/\${chapterId}`, { status: nextStatus })
      loadPlanner()
    } catch (err) {
      console.error('Failed to update status', err)
    }
  }

  const handleAutoSchedule = async () => {
    if (!planner) return
    if (!confirm("This will automatically calculate and evenly schedule chapter completion dates based on lesson durations. Continue?")) return
    
    setLoading(true)
    try {
      const scheduledRes = await api.post(`/school/planners/\${planner.id}/auto-schedule`, {})
      setPlanner(scheduledRes.data?.success ? scheduledRes.data.data : scheduledRes.data)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to auto-schedule planner')
    } finally {
      setLoading(false)
    }
  }

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
      case 'in_progress': return 'bg-amber-50 text-amber-600 border-amber-100'
      default: return 'bg-slate-50 text-slate-400 border-slate-100'
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* Header Panel */}
      <header className="px-6 py-6 bg-white rounded-b-[2.5rem] shadow-sm shrink-0 border-b border-slate-100">
        <div className="flex items-center gap-4 mb-5">
          <button onClick={onBack} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Academic Planner</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Syllabus Engine & Target Tracker</p>
          </div>
        </div>

        {/* Dynamic Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <select
              value={selectedGradeId}
              onChange={e => setSelectedGradeId(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 pr-8 text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand-500 transition-all text-slate-900"
            >
              <option value="">Select Grade</option>
              {grades.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 pr-8 text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand-500 transition-all text-slate-900"
            >
              <option value="">Select Subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto px-6 py-6 custom-scrollbar pb-32">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Syllabus Data...</p>
          </div>
        ) : !selectedGradeId || !selectedSubjectId ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-20 h-20 bg-white border border-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300 shadow-sm">
              <BookOpen size={30} />
            </div>
            <h3 className="text-base font-black text-slate-900">Select Subject & Grade</h3>
            <p className="text-slate-400 text-xs max-w-[240px] mx-auto leading-relaxed">
              Choose a class section and subject above to build and manage your teaching syllabus targets.
            </p>
          </div>
        ) : !planner ? (
          <div className="bg-white rounded-[2.5rem] p-8 text-center border border-slate-100 shadow-sm space-y-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
              <CalendarIcon size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">No Active Planner</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Initialize an academic planner to begin adding chapters, scheduling hours, and tracking completion benchmarks.
              </p>
            </div>
            <button
              onClick={() => setShowInitModal(true)}
              className="w-full py-4 bg-brand-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-brand-100"
            >
              <Plus size={14} /> Initialize Syllabus Planner
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Completion Metric */}
            <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-white/5 rounded-full" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Syllabus Completion</span>
                <TrendingUp size={16} className="text-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-4xl font-black">{planner.metrics?.progressPercentage}%</h3>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `\${planner.metrics?.progressPercentage}%` }} />
              </div>
              <div className="flex justify-between items-center mt-3 text-[9px] font-bold text-white/50 uppercase tracking-wider">
                <span>{planner.metrics?.completedChapters} / {planner.metrics?.totalChapters} Chapters Finished</span>
                <span>{planner.metrics?.probability || 'On Track'}</span>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <Clock size={16} className="text-sky-500 mb-2" />
                <h4 className="text-lg font-black text-slate-900 leading-none">{planner.metrics?.completedLessons} / {planner.metrics?.totalLessons}</h4>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lesson Periods Covered</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <CalendarDays size={16} className="text-amber-500 mb-2" />
                <h4 className="text-lg font-black text-slate-900 leading-none">{planner.metrics?.remainingDays} Days</h4>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Remaining Term Days</p>
              </div>
            </div>

            {/* Tabs & Tab List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <header className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setActiveTab('chapters')}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all \${activeTab === 'chapters' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    Syllabus
                  </button>
                  <button
                    onClick={() => setActiveTab('milestones')}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all \${activeTab === 'milestones' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    Milestones
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {activeTab === 'chapters' ? (
                    <>
                      <button
                        onClick={handleAutoSchedule}
                        className="p-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                        title="Auto-Schedule Dates"
                      >
                        <Sparkles size={10} className="text-amber-400" /> Auto
                      </button>
                      <button
                        onClick={() => setShowChapterModal(true)}
                        className="p-3 bg-brand-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                      >
                        <Plus size={10} /> Add
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowMilestoneModal(true)}
                      className="p-3 bg-brand-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                    >
                      <Plus size={10} /> Add
                    </button>
                  )}
                </div>
              </header>

              <div className="p-5">
                {activeTab === 'chapters' ? (
                  planner.chapters.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <p className="text-xs font-bold text-slate-400">No chapters found</p>
                      <button onClick={() => setShowChapterModal(true)} className="text-brand-600 text-[10px] font-black uppercase tracking-widest">Add Chapter</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {planner.chapters.map((ch: any, idx: number) => (
                        <div key={ch.id} className="p-4 bg-slate-50 rounded-2xl flex items-start justify-between gap-4 border border-slate-100">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleUpdateChapterStatus(ch.id, ch.status)}
                              className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-all \${
                                ch.status === 'completed'
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : ch.status === 'in_progress'
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'bg-white border-slate-200 text-slate-300'
                              }`}
                            >
                              {ch.status === 'completed' ? <CheckCircle2 size={14} /> : ch.status === 'in_progress' ? <PlayCircle size={12} className="text-white fill-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                            </button>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-black text-slate-400 uppercase">CH {idx + 1}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase border \${getStatusStyle(ch.status)}`}>
                                  {ch.status.replace('_', ' ')}
                                </span>
                              </div>
                              <h5 className="font-black text-slate-900 text-sm mt-1">{ch.name}</h5>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Weight: {ch.estimated_lessons} lessons</p>
                              {ch.start_date && ch.end_date && (
                                <p className="text-[8px] font-bold text-brand-600 uppercase tracking-wider mt-1.5">
                                  {new Date(ch.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(ch.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  planner.milestones.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <p className="text-xs font-bold text-slate-400">No milestones registered</p>
                      <button onClick={() => setShowMilestoneModal(true)} className="text-brand-600 text-[10px] font-black uppercase tracking-widest">Add Milestone</button>
                    </div>
                  ) : (
                    <div className="relative border-l border-slate-200 ml-3 space-y-6 py-2">
                      {planner.milestones.map((mil: any) => (
                        <div key={mil.id} className="relative pl-6">
                          <div className="absolute -left-[16px] top-1 w-3 h-3 rounded-full bg-slate-900 border-2 border-white" />
                          <div>
                            <span className="text-[8px] font-black text-slate-400 uppercase">
                              {new Date(mil.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <h5 className="font-black text-slate-900 text-sm mt-0.5">{mil.name}</h5>
                            <p className="text-slate-400 text-xs mt-0.5">{mil.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Initialize Planner Modal */}
      {showInitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100">
            <header className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-950">Initialize Planner</h3>
              <button onClick={() => setShowInitModal(false)} className="text-slate-400 hover:text-slate-950 text-xs font-black uppercase tracking-widest">Cancel</button>
            </header>
            <form onSubmit={handleCreatePlanner} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Term Start Date</label>
                <input 
                  type="date"
                  required
                  value={initData.start_date}
                  onChange={e => setInitData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Term End Date</label>
                <input 
                  type="date"
                  required
                  value={initData.end_date}
                  onChange={e => setInitData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 mt-2 font-black uppercase text-[10px] tracking-wider rounded-xl">
                Initialize Now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Chapter Modal */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100">
            <header className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-950">Add Chapter</h3>
              <button onClick={() => setShowChapterModal(false)} className="text-slate-400 hover:text-slate-950 text-xs font-black uppercase tracking-widest">Cancel</button>
            </header>
            <form onSubmit={handleAddChapter} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Chapter Title</label>
                <input 
                  type="text"
                  required
                  value={chapterData.name}
                  onChange={e => setChapterData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Chemical Bonding"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Estimated Lessons</label>
                <input 
                  type="number"
                  required
                  min={1}
                  value={chapterData.estimated_lessons}
                  onChange={e => setChapterData(prev => ({ ...prev, estimated_lessons: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Description</label>
                <textarea 
                  value={chapterData.description}
                  onChange={e => setChapterData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Core learning objectives..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none resize-none"
                />
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 mt-2 font-black uppercase text-[10px] tracking-wider rounded-xl">
                Add Chapter
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100">
            <header className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-950">Add Milestone</h3>
              <button onClick={() => setShowMilestoneModal(false)} className="text-slate-400 hover:text-slate-950 text-xs font-black uppercase tracking-widest">Cancel</button>
            </header>
            <form onSubmit={handleAddMilestone} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Milestone Title</label>
                <input 
                  type="text"
                  required
                  value={milestoneData.name}
                  onChange={e => setMilestoneData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Term Assessment 1"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Target Date</label>
                <input 
                  type="date"
                  required
                  value={milestoneData.target_date}
                  onChange={e => setMilestoneData(prev => ({ ...prev, target_date: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Description</label>
                <textarea 
                  value={milestoneData.description}
                  onChange={e => setMilestoneData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Milestone criteria..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none resize-none"
                />
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 mt-2 font-black uppercase text-[10px] tracking-wider rounded-xl">
                Add Milestone
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
