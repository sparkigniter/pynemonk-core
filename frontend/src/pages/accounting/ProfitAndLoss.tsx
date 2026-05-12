import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Printer, Download, 
    Calendar, Loader2,
    TrendingUp, ChevronRight
} from 'lucide-react';
import { getProfitAndLoss } from '../../api/accounting.api';

export default function ProfitAndLoss() {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                const res = await getProfitAndLoss(dateRange.start, dateRange.end);
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [dateRange]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    if (loading && !data) {
        return (
            <div className="h-[70vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-[1200px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">
                            <span>Accounting Reports</span>
                            <ChevronRight size={10} />
                            <span>Financial Statements</span>
                        </div>
                        <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Profit & Loss</h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <Printer size={18} />
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-surface-dark text-white rounded-xl font-bold text-sm shadow-xl shadow-slate-200 hover:scale-[1.02] transition-all">
                        <Download size={18} />
                        Export P&L
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between premium-card p-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input 
                            type="date" 
                            className="premium-input pl-11 text-xs font-bold"
                            value={dateRange.start}
                            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <span className="text-slate-300 font-bold">to</span>
                    <div className="relative">
                        <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input 
                            type="date" 
                            className="premium-input pl-11 text-xs font-bold"
                            value={dateRange.end}
                            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                </div>
                
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                    <div className="p-2 bg-emerald-500 text-white rounded-xl">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Net Profit</p>
                        <h3 className="text-xl font-black text-emerald-700">{formatCurrency(data?.netProfit || 0)}</h3>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            <div className="premium-card p-10 space-y-12">
                {/* Revenue Section */}
                <section>
                    <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest mb-6 border-b border-[var(--card-border)] pb-2">Revenue</h3>
                    <div className="space-y-4">
                        {data?.revenue.map((r: any, i: number) => (
                            <div key={i} className="flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] group-hover:text-primary transition-colors">{r.code}</span>
                                    <span className="text-sm font-bold text-slate-700">{r.account_name}</span>
                                </div>
                                <span className="text-sm font-mono font-bold text-[var(--text-main)]">{formatCurrency(parseFloat(r.balance))}</span>
                            </div>
                        ))}
                        <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                            <span className="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">Total Revenue</span>
                            <span className="text-lg font-black text-[var(--text-main)]">{formatCurrency(data?.totalRevenue || 0)}</span>
                        </div>
                    </div>
                </section>

                {/* Expenses Section */}
                <section>
                    <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest mb-6 border-b border-[var(--card-border)] pb-2">Operating Expenses</h3>
                    <div className="space-y-4">
                        {data?.expenses.map((e: any, i: number) => (
                            <div key={i} className="flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] group-hover:text-primary transition-colors">{e.code}</span>
                                    <span className="text-sm font-bold text-slate-700">{e.account_name}</span>
                                </div>
                                <span className="text-sm font-mono font-bold text-rose-600">({formatCurrency(Math.abs(parseFloat(e.balance)))})</span>
                            </div>
                        ))}
                        <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                            <span className="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">Total Expenses</span>
                            <span className="text-lg font-black text-rose-600">{formatCurrency(data?.totalExpenses || 0)}</span>
                        </div>
                    </div>
                </section>

                {/* Final Net Section */}
                <section className="pt-8 border-t-4 border-slate-900">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-black text-[var(--text-main)]">Net Profit / (Loss)</h3>
                            <p className="text-xs text-[var(--text-muted)] font-bold mt-1">For the period {new Date(dateRange.start).toLocaleDateString()} — {new Date(dateRange.end).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <h2 className={`text-4xl font-black ${data?.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatCurrency(data?.netProfit || 0)}
                            </h2>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-2">Verified statement</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
