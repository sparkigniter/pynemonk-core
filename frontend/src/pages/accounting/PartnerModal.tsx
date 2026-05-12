import { useState } from 'react';
import { X, Loader2, User, Mail, Phone, Tag } from 'lucide-react';
import { createPartner } from '../../api/accounting.api';

interface PartnerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PartnerModal({ isOpen, onClose, onSuccess }: PartnerModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        type: 'customer'
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await createPartner(formData);
            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Failed to create customer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--card-bg)] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-extrabold text-[var(--text-main)]">New Customer</h3>
                        <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Add a generic partner for AR transactions</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--card-bg)] rounded-xl transition-all text-[var(--text-muted)] hover:text-slate-600 shadow-sm border border-transparent hover:border-[var(--card-border)]">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Customer Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    required
                                    type="text"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-[var(--card-border)] rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-slate-700"
                                    placeholder="Enter full name..."
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="group">
                                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type="email"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-[var(--card-border)] rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-slate-700"
                                        placeholder="Email address"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type="tel"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-[var(--card-border)] rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-slate-700"
                                        placeholder="Phone number"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Partner Type</label>
                            <div className="relative">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" size={18} />
                                <select
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-[var(--card-border)] rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-slate-700 appearance-none"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="customer">Customer</option>
                                    <option value="student">Student (Manual Link)</option>
                                    <option value="other">Other</option>
                                </select>
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
                                    Saving...
                                </>
                            ) : (
                                'Create Customer'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
