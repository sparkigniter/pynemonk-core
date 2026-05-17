import { useState, useEffect } from 'react';
import { X, Loader2, DollarSign, User, ShieldCheck } from 'lucide-react';
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
            <div className="bg-[var(--card-bg)] rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--card-border)]/50">
                <div className="p-6 border-b border-[var(--card-border)]/50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">Create Invoice</h3>
                        <p className="text-[10px] text-[var(--text-muted)] font-black mt-1 uppercase tracking-widest">General Ledger Receivable</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600 flex items-center justify-center border border-transparent hover:border-slate-200">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer / Institutional Partner</label>
                            <div className="relative group">
                                <select
                                    required
                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all font-bold text-slate-800 text-base appearance-none cursor-pointer shadow-sm hover:border-slate-300"
                                    value={formData.partner_id}
                                    onChange={e => setFormData({ ...formData, partner_id: e.target.value })}
                                >
                                    <option value="">Select Target Entity...</option>
                                    {partners.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 transition-colors">
                                    <User size={18} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Invoice Identifier</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all font-bold text-slate-800 text-base shadow-sm hover:border-slate-300"
                                value={formData.invoice_no}
                                onChange={e => setFormData({ ...formData, invoice_no: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Receivable Amount</label>
                            <div className="relative group">
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all font-bold text-slate-800 text-base shadow-sm hover:border-slate-300"
                                    placeholder="0.00"
                                    value={formData.net_amount}
                                    onChange={e => setFormData({ ...formData, net_amount: e.target.value })}
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 transition-colors">
                                    <DollarSign size={16} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Posting Date</label>
                            <input
                                required
                                type="date"
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all font-bold text-slate-700 text-base shadow-sm hover:border-slate-300"
                                value={formData.invoice_date}
                                onChange={e => setFormData({ ...formData, invoice_date: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Settlement Deadline</label>
                            <input
                                required
                                type="date"
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all font-bold text-slate-700 text-base shadow-sm hover:border-slate-300"
                                value={formData.due_date}
                                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference Notes / Description</label>
                            <textarea
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all font-medium text-slate-700 min-h-[100px] shadow-sm resize-none hover:border-slate-300"
                                placeholder="Enter specific details for the general ledger..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                        >
                            Cancel Posting
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Processing Entry...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={16} />
                                    Post to Ledger
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
