import { useState, useEffect } from 'react';
import { 
    Calendar, Clock, Loader2, Plus,
    Briefcase, Coffee, HeartPulse, MoreHorizontal
} from 'lucide-react';
import * as leaveApi from '../../api/leave.api';
import Modal from '../../components/ui/Modal';
import { useNotification } from '../../contexts/NotificationContext';

export default function LeaveManagement() {
    const { notify } = useNotification();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [leaves, types] = await Promise.all([
                leaveApi.getMyLeaves(),
                leaveApi.getLeaveTypes()
            ]);
            setLeaves(leaves);
            setLeaveTypes(types);
        } catch (err) {
            console.error('Failed to fetch leaves', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await leaveApi.applyLeave(formData);
            notify('success', 'Application Submitted', 'Your leave application is pending approval.');
            setIsModalOpen(false);
            setFormData({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
            fetchInitialData();
        } catch (err) {
            notify('error', 'Submission Failed', 'Please verify your dates and try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    const getLeaveIcon = (typeName: string) => {
        const name = typeName.toLowerCase();
        if (name.includes('sick') || name.includes('medical')) return <HeartPulse size={18} />;
        if (name.includes('casual')) return <Coffee size={18} />;
        return <Briefcase size={18} />;
    };

    return (
        <div className="p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="bg-surface-dark p-4 rounded-3xl shadow-xl">
                        <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Leave <span className="text-primary">Management</span></h1>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Time-off tracking & requests</p>
                    </div>
                </div>

                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center gap-2 !px-8 !py-4"
                >
                    <Plus size={18} />
                    New Request
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {leaveTypes.map(type => (
                    <div key={type.id} className="bg-[var(--card-bg)] p-6 rounded-[2rem] border border-[var(--card-border)] shadow-sm group hover:shadow-xl transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                {getLeaveIcon(type.name)}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{type.name}</p>
                                <p className="text-xl font-black text-[var(--text-main)]">Balance: {type.default_days} Days</p>
                            </div>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-1/3" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="p-8 border-b border-[var(--card-border)] flex items-center justify-between">
                    <h3 className="text-lg font-black text-[var(--text-main)]">My Leave History</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                        <Clock size={14} /> Total Requests: {leaves.length}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[var(--background)]">
                            <tr>
                                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Type</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Duration</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Reason</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Status</th>
                                <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--card-border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <Loader2 className="animate-spin mx-auto text-primary mb-2" />
                                        <p className="text-xs font-bold text-[var(--text-muted)]">Syncing calendar...</p>
                                    </td>
                                </tr>
                            ) : leaves.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <Calendar size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-[var(--text-muted)]">No leave records found.</p>
                                    </td>
                                </tr>
                            ) : leaves.map((leave) => (
                                <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                                {getLeaveIcon(leave.leave_type_name)}
                                            </div>
                                            <span className="text-sm font-bold text-[var(--text-main)]">{leave.leave_type_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-bold text-[var(--text-main)]">
                                            {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                        </p>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                                            {Math.ceil((new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / (1000 * 3600 * 24)) + 1} Days
                                        </p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-xs text-[var(--text-muted)] font-medium max-w-xs truncate">{leave.reason}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(leave.status)}`}>
                                            {leave.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Request Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Apply for Leave"
                size="xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Leave Type</label>
                        <select 
                            required
                            className="input-field-modern !py-4"
                            value={formData.leave_type_id}
                            onChange={e => setFormData({...formData, leave_type_id: e.target.value})}
                        >
                            <option value="">Select leave category...</option>
                            {leaveTypes.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.default_days} Days)</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Start Date</label>
                            <input 
                                type="date" required
                                className="input-field-modern !py-4"
                                value={formData.start_date}
                                onChange={e => setFormData({...formData, start_date: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">End Date</label>
                            <input 
                                type="date" required
                                className="input-field-modern !py-4"
                                value={formData.end_date}
                                onChange={e => setFormData({...formData, end_date: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Reason / Notes</label>
                        <textarea 
                            required
                            rows={4}
                            className="input-field-modern !py-4 resize-none"
                            placeholder="Please provide a brief reason for your leave request..."
                            value={formData.reason}
                            onChange={e => setFormData({...formData, reason: e.target.value})}
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="btn-primary flex-1 !py-4"
                        >
                            {isSaving ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Submit Application'}
                        </button>
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-8 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
