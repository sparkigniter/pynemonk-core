import { useState, useEffect } from 'react';
import { 
    Plus, Building, CreditCard, 
    ArrowUpRight, ArrowDownLeft, 
    History, Loader2, MoreVertical,
    CheckCircle2, Wallet,
    Download, Landmark,
    ArrowRight, ChevronRight
} from 'lucide-react';
import { getBankAccounts, getCOA, createBankAccount, getBankTransactions } from '../../api/accounting.api';
import Modal from '../../components/ui/Modal';

export default function Banking() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [aData, tData] = await Promise.all([
                getBankAccounts(),
                getBankTransactions()
            ]);
            setAccounts(aData);
            setTransactions(tData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">Banking & Treasury</h1>
                    <p className="text-[var(--text-muted)] font-medium mt-1">Institutional cash management and reconciliation</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] text-slate-600 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all">
                        <Download size={18} />
                        Export Statements
                    </button>
                    <button 
                        onClick={() => setIsAccountModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                    >
                        <Plus size={18} />
                        Link Bank Account
                    </button>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="premium-card p-6 bg-surface-dark text-white">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 rounded-xl bg-[var(--card-bg)]/10 text-white">
                            <Landmark size={20} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg uppercase tracking-widest">In Sync</span>
                    </div>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Treasury Balance</p>
                    <h2 className="text-3xl font-black">{formatCurrency(accounts.reduce((acc, a) => acc + parseFloat(a.balance), 0))}</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">Consolidated across {accounts.length} accounts</p>
                </div>
                
                <div className="premium-card p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 rounded-xl bg-primary/5 text-primary">
                            <ArrowDownLeft size={20} />
                        </div>
                        <span className="text-[10px] font-black text-[var(--text-muted)] bg-slate-50 px-2 py-1 rounded-lg uppercase tracking-widest">30 Days</span>
                    </div>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Inflow</p>
                    <h2 className="text-3xl font-black text-[var(--text-main)]">{formatCurrency(45200)}</h2>
                    <p className="text-xs text-emerald-600 mt-2 font-bold flex items-center gap-1">
                        <ArrowUpRight size={14} /> +12% from last month
                    </p>
                </div>

                <div className="premium-card p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                            <ArrowUpRight size={20} />
                        </div>
                        <span className="text-[10px] font-black text-[var(--text-muted)] bg-slate-50 px-2 py-1 rounded-lg uppercase tracking-widest">30 Days</span>
                    </div>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Outflow</p>
                    <h2 className="text-3xl font-black text-[var(--text-main)]">{formatCurrency(28400)}</h2>
                    <p className="text-xs text-rose-600 mt-2 font-bold flex items-center gap-1">
                        <ArrowDownLeft size={14} /> -4.5% from last month
                    </p>
                </div>
            </div>

            {/* Bank Accounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="premium-card h-64 animate-pulse" />)
                ) : accounts.length === 0 ? (
                    <div className="col-span-full py-24 text-center premium-card border-dashed bg-slate-50/50">
                        <div className="w-20 h-20 bg-[var(--card-bg)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Building size={40} className="text-slate-200" />
                        </div>
                        <h3 className="text-xl font-extrabold text-[var(--text-main)] mb-2">No active treasury accounts</h3>
                        <p className="text-[var(--text-muted)] max-w-sm mx-auto mb-8">Link your school bank accounts to automate transaction matching and reconciliation.</p>
                        <button 
                            onClick={() => setIsAccountModalOpen(true)}
                            className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.05] transition-all"
                        >
                            Establish First Connection
                        </button>
                    </div>
                ) : accounts.map(account => (
                    <div key={account.id} className="premium-card p-8 group relative overflow-hidden hover:border-primary/30 transition-all cursor-default">
                        <div className="absolute -right-12 -top-12 w-48 h-48 bg-slate-50 rounded-full group-hover:scale-110 transition-transform duration-500" />
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h3 className="text-lg font-extrabold text-[var(--text-main)] tracking-tight">{account.name}</h3>
                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1">{account.bank_name || 'Standard Bank'}</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-[var(--card-bg)] shadow-sm border border-[var(--card-border)] flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors">
                                    <CreditCard size={24} />
                                </div>
                            </div>

                            <div className="mb-10">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Available Funds</p>
                                <h2 className="text-3xl font-black text-[var(--text-main)] font-mono tracking-tighter">{formatCurrency(parseFloat(account.balance))}</h2>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    Active Sync
                                </div>
                                <div className="flex gap-1">
                                    <button className="p-2 text-slate-300 hover:text-slate-600 rounded-xl transition-all"><History size={18} /></button>
                                    <button className="p-2 text-slate-300 hover:text-slate-600 rounded-xl transition-all"><MoreVertical size={18} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reconciliation Workflow */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 premium-card p-8 bg-slate-50/50 border-dashed border-2">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-extrabold text-[var(--text-main)]">Pending Reconciliation</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary">{transactions.length} Items Found</span>
                            <ChevronRight size={16} className="text-indigo-400" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {transactions.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-[var(--text-muted)] text-sm font-medium italic">Everything is matched. Good job!</p>
                            </div>
                        ) : transactions.map((tx, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-[var(--card-bg)] rounded-2xl shadow-sm group hover:border-primary/20 border border-transparent transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {tx.type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[var(--text-main)]">{tx.description}</p>
                                        <p className="text-[10px] font-medium text-[var(--text-muted)]">{new Date(tx.transaction_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className={`text-sm font-extrabold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-[var(--text-main)]'}`}>{formatCurrency(parseFloat(tx.amount))}</span>
                                    <button className="px-4 py-1.5 bg-surface-dark text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all">
                                        Match
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="premium-card p-8 flex flex-col items-center justify-center text-center bg-primary text-white border-none shadow-xl shadow-theme/10 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-[var(--card-bg)]/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-8">
                            <Wallet size={32} />
                        </div>
                        <h3 className="text-2xl font-black mb-4">Cash Position Strength</h3>
                        <p className="text-indigo-100 text-sm font-medium mb-10 leading-relaxed">Your current cash reserves can cover 14 weeks of operational expenses without additional revenue.</p>
                        <button className="w-full py-4 bg-[var(--card-bg)] text-primary rounded-2xl font-black text-sm hover:scale-[1.05] transition-all flex items-center justify-center gap-2">
                            Run Cash Analysis
                            <ArrowRight size={18} />
                        </button>
                    </div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[var(--card-bg)]/5 rounded-full blur-2xl" />
                </div>
            </div>

            <AccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} onSuccess={fetchData} />
        </div>
    );
}

function AccountModal({ isOpen, onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [coa, setCoa] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '', bank_name: '', account_no: '', branch: '', gl_account_id: '', opening_balance: 0
    });

    useEffect(() => {
        if (isOpen) {
            getCOA().then(data => setCoa(data.filter(a => !a.is_group)));
        }
    }, [isOpen]);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            setLoading(true);
            await createBankAccount(formData);
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Establish Treasury Connection" size="md">
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Internal Identifier</label>
                    <input 
                        required
                        placeholder="e.g. Main Operating Reserve"
                        className="w-full px-5 py-3 bg-slate-50 border border-[var(--card-border)] rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Financial Institution</label>
                        <input 
                            required
                            placeholder="e.g. Chase Bank"
                            className="w-full px-5 py-3 bg-slate-50 border border-[var(--card-border)] rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold"
                            value={formData.bank_name}
                            onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Account End Digits</label>
                        <input 
                            required
                            placeholder="e.g. 1234"
                            className="w-full px-5 py-3 bg-slate-50 border border-[var(--card-border)] rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold"
                            value={formData.account_no}
                            onChange={e => setFormData({ ...formData, account_no: e.target.value })}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">General Ledger Integration</label>
                    <select 
                        required
                        className="w-full px-5 py-3 bg-slate-50 border border-[var(--card-border)] rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold"
                        value={formData.gl_account_id}
                        onChange={e => setFormData({ ...formData, gl_account_id: e.target.value })}
                    >
                        <option value="">Select Asset GL...</option>
                        {coa.filter(a => a.type_name === 'Asset').map((a: any) => (
                            <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-8 border-t border-[var(--card-border)]">
                    <button type="button" onClick={onClose} className="px-6 py-3 text-sm text-[var(--text-muted)] font-bold hover:text-slate-600 transition-colors">Discard</button>
                    <button disabled={loading} className="px-8 py-3 bg-surface-dark text-white rounded-2xl text-sm font-extrabold shadow-xl shadow-slate-200 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                        Authorize Connection
                    </button>
                </div>
            </form>
        </Modal>
    );
}
