import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    MoreVertical, Loader2,
    Search, Clock, Receipt,
    Download, Send, CreditCard, UserPlus, Users, Tag
} from 'lucide-react';
import { getInvoices, getAccountingSettings, getARSummary, getPartners } from '../../api/accounting.api';
import FeeInvoiceBatchForm from './FeeInvoiceBatchForm';
import FeePaymentModal from './FeePaymentModal';
import PartnerModal from './PartnerModal';

export default function AccountsReceivable() {
    const navigate = useNavigate();
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'invoices' | 'partners' | 'collections'>('invoices');
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [partners, setPartners] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>({ total_outstanding: 0, overdue_amount: 0, total_collected: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [currencySymbol, setCurrencySymbol] = useState('$');

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
            setCurrencySymbol(settings.currency_symbol || '$');
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
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencySymbol === '$' ? 'USD' : 'AED',
            currencyDisplay: 'narrowSymbol'
        }).format(val).replace('USD', currencySymbol).replace('AED', currencySymbol);
    };

    const collectionEfficiency = summary.total_outstanding + summary.total_collected > 0
        ? Math.round((summary.total_collected / (summary.total_outstanding + summary.total_collected)) * 100)
        : 0;

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">Accounts Receivable</h1>
                    <p className="text-[var(--text-muted)] font-medium mt-1">Unified Customer Billing & Collection Engine</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsPartnerModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] text-slate-600 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all"
                    >
                        <UserPlus size={18} />
                        Add Customer
                    </button>
                    <button
                        onClick={() => setIsBatchModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] text-slate-600 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all"
                    >
                        <Receipt size={18} />
                        Batch Invoicing
                    </button>
                    <button
                        onClick={() => navigate('/accounting/invoices/new')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus size={18} />
                        Create Invoice
                    </button>
                </div>
            </div>

            {/* AR Summary Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="premium-card p-6 bg-[var(--card-bg)] border-l-4 border-l-indigo-500">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Outstanding</p>
                    <h3 className="text-2xl font-extrabold text-[var(--text-main)]">{formatCurrency(summary.total_outstanding)}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-2">All unpaid generic receivables</p>
                </div>
                <div className="premium-card p-6 bg-[var(--card-bg)] border-l-4 border-l-rose-500">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Overdue Amount</p>
                    <h3 className="text-2xl font-extrabold text-rose-600">{formatCurrency(summary.overdue_amount)}</h3>
                    <p className="text-xs text-rose-600 font-bold mt-2">Requires immediate follow-up</p>
                </div>
                <div className="premium-card p-6 bg-[var(--card-bg)] border-l-4 border-l-emerald-500">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Collected</p>
                    <h3 className="text-2xl font-extrabold text-emerald-600">{formatCurrency(summary.total_collected)}</h3>
                    <p className="text-xs text-emerald-600 font-bold mt-2">Lifetime AR collection</p>
                </div>
                <div className="premium-card p-6 bg-surface-dark text-white">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Collection Efficiency</p>
                    <h3 className="text-2xl font-extrabold text-white">{collectionEfficiency}%</h3>
                    <div className="w-full bg-slate-700 h-1 rounded-full mt-3 overflow-hidden">
                        <div
                            className="bg-primary h-full transition-all duration-1000"
                            style={{ width: `${collectionEfficiency}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Search & Tabs */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-1 bg-[var(--card-bg)] p-1.5 rounded-2xl border border-[var(--card-border)]/60 shadow-sm w-full lg:w-max overflow-x-auto">
                    {(['invoices', 'partners', 'collections'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize whitespace-nowrap ${activeTab === tab
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-[var(--text-muted)] hover:text-slate-800 hover:bg-slate-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Invoice #, Partner name..."
                        className="w-full pl-12 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content Area */}
            {activeTab === 'invoices' && (
                <div className="premium-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-[var(--card-border)]">
                                    <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Invoice # & Date</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Partner / Customer</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Due Date</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Net Amount</th>
                                    <th className="px-8 py-5 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
                                            <p className="text-[var(--text-muted)] text-sm font-medium">Fetching ledger...</p>
                                        </td>
                                    </tr>
                                ) : invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Receipt size={40} className="text-slate-200" />
                                            </div>
                                            <p className="text-[var(--text-main)] font-bold text-lg">No generic receivables found</p>
                                            <p className="text-[var(--text-muted)] text-sm mt-1 mb-8">All customer dues are cleared or no invoices raised.</p>
                                        </td>
                                    </tr>
                                ) : invoices.map(invoice => (
                                    <tr key={invoice.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-extrabold text-[var(--text-main)]">{invoice.invoice_no}</span>
                                                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase mt-1">
                                                    {new Date(invoice.invoice_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-bold text-xs uppercase">
                                                    {invoice.partner_name?.substring(0, 2)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{invoice.partner_name}</span>
                                                    <span className="text-[10px] text-[var(--text-muted)] font-bold flex items-center gap-1">
                                                        <Tag size={10} />
                                                        {invoice.source_type?.toUpperCase() || 'MANUAL'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-slate-300" />
                                                <span className={`text-sm font-medium ${new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                                                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max
                                                ${invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                    invoice.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-rose-100 text-rose-700'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${invoice.status === 'paid' ? 'bg-emerald-500' : invoice.status === 'partial' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-sm font-extrabold text-[var(--text-main)]">{formatCurrency(invoice.net_amount)}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {invoice.status !== 'paid' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedInvoiceId(invoice.id);
                                                            setIsPaymentModalOpen(true);
                                                        }}
                                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1"
                                                    >
                                                        <CreditCard size={12} />
                                                        Pay Now
                                                    </button>
                                                )}
                                                <button className="p-2 text-[var(--text-muted)] hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="Email Invoice">
                                                    <Send size={16} />
                                                </button>
                                                <button className="p-2 text-[var(--text-muted)] hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="Download PDF">
                                                    <Download size={16} />
                                                </button>
                                                <button className="p-2 text-[var(--text-muted)] hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                                                    <MoreVertical size={16} />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {partners.map(partner => (
                        <div key={partner.id} className="premium-card p-6 bg-[var(--card-bg)] hover:border-primary/30 transition-all group">
                            <div className="flex items-start justify-between">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[var(--text-muted)] group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                    <Users size={24} />
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${partner.type === 'student' ? 'bg-primary/5 text-primary' : 'bg-amber-50 text-amber-600'}`}>
                                    {partner.type}
                                </span>
                            </div>
                            <div className="mt-4">
                                <h4 className="text-lg font-extrabold text-[var(--text-main)]">{partner.name}</h4>
                                <p className="text-xs text-[var(--text-muted)] font-medium">{partner.email || 'No email'}</p>
                            </div>
                            <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Outstanding</span>
                                    <span className="text-sm font-black text-[var(--text-main)]">{formatCurrency(0)}</span>
                                </div>
                                <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-surface-dark hover:text-white transition-all">
                                    View Ledger
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <footer className="mt-8 pt-8 border-t border-[var(--card-border)] text-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Pynemonk Accounting Engine v3.0 • Unified AR Management</p>
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
