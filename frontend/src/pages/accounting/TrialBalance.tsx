import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Printer, Download, 
    Search, Filter, Loader2,
    TrendingUp, TrendingDown, ChevronRight
} from 'lucide-react';
import { getTrialBalance } from '../../api/accounting.api';

export default function TrialBalance() {
    const navigate = useNavigate();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await getTrialBalance();
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const filteredData = data.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.code.includes(searchQuery)
    );

    const totals = data.reduce((acc, a) => {
        acc.debit += parseFloat(a.total_debit);
        acc.credit += parseFloat(a.total_credit);
        return acc;
    }, { debit: 0, credit: 0 });

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
                        <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Trial Balance</h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <Printer size={18} />
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-surface-dark text-white rounded-xl font-bold text-sm shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <Download size={18} />
                        Export statement
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between premium-card p-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input 
                        placeholder="Search accounts..."
                        className="premium-input w-full pl-12"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-[var(--text-muted)]">As of {new Date().toLocaleDateString()}</span>
                    <button className="p-2.5 bg-slate-50 text-[var(--text-muted)] rounded-xl hover:text-slate-600 transition-all">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="premium-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-[var(--card-border)]">
                            <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Account</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Type</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Debit</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Credit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-20 text-center">
                                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                                    <p className="text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-[0.2em]">Calculating parity...</p>
                                </td>
                            </tr>
                        ) : filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-20 text-center text-[var(--text-muted)] italic">No transactions found for this period.</td>
                            </tr>
                        ) : filteredData.map(account => (
                            <tr key={account.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black px-2 py-1 bg-slate-100 text-[var(--text-muted)] rounded">{account.code}</span>
                                        <span className="text-sm font-extrabold text-[var(--text-main)]">{account.name}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{account.type_name}</span>
                                </td>
                                <td className="px-8 py-5 text-right font-mono text-sm">
                                    {parseFloat(account.total_debit) > 0 ? formatCurrency(parseFloat(account.total_debit)) : '-'}
                                </td>
                                <td className="px-8 py-5 text-right font-mono text-sm">
                                    {parseFloat(account.total_credit) > 0 ? formatCurrency(parseFloat(account.total_credit)) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-surface-dark text-white border-t-2 border-primary">
                            <td colSpan={2} className="px-8 py-6 text-sm font-black uppercase tracking-widest">Grand Totals</td>
                            <td className="px-8 py-6 text-right font-mono text-lg font-black">{formatCurrency(totals.debit)}</td>
                            <td className="px-8 py-6 text-right font-mono text-lg font-black">{formatCurrency(totals.credit)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Check Parity Alert */}
            <div className={`p-6 rounded-2xl border-2 flex items-center gap-4 ${Math.abs(totals.debit - totals.credit) < 0.01 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                {Math.abs(totals.debit - totals.credit) < 0.01 ? (
                    <>
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-widest">Balanced Statement</h4>
                            <p className="text-xs font-medium mt-0.5">All debits match credits perfectly. Your ledger integrity is maintained.</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                            <TrendingDown size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-widest">Discrepancy Detected</h4>
                            <p className="text-xs font-medium mt-0.5">There is a difference of {formatCurrency(Math.abs(totals.debit - totals.credit))} in your ledger.</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
