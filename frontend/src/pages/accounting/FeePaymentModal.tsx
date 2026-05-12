import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle, CreditCard, Building, Wallet } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { getInvoice, recordFeePayment, getBankAccounts } from '../../api/accounting.api';

interface FeePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    invoiceId: number | null;
}

export default function FeePaymentModal({ isOpen, onClose, onSuccess, invoiceId }: FeePaymentModalProps) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [invoice, setInvoice] = useState<any>(null);
    const [banks, setBanks] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    const [formData, setFormData] = useState({
        amount: 0,
        payment_method: 'cash',
        bank_account_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    useEffect(() => {
        if (isOpen && invoiceId) {
            fetchInitialData();
        }
    }, [isOpen, invoiceId]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [invoiceData, bankData] = await Promise.all([
                getInvoice(invoiceId!),
                getBankAccounts()
            ]);
            setInvoice(invoiceData);
            setBanks(bankData);
            setFormData(prev => ({
                ...prev,
                amount: parseFloat(invoiceData.due_amount)
            }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoiceId) return;

        try {
            setSubmitting(true);
            setError(null);
            
            await recordFeePayment({
                ...formData,
                invoice_id: invoiceId,
                tenant_id: invoice.tenant_id,
                student_id: invoice.student_id
            });
            
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const methods = [
        { id: 'cash', name: 'Cash', icon: Wallet },
        { id: 'bank', name: 'Bank Transfer', icon: Building },
        { id: 'online', name: 'Online/Card', icon: CreditCard },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Record Fee Payment" size="md">
            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : invoice ? (
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Invoice Summary */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-[var(--card-border)] flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Invoice</p>
                            <p className="text-sm font-extrabold text-[var(--text-main)]">{invoice.invoice_no}</p>
                            <p className="text-xs text-[var(--text-muted)] font-medium">{invoice.student_name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Due Balance</p>
                            <p className="text-xl font-black text-primary">${parseFloat(invoice.due_amount).toLocaleString()}</p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm border border-rose-100 flex items-center gap-3">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Payment Amount</label>
                            <input 
                                type="number"
                                required
                                max={invoice.due_amount}
                                step="0.01"
                                value={formData.amount}
                                onChange={e => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                                className="w-full px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm outline-none focus:border-primary"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Payment Date</label>
                            <input 
                                type="date"
                                required
                                value={formData.payment_date}
                                onChange={e => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Payment Method</label>
                        <div className="grid grid-cols-3 gap-3">
                            {methods.map(m => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, payment_method: m.id }))}
                                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${
                                        formData.payment_method === m.id 
                                        ? 'bg-primary/5 border-primary text-primary shadow-sm' 
                                        : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--card-border)]'
                                    }`}
                                >
                                    <m.icon size={20} />
                                    <span className="text-[10px] font-bold">{m.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {formData.payment_method === 'bank' && (
                        <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Deposit Account</label>
                            <select
                                required
                                value={formData.bank_account_id}
                                onChange={e => setFormData(prev => ({ ...prev, bank_account_id: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-[var(--card-border)] rounded-xl text-sm outline-none focus:border-primary font-medium"
                            >
                                <option value="">Select bank account...</option>
                                {banks.map(b => (
                                    <option key={b.id} value={b.id}>{b.account_name} ({b.account_number})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Notes / Reference</label>
                        <textarea 
                            value={formData.notes}
                            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm outline-none focus:border-primary resize-none h-20"
                            placeholder="Cheque number, transaction ID..."
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-[var(--text-muted)] hover:bg-slate-100 rounded-xl">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={submitting || formData.amount <= 0}
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                            Confirm Payment
                        </button>
                    </div>
                </form>
            ) : null}
        </Modal>
    );
}
