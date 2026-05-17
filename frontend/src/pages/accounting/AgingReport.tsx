import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    ArrowLeft, Download,
    Search, User, Building,
    ChevronRight, AlertCircle, Filter, ChevronDown, FileText, Layout
} from 'lucide-react';
import { getARAging, getAPAging, getAccountingSettings, getPartners } from '../../api/accounting.api';

export default function AgingReport() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'ar'; // ar or ap
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [partners, setPartners] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>({ base_currency: 'USD', currency_symbol: '$' });
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Advanced Filters State
    const [filters, setFilters] = useState({
        fromPartnerId: '',
        toPartnerId: '',
        isDetailed: false,
        status: '',
        sourceType: searchParams.get('sourceType') || ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reportData, settingsData, partnersData] = await Promise.all([
                type === 'ar' ? getARAging({
                    sourceType: filters.sourceType || undefined,
                    fromPartnerId: filters.fromPartnerId ? Number(filters.fromPartnerId) : undefined,
                    toPartnerId: filters.toPartnerId ? Number(filters.toPartnerId) : undefined,
                    isDetailed: filters.isDetailed,
                    status: filters.status || undefined
                }) : getAPAging(),
                getAccountingSettings(),
                getPartners(type === 'ar' ? 'student' : 'vendor')
            ]);
            setData(reportData);
            setSettings(settingsData);
            setPartners(partnersData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [type, filters]);

    const formatCurrency = (amount: any) => {
        const val = parseFloat(amount || 0);
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: settings.base_currency || 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const filteredData = data.filter(item => 
        (item.partner_name || item.student_name || item.vendor_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.student_id_no || item.vendor_code || item.invoice_no || '').includes(searchQuery)
    );

    const totals = filters.isDetailed ? { current: 0, overdue30: 0, overdue60: 0, overdue90: 0, total: data.reduce((sum, item) => sum + parseFloat(item.due_amount || 0), 0) } : data.reduce((acc, item) => {
        acc.current += parseFloat(item.current_30 || 0);
        acc.overdue30 += parseFloat(item.overdue_31_60 || 0);
        acc.overdue60 += parseFloat(item.overdue_61_90 || 0);
        acc.overdue90 += parseFloat(item.overdue_91_plus || 0);
        acc.total += parseFloat(item.total_outstanding || 0);
        return acc;
    }, { current: 0, overdue30: 0, overdue60: 0, overdue90: 0, total: 0 });

    const exportToCSV = () => {
        if (!data.length) return;
        let csv = '';
        if (filters.isDetailed) {
            csv = 'Partner,Invoice No,Date,Due Date,Total,Paid,Balance,Status,Source\n';
            data.forEach(item => {
                csv += `"${item.partner_name}",${item.invoice_no},${item.invoice_date},${item.due_date},${item.total_amount},${item.paid_amount},${item.due_amount},${item.status},${item.source_type}\n`;
            });
        } else {
            csv = 'Partner,ID,0-30 Days,31-60 Days,61-90 Days,90+ Days,Total Outstanding\n';
            data.forEach(item => {
                csv += `"${item.partner_name || item.student_name || item.vendor_name}",${item.student_id_no || item.vendor_code},${item.current_30},${item.overdue_31_60},${item.overdue_61_90},${item.overdue_91_plus},${item.total_outstanding}\n`;
            });
            csv += `TOTALS,,${totals.current},${totals.overdue30},${totals.overdue60},${totals.overdue90},${totals.total}\n`;
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `${type}_aging_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (loading && data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating Audit Reports...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-[1500px] mx-auto animate-in fade-in duration-500">
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
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            <span>{filters.isDetailed ? 'Detailed Ledger' : 'Aging Report'}</span>
                            <ChevronRight size={10} />
                            <span>{type === 'ar' ? 'Receivables' : 'Payables'}</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            {searchParams.get('title') || (type === 'ar' ? 'Fee Aging Report' : 'Vendor Aging Report')}
                            <div className={`px-2 py-0.5 ${type === 'ar' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'} text-[9px] font-black uppercase rounded-lg border flex items-center gap-1.5`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                {filters.isDetailed ? 'Audit Mode' : 'Management View'}
                            </div>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                            placeholder={`Search ${type === 'ar' ? 'students' : 'vendors'}...`}
                            className="pl-12 pr-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-primary/20 w-64 md:w-80"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl font-bold text-sm transition-all shadow-sm ${showFilters ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary/20'}`}
                    >
                        <Filter size={18} />
                        Filters
                    </button>
                    <button 
                        onClick={exportToCSV}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all shadow-sm" title="Export CSV"
                    >
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">From Partner</label>
                        <div className="relative">
                            <select 
                                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold appearance-none outline-none focus:ring-2 ring-primary/20"
                                value={filters.fromPartnerId}
                                onChange={e => setFilters(f => ({ ...f, fromPartnerId: e.target.value }))}
                            >
                                <option value="">First Partner</option>
                                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">To Partner</label>
                        <div className="relative">
                            <select 
                                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold appearance-none outline-none focus:ring-2 ring-primary/20"
                                value={filters.toPartnerId}
                                onChange={e => setFilters(f => ({ ...f, toPartnerId: e.target.value }))}
                            >
                                <option value="">Last Partner</option>
                                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Report Mode</label>
                        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                            <button 
                                onClick={() => setFilters(f => ({ ...f, isDetailed: false }))}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all ${!filters.isDetailed ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Layout size={14} /> SUMMARY
                            </button>
                            <button 
                                onClick={() => setFilters(f => ({ ...f, isDetailed: true }))}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all ${filters.isDetailed ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <FileText size={14} /> DETAILED
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Source Filter</label>
                        <div className="relative">
                            <select 
                                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold appearance-none outline-none focus:ring-2 ring-primary/20"
                                value={filters.sourceType}
                                onChange={e => setFilters(f => ({ ...f, sourceType: e.target.value }))}
                            >
                                <option value="">All Sources</option>
                                <option value="fee">Academic Fees</option>
                                <option value="manual">Manual Invoices</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>
            )}

            {!filters.isDetailed && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {[
                        { label: '0 - 30 Days', value: totals.current, color: 'emerald' },
                        { label: '31 - 60 Days', value: totals.overdue30, color: 'amber' },
                        { label: '61 - 90 Days', value: totals.overdue60, color: 'orange' },
                        { label: '90+ Days', value: totals.overdue90, color: 'rose' },
                        { label: 'Total Outstanding', value: totals.total, color: 'slate', dark: true },
                    ].map((m, i) => (
                        <div key={i} className={`p-6 rounded-[2rem] border shadow-sm transition-all hover:scale-[1.02] ${m.dark ? 'bg-slate-900 text-white border-slate-800 shadow-xl shadow-slate-200' : 'bg-white border-slate-100 text-slate-800'}`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${m.dark ? 'text-slate-400' : `text-${m.color}-500`}`}>{m.label}</p>
                            <h3 className="text-xl font-black">{formatCurrency(m.value)}</h3>
                            <div className="mt-4 flex items-center justify-between">
                                <span className={`text-[10px] font-bold ${m.dark ? 'text-slate-500' : 'text-slate-300'}`}>
                                    {((m.value / (totals.total || 1)) * 100).toFixed(1)}% of total
                                </span>
                                <div className={`w-1.5 h-1.5 rounded-full ${m.dark ? 'bg-primary' : `bg-${m.color}-400 shadow-[0_0_8px_rgba(var(--${m.color}-rgb),0.5)]`}`} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detailed Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                        {filters.isDetailed ? (
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-8 py-5">Partner & Reference</th>
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5">Source</th>
                                <th className="px-8 py-5 text-right">Total</th>
                                <th className="px-8 py-5 text-right">Paid</th>
                                <th className="px-8 py-5 text-right bg-slate-100/50 text-primary">Balance Due</th>
                            </tr>
                        ) : (
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-8 py-5">Partner Name</th>
                                <th className="px-8 py-5 text-right">0-30 Days</th>
                                <th className="px-8 py-5 text-right">31-60 Days</th>
                                <th className="px-8 py-5 text-right">61-90 Days</th>
                                <th className="px-8 py-5 text-right">90+ Days</th>
                                <th className="px-8 py-5 text-right bg-slate-100/50 text-primary">Total Due</th>
                            </tr>
                        )}
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredData.length === 0 ? (
                            <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-300 italic text-sm">No transaction records found for these filters</td></tr>
                        ) : filteredData.map((item, i) => (
                            <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                {filters.isDetailed ? (
                                    <>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:border-primary/20 transition-all">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{item.partner_name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.invoice_no}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold text-slate-600">{new Date(item.invoice_date).toLocaleDateString()}</p>
                                            <p className="text-[10px] font-medium text-slate-400">Due: {new Date(item.due_date).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${item.source_type === 'fee' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                {item.source_type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right text-sm font-bold text-slate-600">{formatCurrency(item.total_amount)}</td>
                                        <td className="px-8 py-5 text-right text-sm font-bold text-emerald-600">{formatCurrency(item.paid_amount)}</td>
                                        <td className="px-8 py-5 text-right text-sm font-black text-primary bg-slate-50/30 group-hover:bg-slate-100/30 transition-all">
                                            {formatCurrency(item.due_amount)}
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'ar' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} border border-transparent group-hover:border-current transition-all`}>
                                                    {type === 'ar' ? <User size={20} /> : <Building size={20} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{item.partner_name || item.student_name || item.vendor_name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.student_id_no || item.vendor_code}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right text-sm font-bold text-slate-600">{formatCurrency(item.current_30)}</td>
                                        <td className="px-8 py-5 text-right text-sm font-bold text-amber-600">{formatCurrency(item.overdue_31_60)}</td>
                                        <td className="px-8 py-5 text-right text-sm font-bold text-orange-600">{formatCurrency(item.overdue_61_90)}</td>
                                        <td className="px-8 py-5 text-right text-sm font-bold text-rose-600">{formatCurrency(item.overdue_91_plus)}</td>
                                        <td className="px-8 py-5 text-right text-sm font-black text-primary bg-slate-50/30 group-hover:bg-slate-100/30 transition-all">
                                            {formatCurrency(item.total_outstanding)}
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-900 text-white">
                        <tr className="font-black">
                            <td className="px-8 py-6 text-xs uppercase tracking-widest" colSpan={filters.isDetailed ? 5 : 5}>Aggregate Totals</td>
                            <td className="px-8 py-6 text-right text-lg text-primary">{formatCurrency(totals.total)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Risk Disclaimer */}
            <div className="p-6 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 flex items-center gap-4 text-indigo-800">
                <AlertCircle className="text-indigo-500 shrink-0" size={24} />
                <div className="text-sm">
                    <h4 className="font-black uppercase tracking-widest text-[10px] mb-1">Financial Integrity Monitor</h4>
                    <p className="font-medium leading-relaxed opacity-80">
                        This {filters.isDetailed ? 'Detailed Transaction Ledger' : 'Aging Analysis'} was generated on {new Date().toLocaleDateString()}. Total {type === 'ar' ? 'receivable' : 'payable'} exposure is {formatCurrency(totals.total)}. Please ensure all payments are reconciled before the fiscal month-end closing.
                    </p>
                </div>
            </div>
        </div>
    );
}
