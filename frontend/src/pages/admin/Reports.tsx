import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    BarChart2, TrendingUp, TrendingDown, Download, 
    RefreshCw, Sliders, Filter, Loader2, Play, CheckCircle2, 
    XCircle, AlertCircle, Lock, Mail, 
    BookOpen, Settings, Info
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';

import { getAccountingSummary, getFinancialTrends } from '../../api/accounting.api';
import { reportsApi } from '../../api/reports.api';
import type { ReportJob } from '../../api/reports.api';
import { getGrades } from '../../api/grade.api';
import type { Grade } from '../../api/grade.api';
import { getClassrooms } from '../../api/classroom.api';
import type { Classroom } from '../../api/classroom.api';
import { examApi } from '../../api/exam.api';
import type { Exam } from '../../api/exam.api';
import { getBaseURL } from '../../api/base.api';

export default function Reports() {
    const navigate = useNavigate();

    // Live Metrics State
    const [summary, setSummary] = useState<any>(null);
    const [trends, setTrends] = useState<any[]>([]);
    const [metricsLoading, setMetricsLoading] = useState(true);

    // Filter Form Catalogs
    const [exams, setExams] = useState<Exam[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);

    // Selected Report Studio Configuration
    const [selectedReport, setSelectedReport] = useState<string>('trial_balance');
    const [format, setFormat] = useState<string>('pdf');
    const [generating, setGenerating] = useState(false);

    // Form Filters State
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        showZeroBalance: false,
        subType: 'ar', // for aging report: ar/ap
        status: '', // invoice status
        sourceType: '', // invoice source
        examId: '',
        gradeId: '',
        classroomId: '',
    });

    // Offline Background Jobs State
    const [jobs, setJobs] = useState<ReportJob[]>([]);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [emailDispatch, setEmailDispatch] = useState('');
    const [password, setPassword] = useState('');
    const [showSecuredOptions, setShowSecuredOptions] = useState(false);

    // Polling Reference
    const pollingIntervalRef = useRef<any>(null);

    // Initialize metrics and catalogs
    useEffect(() => {
        fetchDashboardMetrics();
        fetchCatalogData();
        fetchJobsList();

        // Start periodic job polling
        startJobsPolling();

        return () => {
            stopJobsPolling();
        };
    }, []);

    // Stop polling helper
    const stopJobsPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    // Start jobs status polling
    const startJobsPolling = () => {
        stopJobsPolling();
        pollingIntervalRef.current = setInterval(() => {
            fetchJobsList(false); // fetch silently without spinning indicators
        }, 5000);
    };

    const fetchDashboardMetrics = async () => {
        setMetricsLoading(true);
        try {
            const [summaryData, trendsData] = await Promise.all([
                getAccountingSummary(),
                getFinancialTrends()
            ]);
            setSummary(summaryData);
            setTrends(trendsData || []);
        } catch (err) {
            console.error('Failed to load metrics', err);
        } finally {
            setMetricsLoading(false);
        }
    };

    const fetchCatalogData = async () => {
        try {
            const [examsRes, gradesRes, classroomsRes] = await Promise.all([
                examApi.getExams(),
                getGrades({ limit: 100 }),
                getClassrooms({ limit: 100 })
            ]);
            setExams(examsRes || []);
            setGrades(gradesRes?.data || []);
            setClassrooms(classroomsRes?.data || []);
        } catch (err) {
            console.error('Failed to load filters metadata catalog', err);
        }
    };

    const fetchJobsList = async (showSpinner = true) => {
        if (showSpinner) setJobsLoading(true);
        try {
            const jobsData = await reportsApi.getJobsList();
            setJobs(jobsData || []);
            
            // Check if any jobs are currently in active state (PENDING / PROCESSING)
            const activeJobs = (jobsData || []).some(
                job => job.status === 'PENDING' || job.status === 'PROCESSING'
            );
            
            if (!activeJobs) {
                // If there are no active jobs, we don't strictly need rapid polling
                // but we keep it safe or we can slow it down.
            }
        } catch (err) {
            console.error('Failed to fetch offline jobs list', err);
        } finally {
            if (showSpinner) setJobsLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleRefreshMetrics = () => {
        fetchDashboardMetrics();
    };

    // Synchronous direct array buffer export
    const handleGenerateSync = async () => {
        setGenerating(true);
        try {
            // Build current filters payload based on selected report
            const activeFilters: Record<string, any> = {};
            if (selectedReport === 'student_grades') {
                if (!filters.examId) {
                    alert('Please select an Exam Term to run Academic Grades reports.');
                    setGenerating(false);
                    return;
                }
                activeFilters.examId = filters.examId;
                if (filters.gradeId) activeFilters.gradeId = filters.gradeId;
                if (filters.classroomId) activeFilters.classroomId = filters.classroomId;
            } else {
                if (filters.startDate) activeFilters.startDate = filters.startDate;
                if (filters.endDate) activeFilters.endDate = filters.endDate;
                if (filters.showZeroBalance) activeFilters.showZeroBalance = 'true';
                if (selectedReport === 'aging') {
                    activeFilters.subType = filters.subType;
                    if (filters.status) activeFilters.status = filters.status;
                    if (filters.sourceType) activeFilters.sourceType = filters.sourceType;
                }
            }

            const queryParams = new URLSearchParams();
            queryParams.append('format', format);
            Object.entries(activeFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value.toString());
                }
            });

            const session = localStorage.getItem('eduerp_session');
            const token = session ? JSON.parse(session).accessToken : '';

            console.log(`[ReportsUI] Direct sync download triggered for ${selectedReport} as ${format}`);
            const response = await fetch(`${getBaseURL()}/reports/generate/${selectedReport}?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const text = await response.text();
                let errMsg = 'Failed to generate document.';
                try {
                    const parsed = JSON.parse(text);
                    errMsg = parsed.message || errMsg;
                } catch {}
                throw new Error(errMsg);
            }

            const buffer = await response.arrayBuffer();
            let mimeType = 'application/octet-stream';
            if (format === 'pdf') mimeType = 'application/pdf';
            else if (format === 'csv') mimeType = 'text/csv';
            else if (format === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            else if (format === 'json') mimeType = 'application/json';

            const blob = new Blob([buffer], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: any) {
            console.error('Sync Export Failed', err);
            alert(err.message || 'Direct export failed. Consider dispatching a background job instead.');
        } finally {
            setGenerating(false);
        }
    };

    // Asynchronous background job trigger
    const handleTriggerBackgroundJob = async () => {
        setGenerating(true);
        try {
            // Build current filters payload based on selected report
            const activeFilters: Record<string, any> = {};
            if (selectedReport === 'student_grades') {
                if (!filters.examId) {
                    alert('Please select an Exam Term to run Academic Grades reports.');
                    setGenerating(false);
                    return;
                }
                activeFilters.examId = filters.examId;
                if (filters.gradeId) activeFilters.gradeId = filters.gradeId;
                if (filters.classroomId) activeFilters.classroomId = filters.classroomId;
            } else {
                if (filters.startDate) activeFilters.startDate = filters.startDate;
                if (filters.endDate) activeFilters.endDate = filters.endDate;
                if (filters.showZeroBalance) activeFilters.showZeroBalance = true;
                if (selectedReport === 'aging') {
                    activeFilters.subType = filters.subType;
                    if (filters.status) activeFilters.status = filters.status;
                    if (filters.sourceType) activeFilters.sourceType = filters.sourceType;
                }
            }

            const payload = {
                reportType: selectedReport,
                format: format,
                filters: activeFilters,
                password: password || undefined,
                emailDispatch: emailDispatch || undefined
            };

            console.log('[ReportsUI] Queueing background report job:', payload);
            await reportsApi.triggerJob(payload);
            
            // Clean inputs
            setPassword('');
            setEmailDispatch('');
            setShowSecuredOptions(false);
            
            // Refresh list
            await fetchJobsList(true);
            
            alert('Successfully queued background report job! Monitor its progress in the console below.');
        } catch (err: any) {
            console.error('Failed to trigger background job', err);
            alert(err.message || 'Failed to dispatch background job.');
        } finally {
            setGenerating(false);
        }
    };

    // Offline completed job download
    const handleDownloadJobOutput = async (job: ReportJob) => {
        try {
            const session = localStorage.getItem('eduerp_session');
            const token = session ? JSON.parse(session).accessToken : '';

            console.log(`[ReportsUI] Triggering secure download for background job ${job.id}`);
            const response = await fetch(`${getBaseURL()}/reports/jobs/${job.id}/download`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const text = await response.text();
                let errMsg = 'Failed to retrieve file from server storage.';
                try {
                    const parsed = JSON.parse(text);
                    errMsg = parsed.message || errMsg;
                } catch {}
                throw new Error(errMsg);
            }

            const buffer = await response.arrayBuffer();
            let mimeType = 'application/octet-stream';
            const fileFormat = job.format.toLowerCase();
            if (fileFormat === 'pdf') mimeType = 'application/pdf';
            else if (fileFormat === 'csv') mimeType = 'text/csv';
            else if (fileFormat === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            else if (fileFormat === 'zip') mimeType = 'application/zip';

            const blob = new Blob([buffer], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${job.report_type}_job_${job.id}.${fileFormat === 'zip' ? 'zip' : fileFormat}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: any) {
            console.error('Offline job download failed', err);
            alert(err.message || 'Failed to download compiled report output.');
        }
    };

    // Format helpers
    const formatCurrency = (val: number | string | undefined) => {
        if (val === undefined || val === null) return '$0.00';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
    };

    const getReportLabel = (type: string) => {
        switch (type) {
            case 'trial_balance': return 'Trial Balance';
            case 'profit_loss': return 'Profit & Loss';
            case 'balance_sheet': return 'Balance Sheet';
            case 'cash_flow': return 'Cash Flow Statement';
            case 'aging': return 'Aging Balance Report';
            case 'student_grades': return 'Academic Performance (Grades)';
            default: return type;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 font-heading tracking-tight flex items-center gap-2">
                        Analytics & Reports
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Synthesize ledger entries, academic performances, and cash flow statements in premium layouts.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={() => navigate('/accounting/reports/templates')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-semibold text-sm"
                    >
                        <Settings size={16} />
                        Template Designer
                    </button>
                    <button 
                        onClick={handleRefreshMetrics}
                        className="p-2.5 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        title="Refresh Analytics"
                    >
                        <RefreshCw size={18} className={metricsLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* LIVE KPI METRICS PANEL */}
            {metricsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm animate-pulse space-y-3">
                            <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {/* Revenue Card */}
                    <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-[1.5rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                        <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none text-emerald-500">
                            <TrendingUp size={120} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MTD Revenue</p>
                        <h2 className="text-2xl font-black text-slate-800 mt-1">{formatCurrency(summary?.revenueMTD)}</h2>
                        <div className="flex items-center gap-1 text-emerald-500 font-bold text-[10px] mt-2">
                            <TrendingUp size={12} />
                            <span>Inflows active</span>
                        </div>
                    </div>

                    {/* Expenses Card */}
                    <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-[1.5rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                        <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none text-rose-500">
                            <TrendingDown size={120} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MTD Expenses</p>
                        <h2 className="text-2xl font-black text-slate-800 mt-1">{formatCurrency(summary?.expensesMTD)}</h2>
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-[10px] mt-2">
                            <TrendingDown size={12} />
                            <span>Outflows checked</span>
                        </div>
                    </div>

                    {/* Cash Card */}
                    <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-[1.5rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cash On Hand</p>
                        <h2 className="text-2xl font-black text-slate-800 mt-1">{formatCurrency(summary?.cashOnHand)}</h2>
                        <div className="flex items-center gap-1 text-blue-500 font-bold text-[10px] mt-2">
                            <CheckCircle2 size={12} />
                            <span>Liquid & Liquid equivalents</span>
                        </div>
                    </div>

                    {/* Outstanding AR Card */}
                    <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-[1.5rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receivables (AR)</p>
                        <h2 className="text-2xl font-black text-slate-800 mt-1">{formatCurrency(summary?.outstandingAR)}</h2>
                        <div className="flex items-center gap-1 text-indigo-500 font-bold text-[10px] mt-2">
                            <Info size={12} />
                            <span>Uncollected fee batches</span>
                        </div>
                    </div>

                    {/* Outstanding AP Card */}
                    <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-[1.5rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payables (AP)</p>
                        <h2 className="text-2xl font-black text-slate-800 mt-1">{formatCurrency(summary?.outstandingAP)}</h2>
                        <div className="flex items-center gap-1 text-slate-500 font-bold text-[10px] mt-2">
                            <Lock size={12} />
                            <span>Vendor invoices due</span>
                        </div>
                    </div>
                </div>
            )}

            {/* VISUAL ANALYTICS TIMELINE */}
            {!metricsLoading && trends.length > 0 && (
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Financial Timeline</h3>
                            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Ledger trend analysis (Revenue vs Expenses)</p>
                        </div>
                        <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-lg">
                            Dynamic rolling window
                        </div>
                    </div>
                    
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="rgb(16, 185, 129)" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="rgb(16, 185, 129)" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="rgb(245, 158, 11)" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="rgb(245, 158, 11)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} tickFormatter={(v) => `$${v}`} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [formatCurrency(value as number), '']}
                                    labelStyle={{ fontWeight: 900, color: '#334155', fontSize: '11px' }}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                                <Area type="monotone" name="Inflow Revenue" dataKey="revenue" stroke="rgb(16, 185, 129)" strokeWidth={3} fillOpacity={1} fill="url(#revenueGrad)" />
                                <Area type="monotone" name="Outflow Expenses" dataKey="expenses" stroke="rgb(245, 158, 11)" strokeWidth={3} fillOpacity={1} fill="url(#expenseGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* REPORT GENERATION STUDIO */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Generation Form Settings */}
                <div className="lg:col-span-8 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="p-2 bg-theme-primary/10 text-theme-primary rounded-xl">
                            <Sliders size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Reporting Studio</h3>
                            <p className="text-xs text-slate-400">Configure parameters, select templates, and dispatch compilers.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        
                        {/* Selector for Report Type */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 tracking-widest block">Report Matrix Type</label>
                            <div className="relative">
                                <select 
                                    value={selectedReport}
                                    onChange={(e) => setSelectedReport(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-theme-primary/20 appearance-none"
                                >
                                    <option value="trial_balance">Trial Balance Ledger</option>
                                    <option value="profit_loss">Profit & Loss Statement</option>
                                    <option value="balance_sheet">Balance Sheet Statement</option>
                                    <option value="cash_flow">Cash Flow Statement</option>
                                    <option value="aging">AR & AP Aging Ledger</option>
                                    <option value="student_grades">Academic Grades Summary</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <Sliders size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Export Output Format */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 tracking-widest block">Output Format</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['pdf', 'csv', 'xlsx', 'json'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFormat(f)}
                                        className={`py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                                            format === f 
                                                ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                                                : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                                        }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* DYNAMIC CONTEXTUAL FILTER BLOCK */}
                    <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] space-y-6">
                        <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                            <Filter size={14} />
                            Contextual Parameters Filter
                        </h4>

                        {/* Conditional filters for Student Grades */}
                        {selectedReport === 'student_grades' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Exam Dropdown */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Exam Term <span className="text-rose-500">*</span></label>
                                    <select
                                        value={filters.examId}
                                        onChange={(e) => handleFilterChange('examId', e.target.value)}
                                        className="w-full bg-white border border-slate-200/60 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none"
                                    >
                                        <option value="">Select Exam</option>
                                        {exams.map(e => (
                                            <option key={e.id} value={e.id}>{e.name} ({e.exam_type})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Grade Selector */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Grade (Academic Level)</label>
                                    <select
                                        value={filters.gradeId}
                                        onChange={(e) => handleFilterChange('gradeId', e.target.value)}
                                        className="w-full bg-white border border-slate-200/60 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none"
                                    >
                                        <option value="">All Grades</option>
                                        {grades.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Classroom Selector */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Classroom Section</label>
                                    <select
                                        value={filters.classroomId}
                                        onChange={(e) => handleFilterChange('classroomId', e.target.value)}
                                        className="w-full bg-white border border-slate-200/60 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none"
                                    >
                                        <option value="">All Classrooms</option>
                                        {classrooms.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            /* Standard Financial Report Filters */
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Start Date</label>
                                        <input 
                                            type="date" 
                                            value={filters.startDate}
                                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                            className="w-full bg-white border border-slate-200/60 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">End Date</label>
                                        <input 
                                            type="date" 
                                            value={filters.endDate}
                                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                            className="w-full bg-white border border-slate-200/60 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {selectedReport === 'aging' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Aging Category</label>
                                            <select
                                                value={filters.subType}
                                                onChange={(e) => handleFilterChange('subType', e.target.value)}
                                                className="w-full bg-white border border-slate-200/60 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none"
                                            >
                                                <option value="ar">Accounts Receivable (Fees)</option>
                                                <option value="ap">Accounts Payable (Bills)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Source Filter</label>
                                            <select
                                                value={filters.sourceType}
                                                onChange={(e) => handleFilterChange('sourceType', e.target.value)}
                                                className="w-full bg-white border border-slate-200/60 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none"
                                            >
                                                <option value="">All sources</option>
                                                <option value="fee">Core Tuition Fees</option>
                                                <option value="enrollment">Admissions/Enrollments</option>
                                                <option value="manual">Manual Ledger Bills</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Invoice Status</label>
                                            <select
                                                value={filters.status}
                                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                                className="w-full bg-white border border-slate-200/60 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none"
                                            >
                                                <option value="">All unpaid</option>
                                                <option value="unpaid">Unpaid / Defaulted</option>
                                                <option value="partially_paid">Partially Paid</option>
                                                <option value="draft">Draft batches</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 pt-2">
                                    <input 
                                        type="checkbox"
                                        id="zeroBalanceCheck"
                                        checked={filters.showZeroBalance}
                                        onChange={(e) => handleFilterChange('showZeroBalance', e.target.checked)}
                                        className="w-4 h-4 rounded text-theme-primary border-slate-300 focus:ring-theme-primary/20"
                                    />
                                    <label htmlFor="zeroBalanceCheck" className="text-xs font-bold text-slate-600 select-none">
                                        Include accounts with zero transaction balance activity
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions Trigger Block */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-slate-100 pt-6">
                        <div className="w-full sm:w-auto">
                            <button
                                onClick={() => setShowSecuredOptions(!showSecuredOptions)}
                                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                            >
                                <Lock size={12} />
                                {showSecuredOptions ? 'Hide secured delivery options' : 'Show secured delivery options'}
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <button
                                onClick={handleGenerateSync}
                                disabled={generating}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all active:scale-95"
                            >
                                {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                Direct Download
                            </button>
                            <button
                                onClick={handleTriggerBackgroundJob}
                                disabled={generating}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-xl shadow-slate-900/10 hover:scale-[1.02] disabled:opacity-50 transition-all active:scale-95"
                            >
                                {generating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                                Run in Background
                            </button>
                        </div>
                    </div>

                    {/* Secured Delivery parameters */}
                    {showSecuredOptions && (
                        <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                                    <Lock size={10} />
                                    PDF Encryption Password
                                </label>
                                <input 
                                    type="password"
                                    placeholder="Keep empty for no encryption"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white border border-slate-200/60 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                                    <Mail size={10} />
                                    Email Dispatch Dispatcher
                                </label>
                                <input 
                                    type="email"
                                    placeholder="e.g. board@luvia.edu"
                                    value={emailDispatch}
                                    onChange={(e) => setEmailDispatch(e.target.value)}
                                    className="w-full bg-white border border-slate-200/60 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none"
                                />
                            </div>
                        </div>
                    )}

                </div>

                {/* Quick Info & Report Definitions Side Card */}
                <div className="lg:col-span-4 bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2rem] text-white shadow-xl flex flex-col justify-between space-y-8">
                    <div>
                        <div className="p-3 bg-white/10 rounded-2xl w-fit text-primary mb-6">
                            <BarChart2 size={24} className="text-theme-primary" />
                        </div>
                        <h3 className="text-xl font-black mb-3">Enterprise Reporting</h3>
                        <p className="text-xs text-white/70 leading-relaxed">
                            Generate legally compliant ledger matrices, audit trials, student grade books, and cash flow reports on-demand.
                        </p>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-1.5 bg-white/10 rounded-lg mt-0.5">
                                    <CheckCircle2 size={12} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black">Audit Ready</h4>
                                    <p className="text-[10px] text-white/50 mt-0.5">Sync compilation guarantees GAAP compatibility for financial ledgers.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-1.5 bg-white/10 rounded-lg mt-0.5">
                                    <CheckCircle2 size={12} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black">Secured Delivery</h4>
                                    <p className="text-[10px] text-white/50 mt-0.5">Optional password protection with secure AES-256 PDF encryption wrappers.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-1.5 bg-white/10 rounded-lg mt-0.5">
                                    <CheckCircle2 size={12} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black">Asynchronous Queue</h4>
                                    <p className="text-[10px] text-white/50 mt-0.5">Large reports are queued in background threads to avoid HTTP connection timeouts.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                        <h4 className="text-xs font-black flex items-center gap-2">
                            <BookOpen size={14} className="text-theme-primary" />
                            Academic Year Active
                        </h4>
                        <p className="text-[10px] text-white/60 mt-1">
                            Filtering and calculating ledger records is mapped automatically to the current active term.
                        </p>
                    </div>
                </div>

            </div>

            {/* ASYNCHRONOUS JOBS MONITOR CONSOLE */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="text-lg font-black text-slate-800">Background Offline Jobs</h3>
                        <p className="text-xs text-slate-400">Status console for larger async documents. Polling actively in background.</p>
                    </div>
                    <button 
                        onClick={() => fetchJobsList(true)}
                        className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border border-slate-200"
                    >
                        <RefreshCw size={12} className={jobsLoading ? 'animate-spin' : ''} />
                        Refresh Status List
                    </button>
                </div>

                {jobsLoading && jobs.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Retrieving background queue status...</p>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 italic text-sm">
                        No background jobs generated in the last 50 transactions. Select "Run in Background" above to initiate.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Type</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Format</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Initiated</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Download Compiled</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map(job => (
                                    <tr key={job.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-mono text-slate-500">#{job.id}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-black text-slate-700">{getReportLabel(job.report_type)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                {job.format}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {job.status === 'COMPLETED' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                                                    <CheckCircle2 size={12} />
                                                    COMPLETED
                                                </span>
                                            )}
                                            {job.status === 'PENDING' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100 animate-pulse">
                                                    <Loader2 size={12} className="animate-spin" />
                                                    PENDING
                                                </span>
                                            )}
                                            {job.status === 'PROCESSING' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100 animate-pulse">
                                                    <Loader2 size={12} className="animate-spin" />
                                                    PROCESSING
                                                </span>
                                            )}
                                            {job.status === 'FAILED' && (
                                                <span 
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-100 cursor-pointer"
                                                    title={job.error_message || 'Unknown error'}
                                                >
                                                    <XCircle size={12} />
                                                    FAILED
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                            {new Date(job.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {job.status === 'COMPLETED' ? (
                                                <button
                                                    onClick={() => handleDownloadJobOutput(job)}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-md shadow-emerald-600/10 active:scale-95 transition-all inline-flex items-center gap-1"
                                                >
                                                    <Download size={12} />
                                                    Get Output
                                                </button>
                                            ) : job.status === 'FAILED' ? (
                                                <span className="text-xs text-rose-500 font-medium italic flex items-center justify-end gap-1" title={job.error_message}>
                                                    <AlertCircle size={12} />
                                                    Compilation Error
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium italic flex items-center justify-end gap-1">
                                                    <Loader2 size={12} className="animate-spin" />
                                                    Compiling...
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}
