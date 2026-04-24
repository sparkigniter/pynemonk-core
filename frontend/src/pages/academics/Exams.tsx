import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Calendar,
  Plus,
  Users,
  Search,
  X,
  Check,
  Clock,
  ChevronRight,
  MoreVertical,
  UserCheck,
  UserX,
  Calculator
} from 'lucide-react';
import { examApi } from '../../api/exam.api';
import type { Exam, ExamTerm, ExamPaper, ExamStudent } from '../../api/exam.api';
import { getGrades } from '../../api/grade.api';
import { getSubjectList } from '../../api/subject.api';
import { getClassrooms } from '../../api/classroom.api';
import { TimetableApi } from '../../api/timetable.api';
import type { Grade } from '../../api/grade.api';
import type { Subject } from '../../api/subject.api';
import type { Classroom } from '../../api/classroom.api';

// ── Components ───────────────────────────────────────────────────────────────

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm group">
            <X className="w-5 h-5 text-slate-400 group-hover:text-rose-500" />
          </button>
        </div>
        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────

export default function Exams() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [terms, setTerms] = useState<ExamTerm[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [periods, setPeriods] = useState<{ period_number: number, start_time: string, end_time: string }[]>([]);

  const [selectedExam, setSelectedExam] = useState<(Exam & { papers: ExamPaper[], invitations: any[], students: ExamStudent[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);

  // Forms & UI state
  const [examStep, setExamStep] = useState(1);
  const [newExam, setNewExam] = useState<any>({
    name: '',
    exam_type: 'periodic',
    start_date: '',
    end_date: '',
    invitations: [] // [{ grade_id, classroom_id }]
  });
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [newTerm, setNewTerm] = useState<Partial<ExamTerm>>({ name: '', start_date: '', end_date: '' });
  const [newPaper, setNewPaper] = useState<Partial<ExamPaper>>({
    subject_id: 0,
    exam_date: '',
    start_time: '',
    end_time: '',
    max_marks: 100,
    passing_marks: 33,
    user_period: true
  });
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [examsData, termsData, gradesData, subjectsData, classroomsData, periodsData] = await Promise.all([
        examApi.getExams(),
        examApi.getTerms(),
        getGrades(),
        getSubjectList(),
        getClassrooms(),
        TimetableApi.getPeriods()
      ]);
      setExams(examsData);
      setTerms(termsData);
      setGrades(gradesData);
      setSubjects(subjectsData.data);
      setClassrooms(classroomsData.data);
      setPeriods(periodsData);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleGradeChange = (gradeId: number) => {
    setSelectedGrade(gradeId);
    // Auto-invite all classrooms of this grade by default or let user select
    const gradeClassrooms = classrooms.filter(c => c.grade_id === gradeId);
    setNewExam((prev: any) => ({
      ...prev,
      invitations: gradeClassrooms.map(c => ({ grade_id: gradeId, classroom_id: c.id }))
    }));
  };

  const toggleInvitation = (classroomId: number) => {
    setNewExam((prev: any) => {
      const exists = prev.invitations.find((i: any) => i.classroom_id === classroomId);
      if (exists) {
        return { ...prev, invitations: prev.invitations.filter((i: any) => i.classroom_id !== classroomId) };
      } else {
        return { ...prev, invitations: [...prev.invitations, { grade_id: selectedGrade, classroom_id: classroomId }] };
      }
    });
  };

  const handleCreateExam = async () => {
    try {
      await examApi.createExam(newExam);
      setIsExamModalOpen(false);
      setExamStep(1);
      setSelectedGrade(null);
      setNewExam({ name: '', exam_type: 'periodic', start_date: '', end_date: '', invitations: [] });
      loadInitialData();
    } catch (err) { console.error(err); }
  };

  const handleCreateTerm = async () => {
    try {
      await examApi.createTerm(newTerm);
      setIsTermModalOpen(false);
      loadInitialData();
    } catch (err) { console.error(err); }
  };

  const openExamDetails = async (id: number) => {
    try {
      const details = await examApi.getExamDetails(id);
      setSelectedExam(details);
      setIsDetailsModalOpen(true);
    } catch (err) { console.error(err); }
  };

  const handleAddPaper = async () => {
    if (!selectedExam) return;
    try {
      await examApi.addPaper(selectedExam.id, newPaper);
      const details = await examApi.getExamDetails(selectedExam.id);
      setSelectedExam(details);
      setIsPaperModalOpen(false);
    } catch (err) { console.error(err); }
  };

  const handleUpdateStudentStatus = async (studentId: number, isExcluded: boolean, reason?: string) => {
    if (!selectedExam) return;
    try {
      await examApi.updateStudentStatus(selectedExam.id, studentId, { is_excluded: isExcluded, exclusion_reason: reason });
      const details = await examApi.getExamDetails(selectedExam.id);
      setSelectedExam(details);
    } catch (err) { console.error(err); }
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-primary" />
          </div>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Assembling Academic Modules...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-primary p-4 rounded-[1.5rem] shadow-xl shadow-primary/20 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Examinations</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Assessment Control Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTermModalOpen(true)}
              className="bg-white text-slate-600 px-6 py-3.5 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all shadow-sm border border-slate-200 active:scale-95"
            >
              Manage Terms
            </button>
            <button
              onClick={() => setIsExamModalOpen(true)}
              className="bg-primary text-white px-8 py-3.5 rounded-2xl text-sm font-black hover:opacity-90 flex items-center gap-3 transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Schedule Exam
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Active Exams', value: exams.filter(e => !e.is_published).length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Total Assessed', value: '450+', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Published Result', value: exams.filter(e => e.is_published).length, icon: Check, color: 'text-primary', bg: 'bg-primary/5' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-[1.25rem] group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {exams.map(exam => (
            <div
              key={exam.id}
              onClick={() => openExamDetails(exam.id)}
              className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 p-8 cursor-pointer group relative overflow-hidden"
            >
              {/* Status Badge */}
              <div className="absolute top-8 right-8">
                {exam.is_published ? (
                  <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    Published
                  </div>
                ) : (
                  <div className="bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Pending
                  </div>
                )}
              </div>

              <div className="mb-8">
                <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-500">
                  <Calendar className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors duration-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{exam.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{exam.term_name || 'Generic Term'}</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span className="font-bold">Date Range</span>
                  </div>
                  <span className="font-black text-slate-900">{new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Users className="w-4 h-4" />
                    <span className="font-bold">Students</span>
                  </div>
                  <span className="font-black text-slate-900">Invited</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[8px] font-black text-primary uppercase">
                    +12
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-500 transform group-hover:translate-x-1">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              {/* Decorative background element */}
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            </div>
          ))}

          {/* Add Empty State / Placeholder */}
          {exams.length === 0 && (
            <div className="col-span-full bg-white rounded-[3rem] border border-dashed border-slate-200 p-20 text-center">
              <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                <ClipboardList className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">No Exams Scheduled</h3>
              <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-xs">Ready to start assessing? Create your first exam above.</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}

      {/* Exam Create Modal (Multi-Step Wizard) */}
      <Modal
        isOpen={isExamModalOpen}
        onClose={() => {
          setIsExamModalOpen(false);
          setExamStep(1);
          setSelectedGrade(null);
          setNewExam({ name: '', exam_type: 'periodic', start_date: '', end_date: '', invitations: [] });
        }}
        title={examStep === 1 ? "Schedule New Exam" : "Target Audience"}
      >
        <div className="space-y-8">
          {/* Progress Indicator */}
          <div className="flex items-center gap-4 mb-8">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${examStep === i ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : examStep > i ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {examStep > i ? <Check className="w-4 h-4" /> : i}
                </div>
                {i === 1 && <div className={`w-12 h-1 rounded-full ${examStep > 1 ? 'bg-emerald-500' : 'bg-slate-100'}`} />}
              </div>
            ))}
          </div>

          {examStep === 1 ? (
            <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Exam Title</label>
                <input
                  type="text"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  placeholder="e.g. Mid-Annual 2024"
                  value={newExam.name}
                  onChange={e => setNewExam({ ...newExam, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Term</label>
                <select
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none appearance-none"
                  value={newExam.exam_term_id || ''}
                  onChange={e => setNewExam({ ...newExam, exam_term_id: parseInt(e.target.value) })}
                >
                  <option value="">Select Term</option>
                  {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Exam Type</label>
                <select
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none appearance-none"
                  value={newExam.exam_type}
                  onChange={e => setNewExam({ ...newExam, exam_type: e.target.value as any })}
                >
                  <option value="periodic">Periodic/Unit Test</option>
                  <option value="term">Term Exam</option>
                  <option value="annual">Annual Exam</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Start Date</label>
                <input
                  type="date"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none"
                  value={newExam.start_date}
                  onChange={e => setNewExam({ ...newExam, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">End Date</label>
                <input
                  type="date"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none"
                  value={newExam.end_date}
                  onChange={e => setNewExam({ ...newExam, end_date: e.target.value })}
                />
              </div>
              <div className="col-span-2 pt-4">
                <button
                  onClick={() => setExamStep(2)}
                  disabled={!newExam.name || !newExam.start_date || !newExam.end_date}
                  className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                >
                  Continue to Selection
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Target Grade</label>
                <div className="grid grid-cols-2 gap-3">
                  {grades.map(grade => (
                    <button
                      key={grade.id}
                      onClick={() => handleGradeChange(grade.id)}
                      className={`px-6 py-4 rounded-2xl border font-bold text-sm transition-all text-left flex items-center justify-between ${selectedGrade === grade.id ? 'bg-primary/5 border-primary text-primary shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
                    >
                      {grade.name}
                      {selectedGrade === grade.id && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {selectedGrade && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Specific Sections (Classrooms)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {classrooms.filter(c => c.grade_id === selectedGrade).map(classroom => {
                      const isInvited = newExam.invitations.some((i: any) => i.classroom_id === classroom.id);
                      return (
                        <button
                          key={classroom.id}
                          onClick={() => toggleInvitation(classroom.id)}
                          className={`px-6 py-4 rounded-2xl border font-bold text-sm transition-all text-left flex items-center justify-between ${isInvited ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
                        >
                          {classroom.name} - {classroom.section}
                          {isInvited ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-100" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-8 flex gap-4">
                <button
                  onClick={() => setExamStep(1)}
                  className="px-8 py-5 rounded-[1.5rem] bg-slate-50 text-slate-500 font-black text-sm hover:bg-slate-100 active:scale-[0.98] transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateExam}
                  disabled={newExam.invitations.length === 0}
                  className="flex-1 bg-primary text-white py-5 rounded-[1.5rem] font-black text-sm shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30"
                >
                  Confirm & Schedule Exam
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Details Modal (The Workspace) */}
      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={selectedExam?.name || 'Exam Details'}>
        <div className="space-y-10">

          {/* Section: Papers Schedule */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Date Sheet / Papers
              </h4>
              <button
                onClick={() => setIsPaperModalOpen(true)}
                className="bg-primary/5 text-primary p-2 rounded-xl hover:bg-primary/10 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {selectedExam?.papers.map(paper => (
                <div key={paper.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm text-primary font-black text-xs">
                      {paper.subject_code}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{paper.subject_name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(paper.exam_date).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {paper.start_time.slice(0, 5)} - {paper.end_time.slice(0, 5)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900">{paper.max_marks} Marks</p>
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter mt-1">Pass: {paper.passing_marks}</p>
                    </div>
                    <button 
                        onClick={() => navigate(`/exams/${selectedExam.id}/papers/${paper.id}/marks`)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                    >
                        <Calculator size={14} />
                        Marks
                    </button>
                  </div>
                </div>
              ))}
              {selectedExam?.papers.length === 0 && <p className="text-xs text-slate-400 font-bold italic text-center py-4">No papers scheduled yet.</p>}
            </div>
          </div>

          {/* Section: Student Invitations (The brainstormed part) */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Invited Students ({selectedExam?.students.filter(s => !s.is_excluded).length})
              </h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  placeholder="Search students..."
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:bg-white transition-all w-48"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {selectedExam?.students
                .filter(s => s.first_name.toLowerCase().includes(studentSearch.toLowerCase()) || s.admission_no.includes(studentSearch))
                .map(student => (
                  <div key={student.student_id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${student.is_excluded ? 'bg-rose-50/50 border-rose-100 opacity-70' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${student.is_excluded ? 'bg-rose-100 text-rose-500' : 'bg-primary/5 text-primary'}`}>
                        {student.first_name[0]}
                      </div>
                      <div>
                        <p className={`text-sm font-black ${student.is_excluded ? 'text-rose-900' : 'text-slate-900'}`}>{student.first_name} {student.last_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{student.classroom_name} - {student.classroom_section} | {student.admission_no}</p>
                      </div>
                    </div>

                    {student.is_excluded ? (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-rose-500 uppercase">Excluded</p>
                          <p className="text-[8px] font-bold text-rose-400 max-w-[100px] truncate">{student.exclusion_reason || 'No reason provided'}</p>
                        </div>
                        <button
                          onClick={() => handleUpdateStudentStatus(student.student_id, false)}
                          className="p-2 bg-emerald-50 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          const reason = prompt("Enter reason for exclusion:");
                          if (reason !== null) handleUpdateStudentStatus(student.student_id, true, reason);
                        }}
                        className="p-2 bg-slate-50 text-slate-300 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all group"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50">
            <button className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95">
              <Check className="w-5 h-5" />
              Save & Lock Schedule
            </button>
          </div>
        </div>
      </Modal>

      {/* Paper Creation Modal */}
      <Modal isOpen={isPaperModalOpen} onClose={() => setIsPaperModalOpen(false)} title="Add Paper to Schedule">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Subject</label>
              <select
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none appearance-none"
                value={newPaper.subject_id}
                onChange={e => setNewPaper({ ...newPaper, subject_id: parseInt(e.target.value) })}
              >
                <option value="0">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Scheduling Mode</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setNewPaper({ ...newPaper, user_period: false })}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!newPaper.user_period ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    Time
                  </button>
                  <button
                    onClick={() => setNewPaper({ ...newPaper, user_period: true })}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${newPaper.user_period ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    Period
                  </button>
                </div>
              </div>

              {newPaper.user_period ? (
                <select
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none appearance-none animate-in slide-in-from-top-2"
                  onChange={e => {
                    const p = periods.find(p => p.period_number === parseInt(e.target.value));
                    if (p) setNewPaper({ ...newPaper, start_time: p.start_time, end_time: p.end_time });
                  }}
                >
                  <option value="">Select Timetable Period</option>
                  {periods.map(p => (
                    <option key={p.period_number} value={p.period_number}>
                      Period {p.period_number} ({p.start_time.slice(0, 5)} - {p.end_time.slice(0, 5)})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                  <input
                    type="time"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none"
                    value={newPaper.start_time}
                    onChange={e => setNewPaper({ ...newPaper, start_time: e.target.value })}
                  />
                  <input
                    type="time"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none"
                    value={newPaper.end_time}
                    onChange={e => setNewPaper({ ...newPaper, end_time: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Exam Date</label>
              <input
                type="date"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none"
                value={newPaper.exam_date}
                onChange={e => setNewPaper({ ...newPaper, exam_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Room / Hall</label>
              <input
                type="text"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none"
                placeholder="e.g. Hall A"
                value={newPaper.room}
                onChange={e => setNewPaper({ ...newPaper, room: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Max Marks</label>
              <input
                type="number"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none"
                value={newPaper.max_marks}
                onChange={e => setNewPaper({ ...newPaper, max_marks: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Passing Marks</label>
              <input
                type="number"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none"
                value={newPaper.passing_marks}
                onChange={e => setNewPaper({ ...newPaper, passing_marks: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <button
            onClick={handleAddPaper}
            className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black text-sm shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Schedule Paper
          </button>
        </div>
      </Modal>

      {/* Term Creation Modal */}
      <Modal isOpen={isTermModalOpen} onClose={() => setIsTermModalOpen(false)} title="Manage Academic Terms">
        <div className="space-y-8">
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Create New Term</h5>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Term Name (e.g. Fall 2024)"
                className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl font-bold outline-none"
                value={newTerm.name}
                onChange={e => setNewTerm({ ...newTerm, name: e.target.value })}
              />
              <button onClick={handleCreateTerm} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm active:scale-[0.98] transition-all">Add Term</button>
            </div>
          </div>

          <div>
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Existing Terms</h5>
            <div className="space-y-2">
              {terms.map(term => (
                <div key={term.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                  <span className="font-bold text-slate-900">{term.name}</span>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-rose-500 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}
