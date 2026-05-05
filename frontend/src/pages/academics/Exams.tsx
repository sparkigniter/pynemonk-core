import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  Calendar,
  Plus,
  X,
  Clock,
  Settings,
  MoreVertical,
  UserCheck,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import { examApi } from '../../api/exam.api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Exam, ExamTerm } from '../../api/exam.api';

// ── Components ───────────────────────────────────────────────────────────────

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: ReactNode }) => {
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
  const [searchParams] = useSearchParams();
  const classIdFromUrl = searchParams.get('classId');
  const { notify } = useNotification();
  const { can } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [terms, setTerms] = useState<ExamTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);

  // Forms & UI state
  const [newTerm, setNewTerm] = useState<Partial<ExamTerm>>({ name: '', start_date: '', end_date: '' });

  useEffect(() => { loadInitialData(); }, [classIdFromUrl]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [examsData, termsData] = await Promise.all([
        examApi.getExams(undefined, classIdFromUrl ? parseInt(classIdFromUrl) : undefined),
        examApi.getTerms()
      ]);
      setExams(examsData);
      setTerms(termsData);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleCreateTerm = async () => {
    try {
      await examApi.createTerm(newTerm);
      setIsTermModalOpen(false);
      notify('success', 'Term Created', `Term ${newTerm.name} is now available.`);
      loadInitialData();
    } catch (err: any) {
      notify('error', 'Failed to Create Term', err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 bg-[#FBFBFE] min-h-screen">
      <div className="max-w-[1500px] mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-slate-900 p-5 rounded-[1.75rem] shadow-2xl shadow-slate-900/10">
              <ClipboardList className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Academic Assessments</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Exam Execution System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {can('exam:write') && (
              <>
                <button
                  onClick={() => setIsTermModalOpen(true)}
                  className="bg-white text-slate-600 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm border border-slate-100 active:scale-95"
                >
                  Academic Terms
                </button>
                <button
                  onClick={() => navigate('/exams/new')}
                  className="bg-indigo-600 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-3 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Initialize Exam
                </button>
              </>
            )}
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { label: 'Active Exams', value: exams.filter(e => !e.is_published).length, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Papers to Evaluate', value: '32', icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50', urgent: true },
            { label: 'Results Pending', value: '4', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-default">
              <div className={`${stat.bg} ${stat.color} p-5 rounded-2xl group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                  {stat.label}
                  {stat.urgent && <span className="bg-amber-500 text-white px-2 py-0.5 rounded-lg animate-pulse">Action Required</span>}
                </p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Work Queue Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Work Queue</h2>
            <div className="h-px flex-1 bg-slate-100" />
            <span className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">3 Items Pending</span>
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-10 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl shadow-slate-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-48 -mt-48" />
            
            <div className="flex items-center gap-8 relative z-10">
              <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center border border-white/10 shadow-inner">
                <UserCheck className="w-10 h-10 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight mb-2">32 Answer Sheets Pending</h3>
                <p className="text-slate-400 font-medium text-lg">Batch: Final Term Examination • Grade 10-A Science</p>
              </div>
            </div>

            <button 
              onClick={() => {
                const pendingExam = exams.find(e => !e.is_published);
                if (pendingExam) navigate(`/exams/${pendingExam.id}/overview`);
              }}
              className="bg-indigo-500 text-white px-12 py-6 rounded-3xl text-sm font-black uppercase tracking-[0.2em] hover:bg-white hover:text-slate-900 transition-all shadow-2xl active:scale-95 relative z-10"
            >
              Start Evaluating
            </button>
          </div>
        </div>

        {/* Exams Section */}
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Assessments</h2>
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
          {exams.map(exam => {
            const isCompleted = new Date(exam.end_date) < new Date();
            const evaluationProgress: number = isCompleted ? 65 : 0; // Mock progress for demo

            return (
              <div
                key={exam.id}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/40 transition-all duration-500 p-8 group flex flex-col relative"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="bg-slate-50 w-16 h-16 rounded-[1.5rem] flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <Calendar className="w-8 h-8 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <div className="text-right">
                    {exam.is_published ? (
                      <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                        Published
                      </span>
                    ) : isCompleted ? (
                      <span className="bg-amber-50 text-amber-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
                        <AlertCircle size={14} /> Evaluation Pending
                      </span>
                    ) : (
                      <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm animate-pulse">
                        Ongoing
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">{exam.term_name || 'Annual Term'}</p>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{exam.name}</h3>
                </div>

                <div className="space-y-6 mb-10">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Duration</p>
                      <p className="text-sm font-bold text-slate-600 italic">
                        {new Date(exam.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(exam.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Type</p>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{exam.exam_type}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Evaluation Progress</span>
                      <span className="text-slate-900 font-black">{evaluationProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${evaluationProgress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                        style={{ width: `${evaluationProgress}%` }} 
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  <button 
                    onClick={() => navigate(`/exams/${exam.id}/overview`)}
                    className={`w-full py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95
                      ${evaluationProgress < 100 ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' : 'bg-white border-2 border-slate-100 text-slate-900 shadow-sm hover:bg-slate-50'}
                    `}
                  >
                    {evaluationProgress < 100 ? (
                      <>
                        <PlayCircle size={18} />
                        {evaluationProgress === 0 ? 'Start Evaluation' : 'Continue Evaluation'}
                      </>
                    ) : (
                      <>
                        <UserCheck size={18} className="text-emerald-500" />
                        View Results
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => navigate(`/exams/${exam.id}/papers`)}
                      className="py-4 bg-slate-50 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                    >
                      Manage Papers
                    </button>
                    <button 
                      onClick={() => navigate(`/exams/${exam.id}/invitations`)}
                      className="py-4 bg-slate-50 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                    >
                      View Students
                    </button>
                  </div>
                </div>

                {/* Edit Shortcut */}
                {can('exam:write') && (
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/exams/${exam.id}/edit`);
                    }}
                    className="absolute top-8 right-8 p-3 text-slate-200 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
                  >
                    <Settings size={20} />
                  </button>
                )}
              </div>
            );
          })}

          {exams.length === 0 && (
            <div className="col-span-full bg-white rounded-[4rem] border-2 border-dashed border-slate-100 p-24 text-center">
              <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-slate-200">
                <ClipboardList size={48} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">No exams created yet</h3>
              <p className="text-slate-400 mt-3 font-medium text-lg max-w-sm mx-auto">Initialize your first assessment cycle to begin evaluating student performance.</p>
              {can('exam:write') && (
                <button onClick={() => navigate('/exams/new')} className="mt-10 px-12 py-6 bg-slate-900 text-white rounded-3xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">Add New Exam</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}

      {/* Legacy Exam Create Modal removed - now using dedicated /exams/new page */}

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
