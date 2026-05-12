import { useState, useEffect } from 'react';
import { 
    Settings, Loader2, 
    AlertCircle, CheckCircle2, 
    ArrowRightLeft, Link as LinkIcon,
    FileText, TrendingUp, TrendingDown,
    Building2, Wallet
} from 'lucide-react';
import { getSystemMappings, saveSystemMapping, getCOA } from '../../api/accounting.api';

const MAPPING_LABELS: Record<string, { label: string, icon: any, desc: string }> = {
    'REV_ADMISSION': { 
        label: 'Admission Revenue', 
        icon: TrendingUp,
        desc: 'Credit this account when a new student is admitted.'
    },
    'REV_TUITION': { 
        label: 'Tuition Revenue', 
        icon: TrendingUp,
        desc: 'Credit this account when tuition fees are collected.'
    },
    'EXP_SALARY': { 
        label: 'Salary Expense', 
        icon: TrendingDown,
        desc: 'Debit this account when staff salaries are paid.'
    },
    'ASSET_CASH': { 
        label: 'Default Cash Account', 
        icon: Wallet,
        desc: 'Used for petty cash and walk-in fee collections.'
    },
    'ASSET_BANK': { 
        label: 'Default Bank Account', 
        icon: Building2,
        desc: 'Primary account for salaries and vendor payments.'
    },
    'ASSET_RECEIVABLE': { 
        label: 'Accounts Receivable', 
        icon: FileText,
        desc: 'Tracks outstanding student fee balances.'
    }
};

export default function AccountingSettings() {
    const [mappings, setMappings] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [mRows, coa] = await Promise.all([
                getSystemMappings(),
                getCOA()
            ]);
            setMappings(mRows);
            setAccounts(coa.filter(a => !a.is_group));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (key: string, accountId: number) => {
        try {
            setSaving(key);
            await saveSystemMapping({ mapping_key: key, account_id: accountId });
            setMessage({ type: 'success', text: `Mapping for ${key} updated successfully.` });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to save mapping.' });
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={40} className="animate-spin text-primary mb-4" />
                <p className="text-[var(--text-muted)] animate-pulse">Loading system configurations...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 font-heading tracking-tight">Financial Automation</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Configure default General Ledger accounts for automated system events.</p>
                </div>
                <div className="p-3 bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--card-border)]">
                    <Settings className="text-[var(--text-muted)]" size={24} />
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-slide-up ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {Object.entries(MAPPING_LABELS).map(([key, info]) => {
                    const currentMapping = mappings.find(m => m.mapping_key === key);
                    const Icon = info.icon;

                    return (
                        <div key={key} className="card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 group hover:shadow-xl transition-all">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[var(--text-muted)] group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                                <Icon size={28} />
                            </div>
                            
                            <div className="flex-1 space-y-1">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    {info.label}
                                    <span className="px-2 py-0.5 bg-slate-100 text-[var(--text-muted)] text-[10px] rounded font-mono uppercase tracking-tighter">{key}</span>
                                </h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{info.desc}</p>
                            </div>

                            <div className="w-full sm:w-72 flex items-center gap-2">
                                <div className="relative flex-1">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                                        <LinkIcon size={14} />
                                    </div>
                                    <select 
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-[var(--card-border)] rounded-xl outline-none focus:border-primary text-sm font-medium appearance-none"
                                        value={currentMapping?.account_id || ''}
                                        onChange={(e) => handleSave(key, parseInt(e.target.value))}
                                        disabled={saving === key}
                                    >
                                        <option value="">Select Account...</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {saving === key && (
                                    <Loader2 size={18} className="animate-spin text-primary" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-8 bg-primary/5 rounded-3xl border border-primary/20 relative overflow-hidden group">
                <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform">
                    <ArrowRightLeft size={200} />
                </div>
                <h3 className="text-lg font-bold text-indigo-900 mb-2">How it works</h3>
                <p className="text-sm text-indigo-700/80 leading-relaxed max-w-2xl">
                    When you link a system event (like Admission) to a GL account, Pynemonk will automatically post balanced journal entries to your ledger whenever that event occurs. 
                    This keeps your P&L and Balance Sheet up-to-date in real-time, eliminating the need for manual year-end reconciliation.
                </p>
            </div>
        </div>
    );
}
