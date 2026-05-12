import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, PlayCircle, Info } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { batchGenerateInvoices, getInstallments } from '../../api/accounting.api';

interface FeeInvoiceBatchFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function FeeInvoiceBatchForm({ isOpen, onClose, onSuccess }: FeeInvoiceBatchFormProps) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [installments, setInstallments] = useState<any[]>([]);
    const [selectedInstallment, setSelectedInstallment] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            fetchInstallments();
        }
    }, [isOpen]);

    const fetchInstallments = async () => {
        try {
            setFetching(true);
            const data = await getInstallments();
            setInstallments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            const res = await batchGenerateInvoices(Number(selectedInstallment));
            setResult(res);
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Batch Generate Invoices" size="md">
            {!result ? (
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-amber-800 text-sm">
                        <Info className="flex-shrink-0" size={18} />
                        <p>This action will generate invoices for all active students assigned to the selected fee installment. This process cannot be undone easily.</p>
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm border border-rose-100 flex items-center gap-3">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Select Fee Installment</label>
                        <select 
                            required
                            disabled={fetching}
                            value={selectedInstallment}
                            onChange={e => setSelectedInstallment(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-[var(--card-border)] rounded-xl text-sm outline-none focus:border-primary disabled:opacity-50"
                        >
                            <option value="">{fetching ? 'Loading installments...' : 'Choose installment...'}</option>
                            {installments.map(i => (
                                <option key={i.id} value={i.id}>{i.name} (Due: {new Date(i.due_date).toLocaleDateString()})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-[var(--text-muted)] hover:bg-slate-100 rounded-xl">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={loading || !selectedInstallment}
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <PlayCircle size={18} />}
                            Generate Now
                        </button>
                    </div>
                </form>
            ) : (
                <div className="p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <PlayCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Invoices Generated!</h3>
                    <p className="text-[var(--text-muted)]">Successfully generated <b>{result.count || 0}</b> invoices for the selected period.</p>
                    <button 
                        onClick={onClose}
                        className="mt-4 px-8 py-2.5 bg-surface-dark text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            )}
        </Modal>
    );
}
