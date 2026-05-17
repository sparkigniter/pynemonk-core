import { useState, useEffect } from 'react';
import { 
    Calendar, Plus, 
    Lock, Unlock, Loader2,
    Info
} from 'lucide-react';
import { getFiscalYears, createFiscalYear, closeFiscalYear } from '../../../api/accounting.api';

export default function FiscalYearSettings() {
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [years, setYears] = useState<any[]>([]);
    const [showNewForm, setShowNewForm] = useState(false);
    const [newYear, setNewYear] = useState({
        name: '',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        fetchYears();
    }, []);

    const fetchYears = async () => {
        try {
            setLoading(true);
            const data = await getFiscalYears();
            setYears(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setProcessing(true);
            await createFiscalYear(newYear);
            setNewYear({ name: '', start_date: '', end_date: '' });
            setShowNewForm(false);
            fetchYears();
        } catch (err) {
            alert('Failed to create fiscal year');
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = async (id: number) => {
        if (!confirm('Are you sure you want to close this fiscal year? This will generate closing entries and move balances to Retained Earnings. This action is irreversible.')) return;
        try {
            setProcessing(true);
            await closeFiscalYear(id);
            fetchYears();
        } catch (err) {
            alert('Failed to close fiscal year');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Fiscal Cycles...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Fiscal <span className="text-primary">Lifecycle</span></h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage institutional financial periods and year-end closing</p>
                </div>
                <button 
                    onClick={() => setShowNewForm(true)}
                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
                >
                    <Plus size={16} />
                    New Fiscal Year
                </button>
            </div>

            {showNewForm && (
                <form onSubmit={handleCreate} className="p-8 bg-white border-2 border-primary/20 rounded-[2.5rem] space-y-6 animate-in zoom-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Year Name (e.g. FY 2026-27)</label>
                            <input 
                                type="text" 
                                required
                                className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-primary/20"
                                value={newYear.name}
                                onChange={e => setNewYear({...newYear, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                            <input 
                                type="date" 
                                required
                                className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-primary/20"
                                value={newYear.start_date}
                                onChange={e => setNewYear({...newYear, start_date: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                            <input 
                                type="date" 
                                required
                                className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-primary/20"
                                value={newYear.end_date}
                                onChange={e => setNewYear({...newYear, end_date: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                        <button type="button" onClick={() => setShowNewForm(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={processing}
                            className="px-10 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                        >
                            {processing ? <Loader2 className="animate-spin" size={16} /> : 'Initialize Year'}
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiscal Period</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {years.map(year => (
                            <tr key={year.id} className="group hover:bg-slate-50/50 transition-all">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${year.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Calendar size={20} />
                                        </div>
                                        <span className="text-sm font-black text-slate-900">{year.name}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-sm font-bold text-slate-500">{new Date(year.start_date).toLocaleDateString()}</td>
                                <td className="px-8 py-5 text-sm font-bold text-slate-500">{new Date(year.end_date).toLocaleDateString()}</td>
                                <td className="px-8 py-5">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                        year.status === 'open' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {year.status === 'open' ? <Unlock size={10} /> : <Lock size={10} />}
                                        {year.status}
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    {year.status === 'open' ? (
                                        <button 
                                            onClick={() => handleClose(year.id)}
                                            disabled={processing}
                                            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-md"
                                        >
                                            Close Year
                                        </button>
                                    ) : (
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Archived</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-4 text-amber-800">
                <Info className="flex-shrink-0" size={24} />
                <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-tight">Closing Logic Disclosure</p>
                    <p className="text-xs font-medium opacity-80 leading-relaxed">
                        Closing a fiscal year will automatically zero out all Income and Expense accounts and transfer the net profit/loss to the **Retained Earnings** account. This process is essential for accurate Balance Sheet reporting in the next period.
                    </p>
                </div>
            </div>
        </div>
    );
}
