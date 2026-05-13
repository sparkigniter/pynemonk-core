import { useState, useEffect } from 'react';
import { 
    DollarSign, Users, Download, 
    CreditCard, ChevronRight, FileText, Settings,
    Plus, Search
} from 'lucide-react';
import * as payrollApi from '../../api/payroll.api';
import * as staffApi from '../../api/staff.api';
import { useNotification } from '../../contexts/NotificationContext';

export default function Payroll() {
    const { notify } = useNotification();
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [payrollData, setPayrollData] = useState<any>(null);
    const [processing, setProcessing] = useState(false);
    
    // For generation
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await staffApi.getStaffList();
            setStaffList(res.data);
        } catch (err) {
            console.error('Failed to fetch staff', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPayrollDetails = async (staffId: number) => {
        try {
            const data = await payrollApi.getStaffPayroll(staffId);
            setPayrollData(data);
        } catch (err) {
            console.error('Failed to fetch payroll details', err);
        }
    };

    const handleGenerate = async () => {
        if (!selectedStaff) return;
        setProcessing(true);
        try {
            await payrollApi.generatePayslip({
                staffId: selectedStaff.id,
                month,
                year
            });
            notify('success', 'Payslip Generated', 'Monthly payroll record created.');
            fetchPayrollDetails(selectedStaff.id);
        } catch (err) {
            notify('error', 'Generation Failed', 'Please check salary structure.');
        } finally {
            setProcessing(false);
        }
    };

    const handlePay = async (payslipId: number) => {
        setProcessing(true);
        try {
            await payrollApi.pay(payslipId);
            notify('success', 'Salary Paid', 'Payment recorded and synced to GL.');
            fetchPayrollDetails(selectedStaff.id);
        } catch (err) {
            notify('error', 'Payment Failed', 'Financial sync error.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="bg-slate-900 p-4 rounded-3xl shadow-xl shadow-slate-200">
                        <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payroll <span className="text-primary">System</span></h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Salary management & GL synchronization</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                    <select 
                        className="bg-transparent text-sm font-black px-4 py-2 outline-none cursor-pointer"
                        value={month}
                        onChange={e => setMonth(parseInt(e.target.value))}
                    >
                        {Array.from({length: 12}, (_, i) => (
                            <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                    <div className="w-px h-8 bg-slate-200" />
                    <select 
                        className="bg-transparent text-sm font-black px-4 py-2 outline-none cursor-pointer"
                        value={year}
                        onChange={e => setYear(parseInt(e.target.value))}
                    >
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Staff List */}
                <div className="col-span-12 lg:col-span-4 space-y-4">
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-slate-900">Staff Directory</h3>
                            <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                <Search size={20} />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />
                                ))
                            ) : staffList.map(staff => (
                                <button 
                                    key={staff.id}
                                    onClick={() => {
                                        setSelectedStaff(staff);
                                        fetchPayrollDetails(staff.id);
                                    }}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                        selectedStaff?.id === staff.id 
                                        ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10' 
                                        : 'bg-white border-slate-100 hover:border-slate-200'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm ${
                                        selectedStaff?.id === staff.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {staff.first_name[0]}{staff.last_name[0]}
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-sm font-black text-slate-900">{staff.first_name} {staff.last_name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{staff.role_slug || 'Staff'}</p>
                                    </div>
                                    <ChevronRight size={16} className={selectedStaff?.id === staff.id ? 'text-primary' : 'text-slate-200'} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Details / Management */}
                <div className="col-span-12 lg:col-span-8">
                    {!selectedStaff ? (
                        <div className="h-full min-h-[500px] bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-4 p-12">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center">
                                <Users size={40} className="text-slate-300" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-black text-slate-900">Select a Staff Member</p>
                                <p className="text-sm font-medium">Choose a member from the directory to manage their payroll and salary structure.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Salary Structure Card */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Salary Structure</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Defined earnings and deductions</p>
                                    </div>
                                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                                        <Settings size={14} />
                                        Update Structure
                                    </button>
                                </div>

                                {payrollData?.structure ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Base Salary</p>
                                            <p className="text-2xl font-black text-slate-900">${Number(payrollData.structure.base_salary).toLocaleString()}</p>
                                        </div>
                                        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Total Allowances</p>
                                            <p className="text-2xl font-black text-emerald-700">
                                                + ${payrollData.structure.allowances?.reduce((a: any, c: any) => a + Number(c.amount), 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Total Deductions</p>
                                            <p className="text-2xl font-black text-rose-700">
                                                - ${payrollData.structure.deductions?.reduce((a: any, c: any) => a + Number(c.amount), 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <p className="text-sm font-bold text-slate-500 mb-4">No active salary structure found.</p>
                                        <button className="btn-primary !py-3">Initialize Structure</button>
                                    </div>
                                )}
                            </div>

                            {/* Payslips Card */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                                <div className="p-8 flex items-center justify-between border-b border-slate-100">
                                    <h3 className="text-lg font-black text-slate-900">Payment History</h3>
                                    <button 
                                        onClick={handleGenerate}
                                        disabled={processing}
                                        className="btn-primary flex items-center gap-2 !px-6 !py-3 !text-[10px]"
                                    >
                                        <Plus size={14} />
                                        Generate {new Date(0, month-1).toLocaleString('default', { month: 'short' })} Payslip
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50/50">
                                            <tr>
                                                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Period</th>
                                                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Net Salary</th>
                                                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                                <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {payrollData?.payslips?.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="py-20 text-center text-slate-400">
                                                        <FileText size={40} className="mx-auto mb-4 opacity-20" />
                                                        <p className="text-xs font-black uppercase tracking-widest">No payslips found</p>
                                                    </td>
                                                </tr>
                                            ) : payrollData?.payslips?.map((slip: any) => (
                                                <tr key={slip.id} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <p className="text-sm font-black text-slate-900">{new Date(0, slip.month-1).toLocaleString('default', { month: 'long' })} {slip.year}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Generated on {new Date(slip.created_at).toLocaleDateString()}</p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-sm font-black text-slate-900">${Number(slip.net_salary).toLocaleString()}</p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                            slip.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                                        }`}>
                                                            {slip.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <button className="p-2 text-slate-400 hover:text-primary transition-colors" title="Download PDF">
                                                                <Download size={18} />
                                                            </button>
                                                            {slip.status === 'generated' && (
                                                                <button 
                                                                    onClick={() => handlePay(slip.id)}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                                                                >
                                                                    <CreditCard size={14} />
                                                                    Mark Paid
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
