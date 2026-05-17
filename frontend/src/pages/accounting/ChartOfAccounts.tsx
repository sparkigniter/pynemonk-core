import { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, FolderOpen, FileText,
    ChevronRight,
    DollarSign, Briefcase, CreditCard, TrendingUp, TrendingDown,
    Loader2,
    ArrowRight, Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCOA, type Account } from '../../api/accounting.api';
import AccountForm from './AccountForm';

interface AccountNode extends Account {
    children?: AccountNode[];
}

const AccountRow = ({ account, level = 0 }: { account: AccountNode; level?: number }) => {
    const [expanded, setExpanded] = useState(level < 1);
    const hasChildren = account.children && account.children.length > 0;

    return (
        <>
            <div
                className={`flex items-center gap-4 py-4 px-8 hover:bg-slate-50/50 border-b border-[var(--card-border)]/30 transition-all cursor-pointer group
                ${level === 0 ? 'bg-[var(--card-bg)]/50' : ''}`}
                onClick={() => setExpanded(!expanded)}
            >
                <div style={{ width: `${level * 28}px` }} className="flex-shrink-0" />

                <div className="flex items-center gap-2 w-8 justify-center">
                    {hasChildren ? (
                        <div className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
                            <ChevronRight size={16} className="text-[var(--text-muted)]" />
                        </div>
                    ) : (
                        <div className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                    )}
                </div>

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-all
                    ${account.is_group ? 'bg-primary/10 text-primary group-hover:scale-110' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)]'}`}>
                    {account.is_group ? <FolderOpen size={18} /> : <FileText size={18} />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black font-mono text-[var(--text-muted)] bg-[var(--card-bg)] px-2 py-0.5 rounded uppercase tracking-wider border border-[var(--card-border)]">
                            {account.code}
                        </span>
                        <h3 className={`text-sm font-bold truncate ${account.is_group ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] font-semibold'}`}>
                            {account.name}
                        </h3>
                    </div>
                </div>

                <div className="hidden lg:block w-32 px-4">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border
                        ${account.type_name === 'Asset' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            account.type_name === 'Liability' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                account.type_name === 'Equity' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-primary/5 text-primary border-primary/10'}`}>
                        {account.type_name}
                    </span>
                </div>

                <div className="w-48 text-right font-mono font-extrabold text-[var(--text-main)]">
                    {account.balance || '$0.00'}
                </div>

                <div className="w-10 text-right opacity-0 group-hover:opacity-100 transition-all">
                    <button className="p-2 text-[var(--text-muted)] hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            {hasChildren && expanded && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    {account.children!.map(child => (
                        <AccountRow key={child.id} account={child} level={level + 1} />
                    ))}
                </div>
            )}
        </>
    );
};

export default function ChartOfAccounts() {
    const { can } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartData, setChartData] = useState<AccountNode[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const calculateGroupBalances = (nodes: AccountNode[]): number => {
        let total = 0;
        nodes.forEach(node => {
            const nodeBalance = parseFloat(node.raw_balance as any || '0');
            const childrenBalance = node.children ? calculateGroupBalances(node.children) : 0;
            node.balance = formatCurrency(nodeBalance + childrenBalance);
            total += nodeBalance + childrenBalance;
        });
        return total;
    };

    const fetchChart = async () => {
        try {
            setLoading(true);
            const flatData = await getCOA();
            const accountMap: Record<number, AccountNode> = {};
            const roots: AccountNode[] = [];

            flatData.forEach(account => {
                accountMap[account.id] = { ...account, children: [] };
            });

            flatData.forEach(account => {
                if (account.parent_id && accountMap[account.parent_id]) {
                    accountMap[account.parent_id].children!.push(accountMap[account.id]);
                } else {
                    roots.push(accountMap[account.id]);
                }
            });

            calculateGroupBalances(roots);
            setChartData(roots);
        } catch (err: any) {
            setError(err.message || 'Failed to load Chart of Accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChart();
    }, []);

    const getSummaryTotal = (typeName: string) => {
        const getSum = (nodes: AccountNode[]): number => {
            return nodes.reduce((acc, node) => {
                const nodeVal = node.type_name === typeName ? parseFloat(node.raw_balance as any || '0') : 0;
                return acc + nodeVal + (node.children ? getSum(node.children) : 0);
            }, 0);
        };
        return getSum(chartData);
    };

    if (loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px]">Mapping General Ledger...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <AccountForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={fetchChart} />
            
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--card-bg)] flex items-center justify-center shadow-sm">
                            <FolderOpen className="text-rose-500" size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-extrabold">Ledger Sync Error</p>
                            <p className="text-xs font-medium opacity-80">{error}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => fetchChart()}
                        className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <TrendingUp size={12} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Financial Architecture</span>
                    </div>
                    <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight">Chart of Accounts</h1>
                    <p className="text-[var(--text-muted)] font-medium text-sm mt-1">Multi-level institutional ledger architecture for LuviaEdu</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                        <Download size={18} />
                        Export COA
                    </button>
                    {can('coa:write') && (
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <Plus size={18} />
                            Add Account
                        </button>
                    )}
                </div>
            </div>

            {/* Account Types Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {[
                    { name: 'Asset', label: 'Assets', icon: TrendingUp, color: 'emerald' },
                    { name: 'Liability', label: 'Liabilities', icon: TrendingDown, color: 'rose' },
                    { name: 'Equity', label: 'Equity', icon: Briefcase, color: 'amber' },
                    { name: 'Revenue', label: 'Revenue', icon: DollarSign, color: 'primary' },
                    { name: 'Expense', label: 'Expenses', icon: CreditCard, color: 'slate' },
                ].map(type => (
                    <div key={type.name} className="premium-card p-6 hover:border-primary/20 transition-all cursor-default group">
                        <div className={`w-10 h-10 rounded-xl bg-${type.color === 'primary' ? 'primary/10' : type.color + '-50'} text-${type.color === 'primary' ? 'primary' : type.color + '-600'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <type.icon size={20} />
                        </div>
                        <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{type.label}</h4>
                        <p className="text-xl font-black text-[var(--text-main)] font-mono">{formatCurrency(getSummaryTotal(type.name))}</p>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-[var(--card-bg)] p-4 rounded-[2.5rem] border border-[var(--card-border)] shadow-sm">
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input
                        type="text"
                        placeholder="Search accounts by code or name..."
                        className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-transparent rounded-[2rem] outline-none focus:bg-[var(--card-bg)] focus:border-primary transition-all text-sm font-bold placeholder:text-[var(--text-muted)]/50"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full lg:w-auto">
                    <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-50/50 text-[var(--text-muted)] rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                        <Filter size={14} />
                        Filter
                    </button>
                    <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-50/50 text-[var(--text-muted)] rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                        Collapse All
                    </button>
                </div>
            </div>

            {/* Chart Tree */}
            <div className="premium-card overflow-hidden border-none shadow-2xl shadow-slate-200/50">
                <div className="flex items-center gap-4 py-6 px-8 bg-slate-50/50 border-b border-[var(--card-border)]/50 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                    <div className="w-8 flex-shrink-0" />
                    <div className="w-10 flex-shrink-0" />
                    <div className="flex-1">Institutional Account Detail</div>
                    <div className="hidden lg:block w-32 px-4">Classification</div>
                    <div className="w-48 text-right">Running Balance</div>
                    <div className="w-10" />
                </div>

                <div className="divide-y divide-[var(--card-border)]/20">
                    {chartData.map(account => (
                        <AccountRow key={account.id} account={account} />
                    ))}
                </div>
            </div>
        </div>
    );
}

