import { useState, useEffect } from 'react';
import { 
    Plus, 
    ArrowUpRight, ArrowDownLeft, 
    Loader2,
    CheckCircle2, Wallet,
    Download, Landmark,
    ArrowRight, Activity, ShieldCheck,
    Banknote, Smartphone,
    Layers
} from 'lucide-react';
import { getTreasuryInventory, getCOA, createBankAccount, getBankTransactions, settleTreasuryFunds } from '../../api/accounting.api';
import Modal from '../../components/ui/Modal';

export default function Banking() {
    const [inventory, setInventory] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isSweepModalOpen, setIsSweepModalOpen] = useState(false);
    const [sweepSource, setSweepSource] = useState<any>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [iData, tData] = await Promise.all([
                getTreasuryInventory(),
                getBankTransactions()
            ]);
            setInventory(iData);
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

    const getFacetTotal = (type: string) => {
        return inventory
            .filter(item => item.treasury_type === type)
            .reduce((sum, item) => sum + parseFloat(item.balance), 0);
    };

    const totalBalance = inventory.reduce((acc, a) => acc + (parseFloat(a.balance) || 0), 0);

    return (
        <div className="p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <Activity size={12} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Institutional Treasury</span>
                    </div>
                    <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight">Financial Command Center</h1>
                    <p className="text-[var(--text-muted)] font-medium text-sm mt-1">Consolidated liquidity monitoring across all institutional facets.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                        <Download size={18} />
                        Export Treasury Report
                    </button>
                    <button 
                        onClick={() => setIsAccountModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus size={18} />
                        Link Bank Account
                    </button>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="premium-card p-6 bg-surface-dark text-white relative overflow-hidden border-none shadow-2xl shadow-theme/20 md:col-span-1">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Total Treasury Balance</p>
                        <h2 className="text-4xl font-black tracking-tight font-mono">{formatCurrency(totalBalance)}</h2>
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Available Liquidity</span>
                                <span className="text-[10px] font-black text-emerald-400">High</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[85%] rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Facet Summary Cards */}
                {[
                    { label: 'Bank Funds', value: getFacetTotal('bank'), icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                    { label: 'Cash Reserves', value: getFacetTotal('cash'), icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                    { label: 'Digital (UPI)', value: getFacetTotal('upi'), icon: Smartphone, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                ].map((facet, i) => (
                    <div key={i} className={`premium-card p-6 flex flex-col justify-between group hover:${facet.border} transition-all`}>
                        <div className="flex justify-between items-start">
                            <div className={`p-3 rounded-2xl ${facet.bg} ${facet.color} shadow-sm border ${facet.border}`}>
                                <facet.icon size={24} />
                            </div>
                            <Activity size={16} className="text-slate-200" />
                        </div>
                        <div className="mt-6">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{facet.label}</p>
                            <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight font-mono">
                                {formatCurrency(facet.value)}
                            </h2>
                        </div>
                    </div>
                ))}
            </div>

            {/* Treasury Inventory Breakdown */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <Layers size={24} className="text-primary" />
                            Liquidity Distribution
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-4">Bank</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-4">Cash</span>
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-50 rounded-3xl animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {inventory.map((item) => (
                                <div key={item.gl_account_id} className="premium-card p-6 group hover:border-primary/20 transition-all bg-white shadow-sm border border-slate-100 rounded-[2rem]">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm
                                                ${item.treasury_type === 'bank' ? 'bg-blue-50 text-blue-600' : 
                                                item.treasury_type === 'cash' ? 'bg-emerald-50 text-emerald-600' : 
                                                'bg-indigo-50 text-indigo-600'}`}>
                                                {item.treasury_type === 'bank' ? <Landmark size={20} /> : 
                                                item.treasury_type === 'cash' ? <Banknote size={20} /> : 
                                                <Smartphone size={20} />}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 leading-none">{item.name}</h4>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{item.code}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <p className="text-lg font-black text-slate-900 font-mono tracking-tighter">{formatCurrency(parseFloat(item.balance))}</p>
                                            <div className="flex items-center gap-2">
                                                {item.treasury_type !== 'bank' && parseFloat(item.balance) > 0 && (
                                                    <button 
                                                        onClick={() => {
                                                            setSweepSource(item);
                                                            setIsSweepModalOpen(true);
                                                        }}
                                                        className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                                                    >
                                                        Settle to Bank
                                                    </button>
                                                )}
                                                <div className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest
                                                    ${parseFloat(item.balance) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {parseFloat(item.balance) >= 0 ? 'Surplus' : 'Deficit'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="premium-card p-8 flex flex-col items-center justify-center text-center bg-surface-dark text-white border-none shadow-2xl shadow-theme/20 relative overflow-hidden h-full min-h-[400px]">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center text-primary mb-10 shadow-2xl border border-white/5">
                            <Wallet size={36} />
                        </div>
                        <h3 className="text-2xl font-black mb-4 tracking-tight">Institutional Liquidity</h3>
                        <p className="text-white/60 text-sm font-medium mb-12 leading-relaxed px-4">Your current treasury reserves provide high operational coverage for upcoming payroll and vendor cycles.</p>
                        <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center justify-center gap-3">
                            Predictive Cash Flow Analysis
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Reconciliation Workflow */}
            <div className="premium-card p-0 overflow-hidden border-none shadow-2xl shadow-slate-200/50 flex flex-col">
                <div className="p-8 border-b border-[var(--card-border)]/30 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">Financial Reconciliation</h3>
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Pending Matching Queue</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/20">
                            {transactions.length} Unmatched
                        </span>
                    </div>
                </div>
                
                <div className="p-8 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {transactions.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 size={32} />
                            </div>
                            <p className="text-[var(--text-main)] font-black text-lg">Ledger is Synchronized</p>
                            <p className="text-[var(--text-muted)] text-sm mt-1">All bank transactions have been matched and verified.</p>
                        </div>
                    ) : transactions.map((tx, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-[var(--card-bg)] rounded-[2rem] shadow-sm group hover:border-primary/20 border border-slate-100 transition-all hover:translate-x-1">
                            <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                    {tx.type === 'credit' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-[var(--text-main)] leading-tight">{tx.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{new Date(tx.transaction_date).toLocaleDateString()}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                                        <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">ID: {tx.id}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <span className={`text-lg font-black font-mono ${tx.type === 'credit' ? 'text-emerald-600' : 'text-[var(--text-main)]'}`}>{formatCurrency(parseFloat(tx.amount))}</span>
                                <button className="px-4 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10 hover:scale-[1.05] active:scale-[0.95] transition-all">
                                    Verify
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} onSuccess={fetchData} />
            
            <SweepModal 
                isOpen={isSweepModalOpen} 
                onClose={() => setIsSweepModalOpen(false)} 
                source={sweepSource} 
                inventory={inventory}
                onSuccess={fetchData} 
            />

            <footer className="mt-8 pt-8 border-t border-[var(--card-border)]/50 text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">LuviaEdu Institutional Treasury Hub v5.0 • Secure Liquidity Management</p>
            </footer>
        </div>
    );
}

function SweepModal({ isOpen, onClose, source, inventory, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState(0);
    const [targetAccountId, setTargetAccountId] = useState('');

    useEffect(() => {
        if (source) setAmount(parseFloat(source.balance));
    }, [source]);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            setLoading(true);
            await settleTreasuryFunds({
                sourceAccountId: source.gl_account_id,
                targetAccountId: parseInt(targetAccountId),
                amount: amount,
                description: `Treasury Sweep: ${source.name} to Bank`
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!source) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Institutional Treasury Sweep" size="md">
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source Account</p>
                    <h4 className="text-lg font-black text-slate-800">{source.name}</h4>
                    <p className="text-[10px] font-bold text-primary uppercase mt-1">Current Balance: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(source.balance)}</p>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Settlement Amount</label>
                    <input 
                        type="number"
                        step="0.01"
                        required
                        className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-primary/30 transition-all text-xl font-black font-mono"
                        value={amount}
                        onChange={e => setAmount(parseFloat(e.target.value))}
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Bank Account</label>
                    <select 
                        required
                        className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-primary/30 transition-all text-sm font-bold appearance-none cursor-pointer"
                        value={targetAccountId}
                        onChange={e => setTargetAccountId(e.target.value)}
                    >
                        <option value="">Select Destination Bank...</option>
                        {inventory.filter((a: any) => a.treasury_type === 'bank' && a.gl_account_id !== source.gl_account_id).map((a: any) => (
                            <option key={a.gl_account_id} value={a.gl_account_id}>{a.name} ({a.code})</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-4 pt-10 border-t border-slate-100">
                    <button type="button" onClick={onClose} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                    <button disabled={loading || !targetAccountId} className="px-10 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                        Execute Sweep
                    </button>
                </div>
            </form>
        </Modal>
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
        <Modal isOpen={isOpen} onClose={onClose} title="Authorize Treasury Connection" size="md">
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Internal Ledger Identifier</label>
                    <input 
                        required
                        placeholder="e.g. Main Operating Reserve"
                        className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-primary/20 transition-all text-sm font-bold placeholder:text-slate-300 shadow-sm"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Banking Institution</label>
                        <input 
                            required
                            placeholder="e.g. Chase Bank"
                            className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-primary/20 transition-all text-sm font-bold placeholder:text-slate-300 shadow-sm"
                            value={formData.bank_name}
                            onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Account Suffix</label>
                        <input 
                            required
                            placeholder="e.g. 1234"
                            className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-primary/20 transition-all text-sm font-bold placeholder:text-slate-300 shadow-sm"
                            value={formData.account_no}
                            onChange={e => setFormData({ ...formData, account_no: e.target.value })}
                        />
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Asset GL Account Mapping</label>
                    <div className="relative group">
                        <select 
                            required
                            className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-primary/20 transition-all text-sm font-bold appearance-none cursor-pointer shadow-sm"
                            value={formData.gl_account_id}
                            onChange={e => setFormData({ ...formData, gl_account_id: e.target.value })}
                        >
                            <option value="">Select Target GL Account...</option>
                            {coa.filter(a => a.type_name === 'Asset').map((a: any) => (
                                <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <Layers size={18} />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-10 border-t border-slate-100">
                    <button type="button" onClick={onClose} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                    <button disabled={loading} className="px-12 py-5 bg-primary text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                        Authorize Secure Link
                    </button>
                </div>
            </form>
        </Modal>
    );
}
