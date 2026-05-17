import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    TrendingUp, TrendingDown, Building2, 
    LayoutDashboard, ArrowUpRight, ArrowDownRight, 
    Plus, Calendar, Bell,
    MoreHorizontal, AlertCircle,
    FileText, Zap, ArrowRight, ShieldCheck, Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import JournalEntryForm from './JournalEntryForm';
import { getAccountingSummary, getAccountingSettings } from '../../api/accounting.api';

// Mock trend data for visualization
const trendData = [
    { name: 'Mon', income: 4000, expense: 2400 },
    { name: 'Tue', income: 3000, expense: 1398 },
    { name: 'Wed', income: 2000, expense: 9800 },
    { name: 'Thu', income: 2780, expense: 3908 },
    { name: 'Fri', income: 1890, expense: 4800 },
    { name: 'Sat', income: 2390, expense: 3800 },
    { name: 'Sun', income: 3490, expense: 4300 },
];

export default function AccountingHub() {
    const navigate = useNavigate();
    const { can } = useAuth();
    const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
    const [summary, setSummary] = useState<any>(null);
    const [currencySymbol, setCurrencySymbol] = useState('$');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [summaryData, settings] = await Promise.all([
                getAccountingSummary(),
                getAccountingSettings()
            ]);
            setSummary(summaryData);
            setCurrencySymbol(settings.currency_symbol || '$');
        } catch (err) {
            console.error('Failed to fetch initial data', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-12 h-12 border-4 border-[var(--card-border)] border-t-primary rounded-full animate-spin shadow-lg" />
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Compiling Ledger Analytics...</p>
            </div>
        );
    }

    const kpis = [
        { label: 'Cash on Hand', value: summary?.cashOnHand, trend: '+12.5%', isPositive: true, icon: Building2, color: 'primary' },
        { label: 'Monthly Revenue', value: summary?.revenueMTD, trend: '+5.2%', isPositive: true, icon: TrendingUp, color: 'emerald' },
        { label: 'Monthly Expenses', value: summary?.expensesMTD, trend: '-2.1%', isPositive: false, icon: TrendingDown, color: 'rose' },
        { label: 'Outstanding AR', value: summary?.outstandingAR, trend: '+1.4%', isPositive: false, icon: AlertCircle, color: 'amber' },
    ];

    const modules = [
        { 
            title: 'General Ledger', 
            path: '/accounting/coa', 
            icon: LayoutDashboard, 
            color: 'text-primary', 
            bg: 'bg-primary/5', 
            stats: `${summary?.trialBalanceCount || 0} Accounts`,
            desc: 'Chart of accounts, trial balance, and financial statements.'
        },
        { 
            title: 'Accounts Payable', 
            path: '/accounting/ap', 
            icon: TrendingDown, 
            color: 'text-rose-600', 
            bg: 'bg-rose-50', 
            stats: `${currencySymbol}${summary?.outstandingAP?.toLocaleString() || '0'} Unpaid`,
            desc: 'Manage vendors, record bills, and track payments.'
        },
        { 
            title: 'Accounts Receivable', 
            path: '/accounting/ar', 
            icon: TrendingUp, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50', 
            stats: `${currencySymbol}${summary?.outstandingAR?.toLocaleString() || '0'} Dues`,
            desc: 'Student invoicing, fee collection, and aging.'
        },
        { 
            title: 'Banking', 
            path: '/accounting/banking', 
            icon: Building2, 
            color: 'text-amber-600', 
            bg: 'bg-amber-50', 
            stats: `${currencySymbol}${summary?.cashOnHand?.toLocaleString() || '0'} Cash`,
            desc: 'Bank accounts, reconciliation, and cash flow.'
        },
        { 
            title: 'Financial Reports', 
            path: '/accounting/reports', 
            icon: FileText, 
            color: 'text-purple-600', 
            bg: 'bg-purple-50', 
            stats: '12 Reports',
            desc: 'Balance sheet, P&L, and cash flow analysis.'
        },
        { 
            title: 'Payroll', 
            path: '/accounting/salaries', 
            icon: Zap, 
            color: 'text-blue-600', 
            bg: 'bg-blue-50', 
            stats: 'Staff Salaries',
            desc: 'Manage employee payroll and tax filings.'
        },
    ];

    return (
        <div className="p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <Activity size={12} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Accounting Workspace</span>
                    </div>
                    <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight">Executive Dashboard</h1>
                    <p className="text-[var(--text-muted)] font-medium text-sm mt-1">Real-time financial pulse for LuviaEdu Institutional Operations.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    {can('journal:write') && (
                        <button 
                            onClick={() => setIsJournalModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <Plus size={18} />
                            Post Transaction
                        </button>
                    )}
                    <button className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl text-[var(--text-muted)] hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <Calendar size={18} />
                    </button>
                    <button className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl text-[var(--text-muted)] hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {kpis.map((kpi, i) => (
                    <div key={i} className="premium-card p-6 relative overflow-hidden group cursor-pointer hover:border-primary/20 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-3 rounded-2xl bg-${kpi.color === 'primary' ? 'primary' : kpi.color + '-500'}/10 text-${kpi.color === 'primary' ? 'primary' : kpi.color + '-500'} transition-all group-hover:scale-110 shadow-sm`}>
                                <kpi.icon size={24} />
                            </div>
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black ${kpi.isPositive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                {kpi.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {kpi.trend}
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{kpi.label}</p>
                        <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight font-mono">{currencySymbol}{kpi.value?.toLocaleString() || '0'}</h2>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50/50 overflow-hidden">
                            <div className={`h-full ${kpi.isPositive ? 'bg-emerald-500' : 'bg-rose-500'} transition-all group-hover:opacity-100 opacity-20`} style={{ width: '65%' }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Middle Section: Trends & Insights */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Income Trend Chart */}
                <div className="xl:col-span-2 premium-card p-8 border-none shadow-2xl shadow-slate-200/50 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                        <div>
                            <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">Financial Performance</h3>
                            <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Weekly Cash Flow Analysis</p>
                        </div>
                        <div className="flex items-center gap-6 bg-slate-50/50 p-2 rounded-2xl border border-[var(--card-border)]/50">
                            <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-3 py-1.5 rounded-xl bg-[var(--card-bg)] shadow-sm border border-[var(--card-border)]/50">
                                <div className="w-2 h-2 rounded-full bg-primary" /> Income
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-3 py-1.5">
                                <div className="w-2 h-2 rounded-full bg-slate-300" /> Expense
                            </div>
                        </div>
                    </div>
                    <div className="h-[340px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '16px', background: 'var(--card-bg)' }}
                                    cursor={{ stroke: 'var(--primary)', strokeWidth: 2, strokeDasharray: '5 5' }}
                                />
                                <Area type="monotone" dataKey="income" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                                <Area type="monotone" dataKey="expense" stroke="#e2e8f0" strokeWidth={4} fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Fee Collection Progress */}
                    <div className="premium-card p-8 h-full flex flex-col bg-surface-dark text-white border-none shadow-2xl shadow-theme/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                        
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-black tracking-tight">Collection Progress</h3>
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-primary">
                                <ShieldCheck size={20} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-10">Academic Term Goal</p>
                        
                        <div className="space-y-6">
                            <div className="relative h-6 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner p-1">
                                <div className="absolute inset-y-1 left-1 bg-primary rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" style={{ width: '84.8%' }} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 rounded-[2rem] bg-white/5 border border-white/5">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Efficiency</p>
                                    <p className="text-2xl font-black text-white">84.8%</p>
                                </div>
                                <div className="p-5 rounded-[2rem] bg-rose-500/10 border border-rose-500/20">
                                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Delinquency</p>
                                    <p className="text-2xl font-black text-rose-500">9%</p>
                                </div>
                            </div>
                        </div>

                        <button className="w-full mt-10 py-4 bg-primary text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                            <Bell size={18} />
                            Dispatch Reminders
                        </button>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {modules.map((mod, i) => (
                    <button 
                        key={i}
                        onClick={() => navigate(mod.path)}
                        className="premium-card p-8 flex flex-col group hover:border-primary/30 transition-all text-left bg-[var(--card-bg)] shadow-xl shadow-slate-200/40 border-[var(--card-border)]/50"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className={`p-4 rounded-3xl ${mod.bg} ${mod.color} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm`}>
                                <mod.icon size={28} />
                            </div>
                            <div className="px-4 py-1.5 bg-slate-50/50 rounded-full border border-[var(--card-border)]/50">
                                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{mod.stats}</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-[var(--text-main)] mb-2 tracking-tight">{mod.title}</h3>
                        <p className="text-sm text-[var(--text-muted)] font-medium mb-8 leading-relaxed">{mod.desc}</p>
                        <div className="mt-auto flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
                            Explore Workspace <ArrowRight size={14} />
                        </div>
                    </button>
                ))}
            </div>

            {/* Journal Modal */}
            {isJournalModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 modal-overlay backdrop-blur-sm" onClick={() => setIsJournalModalOpen(false)} />
                    <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden bg-[var(--card-bg)] rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom-8 duration-500 border border-[var(--card-border)]/50">
                        <JournalEntryForm onClose={() => setIsJournalModalOpen(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}

