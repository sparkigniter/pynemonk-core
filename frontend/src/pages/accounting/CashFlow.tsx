import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Download, Printer, 
    Activity, ArrowUpRight, ArrowDownRight,
    Search, Calendar
} from 'lucide-react';
import { getCashFlow, getAccountingSettings } from '../../api/accounting.api';

export default function CashFlow() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [settings, setSettings] = useState<any>({ base_currency: 'USD', currency_symbol: '$' });
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [cfData, settingsData] = await Promise.all([
                getCashFlow(dateRange.start, dateRange.end),
                getAccountingSettings()
            ]);
            setData(cfData);
            setSettings(settingsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const formatCurrency = (amount: any) => {
        const val = parseFloat(amount || 0);
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: settings.base_currency || 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const exportToCSV = () => {
        if (!data) return;
        let csv = 'Date,Description,Account,Inflow,Outflow\n';
        data.activities.forEach((a: any) => {
            csv += `${new Date(a.entry_date).toLocaleDateString()},"${a.description}",${a.account_name},${a.inflow},${a.outflow}\n`;
        });
        csv += `\nNet Cash Flow,,,${data.netCashFlow}\n`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `cash_flow_${dateRange.start}_to_${dateRange.end}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking Liquidity...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10 max-w-[1200px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            Cash Flow Statement
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg border border-blue-100">Liquidity</span>
                        </h1>
                        <p className="text-sm text-slate-400 font-medium">Monitoring operational & investing movements</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden px-4 py-1 gap-4">
                        <Calendar size={14} className="text-slate-400" />
                        <input 
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="py-1.5 text-xs font-bold outline-none border-none focus:ring-0"
                        />
                        <span className="text-slate-300">to</span>
                        <input 
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="py-1.5 text-xs font-bold outline-none border-none focus:ring-0"
                        />
                    </div>
                    <button 
                        onClick={exportToCSV}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all shadow-sm" title="Export CSV"
                    >
                        <Download size={18} />
                    </button>
                    <button 
                        onClick={() => window.print()}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all shadow-sm" title="Print"
                    >
                        <Printer size={18} />
                    </button>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Inflow</p>
                        <h3 className="text-2xl font-black text-emerald-600">{formatCurrency(data.totalInflow)}</h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <ArrowUpRight size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Outflow</p>
                        <h3 className="text-2xl font-black text-rose-600">{formatCurrency(data.totalOutflow)}</h3>
                    </div>
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                        <ArrowDownRight size={24} />
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl flex items-center justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Cash Flow</p>
                        <h3 className={`text-2xl font-black ${data.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(data.netCashFlow)}
                        </h3>
                    </div>
                    <div className="relative z-10 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                        <Activity size={24} />
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                </div>
            </div>

            {/* Activities Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Transaction Log</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input 
                            type="text"
                            placeholder="Filter by description..."
                            className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs outline-none focus:ring-1 ring-primary/20 w-64"
                        />
                    </div>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-8 py-4">Date</th>
                            <th className="px-8 py-4">Account / Description</th>
                            <th className="px-8 py-4 text-right text-emerald-600">Inflow (+)</th>
                            <th className="px-8 py-4 text-right text-rose-600">Outflow (-)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {data.activities.length === 0 ? (
                            <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-300 italic text-sm">No cash movements in this period</td></tr>
                        ) : data.activities.map((a: any, i: number) => (
                            <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-5 text-xs font-bold text-slate-400">
                                    {new Date(a.entry_date).toLocaleDateString()}
                                </td>
                                <td className="px-8 py-5">
                                    <p className="text-sm font-bold text-slate-800">{a.description}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{a.account_name}</p>
                                </td>
                                <td className="px-8 py-5 text-right text-sm font-black text-emerald-600">
                                    {parseFloat(a.inflow) > 0 ? `+${formatCurrency(a.inflow)}` : '-'}
                                </td>
                                <td className="px-8 py-5 text-right text-sm font-black text-rose-600">
                                    {parseFloat(a.outflow) > 0 ? `-${formatCurrency(a.outflow)}` : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
