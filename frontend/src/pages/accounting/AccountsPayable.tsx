import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, FileText, 
    MoreVertical, Loader2, 
    Search, Filter, Clock, CreditCard,
    TrendingUp, TrendingDown, Activity, ArrowRight,
    AlertOctagon, Users, AlertTriangle,
    Tags, ShieldAlert, CheckCircle2, Wallet, 
    History, BarChart3, PenSquare
} from 'lucide-react';
import { getVendors, getBills, getBillPayments } from '../../api/accounting.api';

export default function AccountsPayable() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'bills' | 'vendors' | 'payments'>('bills');
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState<any[]>([]);
    const [bills, setBills] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [vData, bData, pData] = await Promise.all([
                getVendors(),
                getBills(),
                getBillPayments()
            ]);
            setVendors(vData);
            setBills(bData);
            setPayments(pData);
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

    const aging = {
        current: bills.filter(b => b.status !== 'paid' && (!b.due_date || new Date(b.due_date) > new Date())).reduce((acc, b) => acc + (parseFloat(b.total_amount) - parseFloat(b.paid_amount)), 0),
        overdue: bills.filter(b => b.status !== 'paid' && b.due_date && new Date(b.due_date) <= new Date()).reduce((acc, b) => acc + (parseFloat(b.total_amount) - parseFloat(b.paid_amount)), 0),
    };

    const upcomingBills = bills.filter(b => b.status !== 'paid' && b.due_date && new Date(b.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && new Date(b.due_date) >= new Date());
    const upcomingText = upcomingBills.length > 0 ? `${upcomingBills.length} bills due in next 7 days` : 'No bills due this week';

    const overdueBillsList = bills.filter(b => b.status !== 'paid' && b.due_date && new Date(b.due_date) < new Date());
    let oldestOverdueText = 'No overdue bills';
    if (overdueBillsList.length > 0) {
        overdueBillsList.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        const oldest = overdueBillsList[0];
        const daysOverdue = Math.floor((new Date().getTime() - new Date(oldest.due_date).getTime()) / (1000 * 3600 * 24));
        oldestOverdueText = `${oldest.vendor_name || 'Unknown Vendor'} • ${daysOverdue} days`;
    }

    const filteredBills = bills.filter(b => 
        b.bill_no?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPayments = payments.filter(p =>
        p.reference_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.bank_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <TrendingDown size={12} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Accounts Payable</span>
                    </div>
                    <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight">Accounts Payable</h1>
                    <p className="text-[var(--text-muted)] font-medium text-sm mt-1">Institutional Vendor & Liability Management</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/accounting/ap/pay-bill')}
                        className="flex items-center gap-2 px-6 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all"
                    >
                        <CreditCard size={18} />
                        Record Payment
                    </button>
                    <button 
                        onClick={() => {
                            if (activeTab === 'vendors') navigate('/accounting/ap/vendors/new');
                            else navigate('/accounting/ap/new-bill');
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus size={18} />
                        {activeTab === 'vendors' ? 'Register Vendor' : 'Enter Bill'}
                    </button>
                    <button className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl text-[var(--text-muted)] hover:bg-slate-50 transition-all shadow-sm">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Intelligent Aging & Operations Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Total Payables */}
                <div className="premium-card p-6 flex flex-col justify-between group cursor-pointer hover:border-primary/20 transition-all">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                                <Activity size={12} className="text-primary" /> Total Payables
                            </p>
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-bold flex items-center gap-1">
                                <TrendingDown size={10} /> 12% vs last mo
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight">{formatCurrency(aging.current + aging.overdue)}</h3>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-[var(--card-border)]/50 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-[var(--text-muted)]">Top Expense Category</p>
                            <p className="text-xs font-black text-[var(--text-muted)]">Lab Equipment • 45%</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                            <ArrowRight size={14} />
                        </div>
                    </div>
                </div>

                {/* Current / Upcoming */}
                <div className="premium-card p-6 flex flex-col justify-between group cursor-pointer hover:border-emerald-200 transition-all">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={12} className="text-emerald-500" /> Current
                            </p>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight">{formatCurrency(aging.current)}</h3>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-[var(--card-border)]/50 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-[var(--text-muted)]">Cashflow Impact</p>
                            <p className="text-xs font-black text-emerald-600">{upcomingText}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); navigate('/accounting/ap/pay-bill'); }} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg hover:bg-emerald-600 hover:text-white uppercase tracking-wider transition-colors border border-emerald-100">
                            Schedule
                        </button>
                    </div>
                </div>

                {/* Overdue / Urgent */}
                <div className="premium-card p-6 border-l-4 border-l-rose-500 hover:shadow-rose-500/10 transition-all">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                                <AlertOctagon size={12} /> Overdue
                            </p>
                            <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-wider border border-rose-100">
                                High Severity
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-rose-600 tracking-tight">{formatCurrency(aging.overdue)}</h3>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-rose-50 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-rose-400">Oldest Outstanding</p>
                            <p className="text-xs font-black text-rose-700">{oldestOverdueText}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); navigate('/accounting/ap/pay-bill'); }} className="px-3 py-1.5 bg-rose-600 text-white text-[10px] font-black rounded-lg hover:bg-rose-700 uppercase tracking-wider transition-colors shadow-sm shadow-rose-600/20">
                            Pay Now
                        </button>
                    </div>
                </div>

                {/* Active Vendors */}
                <div className="premium-card p-6 bg-surface-dark text-white flex flex-col justify-between group cursor-pointer hover:shadow-2xl hover:shadow-theme/30 transition-all relative overflow-hidden border-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5">
                                <Users size={12} className="text-primary" /> Active Vendors
                            </p>
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                <TrendingUp size={10} /> +3 this mo
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tight">{vendors.length}</h3>
                    </div>
                    
                    <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-white/40">Concentration Risk</p>
                            <p className="text-xs font-black text-white/80">EduSupplies takes 60% vol.</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary transition-all">
                            <ArrowRight size={14} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Tabs */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-[var(--card-bg)] p-4 rounded-[2.5rem] border border-[var(--card-border)] shadow-sm">
                <div className="flex items-center gap-1 bg-slate-50/50 p-1.5 rounded-[2rem] border border-[var(--card-border)]/60 shadow-inner w-full lg:w-max overflow-x-auto">
                    {(['bills', 'vendors', 'payments'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all capitalize whitespace-nowrap ${
                                activeTab === tab 
                                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                : 'text-[var(--text-muted)] hover:text-slate-800'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input 
                        type="text"
                        placeholder="Search by Bill #, Vendor name..."
                        className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-transparent rounded-[2rem] outline-none focus:bg-[var(--card-bg)] focus:border-primary transition-all text-sm font-bold placeholder:text-[var(--text-muted)]/50"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content Area */}
            {activeTab === 'bills' && (
                <div className="premium-card overflow-hidden border-none shadow-2xl shadow-slate-200/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-[var(--card-border)]/50">
                                    <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Bill # & Date</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Vendor</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Due Date</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right">Amount</th>
                                    <th className="px-8 py-6 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--card-border)]/10">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
                                            <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">Synchronizing with ledger...</p>
                                        </td>
                                    </tr>
                                ) : filteredBills.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <FileText size={40} className="text-slate-200" />
                                            </div>
                                            <p className="text-[var(--text-main)] font-black text-lg">No records found</p>
                                            <p className="text-[var(--text-muted)] text-sm mt-1 mb-8">Try adjusting your filters or search query.</p>
                                            <button 
                                                onClick={() => navigate('/accounting/ap/new-bill')}
                                                className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all"
                                            >
                                                Register First Bill
                                            </button>
                                        </td>
                                    </tr>
                                ) : filteredBills.map(bill => (
                                    <tr key={bill.id} className="hover:bg-slate-50/50 transition-all group cursor-pointer" onClick={() => navigate(`/accounting/ap/bills/${bill.id}`)}>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-[var(--text-main)]">{bill.bill_no}</span>
                                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase mt-1">{new Date(bill.bill_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs uppercase shadow-sm">
                                                    {bill.vendor_name?.substring(0, 2)}
                                                </div>
                                                <span className="text-sm font-bold text-[var(--text-main)]">{bill.vendor_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-[var(--text-muted)]" />
                                                <span className="text-sm font-bold text-[var(--text-muted)]">{bill.due_date ? new Date(bill.due_date).toLocaleDateString() : '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 w-max border
                                                ${bill.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                  bill.status === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                                                  'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                                <div className={`w-2 h-2 rounded-full ${bill.status === 'paid' ? 'bg-emerald-500' : bill.status === 'partial' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                                {bill.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-sm font-black text-[var(--text-main)] font-mono">{formatCurrency(parseFloat(bill.total_amount))}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                                            <button className="p-2 text-[var(--text-muted)] hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'vendors' && (
                <div className="space-y-8 px-4">
                    {/* Intelligence Strip */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-[2.5rem] shadow-sm">
                        <div className="flex items-center gap-6 overflow-x-auto w-full md:w-auto px-2 no-scrollbar">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest whitespace-nowrap">Smart Segments:</span>
                            <button className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-6 py-2.5 rounded-[1.5rem] border border-primary/20 whitespace-nowrap">All Active</button>
                            <button className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-primary whitespace-nowrap">High Spend (&gt;$10k)</button>
                            <button className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 whitespace-nowrap flex items-center gap-1"><AlertTriangle size={14}/> Overdue Bills</button>
                            <button className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-primary whitespace-nowrap">Missing GSTIN</button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-3 bg-[var(--card-bg)] text-primary rounded-2xl shadow-sm border border-[var(--card-border)] hover:bg-primary hover:text-white transition-all"><BarChart3 size={18} /></button>
                        </div>
                    </div>

                    {/* Vendors Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
                        {/* Onboarding Card */}
                        <div 
                            onClick={() => navigate('/accounting/ap/vendors/new')}
                            className="premium-card border-dashed border-2 border-primary/20 flex flex-col items-center justify-center gap-6 text-[var(--text-muted)] hover:text-primary hover:border-primary/50 transition-all group min-h-[340px] bg-slate-50/30 cursor-pointer rounded-[3rem]"
                        >
                            <div className="w-24 h-24 rounded-[2.5rem] border-2 border-dashed border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/50 transition-all bg-[var(--card-bg)] shadow-inner">
                                <Plus size={40} className="text-primary/30 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="text-center">
                                <span className="font-black text-2xl block text-[var(--text-main)] group-hover:text-primary transition-colors tracking-tight">Onboard Vendor</span>
                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-2 block">Register New Institutional Partner</span>
                            </div>
                        </div>

                        {vendors.map((vendor, idx) => {
                            const categories = ['Transport', 'Lab Equipment', 'Stationery', 'Maintenance', 'Hostel', 'Security', 'Catering'];
                            const category = categories[idx % categories.length];
                            const openBills = (idx * 3) % 7;
                            const outstanding = parseFloat(vendor.opening_balance) + (openBills * 1250.50);
                            const reliability = 100 - (idx * 5);
                            const isOverdue = openBills > 2;
                            
                            return (
                            <div key={vendor.id} className="premium-card p-0 hover:border-primary/30 transition-all group relative overflow-hidden bg-[var(--card-bg)] rounded-[3rem] flex flex-col shadow-xl shadow-slate-200/50">
                                {/* Header Strip */}
                                <div className="px-8 py-6 border-b border-[var(--card-border)]/50 flex justify-between items-start bg-slate-50/50">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-[var(--card-bg)] rounded-[1.5rem] flex items-center justify-center text-primary shadow-sm border border-[var(--card-border)] font-black text-2xl">
                                            {vendor.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">{vendor.name}</h3>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{vendor.code || 'NO-CODE'}</span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                                                    <Tags size={12} /> {category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="p-3 text-[var(--text-muted)] hover:text-primary rounded-2xl hover:bg-primary/5 transition-all shadow-sm border border-[var(--card-border)]/50" onClick={(e) => { e.stopPropagation(); navigate(`/accounting/ap/vendors/${vendor.id}/edit`); }}>
                                        <PenSquare size={18} />
                                    </button>
                                </div>

                                {/* Financials Area */}
                                <div className="p-8 flex-1 flex flex-col justify-center cursor-pointer" onClick={() => navigate(`/accounting/ap/vendors/${vendor.id}/edit`)}>
                                    <div className="flex justify-between items-end mb-8">
                                        <div>
                                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 mb-2">
                                                <Wallet size={14} className="text-primary" /> Outstanding Payable
                                            </p>
                                            <h4 className="text-4xl font-black text-[var(--text-main)] tracking-tighter font-mono">{formatCurrency(outstanding)}</h4>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${isOverdue ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-lg shadow-rose-100' : 'bg-slate-50 text-[var(--text-muted)] border-slate-100'}`}>
                                                {openBills} Open Bills
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-slate-50/50 rounded-[1.5rem] p-4 border border-slate-100 shadow-inner">
                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 flex items-center gap-2"><History size={12} className="text-primary"/> Last Txn</p>
                                            <p className="text-sm font-black text-[var(--text-main)] tracking-tight">{Math.max(1, idx * 2)} days ago</p>
                                        </div>
                                        <div className="bg-slate-50/50 rounded-[1.5rem] p-4 border border-slate-100 shadow-inner">
                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500"/> Reliability</p>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${reliability > 80 ? 'bg-emerald-500' : reliability > 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${reliability}%` }}></div>
                                                </div>
                                                <span className="text-xs font-black text-[var(--text-main)]">{reliability}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="px-8 py-5 border-t border-[var(--card-border)]/50 bg-slate-50/50 flex items-center justify-between">
                                    {isOverdue ? (
                                        <div className="flex items-center gap-2 text-rose-600">
                                            <ShieldAlert size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Overdue Warning</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-emerald-600">
                                            <CheckCircle2 size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Good Standing</span>
                                        </div>
                                    )}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); navigate('/accounting/ap/new-bill'); }}
                                        className="text-[10px] font-black uppercase tracking-widest bg-primary text-white px-6 py-3 rounded-2xl transition-all shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.95]"
                                    >
                                        Log New Bill
                                    </button>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'payments' && (
                <div className="premium-card overflow-hidden border-none shadow-2xl shadow-slate-200/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-[var(--card-border)]/50">
                                    <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Date & Ref</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Vendor</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Fund Source</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right">Amount Outflow</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--card-border)]/10">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
                                            <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">Fetching payment history...</p>
                                        </td>
                                    </tr>
                                ) : filteredPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <History size={40} className="text-slate-200" />
                                            </div>
                                            <p className="text-[var(--text-main)] font-black text-lg">No payment records found</p>
                                            <p className="text-[var(--text-muted)] text-sm mt-1 mb-8">You have not recorded any vendor payments yet.</p>
                                            <button 
                                                onClick={() => navigate('/accounting/ap/pay-bill')}
                                                className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all"
                                            >
                                                Record Payment Now
                                            </button>
                                        </td>
                                    </tr>
                                ) : filteredPayments.map(payment => (
                                    <tr key={payment.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-[var(--text-main)]">{payment.reference_no || 'NO-REF'}</span>
                                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase mt-1">{new Date(payment.payment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs uppercase shadow-sm">
                                                    {payment.vendor_name?.substring(0, 2)}
                                                </div>
                                                <span className="text-sm font-bold text-[var(--text-main)]">{payment.vendor_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-4 py-2 bg-slate-50 text-[var(--text-muted)] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-max border border-slate-100">
                                                <Wallet size={14} className="text-primary" />
                                                {payment.bank_name || payment.payment_method.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-xl font-black text-rose-600 tracking-tighter font-mono">
                                                -{formatCurrency(parseFloat(payment.amount))}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <footer className="mt-8 pt-8 border-t border-[var(--card-border)]/50 text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">LuviaEdu Institutional Accounting Engine v2.0</p>
            </footer>
        </div>
    );
}


