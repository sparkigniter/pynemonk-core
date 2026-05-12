import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { getCOA, getAccountTypes, createAccount, type Account } from '../../api/accounting.api';
import Modal from '../../components/ui/Modal';

interface AccountFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AccountForm({ isOpen, onClose, onSuccess }: AccountFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [accountTypes, setAccountTypes] = useState<any[]>([]);
    const [parentAccounts, setParentAccounts] = useState<Account[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        account_type_id: '',
        parent_id: '',
        is_group: false
    });

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        try {
            const [types, coa] = await Promise.all([
                getAccountTypes(),
                getCOA()
            ]);
            setAccountTypes(types);
            setParentAccounts(coa.filter(a => a.is_group));
        } catch (err: any) {
            setError('Failed to load initial data');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            setError(null);
            await createAccount({
                ...formData,
                account_type_id: Number(formData.account_type_id),
                parent_id: formData.parent_id ? Number(formData.parent_id) : null
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Account" size="md">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-sm">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Account Code</label>
                        <input 
                            type="text" 
                            required
                            placeholder="e.g. 1110"
                            value={formData.code}
                            onChange={e => setFormData(p => ({ ...p, code: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-[var(--card-border)] rounded-xl text-sm outline-none focus:border-primary"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Account Name</label>
                        <input 
                            type="text" 
                            required
                            placeholder="e.g. Cash in Hand"
                            value={formData.name}
                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-[var(--card-border)] rounded-xl text-sm outline-none focus:border-primary"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Account Type</label>
                    <select 
                        required
                        value={formData.account_type_id}
                        onChange={e => setFormData(p => ({ ...p, account_type_id: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-[var(--card-border)] rounded-xl text-sm outline-none focus:border-primary"
                    >
                        <option value="">Select Type...</option>
                        {accountTypes.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.normal_balance})</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Parent Account (Optional)</label>
                    <select 
                        value={formData.parent_id}
                        onChange={e => setFormData(p => ({ ...p, parent_id: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-[var(--card-border)] rounded-xl text-sm outline-none focus:border-primary"
                    >
                        <option value="">No Parent (Root)</option>
                        {parentAccounts.map(a => (
                            <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 py-2">
                    <input 
                        type="checkbox" 
                        id="is_group"
                        checked={formData.is_group}
                        onChange={e => setFormData(p => ({ ...p, is_group: e.target.checked }))}
                        className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="is_group" className="text-sm font-medium text-slate-700">This is a group account (can have children)</label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-[var(--card-border)]">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-[var(--text-muted)] hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                    >
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
