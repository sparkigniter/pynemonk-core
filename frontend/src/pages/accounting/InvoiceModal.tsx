import { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Hash, DollarSign, FileText, User } from 'lucide-react';
import { createInvoice, getPartners } from '../../api/accounting.api';

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function InvoiceModal({ isOpen, onClose, onSuccess }: InvoiceModalProps) {
    const [loading, setLoading] = useState(false);
    const [partners, setPartners] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        partner_id: '',
        invoice_no: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        net_amount: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            getPartners().then(setPartners).catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await createInvoice({
                ...formData,
                partner_id: parseInt(formData.partner_id),
                total_amount: parseFloat(formData.net_amount),
                net_amount: parseFloat(formData.net_amount)
            });
            onSuccess();
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to create invoice');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--card-bg)] rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-extrabold text-[var(--text-main)]">Create Invoice</h3>
                        <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Generate a generic receivable invoice</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--card-bg)] rounded-xl transition-all text-[var(--text-muted)] hover:text-slate-600 shadow-sm border border-transparent hover:border-[var(--card-border)]">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Select Customer</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                                <select
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-[var(--card-border)] rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-slate-700 appearance-none"
                                    value={formData.partner_id}
                                    onChange={e => setFormData({ ...formData, partner_id: e.target.value })}
                                >
                                    <option value="">Select a customer...</option>
                                    {partners.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Invoice #</label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                                <input
                                    required
                                    type="text"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-[var(--card-border)] rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-primary transition-all font-bold text-slate-700"
                                    value={formData.invoice_no}
                                    onChange={e => setFormData({ ...formData, invoice_no: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Amount</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-[var(--card-border)] rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-primary transition-all font-bold text-slate-700"
                                    placeholder="0.00"
                                    value={formData.net_amount}
                                    onChange={e => setFormData({ ...formData, net_amount: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Invoice Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                                <input
                                    required
                                    type="date"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-[var(--card-border)] rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-primary transition-all font-bold text-slate-700"
                                    value={formData.invoice_date}
                                    onChange={e => setFormData({ ...formData, invoice_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Due Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                                <input
                                    required
                                    type="date"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-[var(--card-border)] rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-primary transition-all font-bold text-slate-700"
                                    value={formData.due_date}
                                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="col-span-2 group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Notes / Description</label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-4 text-[var(--text-muted)]" size={18} />
                                <textarea
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-[var(--card-border)] rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-primary transition-all font-bold text-slate-700 min-h-[100px]"
                                    placeholder="Enter invoice details..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Invoice'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
