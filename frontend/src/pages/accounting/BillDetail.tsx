import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ArrowLeft, Calendar, Building2, 
    FileText, CreditCard, Clock, 
    MoreHorizontal, Download, Printer,
    ChevronRight, AlertCircle
} from 'lucide-react';
import { getBills } from '../../api/accounting.api';

export default function BillDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [bill, setBill] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBill = async () => {
            try {
                const bills = await getBills();
                const found = bills.find(b => b.id.toString() === id);
                setBill(found);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBill();
    }, [id]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    if (loading) {
        return (
            <div className="h-[70vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--card-border)] border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!bill) {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-[var(--text-main)]">Bill Not Found</h2>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary font-bold">Go Back</button>
            </div>
        );
    }

    const isOverdue = bill.status !== 'paid' && bill.due_date && new Date(bill.due_date) < new Date();

    return (
        <div className="p-8 space-y-8 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Navigation */}
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
                            <span>Accounts Payable</span>
                            <ChevronRight size={10} />
                            <span>Bill History</span>
                        </div>
                        <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight flex items-center gap-3">
                            Bill {bill.bill_no}
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest
                                ${bill.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                                  isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                {bill.status} {isOverdue && '— Overdue'}
                            </span>
                        </h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <Printer size={18} />
                    </button>
                    <button className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={18} />
                    </button>
                    {bill.status !== 'paid' && (
                        <button 
                            onClick={() => navigate(`/accounting/ap/pay-bill?vendorId=${bill.vendor_id}&billId=${bill.id}`)}
                            className="flex items-center gap-2 px-8 py-2.5 bg-surface-dark text-white rounded-xl font-bold text-sm shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <CreditCard size={18} />
                            Record Payment
                        </button>
                    )}
                    <button className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Bill Header Details */}
                    <div className="premium-card p-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Bill Date</p>
                                <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-main)]">
                                    <Calendar size={14} className="text-primary" />
                                    {new Date(bill.bill_date).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Due Date</p>
                                <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-main)]">
                                    <Clock size={14} className={isOverdue ? "text-rose-500" : "text-primary"} />
                                    {bill.due_date ? new Date(bill.due_date).toLocaleDateString() : '-'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Vendor</p>
                                <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-main)]">
                                    <Building2 size={14} className="text-primary" />
                                    {bill.vendor_name}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Reference</p>
                                <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-main)]">
                                    <FileText size={14} className="text-primary" />
                                    {bill.bill_no}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="premium-card p-8 bg-surface-dark text-white relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div>
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Bill Amount</p>
                                <h2 className="text-4xl font-black">{formatCurrency(parseFloat(bill.total_amount))}</h2>
                            </div>
                            <div className="h-12 w-px bg-[var(--card-bg)]/10 hidden md:block" />
                            <div>
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Paid</p>
                                <h2 className="text-2xl font-black text-emerald-400">{formatCurrency(parseFloat(bill.paid_amount || 0))}</h2>
                            </div>
                            <div className="h-12 w-px bg-[var(--card-bg)]/10 hidden md:block" />
                            <div>
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Balance Due</p>
                                <h2 className={`text-2xl font-black ${isOverdue ? 'text-rose-400' : 'text-white'}`}>
                                    {formatCurrency(parseFloat(bill.total_amount) - parseFloat(bill.paid_amount || 0))}
                                </h2>
                            </div>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary opacity-20 rounded-full blur-3xl" />
                    </div>

                    {/* Notes & Audit */}
                    <div className="premium-card p-8">
                        <h3 className="text-sm font-bold text-[var(--text-main)] mb-4">Memo / Notes</h3>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium">
                            {bill.notes || 'No internal notes provided for this bill.'}
                        </p>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    {/* Status Insights */}
                    <div className="premium-card p-8">
                        <h3 className="text-sm font-bold text-[var(--text-main)] mb-6">Payment Progress</h3>
                        <div className="space-y-6">
                            <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="absolute h-full bg-primary transition-all duration-1000" 
                                    style={{ width: `${(parseFloat(bill.paid_amount || 0) / parseFloat(bill.total_amount)) * 100}%` }} 
                                />
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-[var(--text-muted)] uppercase tracking-widest">Completed</span>
                                <span className="text-[var(--text-main)]">
                                    {Math.round((parseFloat(bill.paid_amount || 0) / parseFloat(bill.total_amount)) * 100)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Audit Log */}
                    <div className="premium-card p-8 space-y-6 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-[var(--text-main)] mb-2">Audit Timeline</h3>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <div className="w-0.5 h-full bg-slate-200 mt-2" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[var(--text-main)]">Bill Created</p>
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">{new Date(bill.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                            {bill.status === 'paid' && (
                                <div className="flex gap-4">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <div>
                                        <p className="text-xs font-bold text-[var(--text-main)]">Fully Reconciled</p>
                                        <p className="text-[10px] text-[var(--text-muted)] mt-1">{new Date(bill.updated_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
