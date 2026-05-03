import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Calendar,
  Plus,
  Users,
  X,
  Clock,
  Settings,
  Settings2,
  MoreVertical,
  UserCheck,
  Check
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
  const { notify } = useNotification();
  const { can } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [terms, setTerms] = useState<ExamTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);

  // Forms & UI state
  const [newTerm, setNewTerm] = useState<Partial<ExamTerm>>({ name: '', start_date: '', end_date: '' });

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [examsData, termsData] = await Promise.all([
        examApi.getExams(),
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
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Exams</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Manage your school exams
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {can('exam:write') && (
              <>
                <button
                  onClick={() => setIsTermModalOpen(true)}
                  className="bg-white text-slate-600 px-6 py-3.5 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all shadow-sm border border-slate-200 active:scale-95"
                >
                  Manage Terms
                </button>
                <button
                  onClick={() => navigate('/exams/new')}
                  className="bg-primary text-white px-8 py-3.5 rounded-2xl text-sm font-black hover:opacity-90 flex items-center gap-3 transition-all shadow-lg shadow-primary/20 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Add Exam
                </button>
              </>
            )}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {exams.map(exam => (
            <div
              key={exam.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 group relative overflow-hidden flex flex-col"
            >
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-theme-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-theme-primary/10 transition-colors duration-700" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-slate-900 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20 transition-all duration-500">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col items-end">
                    {exam.is_published ? (
                      <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                        Active
                      </div>
                    ) : (
                      <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <Clock className="w-3 h-3" />
                        Pending
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">{exam.term_name || 'Annual Term'}</p>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-theme-primary transition-colors line-clamp-1">{exam.name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Window</p>
                    <p className="text-xs font-bold text-slate-600">
                      {new Date(exam.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(exam.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Type</p>
                    <p className="text-xs font-bold text-slate-600 uppercase">{exam.exam_type}</p>
                  </div>
                </div>

                <div className="h-1 bg-slate-50 rounded-full overflow-hidden mb-8">
                  <div className="h-full bg-theme-primary rounded-full w-[35%] group-hover:w-[60%] transition-all duration-1000" />
                </div>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-2 relative z-10">
                <button 
                  onClick={() => navigate(`/exams/${exam.id}/papers`)}
                  className="px-3 py-3 bg-slate-50 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 group/btn shadow-sm"
                >
                  <ClipboardList size={14} />
                  Papers
                </button>
                <button 
                  onClick={() => navigate(`/exams/${exam.id}/overview`)}
                  className="px-3 py-3 bg-slate-50 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2 group/btn shadow-sm"
                >
                  <Users size={14} />
                  Target
                </button>
                <button 
                   onClick={() => navigate(`/exams/${exam.id}/overview`)}
                  className="col-span-2 mt-1 px-4 py-4 bg-theme-primary text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-theme-primary/20"
                >
                  <Settings2 size={16} />
                  Evaluation Portal
                </button>
              </div>

              {/* Edit Shortcut */}
              {can('exam:write') && (
                <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/exams/${exam.id}/edit`);
                  }}
                  className="absolute top-16 right-7 p-2 text-slate-200 hover:text-theme-primary hover:bg-slate-50 rounded-xl transition-all"
                >
                  <Settings size={18} />
                </button>
              )}
            </div>
          ))}

          {exams.length === 0 && (
            <div className="col-span-full bg-white rounded-[4rem] border-2 border-dashed border-slate-100 p-24 text-center">
              <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-slate-200">
                <ClipboardList size={48} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">No Active Assessments</h3>
              <p className="text-slate-400 mt-3 font-medium text-lg max-w-sm mx-auto">Initialize your first assessment cycle to begin evaluating student performance.</p>
              {can('exam:write') && (
                <button onClick={() => navigate('/exams/new')} className="mt-10 px-12 py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">Add New Exam</button>
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
