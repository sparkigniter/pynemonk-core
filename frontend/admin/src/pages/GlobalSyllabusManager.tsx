import React, { useState, useEffect, useRef } from 'react';
import { 
    BookOpen, 
    UploadCloud, 
    CheckCircle2, 
    Download,
    Database,
    Sparkles,
    FileSpreadsheet,
    Search,
    ChevronLeft,
    ChevronRight,
    Globe,
    Loader2
} from 'lucide-react';
import { api, request } from '../api/base.api';

const FALLBACK_BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE'];
const FALLBACK_GRADES = [
    'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 
    'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 
    'Grade 10', 'Grade 11', 'Grade 12'
];
const FALLBACK_SUBJECTS = [
    'English', 'Mathematics', 'Science', 'Social Science', 
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 
    'Environmental Studies (EVS)', 'Hindi', 'Sanskrit'
];

const GlobalSyllabusManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'LIBRARY' | 'UPLOAD_SYLLABUS' | 'QUESTION_BANK'>('LIBRARY');
    const [uploadState, setUploadState] = useState<'IDLE' | 'UPLOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    
    // Upload Form state
    const [uploadBoard, setUploadBoard] = useState('CBSE');
    const [uploadGrade, setUploadGrade] = useState('Class 10');
    const [uploadSubject, setUploadSubject] = useState('Mathematics');
    const [uploadYear, setUploadYear] = useState('2026-27');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Library state
    const [templates, setTemplates] = useState<any[]>([]);
    const [totalTemplates, setTotalTemplates] = useState(0);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    
    // Taxonomy metadata
    const [boards, setBoards] = useState<string[]>(FALLBACK_BOARDS);
    const [grades, setGrades] = useState<string[]>(FALLBACK_GRADES);
    const [subjects, setSubjects] = useState<string[]>(FALLBACK_SUBJECTS);
    
    const [filters, setFilters] = useState({
        board: '',
        grade: '',
        subject: '',
        search: '',
        page: 1,
        limit: 6
    });

    // Preview template drawer state
    const [selectedPreviewTemplateId, setSelectedPreviewTemplateId] = useState<number | null>(null);
    const [previewData, setPreviewData] = useState<any | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    useEffect(() => {
        loadTaxonomy();
    }, []);

    useEffect(() => {
        if (activeTab === 'LIBRARY') {
            loadTemplates();
        }
    }, [filters, activeTab]);

    const loadTaxonomy = async () => {
        try {
            const data = await request<any>('/school/planners/smart/taxonomy');
            if (data) {
                if (data.boards?.length > 0) setBoards(data.boards);
                if (data.grades?.length > 0) setGrades(data.grades);
                if (data.subjects?.length > 0) setSubjects(data.subjects);
            }
        } catch (err) {
            console.error('Failed to load global taxonomy from API, using fallback lists.', err);
        }
    };

    const loadTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const offset = (filters.page - 1) * filters.limit;
            const queryParams = new URLSearchParams({
                limit: filters.limit.toString(),
                offset: offset.toString()
            });
            if (filters.board) queryParams.append('board_name', filters.board);
            if (filters.grade) queryParams.append('grade_name', filters.grade);
            if (filters.subject) queryParams.append('subject_name', filters.subject);
            if (filters.search) queryParams.append('search', filters.search);

            const res = await request<any>(`/school/planners/smart/templates?${queryParams.toString()}`);
            if (res) {
                setTemplates(res.items || []);
                setTotalTemplates(res.total || 0);
            }
        } catch (err) {
            console.error('Failed to load library templates', err);
            setTemplates([]);
            setTotalTemplates(0);
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const openPreview = async (templateId: number) => {
        setSelectedPreviewTemplateId(templateId);
        setLoadingPreview(true);
        try {
            const data = await request<any>(`/school/planners/smart/templates/${templateId}`);
            setPreviewData(data);
        } catch (err) {
            console.error('Failed to load template details', err);
            alert('Failed to load template details');
            setSelectedPreviewTemplateId(null);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadState('UPLOADING');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            if (activeTab === 'UPLOAD_SYLLABUS') {
                formData.append('board', uploadBoard);
                formData.append('grade', uploadGrade);
                formData.append('subject', uploadSubject);
                formData.append('academicYear', uploadYear);
                
                await api.post('/school/planners/global/syllabus', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/school/planners/global/questions', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            
            setUploadState('SUCCESS');
            loadTaxonomy(); // Refresh metadata after successful upload
            setTimeout(() => setUploadState('IDLE'), 4000);
        } catch (err) {
            console.error(err);
            setUploadState('ERROR');
            setTimeout(() => setUploadState('IDLE'), 4000);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 min-h-[calc(100vh-100px)] relative">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-600/20 ring-8 ring-indigo-50">
                        <Database size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Global Content Hub</h2>
                        <p className="text-slate-500 text-sm mt-1 font-semibold">Manage and inspect standard syllabus blueprints and question banks.</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 bg-white/60 p-1.5 rounded-[2rem] border border-slate-200 shadow-sm backdrop-blur-md">
                    <button 
                        onClick={() => setActiveTab('LIBRARY')}
                        className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'LIBRARY' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        Syllabus Library
                    </button>
                    <button 
                        onClick={() => setActiveTab('UPLOAD_SYLLABUS')}
                        className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'UPLOAD_SYLLABUS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        Upload Syllabus
                    </button>
                    <button 
                        onClick={() => setActiveTab('QUESTION_BANK')}
                        className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'QUESTION_BANK' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        Question Bank
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            {activeTab === 'LIBRARY' ? (
                <div className="space-y-8 relative z-10">
                    {/* Filters Dashboard */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Education Board</label>
                            <select 
                                value={filters.board}
                                onChange={e => handleFilterChange('board', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                            >
                                <option value="">All Boards</option>
                                {boards.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Grade Level</label>
                            <select 
                                value={filters.grade}
                                onChange={e => handleFilterChange('grade', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                            >
                                <option value="">All Grades</option>
                                {grades.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subject Area</label>
                            <select 
                                value={filters.subject}
                                onChange={e => handleFilterChange('subject', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                            >
                                <option value="">All Subjects</option>
                                {subjects.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Search Keywords</label>
                            <div className="relative flex items-center">
                                <input 
                                    type="text"
                                    placeholder="Search by syllabus name..."
                                    value={filters.search}
                                    onChange={e => handleFilterChange('search', e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                />
                                <Search size={14} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Library templates display */}
                    {loadingTemplates ? (
                        <div className="flex items-center justify-center p-24">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="bg-white rounded-[3rem] p-16 text-center border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto shadow-sm mb-6">
                                <BookOpen size={30} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">No Templates Available</h2>
                            <p className="text-slate-400 mt-2 text-sm max-w-md mx-auto italic">
                                We couldn't find any master syllabus templates matching the criteria. Go to the "Upload Syllabus" tab to add one.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {templates.map(t => (
                                    <div 
                                        key={t.id} 
                                        className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm flex items-center gap-1">
                                                    <Globe size={9} /> {t.board_name}
                                                </span>
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                                                    {t.academic_year || '2026-27'}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-primary transition-colors">
                                                {t.board_name} {t.grade_name} {t.subject_name}
                                            </h3>
                                            <p className="text-slate-400 text-xs mt-2 line-clamp-2">{t.description || 'Official Board Standard Structured Master Syllabus Blueprint.'}</p>
                                            
                                            {/* Metrics */}
                                            <div className="grid grid-cols-3 gap-2 mt-5 py-4 border-y border-slate-50">
                                                <div className="text-center">
                                                    <span className="text-[9px] font-black uppercase text-slate-400">Chapters</span>
                                                    <p className="text-xs font-black text-slate-800 mt-0.5">{t.chapter_count || 0}</p>
                                                </div>
                                                <div className="text-center border-l border-slate-100">
                                                    <span className="text-[9px] font-black uppercase text-slate-400">Topics</span>
                                                    <p className="text-xs font-black text-slate-800 mt-0.5">{t.topic_count || 0}</p>
                                                </div>
                                                <div className="text-center border-l border-slate-100">
                                                    <span className="text-[9px] font-black uppercase text-slate-400">Periods</span>
                                                    <p className="text-xs font-black text-slate-800 mt-0.5">{t.total_recommended_hours || 0}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-2">
                                            <button 
                                                onClick={() => openPreview(t.id)}
                                                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl py-3.5 text-xs font-black uppercase tracking-widest transition-all border border-slate-100 flex items-center justify-center gap-1.5 hover:scale-[1.02]"
                                            >
                                                <BookOpen size={13} /> View Blueprint Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {totalTemplates > filters.limit && (
                                <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                        Showing {Math.min(totalTemplates, (filters.page - 1) * filters.limit + 1)} - {Math.min(totalTemplates, filters.page * filters.limit)} of {totalTemplates} Blueprints
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            disabled={filters.page === 1}
                                            onClick={() => handlePageChange(filters.page - 1)}
                                            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-1.5 animate-in"
                                        >
                                            <ChevronLeft size={14} /> Prev
                                        </button>
                                        <button 
                                            disabled={filters.page * filters.limit >= totalTemplates}
                                            onClick={() => handlePageChange(filters.page + 1)}
                                            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                                        >
                                            Next <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                    {/* Configuration Sidebar */}
                    <div className="glass-card p-8 col-span-1 border border-slate-100 shadow-xl shadow-slate-200/50 bg-white rounded-[2.5rem]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                <BookOpen size={20} className="text-slate-700" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Target Taxonomy</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Education Board</label>
                                <select 
                                    value={uploadBoard}
                                    onChange={(e) => setUploadBoard(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                >
                                    <option>CBSE</option>
                                    <option>ICSE</option>
                                    <option>State Board</option>
                                    <option>IB</option>
                                    <option>IGCSE</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Grade Level</label>
                                <select 
                                    value={uploadGrade}
                                    onChange={(e) => setUploadGrade(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                >
                                    {FALLBACK_GRADES.map(g => (
                                        <option key={g}>{g}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Subject Area</label>
                                <select 
                                    value={uploadSubject}
                                    onChange={(e) => setUploadSubject(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                >
                                    {FALLBACK_SUBJECTS.map(s => (
                                        <option key={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Academic Year</label>
                                <input 
                                    type="text"
                                    value={uploadYear}
                                    onChange={(e) => setUploadYear(e.target.value)}
                                    placeholder="e.g. 2026-27"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-700 mb-1 flex items-center gap-1">
                                <Sparkles size={12} /> Pro Tip
                            </h4>
                            <p className="text-xs text-indigo-600/80 font-medium leading-relaxed">
                                Ensure your Excel file headers exactly match the system template before uploading to prevent data mapping errors.
                            </p>
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div className="col-span-1 lg:col-span-2 flex flex-col gap-8">
                        {/* File Dropzone */}
                        <div className="glass-card flex-1 flex flex-col p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden bg-white rounded-[2.5rem]">
                            
                            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">
                                        {activeTab === 'UPLOAD_SYLLABUS' ? 'Upload Master Syllabus' : 'Upload Question Bank'}
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium mt-1">
                                        {activeTab === 'UPLOAD_SYLLABUS' 
                                            ? 'Upload Excel containing chapters, topics, learning outcomes, and recommended hours.'
                                            : 'Upload Excel containing MCQs, descriptive questions, tags, and answer keys.'}
                                    </p>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all rounded-xl text-xs font-black uppercase tracking-widest">
                                    <Download size={14} /> Download Template
                                </button>
                            </div>

                            {/* Interactive Drop Zone */}
                            <div 
                                className={`flex-1 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-12 transition-all ${
                                    uploadState === 'UPLOADING' ? 'border-indigo-300 bg-indigo-50/50' : 
                                    uploadState === 'SUCCESS' ? 'border-emerald-300 bg-emerald-50/50' : 
                                    'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300'
                                }`}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".xlsx,.csv" 
                                    onChange={handleFileUpload}
                                />

                                {uploadState === 'IDLE' && (
                                    <>
                                        <div className="w-20 h-20 bg-white shadow-xl rounded-[2rem] flex items-center justify-center mb-6 rotate-3">
                                            <FileSpreadsheet size={40} className="text-indigo-500" />
                                        </div>
                                        <h4 className="text-lg font-black text-slate-700">Drag & Drop Excel File Here</h4>
                                        <p className="text-sm text-slate-400 font-medium mt-2 mb-8">Supports .xlsx and .csv formats (Max 10MB)</p>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-8 py-4 bg-slate-800 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-800/20"
                                        >
                                            Browse Files
                                        </button>
                                    </>
                                )}

                                {uploadState === 'UPLOADING' && (
                                    <div className="flex flex-col items-center">
                                        <div className="w-20 h-20 bg-white shadow-xl rounded-[2rem] flex items-center justify-center mb-6 relative">
                                            <div className="absolute inset-0 border-4 border-indigo-100 border-t-indigo-600 rounded-[2rem] animate-spin" />
                                            <UploadCloud size={32} className="text-indigo-600" />
                                        </div>
                                        <h4 className="text-lg font-black text-slate-700">Processing Data Pipeline...</h4>
                                        <p className="text-sm text-slate-400 font-medium mt-2">Validating rows and mapping taxonomy.</p>
                                    </div>
                                )}

                                {uploadState === 'SUCCESS' && (
                                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                        <div className="w-20 h-20 bg-emerald-500 shadow-xl shadow-emerald-500/30 rounded-[2rem] flex items-center justify-center mb-6 scale-110">
                                            <CheckCircle2 size={40} className="text-white" />
                                        </div>
                                        <h4 className="text-xl font-black text-emerald-600">Upload Successful!</h4>
                                        <p className="text-sm text-emerald-600/70 font-medium mt-2">Data successfully persisted to Global Content DB.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Syllabus Preview Drawer */}
            {selectedPreviewTemplateId && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
                        onClick={() => { setSelectedPreviewTemplateId(null); setPreviewData(null); }}
                    />
                    
                    {/* Slide-over panel */}
                    <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                        <div className="w-screen max-w-md md:max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                            {/* Header */}
                            <header className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Syllabus Blueprint Details</h3>
                                    {previewData && (
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                            {previewData.board_name} • {previewData.grade_name} • {previewData.subject_name}
                                        </p>
                                    )}
                                </div>
                                <button 
                                    onClick={() => { setSelectedPreviewTemplateId(null); setPreviewData(null); }}
                                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm transition-all hover:scale-105"
                                >
                                    ✕
                                </button>
                            </header>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {loadingPreview ? (
                                    <div className="h-64 flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading blueprint details...</p>
                                    </div>
                                ) : !previewData ? (
                                    <p className="text-slate-400 text-xs italic text-center">Failed to load blueprint details.</p>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        {/* Intro info */}
                                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm flex items-center gap-1">
                                                    <Globe size={9} /> {previewData.board_name}
                                                </span>
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                                                    {previewData.academic_year || '2026-27'}
                                                </span>
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 leading-snug">
                                                {previewData.board_name} {previewData.grade_name} {previewData.subject_name}
                                            </h4>
                                            <p className="text-slate-500 text-xs leading-relaxed">{previewData.description || 'Official Board Standard Structured Master Syllabus Blueprint.'}</p>
                                            
                                            {/* Overall Stats */}
                                            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200/60 text-center">
                                                <div>
                                                    <span className="text-[9px] font-black uppercase text-slate-400">Chapters</span>
                                                    <p className="text-sm font-black text-slate-800 mt-0.5">{previewData.chapters?.length || 0}</p>
                                                </div>
                                                <div className="border-l border-slate-200/60">
                                                    <span className="text-[9px] font-black uppercase text-slate-400">Total Topics</span>
                                                    <p className="text-sm font-black text-slate-800 mt-0.5">
                                                        {previewData.chapters?.reduce((sum: number, c: any) => sum + (c.topics?.length || 0), 0)}
                                                    </p>
                                                </div>
                                                <div className="border-l border-slate-200/60">
                                                    <span className="text-[9px] font-black uppercase text-slate-400">Rec. Periods</span>
                                                    <p className="text-sm font-black text-slate-800 mt-0.5">{previewData.total_recommended_hours || 0}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chapters & Topics List */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Syllabus Outline</h4>
                                            
                                            {previewData.chapters?.length === 0 ? (
                                                <p className="text-slate-400 text-xs italic">No chapters defined in this template.</p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {previewData.chapters?.map((chap: any, idx: number) => (
                                                        <div key={chap.id} className="p-5 rounded-2xl border border-slate-100 space-y-3 bg-white hover:border-slate-200 transition-all shadow-sm">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div>
                                                                    <span className="text-[9px] font-black uppercase text-slate-400">Chapter {idx + 1}</span>
                                                                    <h5 className="text-sm font-black text-slate-800 mt-0.5 leading-snug">{chap.title}</h5>
                                                                </div>
                                                                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100/50 flex-shrink-0 font-bold">
                                                                    {chap.recommended_periods || 5} Periods
                                                                </span>
                                                            </div>
                                                            {chap.description && (
                                                                <p className="text-slate-400 text-[11px] leading-relaxed italic">{chap.description}</p>
                                                            )}
                                                            
                                                            {/* Topics nested */}
                                                            {chap.topics && chap.topics.length > 0 && (
                                                                <div className="pt-2 border-t border-slate-50 space-y-1.5">
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Included Topics:</span>
                                                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pl-2">
                                                                        {chap.topics.map((top: any) => (
                                                                            <li key={top.id} className="text-slate-600 text-[11px] font-semibold flex items-start gap-1.5 leading-normal">
                                                                                <span className="text-indigo-400 font-black mt-0.5">•</span>
                                                                                <span className="line-clamp-2">{top.title}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <footer className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
                                <button 
                                    onClick={() => { setSelectedPreviewTemplateId(null); setPreviewData(null); }}
                                    className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors"
                                >
                                    Close Preview
                                </button>
                            </footer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalSyllabusManager;
