import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    ArrowLeft, Save, Loader2, 
    Building2, Landmark, 
    Plus, Trash2, 
    Clock, 
    Sparkles, Zap
} from 'lucide-react';
import { getVendors, getBills, getBankAccounts, recordBillPayment, getAccountingSettings } from '../../api/accounting.api';
import SearchableSelect from '../../components/accounting/SearchableSelect';

export default function BillPaymentForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const preselectedVendorId = queryParams.get('vendorId');
    const preselectedBillId = queryParams.get('billId');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [bills, setBills] = useState<any[]>([]);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [currencySymbol, setCurrencySymbol] = useState('$');
    const [aiInsight, setAiInsight] = useState<any>(null);
    
    const [formData, setFormData] = useState({
        vendor_id: preselectedVendorId || '',
        bank_account_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        reference_no: '',
        notes: '',
        allocations: [] as any[]
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const getIntelligentBills = () => {
        if (!formData.vendor_id) return [];
        const now = new Date();
        return bills
            .filter(b => b.vendor_id.toString() === formData.vendor_id && b.status !== 'paid')
            .map(b => {
                const dueDate = new Date(b.due_date);
                const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                const balance = parseFloat(b.total_amount) - parseFloat(b.paid_amount || 0);
                return {
                    ...b,
                    diffDays,
                    isOverdue: diffDays < 0,
                    dueToday: diffDays === 0,
                    earlyDiscount: diffDays > 10,
                    balance
                };
            })
            .sort((a, b) => a.diffDays - b.diffDays);
    };

    useEffect(() => {
        if (formData.vendor_id && bills.length > 0) {
            const intelligentBills = getIntelligentBills();
            
            // Auto-allocate logic if not pre-allocated
            if (preselectedBillId && formData.allocations.length === 0) {
                const targetBill = intelligentBills.find(b => b.id.toString() === preselectedBillId);
                if (targetBill) {
                    setFormData(prev => ({
                        ...prev,
                        allocations: [{
                            bill_id: targetBill.id,
                            bill_no: targetBill.bill_no,
                            balance: targetBill.balance,
                            amount: targetBill.balance,
                            isOverdue: targetBill.isOverdue
                        }]
                    }));
                }
            } else if (formData.allocations.length === 0 && intelligentBills.length > 0) {
                // Auto-allocate overdue or nearest due bill
                const priorityBill = intelligentBills[0];
                setFormData(prev => ({
                    ...prev,
                    allocations: [{
                        bill_id: priorityBill.id,
                        bill_no: priorityBill.bill_no,
                        balance: priorityBill.balance,
                        amount: priorityBill.balance,
                        isOverdue: priorityBill.isOverdue
                    }]
                }));
            }

            // Generate AI Insight
            const totalOverdue = intelligentBills.filter(b => b.isOverdue).reduce((acc, b) => acc + b.balance, 0);
            if (totalOverdue > 0) {
                setAiInsight({
                    type: 'danger',
                    title: 'Urgent Payment Action Required',
                    message: `This vendor has ${currencySymbol}${totalOverdue.toLocaleString()} in overdue balances. High risk of service interruption.`
                });
            } else if (intelligentBills.some(b => b.earlyDiscount)) {
                setAiInsight({
                    type: 'success',
                    title: 'Early Payment Discount Available',
                    message: 'Paying the outstanding balances today yields a 2% early settlement discount per vendor terms.'
                });
            } else {
                setAiInsight({
                    type: 'info',
                    title: 'Cashflow Optimized',
                    message: 'All bills are currently within standard net terms. No urgent action required.'
                });
            }
        }
    }, [formData.vendor_id, bills]);

    const fetchInitialData = async () => {
        try {
            const [bData, bankData, settings] = await Promise.all([
                getBills(),
                getBankAccounts(),
                getAccountingSettings()
            ]);
            setBills(bData);
            setBankAccounts(bankData);
            setCurrencySymbol(settings.currency_symbol || '$');
            
            if (bankData.length > 0) {
                setFormData(prev => ({ ...prev, bank_account_id: bankData[0].id.toString() }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const totalPaymentAmount = formData.allocations.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (totalPaymentAmount <= 0) return;
        
        try {
            setSubmitting(true);
            await recordBillPayment({
                ...formData,
                total_amount: totalPaymentAmount,
                vendor_id: Number(formData.vendor_id),
                bank_account_id: Number(formData.bank_account_id)
            });
            navigate('/accounting/ap');
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const addBillToPayment = (bill: any) => {
        if (formData.allocations.find(a => a.bill_id === bill.id)) return;
        setFormData(prev => ({
            ...prev,
            allocations: [...prev.allocations, {
                bill_id: bill.id,
                bill_no: bill.bill_no,
                balance: bill.balance,
                amount: bill.balance,
                isOverdue: bill.isOverdue
            }]
        }));
    };

    const intelligentBills = getIntelligentBills();
    const availableBills = intelligentBills.filter(b => !formData.allocations.find(a => a.bill_id === b.id));

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[var(--card-bg)]/90 backdrop-blur-xl border-b border-[var(--card-border)]/50 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 bg-slate-50 border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-slate-100 rounded-xl flex items-center justify-center transition-all">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-black text-[var(--text-main)] tracking-tight flex items-center gap-2">
                                <Landmark className="text-primary" size={20} /> Vendor Payment Allocation
                            </h1>
                            <span className="px-2.5 py-1 bg-primary/5 text-primary border border-indigo-200/50 rounded-lg text-[9px] font-black uppercase tracking-widest">Smart Routing</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Accounts Payable • Institutional Ledger</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button onClick={handleSubmit} disabled={submitting || totalPaymentAmount <= 0} className="px-8 py-2.5 bg-surface-dark text-white rounded-xl font-bold text-sm hover:bg-black shadow-lg shadow-theme/20 transition-all flex items-center gap-2 disabled:opacity-50">
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Confirm & Process Payment
                    </button>
                </div>
            </div>

            <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Main Entry Workspace */}
                    <div className="xl:col-span-3 space-y-6">
                        {/* Payment Header */}
                        <div className="bg-[var(--card-bg)] p-8 rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm space-y-8 relative">
                            <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
                                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                    <Building2 size={200} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-20">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 mb-3"><Building2 size={12}/> Pay To Vendor</label>
                                    <SearchableSelect
                                        icon={Building2}
                                        placeholder="Search vendor..."
                                        value={formData.vendor_id}
                                        onSearch={getVendors}
                                        formatOption={(v) => ({ id: v.id, label: v.name, sublabel: v.code || 'NO CODE', original: v })}
                                        onSelect={(opt) => setFormData(p => ({ ...p, vendor_id: opt.id.toString(), allocations: [] }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 mb-3"><Landmark size={12}/> Fund Source</label>
                                    <SearchableSelect
                                        icon={Landmark}
                                        placeholder="Search bank account..."
                                        value={formData.bank_account_id}
                                        onSearch={async (query) => {
                                            if (!query) return bankAccounts;
                                            const lowerQuery = query.toLowerCase();
                                            return bankAccounts.filter(b => 
                                                b.bank_name?.toLowerCase().includes(lowerQuery) || 
                                                b.name?.toLowerCase().includes(lowerQuery) ||
                                                b.account_no?.includes(query)
                                            );
                                        }}
                                        formatOption={(b) => ({ id: b.id, label: `${b.bank_name} — ${b.name}`, sublabel: `***${b.account_no?.slice(-4)}`, original: b })}
                                        onSelect={(opt) => setFormData(p => ({ ...p, bank_account_id: opt.id.toString() }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* AI Insight Strip */}
                        {aiInsight && (
                            <div className={`p-5 rounded-2xl border flex items-start gap-4 shadow-sm
                                ${aiInsight.type === 'danger' ? 'bg-rose-50 border-rose-100 text-rose-800' : 
                                  aiInsight.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 
                                  'bg-primary/5 border-primary/20 text-indigo-800'}`}>
                                <div className={`p-2 rounded-xl shrink-0 ${aiInsight.type === 'danger' ? 'bg-rose-100 text-rose-600' : aiInsight.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black mb-1">{aiInsight.title}</h4>
                                    <p className="text-sm font-medium opacity-80">{aiInsight.message}</p>
                                </div>
                            </div>
                        )}

                        {/* Smart Allocation Table */}
                        <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-sm font-black text-[var(--text-main)] tracking-tight flex items-center gap-2">
                                    <Zap size={16} className="text-indigo-500" /> Payment Allocation Map
                                </h3>
                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{formData.allocations.length} Items Selected</span>
                            </div>
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[var(--card-bg)] border-b border-[var(--card-border)]">
                                        <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Bill #</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right">Balance</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right w-64">Amount to Pay</th>
                                        <th className="px-4 py-4 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 bg-slate-50/20">
                                    {formData.allocations.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-16 text-center text-[var(--text-muted)] font-medium">Select an outstanding bill below to allocate funds.</td>
                                        </tr>
                                    ) : formData.allocations.map((alloc, idx) => (
                                        <tr key={alloc.bill_id} className="group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-[var(--text-main)]">{alloc.bill_no}</span>
                                                    {alloc.isOverdue && <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-md text-[9px] font-black uppercase">Overdue</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-[var(--text-muted)] font-mono font-bold">{currencySymbol}{alloc.balance.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-black">{currencySymbol}</span>
                                                    <input 
                                                        type="number"
                                                        className="w-full bg-slate-50 border border-[var(--card-border)] group-hover:bg-[var(--card-bg)] rounded-xl pl-8 pr-4 py-3 text-sm font-black text-[var(--text-main)] text-right outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all"
                                                        value={alloc.amount}
                                                        onChange={e => {
                                                            const newAlloc = [...formData.allocations];
                                                            newAlloc[idx].amount = parseFloat(e.target.value) || 0;
                                                            setFormData({ ...formData, allocations: newAlloc });
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button onClick={() => setFormData({ ...formData, allocations: formData.allocations.filter((_, i) => i !== idx) })} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {/* Intelligent Auto-Suggestions */}
                            {availableBills.length > 0 && (
                                <div className="p-6 bg-slate-50/50 border-t border-[var(--card-border)]">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles size={12}/> Intelligent Bill Suggestions</p>
                                    <div className="flex flex-col gap-3">
                                        {availableBills.map(b => (
                                            <div key={b.id} onClick={() => addBillToPayment(b)} className="flex items-center justify-between p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[var(--text-muted)] group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                                        <Plus size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm text-[var(--text-main)]">{b.bill_no}</span>
                                                            {b.isOverdue && <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[9px] font-black uppercase tracking-wider">High Priority</span>}
                                                            {b.earlyDiscount && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-black uppercase tracking-wider">Eligible for Discount</span>}
                                                        </div>
                                                        <p className="text-xs text-[var(--text-muted)] mt-1">{b.isOverdue ? `Overdue by ${Math.abs(b.diffDays)} days` : b.dueToday ? 'Due today' : `Due in ${b.diffDays} days`}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-[var(--text-main)] font-mono">{currencySymbol}{b.balance.toLocaleString()}</p>
                                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Outstanding</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Smart Floating Sidebar */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="sticky top-28 space-y-6">
                            <div className="bg-surface-dark p-8 rounded-[2rem] shadow-2xl shadow-theme/20 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/50/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-6">Execution Summary</h4>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[var(--text-muted)] font-bold">Allocated Bills</span>
                                        <span className="font-black text-lg">{formData.allocations.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[var(--text-muted)] font-bold">Routing Method</span>
                                        <span className="font-black capitalize">{formData.payment_method.replace('_', ' ')}</span>
                                    </div>
                                    <div className="pt-6 mt-6 border-t border-slate-800/80">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Net Outflow</p>
                                        <div className="text-4xl font-black tracking-tight">{currencySymbol}{totalPaymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[var(--card-bg)] p-6 rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                                    <Clock size={12} /> Execution Settings
                                </h4>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Processing Date</label>
                                        <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-[var(--card-border)] rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-[var(--card-bg)] transition-all text-sm" value={formData.payment_date} onChange={e => setFormData({ ...formData, payment_date: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Bank Ref / UTR</label>
                                        <input className="w-full px-4 py-3 bg-slate-50 border border-[var(--card-border)] rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-[var(--card-bg)] transition-all text-sm" placeholder="e.g. UTR-99201" value={formData.reference_no} onChange={e => setFormData({ ...formData, reference_no: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Reconciliation Memo</label>
                                        <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 border border-[var(--card-border)] rounded-xl font-medium text-slate-700 outline-none focus:border-indigo-500 focus:bg-[var(--card-bg)] transition-all text-sm resize-none" placeholder="Internal notes..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
