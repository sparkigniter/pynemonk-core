import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
    Layout, PieChart, BarChart2, 
    Activity, Share2, Download
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { getProfitAndLoss, getBalanceSheet, getCashFlow, getTrialBalance } from '../../api/accounting.api';

export default function ReportsLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { notify } = useNotification();
    
    const tabs = [
        { id: 'analytics', label: 'Analytics', icon: BarChart2, path: '/accounting/reports/analytics' },
        { id: 'library', label: 'Report Library', icon: PieChart, path: '/accounting/reports' },
        { id: 'designer', label: 'Template Designer', icon: Layout, path: '/accounting/reports/templates' },
    ];

    const currentTab = tabs.find(t => t.path === location.pathname)?.id || 'library';

    const handleBatchExport = async () => {
        try {
            notify('info', 'Preparing financial package. Please wait...');
            const [pl, bs, cf, tb] = await Promise.all([
                getProfitAndLoss(),
                getBalanceSheet(),
                getCashFlow(),
                getTrialBalance()
            ]);

            let csv = 'PYNEMONK INSTITUTIONAL FINANCIAL PACKAGE\n';
            csv += `Generated On: ${new Date().toLocaleString()}\n\n`;

            // Simplified export logic for the example
            csv += '--- FINANCIAL PACKAGE SUMMARY ---\n';
            csv += `Trial Balance Items: ${tb.length}\n`;
            csv += `Net Profit: ${pl.netProfit}\n`;
            csv += `Total Assets: ${bs.totalAssets}\n`;
            csv += `Net Cash Flow: ${cf.netCashFlow}\n`;

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Institutional_Package_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            notify('success', 'Financial package exported successfully.');
        } catch (err) {
            notify('error', 'Failed to generate batch export.');
        }
    };

    return (
        <div className="p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <Activity size={12} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Insight Center</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Financial Reporting</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">SaaS-grade institutional reporting and automated financial analysis.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                        <Share2 size={18} />
                        Share Statements
                    </button>
                    <button 
                        onClick={handleBatchExport}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Download size={18} />
                        Batch Export
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-3xl w-fit border border-slate-200 ml-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => navigate(tab.path)}
                        className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                            currentTab === tab.id 
                            ? 'bg-white text-primary shadow-xl shadow-slate-200 border border-slate-100' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Page Content */}
            <div className="pt-4">
                <Outlet />
            </div>

            <footer className="mt-8 pt-8 border-t border-slate-100 text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">LuviaEdu Reporting Engine v3.0 • Verified Financial Intelligence</p>
            </footer>
        </div>
    );
}
