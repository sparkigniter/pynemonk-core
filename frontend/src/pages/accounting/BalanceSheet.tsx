import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Download, Printer, 
    Building, Wallet, Scale,
    AlertCircle
} from 'lucide-react';
import { getBalanceSheet, getAccountingSettings } from '../../api/accounting.api';

export default function BalanceSheet() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [settings, setSettings] = useState<any>({ base_currency: 'USD', currency_symbol: '$' });
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [bsData, settingsData] = await Promise.all([
                getBalanceSheet(asOfDate),
                getAccountingSettings()
            ]);
            setData(bsData);
            setSettings(settingsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [asOfDate]);

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
        let csv = 'Category,Account,Balance\n';
        
        data.assets.forEach((a: any) => csv += `Assets,${a.account_name},${a.balance}\n`);
        csv += `Total Assets,,${data.totalAssets}\n\n`;
        
        data.liabilities.forEach((l: any) => csv += `Liabilities,${l.account_name},${l.balance}\n`);
        csv += `Total Liabilities,,${data.totalLiabilities}\n\n`;
        
        data.equity.forEach((e: any) => csv += `Equity,${e.account_name},${e.balance}\n`);
        csv += `Total Equity,,${data.totalEquity}\n`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `balance_sheet_${asOfDate}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handlePrint = async () => {
        try {
            const session = localStorage.getItem('eduerp_session');
            const token = session ? JSON.parse(session).accessToken : '';
            
            const response = await fetch(`http://localhost:3000/api/v1/accounting/reports/balance-sheet/export/pdf?date=${asOfDate}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to generate PDF');

            const buffer = await response.arrayBuffer();
            const blob = new Blob([buffer], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `balance_sheet_${asOfDate}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('PDF generation error:', err);
            alert('Failed to generate professional PDF. Please check your template in Designer.');
        }
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculating Balances...</p>
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
                            Balance Sheet
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg border border-indigo-100">Cumulative</span>
                        </h1>
                        <p className="text-sm text-slate-400 font-medium">As of {new Date(asOfDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <input 
                        type="date"
                        value={asOfDate}
                        onChange={(e) => setAsOfDate(e.target.value)}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-primary/20"
                    />
                    <button 
                        onClick={exportToCSV}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all shadow-sm" title="Export CSV"
                    >
                        <Download size={18} />
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all shadow-sm" title="Print"
                    >
                        <Printer size={18} />
                    </button>
                </div>
            </div>

            {/* Balancing Status */}
            {!data.isBalanced && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-700 text-sm font-medium">
                    <AlertCircle size={20} />
                    Warning: Statement is out of balance. Check for unposted journal entries or mapping errors.
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Assets Side */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Wallet size={16} className="text-primary" /> Assets
                        </h3>
                        <span className="text-sm font-black text-slate-900">{formatCurrency(data.totalAssets)}</span>
                    </div>
                    
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-50">
                                {data.assets.map((a: any, i: number) => (
                                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold text-slate-700">{a.account_name}</p>
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{a.code}</p>
                                        </td>
                                        <td className="px-8 py-5 text-right text-sm font-black text-slate-800">
                                            {formatCurrency(a.balance)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50/50">
                                    <td className="px-8 py-6 text-sm font-black text-slate-900 uppercase tracking-widest">Total Assets</td>
                                    <td className="px-8 py-6 text-right text-lg font-black text-primary">
                                        {formatCurrency(data.totalAssets)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Liabilities & Equity Side */}
                <div className="space-y-10">
                    {/* Liabilities */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Building size={16} className="text-rose-400" /> Liabilities
                            </h3>
                            <span className="text-sm font-black text-slate-900">{formatCurrency(data.totalLiabilities)}</span>
                        </div>
                        
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-slate-50">
                                    {data.liabilities.length === 0 ? (
                                        <tr><td className="px-8 py-10 text-center text-slate-300 italic text-sm">No active liabilities</td></tr>
                                    ) : data.liabilities.map((l: any, i: number) => (
                                        <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-bold text-slate-700">{l.account_name}</p>
                                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{l.code}</p>
                                            </td>
                                            <td className="px-8 py-5 text-right text-sm font-black text-slate-800">
                                                {formatCurrency(l.balance)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50/50">
                                        <td className="px-8 py-6 text-sm font-black text-slate-900 uppercase tracking-widest">Total Liabilities</td>
                                        <td className="px-8 py-6 text-right text-lg font-black text-rose-500">
                                            {formatCurrency(data.totalLiabilities)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Equity */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Scale size={16} className="text-indigo-400" /> Equity
                            </h3>
                            <span className="text-sm font-black text-slate-900">{formatCurrency(data.totalEquity)}</span>
                        </div>
                        
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-slate-50">
                                    {data.equity.map((e: any, i: number) => (
                                        <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-bold text-slate-700">{e.account_name}</p>
                                                {e.code && <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{e.code}</p>}
                                            </td>
                                            <td className="px-8 py-5 text-right text-sm font-black text-slate-800">
                                                {formatCurrency(e.balance)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-indigo-900 text-white">
                                        <td className="px-8 py-8">
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300 mb-1">Total Liab. & Equity</p>
                                            <p className="text-xl font-black">Balanced Ledger</p>
                                        </td>
                                        <td className="px-8 py-8 text-right text-2xl font-black">
                                            {formatCurrency(data.totalLiabilities + data.totalEquity)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
