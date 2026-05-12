import { useState, useEffect } from 'react';
import { 
    Plus, Search, Filter, Download, 
    Calendar, MoreVertical, CheckCircle2,
    Clock, ArrowRightLeft, FileText,
    Loader2, AlertCircle
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
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-[var(--text-muted)] font-medium">Loading ledger transactions...</p>
            </div>
        );
    }

    if (error && journals.length === 0) {
        return (
            <div className="card p-12 flex flex-col items-center justify-center text-center gap-4 border-rose-100 bg-rose-50/20">
                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                    <AlertCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Connection Error</h3>
                <p className="text-[var(--text-muted)] max-w-sm">{error}</p>
                <button 
                    onClick={() => fetchJournals()}
                    className="mt-2 px-6 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 modal-overlay backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
                    <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-[var(--card-bg)] rounded-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
                        <JournalEntryForm 
                            onClose={() => setIsFormOpen(false)} 
                            onSuccess={fetchJournals} 
                        />
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-heading tracking-tight">Journal Entries</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Record and manage all manual accounting entries and adjustments.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm">
                        <Download size={16} />
                        Export
                    </button>
                    {can('journal:write') && (
                        <button 
                            onClick={() => setIsFormOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-theme-primary text-white rounded-xl hover:bg-theme-primary/90 transition-colors shadow-sm font-medium text-sm"
                        >
                            <Plus size={16} />
                            New Entry
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-5 border-l-4 border-l-theme-primary">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Posted Entries</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.posted} Entries</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                </div>
                <div className="card p-5 border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Draft Entries</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.drafts} Drafts</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock size={20} />
                        </div>
                    </div>
                </div>
                <div className="card p-5 border-l-4 border-l-emerald-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Transaction Volume</p>
                            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalVolume)}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <ArrowRightLeft size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b border-[var(--card-border)] bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input type="text" placeholder="Search entries..." className="w-full pl-9 pr-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <button className="flex items-center gap-2 px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] text-slate-600 rounded-xl text-sm hover:bg-[var(--card-bg)] transition-colors">
                            <Filter size={14} />
                            Filter
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">All</button>
                        <button className="px-3 py-1.5 text-[var(--text-muted)] hover:text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">Posted</button>
                        <button className="px-3 py-1.5 text-[var(--text-muted)] hover:text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">Drafts</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] border-b border-[var(--card-border)]">
                                <th className="py-4 px-6">Date & ID</th>
                                <th className="py-4 px-6">Description / Ref</th>
                                <th className="py-4 px-6 text-right">Amount</th>
                                <th className="py-4 px-6">Status</th>
                                <th className="py-4 px-6">Created By</th>
                                <th className="py-4 px-6 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {journals.map((journal) => {
                                const totalAmount = journal.items?.reduce((sum, item) => sum + (Number(item.debit) || 0), 0) || 0;
                                return (
                                    <tr key={journal.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-[var(--text-muted)]">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">JV-{journal.id}</p>
                                                    <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                                                        <Calendar size={10} />
                                                        {new Date(journal.entry_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-sm font-medium text-slate-700 truncate max-w-xs">{journal.description}</p>
                                            <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase">{journal.reference_no || 'NO REF'}</p>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="text-sm font-mono font-bold text-[var(--text-main)]">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                journal.status === 'posted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                            }`}>
                                                {journal.status === 'posted' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                                {journal.status || 'posted'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                    S
                                                </div>
                                                <span className="text-xs text-slate-600 font-medium">System</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button className="p-1.5 text-slate-300 hover:text-slate-600 rounded-lg hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all">
                                                <MoreVertical size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-slate-50/50 border-t border-[var(--card-border)] flex items-center justify-between">
                    <p className="text-xs text-[var(--text-muted)]">Showing 1 to 4 of 128 entries</p>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 border border-[var(--card-border)] rounded-lg text-xs font-bold text-[var(--text-muted)] cursor-not-allowed">Previous</button>
                        <button className="px-3 py-1.5 border border-[var(--card-border)] rounded-lg text-xs font-bold text-slate-600 hover:bg-[var(--card-bg)]">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
