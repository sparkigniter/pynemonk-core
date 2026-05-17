import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    MoreVertical, Loader2,
    Search, Clock, Receipt,
    Send, CreditCard, UserPlus, Users, Tag,
    TrendingUp, Activity, BarChart3, ArrowRight, ShieldCheck, AlertCircle
} from 'lucide-react';
import { getInvoices, getAccountingSettings, getARSummary, getPartners } from '../../api/accounting.api';
import FeeInvoiceBatchForm from './FeeInvoiceBatchForm';
import FeePaymentModal from './FeePaymentModal';
import PartnerModal from './PartnerModal';

export default function AccountsReceivable() {
    const navigate = useNavigate();
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | number | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'invoices' | 'partners' | 'collections'>('invoices');
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [partners, setPartners] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>({ total_outstanding: 0, overdue_amount: 0, total_collected: 0 });
    const [accountingSettings, setAccountingSettings] = useState<any>({ base_currency: 'USD', currency_symbol: '$' });
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [iData, sData, settings, pData] = await Promise.all([
                getInvoices({ search: searchQuery }),
                getARSummary(),
                getAccountingSettings(),
                getPartners()
            ]);
            setInvoices(iData);
            setSummary(sData);
            setPartners(pData);
            setAccountingSettings(settings);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [searchQuery]);

    const formatCurrency = (amount: any) => {
        const val = parseFloat(amount || 0);
        try {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: accountingSettings.base_currency || 'INR',
                maximumFractionDigits: 2
            }).format(val);
        } catch (e) {
            return `${accountingSettings.currency_symbol || '₹'} ${val.toLocaleString()}`;
        }
    };

    const collectionEfficiency = summary.total_outstanding + summary.total_collected > 0
        ? Math.round((summary.total_collected / (summary.total_outstanding + summary.total_collected)) * 100)
        : 0;

    return (
        <div className="p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <TrendingUp size={12} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Accounts Receivable</span>
                    </div>
                    <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight">Accounts Receivable</h1>
                    <p className="text-[var(--text-muted)] font-medium text-sm mt-1">Unified Institutional Billing & Collection Engine</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsPartnerModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all"
                    >
                        <UserPlus size={18} />
                        Add Customer
                    </button>
                    <button
                        onClick={() => setIsBatchModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all"
                    >
                        <Receipt size={18} />
                        Batch Invoicing
                    </button>
                    <button
                        onClick={() => navigate('/accounting/invoices/new')}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus size={18} />
                        Create Invoice
                    </button>
                </div>
            </div>

            {/* AR Summary Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="premium-card p-6 flex flex-col justify-between group cursor-pointer hover:border-primary/20 transition-all">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                                <Activity size={12} className="text-primary" /> Total Outstanding
                            </p>
                            <span className="px-2 py-1 bg-primary/5 text-primary rounded-lg text-[9px] font-bold">
                                Global Dues
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight">{formatCurrency(summary.total_outstanding)}</h3>
                    </div>
                    <div className="mt-6 pt-4 border-t border-[var(--card-border)]/50">
                        <p className="text-[10px] font-bold text-[var(--text-muted)]">Unpaid generic receivables</p>
                    </div>
                </div>

                <div className="premium-card p-6 border-l-4 border-l-rose-500 hover:shadow-rose-500/10 transition-all">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={12} /> Overdue
                            </p>
                            <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-wider border border-rose-100">
                                Urgent
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-rose-600 tracking-tight">{formatCurrency(summary.overdue_amount)}</h3>
                    </div>
                    <div className="mt-6 pt-4 border-t border-rose-50">
                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Requires follow-up</p>
                    </div>
                </div>

                <div className="premium-card p-6 flex flex-col justify-between group cursor-pointer hover:border-emerald-200 transition-all">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                <ShieldCheck size={12} /> Collected
                            </p>
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-bold">
                                Settled
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-emerald-600 tracking-tight">{formatCurrency(summary.total_collected)}</h3>
                    </div>
                    <div className="mt-6 pt-4 border-t border-emerald-50">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Lifetime AR volume</p>
                    </div>
                </div>

                <div className="premium-card p-6 bg-surface-dark text-white relative overflow-hidden border-none shadow-2xl shadow-theme/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <BarChart3 size={12} className="text-primary" /> Efficiency
                        </p>
                        <h3 className="text-3xl font-black text-white tracking-tight">{collectionEfficiency}%</h3>
                        <div className="w-full bg-white/10 h-2 rounded-full mt-6 overflow-hidden border border-white/5 shadow-inner">
                            <div
                                className="bg-primary h-full transition-all duration-1000 shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]"
                                style={{ width: `${collectionEfficiency}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Tabs */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-[var(--card-bg)] p-4 rounded-[2.5rem] border border-[var(--card-border)] shadow-sm">
                <div className="flex items-center gap-1 bg-slate-50/50 p-1.5 rounded-[2rem] border border-[var(--card-border)]/60 shadow-inner w-full lg:w-max overflow-x-auto">
                    {(['invoices', 'partners', 'collections'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all capitalize whitespace-nowrap ${
                                activeTab === tab 
                                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                : 'text-[var(--text-muted)] hover:text-slate-800'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Invoice #, Partner name..."
                        className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-transparent rounded-[2rem] outline-none focus:bg-[var(--card-bg)] focus:border-primary transition-all text-sm font-bold placeholder:text-[var(--text-muted)]/50"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content Area */}
            {activeTab === 'invoices' && (
                <div className="premium-card overflow-hidden border-none shadow-2xl shadow-slate-200/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-[var(--card-border)]/50">
                                    <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Invoice # & Date</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Partner / Customer</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Due Date</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right">Net Amount</th>
                                    <th className="px-8 py-6 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--card-border)]/10">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
                                            <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">Syncing Receivables Ledger...</p>
                                        </td>
                                    </tr>
                                ) : invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Receipt size={40} className="text-slate-200" />
                                            </div>
                                            <p className="text-[var(--text-main)] font-black text-lg">No generic receivables found</p>
                                            <p className="text-[var(--text-muted)] text-sm mt-1 mb-8">All customer dues are cleared or no invoices raised.</p>
                                        </td>
                                    </tr>
                                ) : invoices.map(invoice => (
                                    <tr 
                                        key={invoice.id} 
                                        className="hover:bg-primary/[0.02] transition-all group cursor-pointer border-b border-[var(--card-border)] last:border-0"
                                        onClick={() => navigate(`/accounting/invoices/${invoice.id}`)}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-[var(--text-main)] group-hover:text-primary transition-colors">{invoice.invoice_no}</span>
                                                    {invoice.source_type === 'fee_allocation' && (
                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase rounded tracking-tighter">School Fees</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col mt-1 gap-0.5">
                                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                    </span>
                                                    <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' ? 'text-rose-500' : 'text-[var(--text-muted)]'}`}>
                                                        <AlertCircle size={10} />
                                                        Due: {new Date(invoice.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs uppercase shadow-sm">
                                                    {invoice.partner_name?.substring(0, 2)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[var(--text-main)]">{invoice.partner_name}</span>
                                                    <span className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.1em] flex items-center gap-1 mt-0.5">
                                                        <Tag size={10} />
                                                        {invoice.source_type?.toUpperCase() || 'MANUAL'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-[var(--text-muted)] opacity-50" />
                                                <span className={`text-sm font-bold ${new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' ? 'text-rose-600' : 'text-[var(--text-muted)]'}`}>
                                                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 w-max border
                                                ${invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    invoice.status === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                                <div className={`w-2 h-2 rounded-full ${invoice.status === 'paid' ? 'bg-emerald-500' : invoice.status === 'partial' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-sm font-black text-[var(--text-main)] font-mono">{formatCurrency(invoice.net_amount)}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 transition-all">
                                                <button 
                                                    onClick={() => navigate(`/accounting/invoices/${invoice.id}`)}
                                                    className="p-2 text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                    title="View Details"
                                                >
                                                    <Activity size={18} />
                                                </button>
                                                {invoice.status !== 'paid' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedInvoiceId(invoice.id);
                                                            setIsPaymentModalOpen(true);
                                                        }}
                                                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                                                    >
                                                        <CreditCard size={14} />
                                                        Settle
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-2 text-[var(--text-muted)] hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                >
                                                    <Send size={18} />
                                                </button>
                                                <button 
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-2 text-[var(--text-muted)] hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'partners' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {partners.map(partner => (
                        <div key={partner.id} className="premium-card p-0 hover:border-primary/30 transition-all group overflow-hidden bg-[var(--card-bg)] rounded-[3rem] flex flex-col shadow-xl shadow-slate-200/50">
                            <div className="px-8 py-6 border-b border-[var(--card-border)]/50 flex justify-between items-start bg-slate-50/50">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-[var(--card-bg)] rounded-[1.5rem] flex items-center justify-center text-primary shadow-sm border border-[var(--card-border)] font-black text-2xl">
                                        {partner.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">{partner.name}</h3>
                                        <span className={`mt-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-max ${partner.type === 'student' ? 'bg-primary/5 text-primary border-primary/10' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            <Users size={10} /> {partner.type}
                                        </span>
                                    </div>
                                </div>
                                <button className="p-3 text-[var(--text-muted)] hover:text-primary rounded-2xl hover:bg-primary/5 transition-all shadow-sm border border-[var(--card-border)]/50">
                                    <MoreVertical size={18} />
                                </button>
                            </div>

                            <div className="p-8">
                                <div className="flex items-center gap-3 text-[var(--text-muted)] mb-8">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                        <Send size={14} className="opacity-50" />
                                    </div>
                                    <span className="text-sm font-bold truncate">{partner.email || 'No institutional email'}</span>
                                </div>

                                <div className="flex items-center justify-between border-t border-[var(--card-border)]/30 pt-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Due</span>
                                        <span className="text-2xl font-black text-[var(--text-main)] font-mono">{formatCurrency(0)}</span>
                                    </div>
                                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-50/50 text-[var(--text-muted)] rounded-2xl font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-primary/20 hover:text-primary transition-all">
                                        Statement <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <footer className="mt-8 pt-8 border-t border-[var(--card-border)]/50 text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">LuviaEdu Institutional Accounting Engine v3.0 • Unified AR</p>
            </footer>

            <FeeInvoiceBatchForm
                isOpen={isBatchModalOpen}
                onClose={() => setIsBatchModalOpen(false)}
                onSuccess={() => {
                    setIsBatchModalOpen(false);
                    fetchData();
                }}
            />

            <FeePaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                invoiceId={selectedInvoiceId}
                onSuccess={() => {
                    setIsPaymentModalOpen(false);
                    fetchData();
                }}
            />

            <PartnerModal
                isOpen={isPartnerModalOpen}
                onClose={() => setIsPartnerModalOpen(false)}
                onSuccess={() => {
                    setIsPartnerModalOpen(false);
                    fetchData();
                }}
            />

        </div>
    );
}

