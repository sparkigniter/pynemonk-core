import { useState } from 'react';
import { 
    CreditCard, Plus, Search, 
    ArrowUpRight, Download, Filter,
    CheckCircle2, AlertCircle, Clock,
    DollarSign, BookOpen, Layers
} from 'lucide-react';
// import { get, post } from '../../api/base.api'; // Uncomment when needed

export default function AdminFinance() {
    const [activeTab, setActiveTab] = useState<'overview' | 'structures' | 'heads'>('overview');
    
    // Placeholder stats
    const stats = [
        { label: 'Total Expected', value: '$124,500', icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Collected', value: '$98,200', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Outstanding', value: '$26,300', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Late Payments', value: '14', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financial <span className="text-primary">Operations</span></h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Fee collections, structures & treasury management</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2">
                        <Plus size={16} />
                        New Transaction
                    </button>
                    <button className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
                        <Download size={18} className="text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 group hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                                <ArrowUpRight size={14} />
                                +4.2%
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <h2 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h2>
                    </div>
                ))}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-[1.5rem] w-fit">
                {[
                    { id: 'overview', label: 'Collections', icon: CreditCard },
                    { id: 'structures', label: 'Fee Structures', icon: Layers },
                    { id: 'heads', label: 'Fee Heads', icon: BookOpen },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                            ? 'bg-white text-slate-900 shadow-sm shadow-slate-200' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Dynamic Content */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 min-h-[500px] overflow-hidden">
                {activeTab === 'overview' && (
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search by student name, roll number or invoice..." 
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 ring-primary/20"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    <Filter size={14} />
                                    Filter
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student / ID</th>
                                        <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Installment</th>
                                        <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                                        <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="group hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
                                                        {i === 1 ? 'JD' : 'AS'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{i === 1 ? 'John Doe' : 'Alice Smith'}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">#ADM-00{i}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-xs font-bold text-slate-600">Term 1 (Academic)</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm font-black text-slate-900">$1,200.00</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-xs font-bold text-slate-500">Oct 15, 2026</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    i % 2 === 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                    {i % 2 === 0 ? 'Pending' : 'Received'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'structures' && (
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                             <div>
                                <h3 className="text-xl font-black text-slate-900">Fee Structures</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Grade-wise and category-wise fee plans</p>
                            </div>
                            <button className="px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2">
                                <Plus size={14} />
                                Create Plan
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { name: 'Grade 1-5 (Regular)', amount: '$12,000', items: '8 Items' },
                                { name: 'Grade 6-10 (Science)', amount: '$15,500', items: '10 Items' },
                                { name: 'Transport (Zone A)', amount: '$2,400', items: '12 Items' }
                            ].map((plan, i) => (
                                <div key={i} className="p-6 border border-slate-100 rounded-[2rem] bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/30 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-white rounded-2xl shadow-sm">
                                            <Layers size={20} className="text-primary" />
                                        </div>
                                        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                            <Clock size={16} />
                                        </button>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900">{plan.name}</h4>
                                    <div className="flex items-center gap-4 mt-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                                            <p className="text-sm font-black text-primary">{plan.amount}</p>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200" />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequency</p>
                                            <p className="text-sm font-black text-slate-900">{plan.items}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
