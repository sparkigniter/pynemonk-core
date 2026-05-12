import { useState, useEffect, useRef } from 'react';
import { 
    Plus, Trash2, Loader2, AlertCircle, 
    CheckCircle2, FileText,
    Keyboard, Save
} from 'lucide-react';
import { getCOA, createJournal, getAccountingSettings } from '../../api/accounting.api';
import SearchableSelect from '../../components/accounting/SearchableSelect';

interface JournalEntryFormProps {
    onClose: () => void;
    onSuccess?: () => void;
}

export default function JournalEntryForm({ onClose, onSuccess }: JournalEntryFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currencySymbol, setCurrencySymbol] = useState('$');
    const lastRowRef = useRef<HTMLTableRowElement>(null);
    
    const [formData, setFormData] = useState({
        entry_date: new Date().toISOString().split('T')[0],
        reference_no: '',
        description: '',
        items: [
            { account_id: 0, debit: 0, credit: 0, description: '' },
            { account_id: 0, debit: 0, credit: 0, description: '' }
        ]
    });

    useEffect(() => {
        fetchInitialData();
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                handleSubmit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const fetchInitialData = async () => {
        try {
            const settings = await getAccountingSettings();
            setCurrencySymbol(settings.currency_symbol || '$');
        } catch (err: any) {
            setError('Failed to load settings');
        }
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { account_id: 0, debit: 0, credit: 0, description: '' }]
        }));
        setTimeout(() => lastRowRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    const removeItem = (index: number) => {
        if (formData.items.length <= 2) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        (newItems[index] as any)[field] = value;
        
        // Logical clear: If updating debit, clear credit and vice versa
        if (field === 'debit' && value > 0) newItems[index].credit = 0;
        if (field === 'credit' && value > 0) newItems[index].debit = 0;
        
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const totalDebit = formData.items.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
    const totalCredit = formData.items.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
    const diff = totalDebit - totalCredit;
    const isBalanced = Math.abs(diff) < 0.01 && totalDebit > 0;

    const autoBalance = (index: number) => {
        if (diff > 0) {
            updateItem(index, 'credit', diff);
        } else if (diff < 0) {
            updateItem(index, 'debit', Math.abs(diff));
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!isBalanced) return;

        if (formData.items.some(i => !i.account_id)) {
            setError('All lines must have an account selected');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            await createJournal({
                ...formData,
                items: formData.items.map(i => ({
                    ...i,
                    debit: Number(i.debit) || 0,
                    credit: Number(i.credit) || 0
                }))
            });
            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to post journal entry');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--card-bg)]">
            {/* Form Header */}
            <div className="px-8 py-6 border-b border-[var(--card-border)] flex items-center justify-between bg-slate-50/30">
                <div>
                    <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2">
                        <FileText className="text-primary" size={24} />
                        New Journal Entry
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">Voucher Type: General Journal</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[10px] font-bold text-[var(--text-muted)]">
                        <Keyboard size={14} />
                        <span>CMD + ENTER TO POST</span>
                    </div>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-slate-600 font-bold text-sm">Discard</button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                <div className="p-8 space-y-8 overflow-y-auto">
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Entry Date</label>
                            <input 
                                type="date" 
                                required
                                value={formData.entry_date}
                                onChange={e => setFormData(p => ({ ...p, entry_date: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-[var(--card-border)] rounded-xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Reference #</label>
                            <input 
                                type="text" 
                                placeholder="e.g. JRN-2025-001"
                                value={formData.reference_no}
                                onChange={e => setFormData(p => ({ ...p, reference_no: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-[var(--card-border)] rounded-xl text-sm font-bold focus:border-primary transition-all outline-none"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">General Narration</label>
                            <input 
                                type="text" 
                                placeholder="Describe the purpose of this entry..."
                                required
                                value={formData.description}
                                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-[var(--card-border)] rounded-xl text-sm font-bold focus:border-primary transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Entry Table */}
                    <div className="border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--card-border)]">
                                    <th className="py-4 px-6 w-1/3">Account Name</th>
                                    <th className="py-4 px-6 w-32 text-right">Debit ({currencySymbol})</th>
                                    <th className="py-4 px-6 w-32 text-right">Credit ({currencySymbol})</th>
                                    <th className="py-4 px-6">Line Description</th>
                                    <th className="py-4 px-6 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {formData.items.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50/30 transition-colors" ref={idx === formData.items.length - 1 ? lastRowRef : null}>
                                        <td className="py-3 px-6">
                                            <SearchableSelect
                                                compact
                                                placeholder="Select Account..."
                                                value={item.account_id}
                                                onSearch={getCOA}
                                                formatOption={(acc) => ({
                                                    id: acc.id,
                                                    label: acc.name,
                                                    sublabel: acc.code,
                                                    original: acc
                                                })}
                                                onSelect={(opt) => updateItem(idx, 'account_id', Number(opt.id))}
                                            />
                                        </td>
                                        <td className="py-3 px-6">
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                placeholder="0.00"
                                                value={item.debit === 0 ? '' : item.debit}
                                                onChange={e => {
                                                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                    updateItem(idx, 'debit', val);
                                                }}
                                                className="w-full px-3 py-2.5 bg-transparent border border-transparent rounded-lg text-sm font-mono font-extrabold text-right text-[var(--text-main)] outline-none focus:border-primary focus:bg-[var(--card-bg)] transition-all"
                                            />
                                        </td>
                                        <td className="py-3 px-6">
                                            <div className="flex items-center gap-1 group/credit">
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={item.credit === 0 ? '' : item.credit}
                                                    onChange={e => {
                                                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                        updateItem(idx, 'credit', val);
                                                    }}
                                                    className="w-full px-3 py-2.5 bg-transparent border border-transparent rounded-lg text-sm font-mono font-extrabold text-right text-[var(--text-main)] outline-none focus:border-primary focus:bg-[var(--card-bg)] transition-all"
                                                />
                                                {!isBalanced && idx === formData.items.length - 1 && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => autoBalance(idx)}
                                                        className="p-1.5 text-primary opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-primary/10 rounded-lg transition-all"
                                                        title="Auto-balance line"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-6">
                                            <input 
                                                type="text" 
                                                placeholder="Entry note..."
                                                value={item.description}
                                                onChange={e => updateItem(idx, 'description', e.target.value)}
                                                className="w-full px-3 py-2.5 bg-transparent border border-transparent rounded-lg text-sm font-medium text-[var(--text-muted)] outline-none focus:border-primary focus:bg-[var(--card-bg)] transition-all"
                                            />
                                        </td>
                                        <td className="py-3 px-6">
                                            <button 
                                                type="button" 
                                                onClick={() => removeItem(idx)}
                                                disabled={formData.items.length <= 2}
                                                className="text-slate-200 hover:text-rose-500 transition-colors disabled:opacity-0"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button 
                        type="button" 
                        onClick={addItem}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-black text-primary uppercase tracking-widest hover:bg-primary/5 rounded-xl transition-all"
                    >
                        <Plus size={14} />
                        Add New Line Item
                    </button>
                </div>

                {/* Sticky Footer for Balancing */}
                <div className="px-8 py-6 bg-surface-dark text-white flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Total Debit</p>
                            <p className="text-xl font-mono font-extrabold">{currencySymbol}{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Total Credit</p>
                            <p className="text-xl font-mono font-extrabold">{currencySymbol}{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="h-10 w-px bg-[var(--card-bg)]/10" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Status</p>
                            {isBalanced ? (
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <CheckCircle2 size={18} />
                                    <span className="text-sm font-bold">BALANCED</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-rose-400">
                                    <AlertCircle size={18} />
                                    <span className="text-sm font-bold">OUT OF BALANCE ({currencySymbol}{Math.abs(diff).toFixed(2)})</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            type="submit"
                            disabled={submitting || !isBalanced}
                            className="px-10 py-3.5 bg-primary text-white rounded-2xl font-black text-sm shadow-2xl shadow-primary/40 hover:scale-[1.05] active:scale-[0.95] disabled:opacity-30 disabled:scale-100 transition-all flex items-center gap-3"
                        >
                            {submitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            POST TRANSACTION
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
