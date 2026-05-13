import { useState, useEffect } from 'react';
import { 
    CheckCircle2, Search, 
    Filter, Loader2, Calendar,
    User
} from 'lucide-react';
import * as leaveApi from '../../api/leave.api';
import { useNotification } from '../../contexts/NotificationContext';
import Modal from '../../components/ui/Modal';

export default function LeaveApprovals() {
    const { notify } = useNotification();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeave, setSelectedLeave] = useState<any>(null);
    const [remarks, setRemarks] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const data = await leaveApi.getPendingLeaves();
            setApplications(data);
        } catch (err) {
            console.error('Failed to fetch pending leaves', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (status: 'approved' | 'rejected') => {
        if (!selectedLeave) return;
        setProcessing(true);
        try {
            if (status === 'approved') {
                await leaveApi.approveLeave(selectedLeave.id, remarks);
                notify('success', 'Leave Approved', 'The teacher has been notified.');
            } else {
                await leaveApi.rejectLeave(selectedLeave.id, remarks);
                notify('warning', 'Leave Rejected', 'Application status updated.');
            }
            setSelectedLeave(null);
            setRemarks('');
            fetchPending();
        } catch (err) {
            notify('error', 'Action Failed', 'Could not update leave status.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Leave <span className="text-primary">Approvals</span></h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Review and process teacher time-off requests</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="Search teachers..."
                            className="bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold outline-none focus:ring-4 ring-primary/10 transition-all w-72"
                        />
                    </div>
                    <button className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Teacher</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Type & Reason</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Dates</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Requested On</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center">
                                        <Loader2 className="animate-spin mx-auto text-primary mb-4" size={32} />
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading applications...</p>
                                    </td>
                                </tr>
                            ) : applications.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center">
                                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle2 size={40} />
                                        </div>
                                        <p className="text-lg font-black text-slate-900">All Clear!</p>
                                        <p className="text-sm font-bold text-slate-400">No pending leave applications at the moment.</p>
                                    </td>
                                </tr>
                            ) : applications.map((app) => (
                                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                                                {app.first_name[0]}{app.last_name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{app.first_name} {app.last_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: #{app.staff_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md uppercase tracking-tight">{app.leave_type_name}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium max-w-xs line-clamp-2">{app.reason}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <Calendar size={14} className="text-slate-400" />
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">
                                                    {new Date(app.start_date).toLocaleDateString()} - {new Date(app.end_date).toLocaleDateString()}
                                                </p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase">
                                                    {Math.ceil((new Date(app.end_date).getTime() - new Date(app.start_date).getTime()) / (1000 * 3600 * 24)) + 1} Days
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xs font-bold text-slate-600">{new Date(app.created_at).toLocaleDateString()}</p>
                                        <p className="text-[10px] font-medium text-slate-400">{new Date(app.created_at).toLocaleTimeString()}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={() => setSelectedLeave(app)}
                                            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all hover:scale-105 active:scale-95"
                                        >
                                            Review Request
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Approval Modal */}
            <Modal
                isOpen={!!selectedLeave}
                onClose={() => setSelectedLeave(null)}
                title="Review Leave Application"
                size="md"
            >
                {selectedLeave && (
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900">{selectedLeave.first_name} {selectedLeave.last_name}</p>
                                <p className="text-xs font-bold text-primary">{selectedLeave.leave_type_name}</p>
                                <p className="text-[10px] font-medium text-slate-400 mt-1 italic">"{selectedLeave.reason}"</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reviewer Remarks</label>
                            <textarea 
                                rows={3}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all resize-none"
                                placeholder="Enter reason for approval or rejection..."
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button 
                                onClick={() => handleAction('approved')}
                                disabled={processing}
                                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {processing ? '...' : 'Approve'}
                            </button>
                            <button 
                                onClick={() => handleAction('rejected')}
                                disabled={processing}
                                className="flex-1 bg-rose-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {processing ? '...' : 'Reject'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
