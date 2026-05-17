import { useState, useEffect } from 'react';
import { 
    Plus, Search, Filter, Download, 
    Calendar, MoreVertical, CheckCircle2,
    Clock, ArrowRightLeft, FileText,
    Loader2, AlertCircle, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getJournals, type JournalEntry } from '../../api/accounting.api';
import JournalEntryForm from './JournalEntryForm';

export default function JournalEntries() {
    const { can } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const fetchJournals = async () => {
        try {
            setLoading(true);
            const data = await getJournals();
            setJournals(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load journal entries');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJournals();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const stats = {
        posted: journals.filter(j => j.status === 'posted').length,
        drafts: journals.filter(j => j.status === 'draft').length,
        totalVolume: journals.reduce((acc, j) => acc + (j.items?.reduce((sum, item) => sum + (Number(item.debit) || 0), 0) || 0), 0)
    };

    if (loading && journals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Mapping Ledger Transactions...</p>
            </div>
        );
    }

    if (error && journals.length === 0) {
        return (
            <div className="premium-card p-12 flex flex-col items-center justify-center text-center gap-6 border-rose-100 bg-rose-50/20">
                <div className="w-20 h-20 rounded-[2rem] bg-[var(--card-bg)] flex items-center justify-center text-rose-500 shadow-xl shadow-rose-100">
                    <AlertCircle size={40} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Sync Disruption</h3>
                    <p className="text-[var(--text-muted)] max-w-sm font-medium mt-1">{error}</p>
                </div>
                <button 
                    onClick={() => fetchJournals()}
                    className="mt-2 px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 modal-overlay backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
                    <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden bg-[var(--card-bg)] rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom-8 duration-500 border border-[var(--card-border)]/50">
                        <JournalEntryForm 
                            onClose={() => setIsFormOpen(false)} 
                            onSuccess={fetchJournals} 
                        />
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <ArrowRightLeft size={12} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Double-Entry Ledger</span>
                    </div>
                    <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight">Journal Entries</h1>
                    <p className="text-[var(--text-muted)] font-medium text-sm mt-1">Manual accounting entries and adjustments for LuviaEdu.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                        <Download size={18} />
                        Export
                    </button>
                    {can('journal:write') && (
                        <button 
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <Plus size={18} />
                            New Entry
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="premium-card p-6 border-l-4 border-l-primary group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Posted Entries</p>
                            <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight">{stats.posted} <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Active</span></h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={24} />
                        </div>
                    </div>
                </div>
                <div className="premium-card p-6 border-l-4 border-l-amber-500 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Draft Entries</p>
                            <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight">{stats.drafts} <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Pending</span></h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Clock size={24} />
                        </div>
                    </div>
                </div>
                <div className="premium-card p-6 border-l-4 border-l-emerald-500 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Total Volume</p>
                            <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight font-mono">{formatCurrency(stats.totalVolume)}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="premium-card overflow-hidden border-none shadow-2xl shadow-slate-200/50">
                <div className="p-6 border-b border-[var(--card-border)]/50 bg-slate-50/50 flex flex-col sm:flex-row gap-6 items-center justify-between">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-80">
                            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input type="text" placeholder="Search entries by ID or reference..." className="w-full pl-12 pr-6 py-3.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
                        </div>
                        <button className="flex items-center gap-2 px-6 py-3.5 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-sm">
                            <Filter size={16} />
                            Filter
                        </button>
                    </div>
                    <div className="flex items-center gap-2 bg-[var(--card-bg)] p-1.5 rounded-2xl border border-[var(--card-border)]/50 shadow-inner overflow-x-auto no-scrollbar">
                        <button className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">All</button>
                        <button className="px-6 py-2.5 text-[var(--text-muted)] hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Posted</button>
                        <button className="px-6 py-2.5 text-[var(--text-muted)] hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Drafts</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] border-b border-[var(--card-border)]/50">
                                <th className="py-6 px-8">Date & ID</th>
                                <th className="py-6 px-8">Description / Ref</th>
                                <th className="py-6 px-8 text-right">Debit Balance</th>
                                <th className="py-6 px-8">Status</th>
                                <th className="py-6 px-8">Created By</th>
                                <th className="py-6 px-8 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--card-border)]/10">
                            {journals.map((journal) => {
                                const totalAmount = journal.items?.reduce((sum, item) => sum + (Number(item.debit) || 0), 0) || 0;
                                return (
                                    <tr key={journal.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                        <td className="py-6 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[var(--text-main)] tracking-tight uppercase">JV-{journal.id}</p>
                                                    <p className="text-[10px] font-black text-[var(--text-muted)] flex items-center gap-1.5 uppercase mt-1">
                                                        <Calendar size={12} className="text-primary" />
                                                        {new Date(journal.entry_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-8">
                                            <p className="text-sm font-bold text-[var(--text-main)] truncate max-w-xs">{journal.description}</p>
                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">{journal.reference_no || 'NO EXTERNAL REF'}</p>
                                        </td>
                                        <td className="py-6 px-8 text-right">
                                            <span className="text-sm font-black text-[var(--text-main)] font-mono">{formatCurrency(totalAmount)}</span>
                                        </td>
                                        <td className="py-6 px-8">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                                journal.status === 'posted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}>
                                                <div className={`w-2 h-2 rounded-full ${journal.status === 'posted' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                {journal.status || 'posted'}
                                            </span>
                                        </td>
                                        <td className="py-6 px-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                    S
                                                </div>
                                                <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">System</span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-8 text-right">
                                            <button className="p-2 text-[var(--text-muted)] hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-[var(--card-border)]/50 flex items-center justify-between">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Institutional Ledger Audit History</p>
                    <div className="flex items-center gap-3">
                        <button className="px-6 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:bg-white transition-all shadow-sm">Previous</button>
                        <button className="px-6 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:bg-white transition-all shadow-sm">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

