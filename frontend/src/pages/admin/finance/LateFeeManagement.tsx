import { useState, useEffect } from 'react';
import { 
    Clock, Plus, Shield, 
    CheckCircle2, 
    Loader2, Trash2, Settings,
    ArrowRight, Info, Play
} from 'lucide-react';
import { get, post } from '../../../api/base.api';
import { useNotification } from '../../../contexts/NotificationContext';

export default function LateFeeManagement() {
    const { notify } = useNotification();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [policies, setPolicies] = useState<any[]>([]);
    const [showNewForm, setShowNewForm] = useState(false);
    const [newPolicy, setNewPolicy] = useState({
        name: '',
        fee_type: 'fixed',
        amount: 0,
        grace_period_days: 5,
        frequency: 'daily'
    });

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            setLoading(true);
            const res = await get('/accounting/automation/late-fees/policies') as any;
            setPolicies(res.data);
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
            await post('/accounting/automation/late-fees/policies', newPolicy);
            setNewPolicy({ name: '', fee_type: 'fixed', amount: 0, grace_period_days: 5, frequency: 'daily' });
            setShowNewForm(false);
            fetchPolicies();
            notify('success', 'Policy Created', 'Your late fee rule is now active.');
        } catch (err) {
            notify('error', 'Failed', 'Could not save policy.');
        } finally {
            setProcessing(false);
        }
    };

    const runAutomation = async () => {
        try {
            setProcessing(true);
            const res = await post('/accounting/automation/late-fees/run', {}) as any;
            notify('success', 'Automation Complete', `Processed overdue invoices. Revenue Generated: $${res.data.totalRevenue}`);
            fetchPolicies();
        } catch (err) {
            notify('error', 'Error', 'Failed to run automation.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-[10px]">Configuring Fine Engine...</div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header section with CTA */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-slate-200">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                        <Shield size={12} className="text-primary" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">Automated Compliance</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">Late Fee <span className="text-primary">Automation</span></h2>
                    <p className="text-sm text-white/50 font-medium max-w-md">Enforce financial discipline by automatically applying fines to overdue installments based on your custom policies.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={runAutomation}
                        disabled={processing}
                        className="px-8 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
                    >
                        {processing ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                        Run Automation Now
                    </button>
                    <button 
                        onClick={() => setShowNewForm(true)}
                        className="px-8 py-4 bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10 flex items-center gap-3"
                    >
                        <Plus size={16} />
                        New Policy
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Policy List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Policies</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {policies.length === 0 && (
                            <div className="col-span-2 p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center space-y-4">
                                <Clock className="mx-auto text-slate-300" size={40} />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active policies found</p>
                            </div>
                        )}
                        {policies.map(policy => (
                            <div key={policy.id} className="premium-card p-8 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-slate-300 hover:text-rose-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                        <Clock size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-black text-slate-900">{policy.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {policy.fee_type === 'fixed' ? `$${policy.amount}` : `${policy.amount}%`} {policy.frequency}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grace Period</p>
                                        <p className="text-xs font-bold text-slate-900">{policy.grace_period_days} Days</p>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                        Active
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info & Stats */}
                <div className="space-y-8">
                    <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 space-y-4">
                        <div className="flex items-center gap-3 text-amber-600">
                            <Info size={20} />
                            <h4 className="text-xs font-black uppercase tracking-widest">Operational Logic</h4>
                        </div>
                        <p className="text-xs text-amber-900/70 font-medium leading-relaxed">
                            When automation runs, the system identifies all unpaid invoices past their grace period. 
                            It updates the **Invoice Balance** and posts a corresponding credit entry to your **Late Fee Revenue** account.
                        </p>
                        <div className="pt-2">
                            <button className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                                Read documentation
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white space-y-6 shadow-2xl shadow-indigo-200">
                        <div className="flex items-center gap-3 opacity-60">
                            <Settings size={20} />
                            <h4 className="text-xs font-black uppercase tracking-widest">System Mapping</h4>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Revenue Ledger</p>
                            <p className="text-lg font-black tracking-tight">Late Fee Income (4200)</p>
                        </div>
                        <p className="text-[10px] font-medium opacity-70 italic">
                            All automated fines are strictly posted to this ledger for audit transparency.
                        </p>
                    </div>
                </div>
            </div>

            {showNewForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowNewForm(false)} />
                    <form onSubmit={handleCreate} className="relative w-full max-w-xl bg-white rounded-[3rem] p-12 space-y-10 shadow-3xl animate-in zoom-in duration-300">
                        <div className="space-y-2 text-center">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Create Fine Policy</h3>
                            <p className="text-xs font-medium text-slate-400">Define how the automation engine should penalize overdue debt.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Policy Name</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Standard Tuition Fine"
                                    className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                    value={newPolicy.name}
                                    onChange={e => setNewPolicy({...newPolicy, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Calculation Type</label>
                                    <select 
                                        className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                        value={newPolicy.fee_type}
                                        onChange={e => setNewPolicy({...newPolicy, fee_type: e.target.value})}
                                    >
                                        <option value="fixed">Fixed Amount</option>
                                        <option value="percentage">Percentage of Due</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount / %</label>
                                    <input 
                                        type="number" 
                                        required
                                        className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                        value={newPolicy.amount}
                                        onChange={e => setNewPolicy({...newPolicy, amount: parseFloat(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grace Period (Days)</label>
                                    <input 
                                        type="number" 
                                        required
                                        className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                        value={newPolicy.grace_period_days}
                                        onChange={e => setNewPolicy({...newPolicy, grace_period_days: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</label>
                                    <select 
                                        className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                        value={newPolicy.frequency}
                                        onChange={e => setNewPolicy({...newPolicy, frequency: e.target.value})}
                                    >
                                        <option value="one-time">One-time Fine</option>
                                        <option value="daily">Every Day Overdue</option>
                                        <option value="monthly">Every Month Overdue</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <button type="button" onClick={() => setShowNewForm(false)} className="flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                            <button 
                                type="submit" 
                                disabled={processing}
                                className="flex-[2] py-5 bg-primary text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {processing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                Activate Policy
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
