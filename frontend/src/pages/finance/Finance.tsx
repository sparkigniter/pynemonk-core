import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    DollarSign, TrendingUp, 
    Download, Plus, CheckCircle2,
    Clock, Loader2, Search, Bell,
    ArrowUpRight,
    Filter,
    FileText,
    Calendar,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getAccountingSummary, getInvoices } from '../../api/accounting.api';
import JournalEntryForm from '../accounting/JournalEntryForm';

const classData = [
    { name: 'Grade 1', collected: 45000, target: 50000 },
    { name: 'Grade 2', collected: 38000, target: 50000 },
    { name: 'Grade 3', collected: 48000, target: 50000 },
    { name: 'Grade 4', collected: 42000, target: 50000 },
    { name: 'Grade 5', collected: 49000, target: 50000 },
    { name: 'Grade 6', collected: 35000, target: 50000 },
];

export default function Finance() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'defaulters' | 'reminders'>('overview');
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isJournalFormOpen, setIsJournalFormOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [sumData, invData] = await Promise.all([
                getAccountingSummary(),
                getInvoices()
            ]);
            setSummary(sumData);
            setInvoices(invData);
        } catch (err: any) {
            console.error('Failed to load finance data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-[var(--text-main)] tracking-tight">Syncing Financial Records</p>
                    <p className="text-sm text-[var(--text-muted)] font-medium mt-1">Fetching real-time revenue analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="bg-surface-dark p-4 rounded-3xl shadow-xl shadow-theme/10">
                        <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">Financial Command</h1>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Revenue & Collection Engine
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button className="btn-ghost flex items-center gap-2 !px-5 !py-3">
                        <Download size={18} />
                        Export Audit Trail
                    </button>
                    <button 
                        onClick={() => navigate('/accounting/invoices/new')}
                        className="btn-primary flex items-center gap-2 !px-6 !py-3"
                    >
                        <Plus size={18} />
                        New Invoice
                    </button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                    { label: 'Total Outstanding', value: summary?.outstandingAR || 124500, trend: '+4.2%', icon: FileText, color: 'text-indigo-600', bg: 'bg-primary/5', sub: 'Active Receivables' },
                    { label: 'Term Collections', value: 382000, trend: '+12%', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Net Realized Revenue' },
                    { label: 'Overdue Arrears', value: 45000, trend: '-2.1%', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50', sub: 'Requires Intervention' },
                    { label: 'Collection Rate', value: '84.8%', trend: 'On Track', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Institutional KPI', isPercent: true },
                ].map((stat, i) => (
                    <div key={i} className="premium-card p-6 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
                        
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                                <stat.icon size={22} />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-tight ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {stat.trend}
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">{stat.label}</p>
                            <h2 className="text-3xl font-bold text-[var(--text-main)] tracking-tight mb-2">
                                {stat.isPercent ? stat.value : formatCurrency(stat.value)}
                            </h2>
                            <p className="text-[10px] font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                                <Sparkles size={10} className="text-amber-500" />
                                {stat.sub}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation & Controls */}
            <div className="flex flex-col xl:flex-row justify-between items-center gap-6 bg-[var(--card-bg)] p-3 rounded-[2.5rem] shadow-sm border border-[var(--card-border)]/60">
                <div className="flex items-center gap-1 p-1 bg-slate-50/50 rounded-2xl w-full xl:w-max">
                    {(['overview', 'invoices', 'defaulters', 'reminders'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-3 rounded-xl text-xs font-bold transition-all capitalize ${
                                activeTab === tab 
                                ? 'bg-[var(--card-bg)] text-surface-dark shadow-sm border border-[var(--card-border)]' 
                                : 'text-[var(--text-muted)] hover:text-slate-600'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <div className="relative flex-1 xl:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                            type="text"
                            placeholder="Search by student, class or invoice ID..."
                            className="input-field-modern !pl-12 !py-3.5 !text-xs !bg-slate-50/50 !border-transparent focus:!bg-[var(--card-bg)] focus:!border-[var(--card-border)]"
                        />
                    </div>
                    <button className="p-3.5 btn-dark !shadow-theme/10">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Class-wise Collection Efficiency */}
                    <div className="xl:col-span-2 premium-card p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">Institutional Efficiency</h3>
                                <p className="text-xs font-medium text-[var(--text-muted)] mt-1 uppercase tracking-widest">Target vs Realized Revenue by Grade</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Realized</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-100" />
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Provisional</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={classData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={12}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                                    />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                                    />
                                    <Bar dataKey="collected" fill="var(--primary)" radius={[8, 8, 8, 8]} barSize={32}>
                                        {classData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fillOpacity={1 - index * 0.05} />
                                        ))}
                                    </Bar>
                                    <Bar dataKey="target" fill="#f1f5f9" radius={[8, 8, 8, 8]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Defaulter Snapshot */}
                    <div className="premium-card p-8 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">Arrears Monitor</h3>
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Critical Defaulters</p>
                            </div>
                            <button className="p-2 text-[var(--text-muted)] hover:text-primary transition-colors">
                                <ArrowUpRight size={20} />
                            </button>
                        </div>

                        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
                            {[
                                { name: 'Aryan Khan', class: 'Grade 10-A', amount: 4500, days: 12, risk: 'Low' },
                                { name: 'Sara Williams', class: 'Grade 8-B', amount: 3200, days: 8, risk: 'Low' },
                                { name: 'James Wilson', class: 'Grade 12-C', amount: 12500, days: 45, risk: 'High' },
                                { name: 'Emily Brown', class: 'Grade 9-A', amount: 2100, days: 5, risk: 'Low' },
                                { name: 'Michael Chen', class: 'Grade 11-B', amount: 8900, days: 32, risk: 'Medium' },
                            ].map((student, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group cursor-pointer border border-transparent hover:border-[var(--card-border)]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-surface-dark flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-theme/10">
                                            {student.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text-main)] group-hover:text-primary transition-colors leading-none mb-1">{student.name}</p>
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">{student.class}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-[var(--text-main)]">{formatCurrency(student.amount)}</p>
                                        <p className={`text-[9px] font-black uppercase tracking-tight mt-0.5 ${student.risk === 'High' ? 'text-rose-500' : student.risk === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {student.days}d Overdue
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-[var(--card-border)] space-y-3">
                            <button className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold text-xs hover:bg-rose-100 transition-all flex items-center justify-center gap-3">
                                <Bell size={18} />
                                Batch Notifications
                            </button>
                            <button className="w-full py-4 bg-slate-50 text-[var(--text-muted)] rounded-2xl font-bold text-xs cursor-not-allowed flex items-center justify-center gap-3">
                                <Calendar size={18} />
                                Schedule Recovery
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'invoices' && (
                <div className="premium-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-[var(--card-border)]">
                                    <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">ID Reference</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Entity Account</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Ledger Item</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Allocation Status</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Value</th>
                                    <th className="px-8 py-5 w-16"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv, i) => (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-all group">
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-[var(--text-main)] bg-slate-100 px-3 py-1.5 rounded-lg border border-[var(--card-border)]/60">
                                                {inv.invoice_no}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary font-bold text-[10px]">
                                                    {inv.student_name?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[var(--text-main)] group-hover:text-primary transition-colors">{inv.student_name}</span>
                                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Student Ledger</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700">{inv.installment_name || 'Quarterly Tuition'}</span>
                                                <span className="text-[10px] font-medium text-[var(--text-muted)]">AY 2024-25 • Term 1</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider border shadow-sm
                                                ${inv.status === 'paid' 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/5' 
                                                    : 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-500/5'}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right font-bold text-[var(--text-main)] text-sm">
                                            {formatCurrency(parseFloat(inv.total_amount))}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2.5 text-slate-300 hover:text-slate-600 hover:bg-[var(--card-bg)] rounded-xl transition-all border border-transparent hover:border-[var(--card-border)]">
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Quick Post Drawer */}
            {isJournalFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-surface-dark/40 backdrop-blur-md" onClick={() => setIsJournalFormOpen(false)} />
                    <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-[var(--card-bg)] rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-12 duration-700">
                        <div className="p-1">
                            <JournalEntryForm onClose={() => setIsJournalFormOpen(false)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
