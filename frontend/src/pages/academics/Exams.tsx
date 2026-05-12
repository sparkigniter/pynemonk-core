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
  PlayCircle,
  ShieldCheck
} from 'lucide-react';
import { examApi } from '../../api/exam.api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Exam, ExamTerm } from '../../api/exam.api';

// ── Components ───────────────────────────────────────────────────────────────

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--card-bg)] rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-[var(--card-border)] flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-[var(--text-main)] tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--card-bg)] rounded-xl transition-all shadow-sm group">
            <X className="w-5 h-5 text-[var(--text-muted)] group-hover:text-rose-500" />
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
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);

  // Forms & UI state
  const [newTerm, setNewTerm] = useState<Partial<ExamTerm>>({ name: '', start_date: '', end_date: '' });

  useEffect(() => { loadInitialData(); }, [classIdFromUrl]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [examsData, termsData, statsData] = await Promise.all([
        examApi.getExams(undefined, classIdFromUrl ? parseInt(classIdFromUrl) : undefined),
        examApi.getTerms(),
        examApi.getStats()
      ]);
      setExams(examsData);
      setTerms(termsData);
      setStats(statsData);
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
          <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-surface-dark p-5 rounded-3xl shadow-xl shadow-theme/20">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">Assessments & Exams</h1>
            <p className="text-sm font-medium text-[var(--text-muted)] mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Institutional evaluation and marking center
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {can('exam:write') && (
            <>
              <button
                onClick={() => setIsTermModalOpen(true)}
                className="btn-ghost px-6"
              >
                Manage Terms
              </button>
              <button
                onClick={() => navigate('/exams/new')}
                className="btn-primary px-8"
              >
                <Plus size={18} />
                New Assessment
              </button>
            </>
          )}
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Cycle', value: stats?.activeExams || 0, icon: Clock, color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Evaluation Required', value: stats?.papersToEvaluate || 0, icon: ClipboardList, color: 'text-amber-500', bg: 'bg-amber-50', urgent: (stats?.papersToEvaluate || 0) > 0 },
          { label: 'Completed Sets', value: stats?.resultsPending || 0, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="premium-card p-8 flex items-center gap-6 group">
            <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl group-hover:scale-105 transition-transform duration-300`}>
              <stat.icon size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1 flex items-center justify-between">
                {stat.label}
                {stat.urgent && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg text-[8px]">Urgent</span>}
              </p>
              <p className="text-2xl font-bold text-[var(--text-main)] truncate">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {stats?.workQueue?.length > 0 && (
        <div className="animate-in slide-in-from-bottom-4 duration-1000 delay-200">
          <div className="premium-card bg-surface-dark p-10 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl shadow-theme/20 relative overflow-hidden group">
            {/* Visual background accent */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-all duration-700" />
            
            <div className="flex items-center gap-8 relative z-10">
              <div className="w-16 h-16 bg-[var(--card-bg)]/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner group-hover:border-white/20 transition-all">
                <UserCheck className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {parseInt(stats.workQueue[0].total_students) - parseInt(stats.workQueue[0].marked_students)} Marking Tasks Remaining
                </h3>
                <p className="text-[var(--text-muted)] font-medium">Batch: <span className="text-white">{stats.workQueue[0].exam_name}</span> • {stats.workQueue[0].subject_name}</p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/exams/${stats.workQueue[0].exam_id}/overview`)}
              className="bg-[var(--card-bg)] text-surface-dark px-10 py-5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl shadow-white/5 active:scale-95 relative z-10"
            >
              Resume Marking
            </button>
          </div>
        </div>
      )}

      {/* Exams Section */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-[var(--text-main)] tracking-tight">Academic <span className="text-primary">Cycles</span></h2>
          <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            {exams.length} active sessions
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {exams.map(exam => {
            const isCompleted = new Date(exam.end_date) < new Date();
            const evaluationProgress = exam.progress_percentage || 0;

            return (
              <div
                key={exam.id}
                className="premium-card p-8 flex flex-col relative group"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                    <Calendar className="w-7 h-7 text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-right">
                    {exam.results_published ? (
                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-emerald-100">
                        Finalized
                      </span>
                    ) : isCompleted ? (
                      <span className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-amber-100">
                        Pending Evaluation
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 bg-primary/5 text-primary rounded-xl text-[9px] font-bold uppercase tracking-widest border border-primary/10 animate-pulse">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2">{exam.term_name || 'Academic Term'}</p>
                  <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight leading-tight group-hover:text-primary transition-colors">{exam.name}</h3>
                </div>

                <div className="space-y-6 mb-10">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Schedule</p>
                      <p className="text-[13px] font-semibold text-slate-600">
                        {new Date(exam.start_date).toLocaleDateString()} — {new Date(exam.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Category</p>
                      <p className="text-[11px] font-bold text-[var(--text-main)] uppercase tracking-tight">{exam.exam_type}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                      <span>{exam.results_published ? 'Consolidated' : 'Marking Progress'}</span>
                      <span className="text-[var(--text-main)] font-bold">
                        {exam.results_published ? '100%' : `${evaluationProgress}%`}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${exam.results_published || evaluationProgress === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                        style={{ width: `${exam.results_published ? 100 : evaluationProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                    <button
                    onClick={() => navigate(exam.results_published ? `/exams/${exam.id}/results` : `/exams/${exam.id}/overview`)}
                    className={`w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95
                      ${exam.results_published
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
                        : 'btn-dark !shadow-theme/10'}
                    `}
                  >
                    {exam.results_published ? <ShieldCheck size={16} /> : <PlayCircle size={16} />}
                    {exam.results_published ? 'View Final Results' : 'Manage Assessment'}
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => navigate(`/exams/${exam.id}/papers`)}
                      className="py-3.5 bg-slate-50 text-[var(--text-muted)] rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                      Exam Papers
                    </button>
                    <button
                      onClick={() => navigate(`/exams/${exam.id}/invitations`)}
                      className="py-3.5 bg-slate-50 text-[var(--text-muted)] rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                      Students List
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
                    className="absolute top-8 right-8 p-2.5 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Settings size={18} />
                  </button>
                )}
              </div>
            );
          })}

          {exams.length === 0 && (
            <div className="col-span-full premium-card border-dashed border-2 p-20 text-center flex flex-col items-center">
              <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 text-slate-300">
                <ClipboardList size={40} />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)]">No Assessment Cycles</h3>
              <p className="text-[var(--text-muted)] mt-2 font-medium text-sm max-w-sm">Start by initializing your first exam term to manage student evaluations.</p>
              {can('exam:write') && (
                <button onClick={() => navigate('/exams/new')} className="btn-primary mt-8 px-10">Create Exam</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Term Creation Modal */}
      <Modal isOpen={isTermModalOpen} onClose={() => setIsTermModalOpen(false)} title="Academic Terms">
        <div className="space-y-8">
          <div className="p-6 bg-slate-50/50 rounded-3xl border border-[var(--card-border)] space-y-4">
            <h5 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Register New Term</h5>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Term ID (e.g. SEM-1-2024)"
                className="input-field-modern !py-3"
                value={newTerm.name}
                onChange={e => setNewTerm({ ...newTerm, name: e.target.value })}
              />
              <button onClick={handleCreateTerm} className="btn-primary w-full !py-3.5">Save Term</button>
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Available Records</h5>
            <div className="space-y-2">
              {terms.map(term => (
                <div key={term.id} className="p-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] flex items-center justify-between group hover:border-primary/20 transition-all">
                  <span className="text-sm font-bold text-slate-700">{term.name}</span>
                  <button className="p-2 text-slate-300 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"><MoreVertical size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}
