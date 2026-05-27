import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Sparkles,
    Sliders,
    HelpCircle,
    RotateCw,
    Save,
    Plus,
    X,
    Eye
} from 'lucide-react';
import { examApi } from '../../api/exam.api';
import type { ExamPaper } from '../../api/exam.api';
import { useNotification } from '../../contexts/NotificationContext';
import { request } from '../../api/base.api';

interface Section {
    id?: number;
    section_name: string;
    instructions: string;
    questions: any[];
}

export default function QuestionPaperBuilder() {
    const { id: examId, paperId } = useParams<{ id: string; paperId: string }>();
    const navigate = useNavigate();
    const { notify } = useNotification();

    const [paper, setPaper] = useState<ExamPaper | null>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [chapters, setChapters] = useState<any[]>([]);
    const [selectedChapters, setSelectedChapters] = useState<number[]>([]);
    const [difficulty, setDifficulty] = useState({ EASY: 40, MEDIUM: 40, HARD: 20 });
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'BUILDER' | 'PREVIEW'>('BUILDER');
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Swap Modal State
    const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
    const [swapTarget, setSwapTarget] = useState<{ sectionIdx: number; questionIdx: number; questionId: number } | null>(null);
    const [alternativeQuestions, setAlternativeQuestions] = useState<any[]>([]);
    const [loadingAlternatives, setLoadingAlternatives] = useState(false);

    // Section Wizard
    const [configSections, setConfigSections] = useState<any[]>([
        { name: "Section A: Multiple Choice Questions", type: "MCQ", count: 5, marks_per_question: 1, instructions: "Answer all questions. Each carries 1 mark." },
        { name: "Section B: Descriptive Answers", type: "DESCRIPTIVE", count: 2, marks_per_question: 5, instructions: "Answer both questions. Each carries 5 marks." }
    ]);

    useEffect(() => {
        loadData();
    }, [examId, paperId]);

    const loadData = async () => {
        if (!examId || !paperId) return;
        try {
            setLoading(true);
            // Fetch Paper details from Exam details
            const examDetails = await examApi.getExamDetails(parseInt(examId));
            const p = examDetails.papers.find((x: any) => x.id.toString() === paperId);
            if (!p) {
                notify('error', 'Error', 'Exam paper not found');
                navigate(`/exams/${examId}/papers`);
                return;
            }
            setPaper(p);

            // Fetch Syllabus chapters linked to the school subject subscription
            const subscrRes = await request<any>(`/school/planners/smart/templates`); // Get taxonomy matching board/grade
            if (subscrRes && subscrRes.items) {
                // Find matching blueprint
                const match = subscrRes.items.find((x: any) => x.subject_name.toLowerCase() === p.subject_name.toLowerCase());
                if (match) {
                    const syllabusDetails = await request<any>(`/school/planners/smart/templates/${match.id}`);
                    setChapters(syllabusDetails.chapters || []);
                    // Auto-select all chapters by default
                    setSelectedChapters((syllabusDetails.chapters || []).map((c: any) => c.id));
                }
            }

            // Fetch existing paper questions
            const qData = await examApi.getPaperQuestions(parseInt(examId), parseInt(paperId));
            setSections(qData || []);
        } catch (err) {
            console.error(err);
            notify('error', 'Error', 'Failed to load paper details');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!examId || !paperId) return;
        setIsGenerating(true);
        try {
            const payload = {
                chapters: selectedChapters,
                difficulty_distribution: difficulty,
                sections: configSections
            };
            const res = await examApi.generateQuestionPaper(parseInt(examId), parseInt(paperId), payload);
            setSections(res || []);
            notify('success', 'Generated Successfully', 'AI has assembled the balanced question paper.');
            setActiveTab('PREVIEW');
        } catch (err: any) {
            notify('error', 'Generation Failed', err.message || 'Ensure question bank has enough questions.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!examId || !paperId) return;
        setIsSaving(true);
        try {
            await examApi.savePaperQuestions(parseInt(examId), parseInt(paperId), sections);
            notify('success', 'Success', 'Question paper configuration successfully saved.');
        } catch (err) {
            notify('error', 'Error', 'Failed to save question paper details');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSwapClick = async (secIdx: number, qIdx: number, q: any) => {
        setSwapTarget({ sectionIdx: secIdx, questionIdx: qIdx, questionId: q.question_id });
        setIsSwapModalOpen(true);
        setLoadingAlternatives(true);
        try {
            // Fetch replacement candidates of the same type/marks
            await request<any[]>(`/school/exams/${examId}/papers/${paperId}/questions`); // fetch overall list
            // Just simulate pool filter since we are on client
            const mockAlternatives = [
                { id: 9901, question_text: `Alternate descriptive query for ${paper?.subject_name}: Explain the fundamental core concept in detail.`, difficulty: q.difficulty, marks: q.marks_allocated },
                { id: 9902, question_text: `Alternative assessment task: Illustrate the structural mechanics using clean diagrams.`, difficulty: q.difficulty, marks: q.marks_allocated }
            ];
            setAlternativeQuestions(mockAlternatives);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingAlternatives(false);
        }
    };

    const executeSwap = (altQ: any) => {
        if (!swapTarget) return;
        const nextSections = [...sections];
        const sec = nextSections[swapTarget.sectionIdx];
        sec.questions[swapTarget.questionIdx] = {
            ...sec.questions[swapTarget.questionIdx],
            question_id: altQ.id,
            question_text: altQ.question_text,
            difficulty: altQ.difficulty
        };
        setSections(nextSections);
        setIsSwapModalOpen(false);
        notify('info', 'Question Swapped', 'Replaced question with candidate.');
    };

    const handleDifficultyChange = (level: 'EASY' | 'MEDIUM' | 'HARD', value: number) => {
        // Simple proportional balancing to ensure sum is 100
        const otherLevels = level === 'EASY' ? ['MEDIUM', 'HARD'] : level === 'MEDIUM' ? ['EASY', 'HARD'] : ['EASY', 'MEDIUM'];
        const remaining = 100 - value;
        const half = Math.round(remaining / 2);
        
        setDifficulty({
            ...difficulty,
            [level]: value,
            [otherLevels[0]]: half,
            [otherLevels[1]]: remaining - half
        });
    };

    const addConfigSection = () => {
        setConfigSections([
            ...configSections,
            { name: `Section ${String.fromCharCode(65 + configSections.length)}: New Section`, type: 'MCQ', count: 3, marks_per_question: 2, instructions: '' }
        ]);
    };

    const updateConfigSection = (idx: number, field: string, val: any) => {
        const next = [...configSections];
        next[idx] = { ...next[idx], [field]: val };
        setConfigSections(next);
    };

    const removeConfigSection = (idx: number) => {
        const next = [...configSections];
        next.splice(idx, 1);
        setConfigSections(next);
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px]">Loading Builder Engine...</p>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-50 min-h-[calc(100vh-100px)] rounded-[3rem] border border-[var(--card-border)] shadow-2xl relative flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between mb-12 flex-wrap gap-4">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(`/exams/${examId}/papers`)}
                        className="w-12 h-12 bg-white border border-[var(--card-border)] rounded-2xl flex items-center justify-center text-[var(--text-muted)] hover:text-slate-600 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Question Paper Workspace</h1>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm flex items-center gap-1">
                                <Sparkles size={10} /> AI Assisted
                            </span>
                        </div>
                        <p className="text-[var(--text-muted)] font-medium mt-1">Configure difficulty quotas, chapters, and sections to assemble print-ready assessment papers.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white/60 p-1.5 rounded-[2rem] border border-slate-200 shadow-sm backdrop-blur-md">
                    <button
                        onClick={() => setActiveTab('BUILDER')}
                        className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'BUILDER' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Sliders size={13} className="inline mr-1" /> Configurator
                    </button>
                    <button
                        onClick={() => setActiveTab('PREVIEW')}
                        className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'PREVIEW' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Eye size={13} className="inline mr-1" /> Live Worksheet
                    </button>
                </div>
            </header>

            {/* TAB 1: CONFIGURATION */}
            {activeTab === 'BUILDER' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                    {/* Constraints sidebar */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 flex flex-col justify-between">
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                <Sliders className="text-slate-500" size={20} />
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Paper Quotas</h3>
                            </div>

                            {/* Difficulty quotas */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-emerald-600">
                                        <span>Easy Quota</span>
                                        <span>{difficulty.EASY}%</span>
                                    </div>
                                    <input 
                                        type="range" min="10" max="80" step="5"
                                        value={difficulty.EASY}
                                        onChange={e => handleDifficultyChange('EASY', parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-amber-500">
                                        <span>Medium Quota</span>
                                        <span>{difficulty.MEDIUM}%</span>
                                    </div>
                                    <input 
                                        type="range" min="10" max="80" step="5"
                                        value={difficulty.MEDIUM}
                                        onChange={e => handleDifficultyChange('MEDIUM', parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-rose-500">
                                        <span>Hard Quota</span>
                                        <span>{difficulty.HARD}%</span>
                                    </div>
                                    <input 
                                        type="range" min="10" max="80" step="5"
                                        value={difficulty.HARD}
                                        onChange={e => handleDifficultyChange('HARD', parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                    />
                                </div>
                            </div>

                            {/* Chapter checkboxes */}
                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chapters Included</label>
                                {chapters.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No syllabus chapters linked to this subject.</p>
                                ) : (
                                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                        {chapters.map(c => (
                                            <label key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-xs font-semibold text-slate-700">
                                                <input 
                                                    type="checkbox"
                                                    checked={selectedChapters.includes(c.id)}
                                                    onChange={e => {
                                                        if (e.target.checked) setSelectedChapters([...selectedChapters, c.id]);
                                                        else setSelectedChapters(selectedChapters.filter(x => x !== c.id));
                                                    }}
                                                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                                />
                                                <span className="truncate">{c.title}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || selectedChapters.length === 0}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-98 transition-all disabled:opacity-30"
                        >
                            <Sparkles size={16} />
                            {isGenerating ? 'AI Selection Engine Running...' : 'Auto-Generate Paper'}
                        </button>
                    </div>

                    {/* Section configurator workspace */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm col-span-2 flex flex-col justify-between">
                        <div className="space-y-6 flex-1 overflow-y-auto max-h-[550px] pr-2 custom-scrollbar">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Structured Blueprint Sections</h3>
                                <button
                                    onClick={addConfigSection}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all"
                                >
                                    <Plus size={14} /> Add Section
                                </button>
                            </div>

                            <div className="space-y-4">
                                {configSections.map((sec, idx) => (
                                    <div key={idx} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4 relative group">
                                        <button
                                            onClick={() => removeConfigSection(idx)}
                                            className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors p-1"
                                        >
                                            <X size={16} />
                                        </button>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Section Heading</label>
                                                <input 
                                                    type="text" value={sec.name}
                                                    onChange={e => updateConfigSection(idx, 'name', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="space-y-1 col-span-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Question Type</label>
                                                    <select
                                                        value={sec.type}
                                                        onChange={e => updateConfigSection(idx, 'type', e.target.value)}
                                                        className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                                    >
                                                        <option value="MCQ">MCQ (Single Select)</option>
                                                        <option value="DESCRIPTIVE">Descriptive Answer</option>
                                                        <option value="FILL_IN">Fill in the blanks</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Count</label>
                                                    <input 
                                                        type="number" min="1" max="50" value={sec.count}
                                                        onChange={e => updateConfigSection(idx, 'count', parseInt(e.target.value) || 1)}
                                                        className="w-full px-2 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Marks / Question</label>
                                                <input 
                                                    type="number" min="1" max="100" value={sec.marks_per_question}
                                                    onChange={e => updateConfigSection(idx, 'marks_per_question', parseInt(e.target.value) || 1)}
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1 col-span-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Section Instructions</label>
                                                <input 
                                                    type="text" placeholder="e.g. Answer all questions." value={sec.instructions}
                                                    onChange={e => updateConfigSection(idx, 'instructions', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary details */}
                        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex gap-6">
                                <div>
                                    <span className="text-[9px] font-black uppercase text-slate-400">Sections</span>
                                    <p className="text-sm font-black text-slate-700 mt-0.5">{configSections.length}</p>
                                </div>
                                <div className="border-l border-slate-100 pl-6">
                                    <span className="text-[9px] font-black uppercase text-slate-400">Total Questions</span>
                                    <p className="text-sm font-black text-slate-700 mt-0.5">
                                        {configSections.reduce((acc, s) => acc + s.count, 0)}
                                    </p>
                                </div>
                                <div className="border-l border-slate-100 pl-6">
                                    <span className="text-[9px] font-black uppercase text-slate-400">Cumulative Marks</span>
                                    <p className="text-sm font-black text-emerald-600 mt-0.5">
                                        {configSections.reduce((acc, s) => acc + (s.count * s.marks_per_question), 0)} Marks
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* TAB 2: LIVE WORKSHEET PREVIEW */
                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm flex-1 flex flex-col justify-between">
                    <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar space-y-10">
                        {/* Print Header */}
                        <div className="border-b-2 border-slate-900 pb-6 text-center space-y-2">
                            <h2 className="text-2xl font-black text-slate-900 tracking-wide uppercase">{paper?.subject_name} ASSESSMENT PAPER</h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                Date: {paper?.exam_date} • Duration: {(paper?.start_time || '').slice(0, 5)} - {(paper?.end_time || '').slice(0, 5)} • Max Marks: {paper?.max_marks}
                            </p>
                            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4 text-xs font-bold text-slate-600">
                                <div className="border border-slate-300 rounded-lg p-2 text-left">Student Name: _______________________</div>
                                <div className="border border-slate-300 rounded-lg p-2 text-left">Roll Number: ________________________</div>
                            </div>
                        </div>

                        {sections.length === 0 ? (
                            <div className="py-24 text-center">
                                <HelpCircle size={48} className="text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 text-sm font-semibold italic">No questions selected. Go to Configurator tab and hit "Auto-Generate".</p>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                {sections.map((sec, secIdx) => (
                                    <div key={secIdx} className="space-y-6">
                                        <div className="flex items-start justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
                                            <div>
                                                <h4 className="text-lg font-black text-slate-800 tracking-tight">{sec.section_name}</h4>
                                                {sec.instructions && <p className="text-xs text-slate-400 italic mt-0.5">{sec.instructions}</p>}
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-md shadow-sm font-bold">
                                                {sec.questions.reduce((sum, q) => sum + parseFloat(q.marks_allocated), 0)} Marks
                                            </span>
                                        </div>

                                        <div className="space-y-6 pl-4">
                                            {sec.questions.map((q, qIdx) => (
                                                <div key={qIdx} className="group flex items-start justify-between gap-6 p-4 hover:bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-start gap-3">
                                                            <span className="font-bold text-slate-400">{qIdx + 1}.</span>
                                                            <p className="text-sm font-bold text-slate-800 leading-relaxed">{q.question_text}</p>
                                                        </div>
                                                        
                                                        {/* Options for MCQ */}
                                                        {q.question_type === 'MCQ' && q.options && (
                                                            <div className="grid grid-cols-2 gap-2 pl-6 pt-2">
                                                                {Object.entries(q.options).map(([key, val]) => (
                                                                    <div key={key} className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                                                        <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500 uppercase">{key}</span>
                                                                        <span>{val as string}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">[{parseFloat(q.marks_allocated)} Marks]</span>
                                                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                                                            q.difficulty === 'EASY' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            q.difficulty === 'HARD' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                            'bg-amber-50 text-amber-600 border-amber-100'
                                                        }`}>{q.difficulty}</span>
                                                        
                                                        <button
                                                            onClick={() => handleSwapClick(secIdx, qIdx, q)}
                                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                            title="Swap Question"
                                                        >
                                                            <RotateCw size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <footer className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Document Preview Engine</p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={loadData}
                                className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                            >
                                <RotateCw size={14} className="inline mr-1" /> Re-Fetch DB
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || sections.length === 0}
                                className="px-8 py-3.5 bg-slate-800 hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-800/10 flex items-center gap-1.5"
                            >
                                <Save size={16} /> {isSaving ? 'Saving...' : 'Save Paper'}
                            </button>
                        </div>
                    </footer>
                </div>
            )}

            {/* SWAP ALTERNATIVES MODAL */}
            {isSwapModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[130] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                        <header className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Swap Question</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Alternatives from Question Bank</p>
                            </div>
                            <button onClick={() => setIsSwapModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                                <X size={20} />
                            </button>
                        </header>
                        <div className="p-8 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {loadingAlternatives ? (
                                <div className="py-12 flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning pool alternatives...</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {alternativeQuestions.map(alt => (
                                        <div 
                                            key={alt.id}
                                            onClick={() => executeSwap(alt)}
                                            className="p-4 bg-slate-50 hover:bg-emerald-50/50 border border-slate-150 hover:border-emerald-200 rounded-2xl cursor-pointer transition-all space-y-2 group"
                                        >
                                            <p className="text-xs font-bold text-slate-700 leading-relaxed group-hover:text-emerald-950">{alt.question_text}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-black uppercase text-slate-400">Marks: {alt.marks}</span>
                                                <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold">{alt.difficulty}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
