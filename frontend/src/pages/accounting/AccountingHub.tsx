import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    TrendingUp, TrendingDown, Building2, 
    LayoutDashboard, ArrowUpRight, ArrowDownRight, 
    Plus, Calendar, Bell,
    MoreHorizontal, AlertCircle,
    FileText, Zap, ArrowRight
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
            <div className="h-[70vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--card-border)] border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const kpis = [
        { label: 'Cash on Hand', value: summary?.cashOnHand, trend: '+12.5%', isPositive: true, icon: Building2 },
        { label: 'Monthly Revenue', value: summary?.revenueMTD, trend: '+5.2%', isPositive: true, icon: TrendingUp },
        { label: 'Monthly Expenses', value: summary?.expensesMTD, trend: '-2.1%', isPositive: false, icon: TrendingDown },
        { label: 'Outstanding AR', value: summary?.outstandingAR, trend: '+1.4%', isPositive: false, icon: AlertCircle },
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
            stats: `${currencySymbol}${summary?.outstandingAR?.toLocaleString() || '0'} Outstanding`,
            desc: 'Student invoicing, fee collection, and aging.'
        },
        { 
            title: 'Banking', 
            path: '/accounting/banking', 
            icon: Building2, 
            color: 'text-amber-600', 
            bg: 'bg-amber-50', 
            stats: `${currencySymbol}${summary?.cashOnHand?.toLocaleString() || '0'} Total Cash`,
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
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">Accounting Workspace</h1>
                    <p className="text-[var(--text-muted)] font-medium mt-1">Real-time financial pulse for LuviaEdu School</p>
                </div>
                
                <div className="flex items-center gap-3">
                    {can('journal:write') && (
                        <button 
                            onClick={() => setIsJournalModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <Plus size={18} />
                            Quick Post
                        </button>
                    )}
                    <button className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <Calendar size={18} />
                    </button>
                    <button className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, i) => (
                    <div key={i} className="premium-card p-6 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-xl ${kpi.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} transition-colors`}>
                                <kpi.icon size={20} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold ${kpi.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {kpi.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {kpi.trend}
                            </div>
                        </div>
                        <p className="text-sm font-semibold text-[var(--text-muted)] mb-1">{kpi.label}</p>
                        <h2 className="text-2xl font-extrabold text-[var(--text-main)]">{currencySymbol}{kpi.value?.toLocaleString() || '0'}</h2>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50 overflow-hidden">
                            <div className={`h-full ${kpi.isPositive ? 'bg-emerald-500' : 'bg-rose-500'} opacity-30 group-hover:opacity-100 transition-opacity`} style={{ width: '65%' }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Middle Section: Trends & Insights */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Income Trend Chart */}
                <div className="xl:col-span-2 premium-card p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-[var(--text-main)]">Performance Trends</h3>
                            <p className="text-sm text-[var(--text-muted)]">Income vs Expenses this week</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-[var(--text-muted)]">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /> Income</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200" /> Expense</div>
                        </div>
                    </div>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    cursor={{ stroke: 'var(--primary)', strokeWidth: 2 }}
                                />
                                <Area type="monotone" dataKey="income" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                                <Area type="monotone" dataKey="expense" stroke="#cbd5e1" strokeWidth={3} fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Fee Collection Progress */}
                    <div className="premium-card p-8 h-full flex flex-col">
                        <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">Term Collection Progress</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-8">Target: {currencySymbol}450k | Collected: {currencySymbol}382k</p>
                        
                        <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
                            <div className="absolute h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '84.8%' }} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-4 rounded-2xl bg-slate-50">
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Efficiency</p>
                                <p className="text-xl font-extrabold text-[var(--text-main)]">84.8%</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                                <p className="text-[10px] font-bold text-rose-400 uppercase mb-1">Defaulters</p>
                                <p className="text-xl font-extrabold text-rose-600">9%</p>
                            </div>
                        </div>

                        <button className="w-full mt-auto py-3 bg-surface-dark text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                            <Bell size={16} />
                            Send Reminders
                        </button>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((mod, i) => (
                    <button 
                        key={i}
                        onClick={() => navigate(mod.path)}
                        className="premium-card p-6 flex flex-col group hover:border-primary/30 transition-all text-left"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className={`p-3 rounded-2xl ${mod.bg} ${mod.color} group-hover:scale-110 transition-transform`}>
                                <mod.icon size={24} />
                            </div>
                            <div className="px-3 py-1 bg-slate-50 rounded-full">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{mod.stats}</span>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">{mod.title}</h3>
                        <p className="text-sm text-[var(--text-muted)] font-medium mb-6 line-clamp-2">{mod.desc}</p>
                        <div className="mt-auto flex items-center gap-2 text-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            Open Workspace <ArrowRight size={14} />
                        </div>
                    </button>
                ))}
            </div>

            {/* Journal Modal */}
            {isJournalModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 modal-overlay backdrop-blur-sm" onClick={() => setIsJournalModalOpen(false)} />
                    <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-[var(--card-bg)] rounded-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
                        <JournalEntryForm onClose={() => setIsJournalModalOpen(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}
