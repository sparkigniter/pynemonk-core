import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
    DollarSign, TrendingUp, TrendingDown, CreditCard, 
    Download, Plus, Search, Filter, MoreVertical, CheckCircle2,
    Clock, AlertCircle
} from 'lucide-react';

const stats = [
    { name: 'Total Revenue', value: '$124,500', change: '+12.5%', isPositive: true, icon: DollarSign, color: 'emerald' },
    { name: 'Pending Dues', value: '$12,450', change: '-2.4%', isPositive: true, icon: Clock, color: 'amber' },
    { name: 'Total Expenses', value: '$45,200', change: '+5.2%', isPositive: false, icon: TrendingDown, color: 'rose' },
    { name: 'Net Profit', value: '$79,300', change: '+18.1%', isPositive: true, icon: TrendingUp, color: 'primary' },
];

const recentInvoices = [
    { id: 'INV-2025-001', student: 'Alex Johnson', grade: 'Grade 10', amount: '$1,200', status: 'paid', date: 'Oct 12, 2025' },
    { id: 'INV-2025-002', student: 'Sarah Smith', grade: 'Grade 8', amount: '$1,100', status: 'pending', date: 'Oct 14, 2025' },
    { id: 'INV-2025-003', student: 'Mike Davis', grade: 'Grade 12', amount: '$1,500', status: 'overdue', date: 'Oct 01, 2025' },
    { id: 'INV-2025-004', student: 'Emily Wilson', grade: 'Grade 5', amount: '$950', status: 'paid', date: 'Oct 15, 2025' },
    { id: 'INV-2025-005', student: 'James Brown', grade: 'Grade 11', amount: '$1,350', status: 'pending', date: 'Oct 16, 2025' },
];

export default function Finance() {
    const { can } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'expenses' | 'settings'>('overview');

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-heading tracking-tight">Finance & Accounting</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage fees, track expenses, and view financial reports.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {can('report:export') && (
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm">
                            <Download size={16} />
                            Export Report
                        </button>
                    )}
                    {can('fee:write') && (
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-theme-primary text-white rounded-xl hover:bg-theme-primary/90 transition-colors shadow-sm font-medium text-sm">
                            <Plus size={16} />
                            New Invoice
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/60 shadow-sm w-max">
                {(['overview', 'invoices', 'expenses', 'settings'] as const)
                    .filter(tab => tab !== 'settings' || can('fee:write'))
                    .map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                                activeTab === tab 
                                ? 'bg-slate-100 text-slate-800 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {stats.map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.name} className={`card p-5 hover-lift delay-${(i+1)*100} relative overflow-hidden group`}>
                                    {/* Decorative background element */}
                                    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-${stat.color} opacity-10 group-hover:scale-150 transition-transform duration-500 ease-out`} />
                                    
                                    <div className="flex justify-between items-start mb-4 relative">
                                        <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                                            stat.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                                        }`}>
                                            {stat.change}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <h3 className="text-3xl font-bold text-slate-800 font-heading tracking-tight">{stat.value}</h3>
                                        <p className="text-sm text-slate-500 font-medium mt-1">{stat.name}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Recent Invoices */}
                        <div className="lg:col-span-2 card p-6 delay-300">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 font-heading">Recent Invoices</h3>
                                    <p className="text-sm text-slate-500">Latest fee generation and collections</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" placeholder="Search..." className="pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                    <button className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
                                        <Filter size={18} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice ID</th>
                                            <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Student</th>
                                            <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                                            <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                                            <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                            <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {recentInvoices.map(invoice => (
                                            <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="py-3.5 pr-4 text-sm font-medium text-slate-700">{invoice.id}</td>
                                                <td className="py-3.5 pr-4">
                                                    <div className="text-sm font-semibold text-slate-800">{invoice.student}</div>
                                                    <div className="text-xs text-slate-500">{invoice.grade}</div>
                                                </td>
                                                <td className="py-3.5 pr-4 text-sm font-semibold text-slate-700">{invoice.amount}</td>
                                                <td className="py-3.5 pr-4 text-sm text-slate-500">{invoice.date}</td>
                                                <td className="py-3.5 pr-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                                                        invoice.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                                                        'bg-rose-50 text-rose-700'
                                                    }`}>
                                                        {invoice.status === 'paid' && <CheckCircle2 size={12} />}
                                                        {invoice.status === 'pending' && <Clock size={12} />}
                                                        {invoice.status === 'overdue' && <AlertCircle size={12} />}
                                                        <span className="capitalize">{invoice.status}</span>
                                                    </span>
                                                </td>
                                                <td className="py-3.5 text-right">
                                                    <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary side panel */}
                        <div className="space-y-6 delay-400">
                            <div className="card p-6">
                                <h3 className="text-lg font-bold text-slate-800 font-heading mb-4">Collection Overview</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1.5">
                                            <span className="text-slate-500 font-medium">Collected</span>
                                            <span className="text-slate-800 font-bold">85%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1.5">
                                            <span className="text-slate-500 font-medium">Pending</span>
                                            <span className="text-slate-800 font-bold">12%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500 rounded-full" style={{ width: '12%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1.5">
                                            <span className="text-slate-500 font-medium">Overdue</span>
                                            <span className="text-slate-800 font-bold">3%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-rose-500 rounded-full" style={{ width: '3%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-xl shadow-indigo-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <CreditCard size={20} />
                                    </div>
                                    <h3 className="font-semibold text-lg">Next Payout</h3>
                                </div>
                                <h2 className="text-3xl font-bold font-heading my-4">$24,500.00</h2>
                                <p className="text-indigo-100 text-sm mb-4">Expected clearing on Oct 25, 2025</p>
                                <button className="w-full py-2.5 bg-white text-indigo-600 rounded-xl font-semibold text-sm hover:bg-indigo-50 transition-colors">
                                    View Breakdown
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
            
            {activeTab === 'invoices' && (
                <div className="card p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <CreditCard className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Full Invoice Management</h3>
                    <p className="text-slate-500 max-w-sm mb-6">Create, send, and track fee invoices for all students across different categories.</p>
                    {can('fee:write') && (
                        <button className="px-5 py-2.5 bg-theme-primary text-white rounded-xl font-medium hover:bg-theme-primary/90">
                            Create First Invoice
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
