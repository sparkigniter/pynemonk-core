import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Calendar, User,
    FileText, Clock,
    MoreHorizontal, Download, Printer,
    ChevronRight, AlertCircle, CheckCircle2,
    Building, Wallet, X, Lock
} from 'lucide-react';
import { getInvoice, getAccountingSettings, getSystemMappings, getPaymentConfig, createCheckoutSession } from '../../api/accounting.api';
import { getBaseURL } from '../../api/base.api';

export default function InvoiceDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [invoice, setInvoice] = useState<any>(null);
    const [settings, setSettings] = useState<any>({ base_currency: 'USD', currency_symbol: '$' });
    const [mappings, setMappings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Payment Drawer State Variables
    const [isPayDrawerOpen, setIsPayDrawerOpen] = useState(false);
    const [payAmount, setPayAmount] = useState('');
    const [paymentConfig, setPaymentConfig] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    // Dummy inputs for card simulation
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');
    const [activeMethod, setActiveMethod] = useState<'card' | 'upi'>('card');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const [invData, settingsData, mappingsData] = await Promise.all([
                    getInvoice(id!),
                    getAccountingSettings(),
                    getSystemMappings()
                ]);
                setInvoice(invData);
                setSettings(settingsData);
                setMappings(mappingsData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    useEffect(() => {
        if (invoice) {
            const outstanding = parseFloat(invoice.net_amount) - parseFloat(invoice.paid_amount || 0);
            setPayAmount(outstanding.toString());
        }
    }, [invoice]);

    const fetchPaymentConfig = async () => {
        try {
            const config = await getPaymentConfig();
            setPaymentConfig(config);
        } catch (err: any) {
            console.error("Failed to load payment configuration:", err);
        }
    };

    useEffect(() => {
        fetchPaymentConfig();
    }, []);

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setPaymentError(null);
        try {
            const session = await createCheckoutSession({
                invoiceId: Number(invoice.id),
                amount: Number(payAmount)
            });

            if (session.success) {
                if (session.checkoutUrl) {
                    setTimeout(() => {
                        window.location.href = session.checkoutUrl;
                    }, 1500);
                } else if (session.gateway === 'razorpay') {
                    setTimeout(async () => {
                        try {
                            const tenantId = invoice.tenant_id;
                            const res = await fetch(`${getBaseURL()}/accounting/payments/webhook?tenant_id=${tenantId}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    gateway: 'razorpay',
                                    reference: session.orderId || `mock_order_${invoice.id}`,
                                    status: 'success'
                                })
                            });
                            if (res.ok) {
                                window.location.href = `/payment/success?reference=${session.orderId || `mock_order_${invoice.id}`}&amount=${payAmount}`;
                            } else {
                                throw new Error("Failed to post mock payment success callback.");
                            }
                        } catch (webhookErr: any) {
                            setPaymentError(webhookErr.message);
                            setIsProcessing(false);
                        }
                    }, 2000);
                } else {
                    setTimeout(() => {
                        window.location.href = `/payment/success?reference=${session.sessionId}&amount=${payAmount}`;
                    }, 1500);
                }
            } else {
                throw new Error("Could not initialize payment session.");
            }
        } catch (err: any) {
            setPaymentError(err.message || "An unexpected error occurred.");
            setIsProcessing(false);
        }
    };

    const arMapping = mappings.find(m => m.mapping_key === 'FEE_RECEIVABLE' || m.mapping_key === 'ASSET_RECEIVABLE');
    const revenueMapping = mappings.find(m => m.mapping_key === 'TUITION_REVENUE' || m.mapping_key === 'REV_TUITION');

    const formatCurrency = (amount: any) => {
        const val = parseFloat(amount || 0);
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: settings.base_currency || 'INR',
            maximumFractionDigits: 2
        }).format(val);
    };

    if (loading) {
        return (
            <div className="h-[70vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="p-8 text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-rose-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Invoice Not Found</h2>
                <p className="text-slate-500 mt-2 mb-8">The transaction you are looking for might have been moved or voided.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const isOverdue = invoice.status !== 'paid' && invoice.due_date && new Date(invoice.due_date) < new Date();

    return (
        <div className="p-8 space-y-8 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                            <span>Accounting</span>
                            <ChevronRight size={10} />
                            <span>Receivables</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            {invoice.invoice_no}
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border
                                ${invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    isOverdue ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                {invoice.status} {isOverdue && '— Overdue'}
                            </span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => window.print()}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all shadow-sm" title="Print Invoice"
                    >
                        <Printer size={18} />
                    </button>
                    <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all shadow-sm" title="Download PDF">
                        <Download size={18} />
                    </button>
                    <button 
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: `Invoice ${invoice.invoice_no}`,
                                    text: `Check out the invoice for ${invoice.student_name || invoice.partner_name}`,
                                    url: window.location.href
                                });
                            }
                        }}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all shadow-sm" title="Share">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Invoice Header Details */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner / Student</p>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                    <User size={14} className="text-primary" />
                                    {invoice.student_name || invoice.partner_name}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Date</p>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                    <Calendar size={14} className="text-primary" />
                                    {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</p>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                    <Clock size={14} className={isOverdue ? "text-rose-500" : "text-primary"} />
                                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source</p>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                    <FileText size={14} className="text-primary" />
                                    <span className="uppercase">{invoice.source_type?.replace('_', ' ') || 'Manual'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Receivable</p>
                                <h2 className="text-5xl font-black tracking-tighter">{formatCurrency(invoice.net_amount)}</h2>
                            </div>
                            <div className="h-16 w-px bg-white/10 hidden md:block" />
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Amount Paid</p>
                                <h2 className="text-3xl font-black text-emerald-400 tracking-tight">{formatCurrency(invoice.paid_amount || 0)}</h2>
                            </div>
                            <div className="h-16 w-px bg-white/10 hidden md:block" />
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Outstanding</p>
                                <h2 className={`text-3xl font-black tracking-tight ${isOverdue ? 'text-rose-400' : 'text-white'}`}>
                                    {formatCurrency(parseFloat(invoice.net_amount) - parseFloat(invoice.paid_amount || 0))}
                                </h2>
                            </div>
                        </div>
                        {/* Abstract Design Elements */}
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary opacity-10 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-500 opacity-5 rounded-full blur-2xl" />
                    </div>

                    {/* Line Items Table */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-slate-50">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Billable Items</h3>
                        </div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="px-8 py-4">Description</th>
                                    <th className="px-8 py-4 text-center">Qty</th>
                                    <th className="px-8 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {invoice.items?.map((item: any, idx: number) => (
                                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold text-slate-700">{item.description}</p>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <p className="text-sm font-medium text-slate-500">{item.quantity}</p>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <p className="text-sm font-black text-slate-800">{formatCurrency(item.amount)}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Transaction Audit */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Payment History</h3>
                        <div className="space-y-4">
                            {invoice.paid_amount > 0 ? (
                                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Fee Payment Received</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">{new Date(invoice.updated_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-emerald-600">+{formatCurrency(invoice.paid_amount)}</p>
                                </div>
                            ) : (
                                <div className="py-12 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                                    <p className="text-sm font-bold text-slate-400">No payments recorded yet for this invoice.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    {invoice.status !== 'paid' && (
                        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Pay Online</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Seamless Online Settlement</p>
                            </div>
                            <button
                                onClick={() => setIsPayDrawerOpen(true)}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95"
                            >
                                <Wallet size={16} />
                                Pay Outstanding Fees
                            </button>
                        </div>
                    )}
                    {/* Status Insights */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Settlement Progress</h3>
                        <div className="space-y-6">
                            <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="absolute h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-1000"
                                    style={{ width: `${(parseFloat(invoice.paid_amount || 0) / parseFloat(invoice.net_amount)) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                                <span className="text-slate-400">Collection Rate</span>
                                <span className="text-primary">
                                    {Math.round((parseFloat(invoice.paid_amount || 0) / parseFloat(invoice.net_amount)) * 100)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Accounting Mapping */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Ledger Mappings</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                    <Building size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Accounts Receivable</p>
                                    <p className="text-xs font-bold text-slate-700">
                                        {arMapping ? `${arMapping.account_code} - ${arMapping.account_name}` : <span className="text-rose-400 italic">Not Configured</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                    <Wallet size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Revenue Account</p>
                                    <p className="text-xs font-bold text-slate-700">
                                        {revenueMapping ? `${revenueMapping.account_code} - ${revenueMapping.account_name}` : <span className="text-rose-400 italic">Not Configured</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Slide-out Parent Checkout Drawer */}
            {isPayDrawerOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-all duration-300 animate-in fade-in"
                        onClick={() => !isProcessing && setIsPayDrawerOpen(false)}
                    />
                    
                    {/* Drawer Panel */}
                    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-slate-100 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <Wallet size={16} className="text-primary" />
                                    Online Fee Checkout
                                </h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
                                    Invoice {invoice.invoice_no}
                                </p>
                            </div>
                            <button 
                                onClick={() => !isProcessing && setIsPayDrawerOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
                                disabled={isProcessing}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Summary */}
                            <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-4 shadow-xl">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Student / Payee</p>
                                    <p className="text-sm font-bold text-white mt-0.5">{invoice.student_name || invoice.partner_name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Payable</p>
                                        <p className="text-md font-black text-white">{formatCurrency(invoice.net_amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Outstanding</p>
                                        <p className="text-md font-black text-amber-400">
                                            {formatCurrency(parseFloat(invoice.net_amount) - parseFloat(invoice.paid_amount || 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handlePay} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                                            {settings.currency_symbol || '$'}
                                        </span>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            className="w-full pl-10 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm text-slate-800 focus:bg-white focus:border-slate-200 transition-all outline-none"
                                            value={payAmount}
                                            onChange={e => setPayAmount(e.target.value)}
                                            max={parseFloat(invoice.net_amount) - parseFloat(invoice.paid_amount || 0)}
                                            required
                                            disabled={isProcessing}
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 ml-1">Enter amount equal to or less than outstanding balance.</p>
                                </div>

                                {/* Active Gateway UI */}
                                <div className="space-y-4 pt-6 border-t border-slate-50">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Method</span>
                                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-[9px] font-black uppercase text-indigo-600 tracking-widest">
                                            {paymentConfig?.payment_gateway || 'MOCK_DEMO'}
                                        </span>
                                    </div>

                                    {paymentConfig?.payment_gateway === 'STRIPE' && (
                                        <div className="space-y-4 p-5 bg-slate-50 rounded-3xl border border-slate-100/80">
                                            <div className="flex gap-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setActiveMethod('card')} 
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeMethod === 'card' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    Credit/Debit Card
                                                </button>
                                            </div>

                                            {activeMethod === 'card' && (
                                                <div className="space-y-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Card Number</label>
                                                        <input 
                                                            type="text" 
                                                            className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs outline-none"
                                                            placeholder="4242 4242 4242 4242"
                                                            value={cardNumber}
                                                            onChange={e => setCardNumber(e.target.value)}
                                                            disabled={isProcessing}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Expiry</label>
                                                            <input 
                                                                type="text" 
                                                                className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs outline-none text-center"
                                                                placeholder="MM / YY"
                                                                value={cardExpiry}
                                                                onChange={e => setCardExpiry(e.target.value)}
                                                                disabled={isProcessing}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CVC</label>
                                                            <input 
                                                                type="text" 
                                                                className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs outline-none text-center"
                                                                placeholder="123"
                                                                value={cardCvc}
                                                                onChange={e => setCardCvc(e.target.value)}
                                                                disabled={isProcessing}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {paymentConfig?.payment_gateway === 'RAZORPAY' && (
                                        <div className="space-y-4 p-5 bg-slate-50 rounded-3xl border border-slate-100/80">
                                            <div className="flex gap-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setActiveMethod('upi')} 
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeMethod === 'upi' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    UPI / Netbanking
                                                </button>
                                            </div>

                                            {activeMethod === 'upi' && (
                                                <div className="space-y-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Virtual Payment Address (VPA)</label>
                                                        <input 
                                                            type="text" 
                                                            className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs outline-none"
                                                            placeholder="student@okaxis"
                                                            disabled={isProcessing}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {paymentConfig?.payment_gateway === 'MOCK_DEMO' && (
                                        <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-3xl text-center space-y-3">
                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Simulated Sandbox Environment</p>
                                            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                                                This mock gateway lets you fully test online payments, receipt auto-generation, and journal entries without connecting a merchant gateway.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {paymentError && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
                                        <AlertCircle size={16} className="shrink-0" />
                                        <p className="text-[10px] font-bold uppercase tracking-wider">{paymentError}</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="space-y-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isProcessing || Number(payAmount) <= 0}
                                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Establishing Secure Session...
                                            </>
                                        ) : (
                                            <>
                                                <Lock size={14} />
                                                Authorize & Pay Online
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
