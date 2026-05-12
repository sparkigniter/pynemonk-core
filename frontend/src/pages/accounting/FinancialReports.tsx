import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    BarChart2, PieChart, TrendingUp, Download, 
    FileText, ChevronRight, Loader2, Zap, 
    Activity, Mail,
    Printer, Share2,
    Clock, GraduationCap, AlertCircle, CreditCard
} from 'lucide-react';
import { getTrialBalance } from '../../api/accounting.api';

const reportGroups = [
    {
        name: 'Financial Statements',
        reports: [
            { title: 'Profit & Loss', desc: 'Income vs Expenses summary', icon: TrendingUp, color: 'emerald' },
            { title: 'Balance Sheet', desc: 'Assets, Liabilities & Equity', icon: PieChart, color: 'indigo' },
            { title: 'Cash Flow', desc: 'Operating & Investing flows', icon: Activity, color: 'blue' },
            { title: 'Trial Balance', desc: 'Account debit/credit parity', icon: BarChart2, color: 'amber' },
        ]
    },
    {
        name: 'Accounts Receivable (Fees)',
        reports: [
            { title: 'Fee Aging Report', desc: 'Overdue fees by age group', icon: Clock, color: 'rose' },
            { title: 'Class Collection', desc: 'Efficiency by grade/section', icon: GraduationCap, color: 'indigo' },
            { title: 'Defaulter List', desc: 'Students with pending dues', icon: AlertCircle, color: 'rose' },
        ]
    },
    {
        name: 'Accounts Payable',
        reports: [
            { title: 'Vendor Aging', desc: 'Unpaid bills by duration', icon: Clock, color: 'rose' },
            { title: 'Payment History', desc: 'Log of outgoing funds', icon: CreditCard, color: 'emerald' },
        ]
    }
];



export default function FinancialReports() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setLoading(true);
                await getTrialBalance();
            } catch (err: any) {
                console.warn('Failed to load reports summary', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);



    if (loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-[var(--text-muted)] font-bold tracking-tight">Generating Financial Insights...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">Financial Insight Center</h1>
                    <p className="text-[var(--text-muted)] font-medium mt-1">SaaS-grade reporting and automated financial analysis</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] text-slate-600 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all">
                        <Share2 size={18} />
                        Share Statements
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-surface-dark text-white rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all">
                        <Download size={18} />
                        Batch Export
                    </button>
                </div>
            </div>

            {/* Smart AI Insight Banner */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600 via-primary to-accent text-white shadow-xl shadow-theme/10 relative overflow-hidden group">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-8">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-white/70 mb-4">
                            <Zap size={20} className="fill-white" />
                            <span className="text-xs font-black uppercase tracking-widest">AI Financial Auditor</span>
                        </div>
                        <h2 className="text-2xl font-extrabold mb-4">Institutional Health Summary</h2>
                        <p className="text-indigo-50 leading-relaxed font-medium">
                            "The school's liquidity remains strong with a current ratio of 2.1. However, fee collection from Grade 10 has slowed down by 8% compared to last term. We recommend triggering automated SMS reminders for the upcoming Term 2 billing cycle."
                        </p>
                    </div>
                    <div className="lg:w-72 space-y-3">
                        <div className="p-4 rounded-2xl bg-[var(--card-bg)]/10 backdrop-blur-md border border-white/10 flex justify-between items-center">
                            <span className="text-xs font-bold">Accuracy</span>
                            <span className="text-sm font-black text-emerald-400">99.9%</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-[var(--card-bg)]/10 backdrop-blur-md border border-white/10 flex justify-between items-center">
                            <span className="text-xs font-bold">Risk Level</span>
                            <span className="text-sm font-black text-amber-400">LOW</span>
                        </div>
                    </div>
                </div>
                {/* Decorative blur */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--card-bg)]/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            </div>

            {/* Report Categories Grid */}
            <div className="grid grid-cols-1 gap-12">
                {reportGroups.map((group, idx) => (
                    <div key={idx} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest">{group.name}</h3>
                            <div className="flex-1 h-px bg-slate-100" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {group.reports.map((report, ridx) => (
                                <button 
                                    key={ridx}
                                    onClick={() => {
                                        const slug = report.title.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
                                        navigate(`/accounting/reports/${slug}`);
                                    }}
                                    className="premium-card p-6 flex flex-col text-left group hover:border-primary/40 transition-all relative overflow-hidden"
                                >
                                    <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[var(--text-muted)] group-hover:bg-primary/10 group-hover:text-primary transition-all mb-6`}>
                                        <report.icon size={22} />
                                    </div>
                                    <h4 className="text-lg font-extrabold text-[var(--text-main)] mb-2">{report.title}</h4>
                                    <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed mb-6 line-clamp-2">{report.desc}</p>
                                    
                                    <div className="mt-auto flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Live Sync</span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Compliance & Export Side-Panel Mock */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 premium-card p-8 bg-slate-50/50 border-dashed border-2">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-extrabold text-[var(--text-main)]">Custom Report Builder</h3>
                        <span className="px-3 py-1 bg-primary/10 text-indigo-700 text-[10px] font-black rounded-lg uppercase tracking-widest">SaaS Preview</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-20 h-20 bg-[var(--card-bg)] rounded-3xl shadow-xl shadow-slate-100 flex items-center justify-center text-slate-300 mb-6">
                            <Zap size={32} />
                        </div>
                        <h4 className="text-xl font-extrabold text-slate-800 mb-2">Drag & Drop Financial Analytics</h4>
                        <p className="text-sm text-[var(--text-muted)] max-w-sm mb-8">Build department-wise spending or hostel vs transport revenue analysis charts in seconds.</p>
                        <button className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.05] transition-all">
                            Unlock Analytics
                        </button>
                    </div>
                </div>

                <div className="premium-card p-8 flex flex-col">
                    <h3 className="text-lg font-extrabold text-[var(--text-main)] mb-8">Quick Export Center</h3>
                    <div className="space-y-4 flex-1">
                        {[
                            { name: 'Income Statement (PDF)', size: '1.2 MB', icon: FileText },
                            { name: 'Trial Balance (Excel)', size: '425 KB', icon: BarChart2 },
                            { name: 'Defaulter List (WhatsApp)', size: 'Auto-link', icon: Mail },
                            { name: 'CFO Presentation (PPT)', size: '5.8 MB', icon: PieChart },
                        ].map((file, fidx) => (
                            <div key={fidx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors group cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-primary transition-colors">
                                        <file.icon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{file.name}</p>
                                        <p className="text-[10px] font-medium text-[var(--text-muted)]">{file.size}</p>
                                    </div>
                                </div>
                                <Download size={16} className="text-slate-200 group-hover:text-primary transition-colors" />
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-8 py-3 bg-surface-dark text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
                        <Printer size={16} />
                        Print All Statements
                    </button>
                </div>
            </div>
        </div>
    );
}
