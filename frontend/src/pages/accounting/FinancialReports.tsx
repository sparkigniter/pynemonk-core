import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    BarChart2, PieChart, TrendingUp, Download, 
    ChevronRight, 
    Activity, 
    Clock, GraduationCap, AlertCircle, CreditCard
} from 'lucide-react';

const reportGroups = [
    {
        name: 'Financial Statements',
        reports: [
            { title: 'Profit & Loss', desc: 'Income vs Expenses summary', icon: TrendingUp, color: 'emerald' },
            { title: 'Balance Sheet', desc: 'Assets, Liabilities & Equity', icon: PieChart, color: 'indigo' },
            { title: 'Cash Flow', desc: 'Operating & Investing flows', icon: Activity, color: 'blue' },
            { title: 'Trial Balance', desc: 'Account debit/credit parity', icon: BarChart2, color: 'amber' },
        ]
    },
    {
        name: 'Accounts Receivable (Fees)',
        reports: [
            { title: 'Fee Aging Report', desc: 'Overdue fees by age group', icon: Clock, color: 'rose' },
            { title: 'Class Collection', desc: 'Efficiency by grade/section', icon: GraduationCap, color: 'indigo' },
            { title: 'Defaulter List', desc: 'Students with pending dues', icon: AlertCircle, color: 'rose' },
        ]
    },
    {
        name: 'Accounts Payable',
        reports: [
            { title: 'Vendor Aging', desc: 'Unpaid bills by duration', icon: Clock, color: 'rose' },
            { title: 'Payment History', desc: 'Log of outgoing funds', icon: CreditCard, color: 'emerald' },
        ]
    }
];

export default function FinancialReports() {
    const navigate = useNavigate();
    const [loading] = useState(false);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin shadow-lg" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating Financial Insights...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Report Categories Grid */}
            <div className="grid grid-cols-1 gap-16 pt-4">
                {reportGroups.map((group: any, idx: number) => (
                    <div key={idx} className="space-y-8 px-4">
                        <div className="flex items-center gap-6">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">{group.name}</h3>
                            <div className="flex-1 h-px bg-gradient-to-r from-slate-200/50 to-transparent" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {group.reports.map((report: any, ridx: number) => (
                                <button 
                                    key={ridx}
                                    onClick={() => {
                                        const slug = report.title.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
                                        if (slug === 'fee-aging-report' || slug === 'class-collection' || slug === 'defaulter-list') {
                                            navigate(`/accounting/reports/aging?type=ar&sourceType=fee&title=${encodeURIComponent(report.title)}`);
                                        } else if (slug === 'vendor-aging') {
                                            navigate('/accounting/reports/aging?type=ap');
                                        } else {
                                            navigate(`/accounting/reports/${slug}`);
                                        }
                                    }}
                                    className="premium-card p-8 flex flex-col text-left group hover:border-primary/40 transition-all relative overflow-hidden bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border-slate-100"
                                >
                                    <div className={`w-14 h-14 rounded-2xl bg-slate-50/50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 mb-8 shadow-sm border border-slate-100`}>
                                        <report.icon size={28} />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-800 mb-2 tracking-tight">{report.title}</h4>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 line-clamp-2">{report.desc}</p>
                                    
                                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Verified Ledger</span>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300 group-hover:text-primary group-hover:translate-x-2 transition-all duration-500" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Export Vault - Moved from separate page for utility */}
            <div className="p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden mt-10">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
                        <Download size={20} />
                    </div>
                    <h3 className="text-xl font-black tracking-tight">Rapid Export Vault</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { name: 'Income Statement', format: 'PDF', icon: BarChart2 },
                        { name: 'Trial Balance', format: 'Excel', icon: Activity },
                        { name: 'Fee Defaulters', format: 'CSV', icon: AlertCircle },
                        { name: 'Full Package', format: 'ZIP', icon: PieChart },
                    ].map((file: any, fidx: number) => (
                        <div key={fidx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-all">
                                    <file.icon size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-black leading-none">{file.name}</p>
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1.5">{file.format}</p>
                                </div>
                            </div>
                            <Download size={14} className="text-white/20 group-hover:text-primary transition-all" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
