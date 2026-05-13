import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, Info } from 'lucide-react';
import * as leaveApi from '../../api/leave.api';
import { useNotification } from '../../contexts/NotificationContext';

export default function LeaveTypeSettings() {
    const { notify } = useNotification();
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        default_days: 12,
        is_paid: true,
        description: ''
    });

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const fetchLeaveTypes = async () => {
        setLoading(true);
        try {
            const data = await leaveApi.getLeaveTypes();
            setLeaveTypes(data);
        } catch (err) {
            console.error('Failed to fetch leave types', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await leaveApi.createLeaveType(formData);
            notify('success', 'Leave Type Created', 'New category added to the institution.');
            setFormData({ name: '', default_days: 12, is_paid: true, description: '' });
            setShowForm(false);
            fetchLeaveTypes();
        } catch (err) {
            notify('error', 'Creation Failed', 'Could not create leave type.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--text-main)]">Configured Types</p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-black">Total: {leaveTypes.length}</p>
                </div>
                {!showForm && (
                    <button 
                        onClick={() => setShowForm(true)}
                        className="btn-primary !py-2 !px-4 !text-[10px] flex items-center gap-2"
                    >
                        <Plus size={14} />
                        Add Category
                    </button>
                )}
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Type Name</label>
                            <input 
                                type="text" required
                                placeholder="e.g. Sick Leave, Annual Leave"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-4 ring-primary/10 transition-all"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Default Annual Entitlement (Days)</label>
                            <input 
                                type="number" required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-4 ring-primary/10 transition-all"
                                value={formData.default_days}
                                onChange={e => setFormData({...formData, default_days: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Description</label>
                        <textarea 
                            rows={2}
                            placeholder="Briefly describe the eligibility or rules for this leave type..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-4 ring-primary/10 transition-all resize-none"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary/20"
                                checked={formData.is_paid}
                                onChange={e => setFormData({...formData, is_paid: e.target.checked})}
                            />
                            <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">Paid Leave Type</span>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="submit"
                            disabled={saving}
                            className="btn-primary !py-3 !px-8 !text-[10px]"
                        >
                            {saving ? <Loader2 className="animate-spin" size={14} /> : 'Save Category'}
                        </button>
                        <button 
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />
                    ))
                ) : leaveTypes.length === 0 ? (
                    <div className="col-span-2 p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <Info size={32} className="mx-auto mb-4 text-slate-300" />
                        <p className="text-sm font-bold text-slate-500">No leave categories defined yet.</p>
                    </div>
                ) : leaveTypes.map(type => (
                    <div key={type.id} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    {type.name}
                                    {type.is_paid ? (
                                        <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100">PAID</span>
                                    ) : (
                                        <span className="text-[8px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100">UNPAID</span>
                                    )}
                                </h4>
                                <p className="text-[10px] font-bold text-slate-400 mt-1">{type.default_days} Days per year</p>
                                {type.description && <p className="text-xs text-slate-500 mt-3 line-clamp-1">{type.description}</p>}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                    <Edit2 size={14} />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
