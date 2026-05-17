import { useState, useEffect } from 'react';
import { 
    Users, 
    CreditCard, ChevronRight, FileText, Settings,
    Plus, Search, Wallet, TrendingUp, ShieldCheck, Activity,
    Printer, X, Trash2
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

    // Modal state
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

    // Bulk states
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkResults, setBulkResults] = useState<any>(null);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    // Config form state
    const [baseSalary, setBaseSalary] = useState<string>('0');
    const [allowances, setAllowances] = useState<any[]>([]);
    const [deductions, setDeductions] = useState<any[]>([]);
    const [paymentMode, setPaymentMode] = useState<string>('bank_transfer');
    const [bankName, setBankName] = useState<string>('');
    const [accountNumber, setAccountNumber] = useState<string>('');
    const [ifscCode, setIfscCode] = useState<string>('');

    const openConfigModal = () => {
        if (payrollData?.structure) {
            setBaseSalary(payrollData.structure.base_salary.toString());
            setAllowances(payrollData.structure.allowances || []);
            setDeductions(payrollData.structure.deductions || []);
            setPaymentMode(payrollData.structure.payment_mode || 'bank_transfer');
            setBankName(payrollData.structure.bank_name || '');
            setAccountNumber(payrollData.structure.account_number || '');
            setIfscCode(payrollData.structure.ifsc_code || '');
        } else {
            setBaseSalary('3500');
            setAllowances([{ name: 'HRA', amount: 500 }, { name: 'TA', amount: 200 }]);
            setDeductions([{ name: 'PF', amount: 150 }]);
            setPaymentMode('bank_transfer');
            setBankName('');
            setAccountNumber('');
            setIfscCode('');
        }
        setIsConfigModalOpen(true);
    };

    const handleSaveStructure = async () => {
        if (!selectedStaff) return;
        setProcessing(true);
        try {
            await payrollApi.saveSalaryStructure(selectedStaff.id, {
                base_salary: parseFloat(baseSalary || '0'),
                allowances,
                deductions,
                payment_mode: paymentMode,
                bank_name: bankName,
                account_number: accountNumber,
                ifsc_code: ifscCode
            });
            notify('success', 'Structure Configured', 'Salary parameters successfully saved.');
            setIsConfigModalOpen(false);
            fetchPayrollDetails(selectedStaff.id);
        } catch (err) {
            notify('error', 'Configuration Failed', 'Failed to save salary structure.');
        } finally {
            setProcessing(false);
        }
    };

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
        } catch (err: any) {
            notify('error', 'Generation Failed', err?.message || 'Please check salary structure.');
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

    const handleBulkGenerate = async () => {
        setIsBulkProcessing(true);
        try {
            const res = await payrollApi.generateBulkPayslips({ month, year });
            setBulkResults(res.data);
            notify('success', 'Bulk Process Complete', `Successfully issued ${res.data.processed.length} payslips.`);
            if (selectedStaff) {
                fetchPayrollDetails(selectedStaff.id);
            }
        } catch (err: any) {
            notify('error', 'Bulk Generation Failed', err?.message || 'Failed to generate bulk payslips.');
        } finally {
            setIsBulkProcessing(false);
        }
    };

    return (
        <div className="p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <Wallet size={12} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Payroll & Compensation</span>
                    </div>
                    <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight">Institutional Payroll</h1>
                    <p className="text-[var(--text-muted)] font-medium text-sm mt-1">High-fidelity salary management and automated GL synchronization.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={() => {
                            setBulkResults(null);
                            setIsBulkModalOpen(true);
                        }}
                        className="flex items-center gap-3 px-6 py-4 bg-primary text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-primary/95 transition-all shadow-xl shadow-primary/25 cursor-pointer"
                    >
                        <Plus size={16} />
                        Issue Bulk Payslips
                    </button>

                    <div className="flex items-center gap-2 p-1.5 bg-[var(--card-bg)] rounded-[1.5rem] border border-[var(--card-border)]/50 shadow-xl shadow-slate-200/40">
                        <select 
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest px-5 py-2.5 outline-none cursor-pointer text-[var(--text-main)]"
                            value={month}
                            onChange={e => setMonth(parseInt(e.target.value))}
                        >
                            {Array.from({length: 12}, (_, i) => (
                                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                            ))}
                        </select>
                        <div className="w-px h-6 bg-[var(--card-border)]/50" />
                        <select 
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest px-5 py-2.5 outline-none cursor-pointer text-[var(--text-main)]"
                            value={year}
                            onChange={e => setYear(parseInt(e.target.value))}
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-10">
                {/* Staff List */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="premium-card p-0 overflow-hidden flex flex-col bg-[var(--card-bg)] rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border-[var(--card-border)]/50">
                        <div className="p-8 border-b border-[var(--card-border)]/30 bg-slate-50/50 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">Staff Directory</h3>
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Institutional Roster</p>
                            </div>
                            <button className="w-10 h-10 rounded-xl bg-white border border-[var(--card-border)]/50 flex items-center justify-center text-[var(--text-muted)] hover:text-primary transition-all shadow-sm">
                                <Search size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="h-20 bg-slate-50/50 rounded-2xl animate-pulse" />
                                ))
                            ) : staffList.map(staff => (
                                <button 
                                    key={staff.id}
                                    onClick={() => {
                                        setSelectedStaff(staff);
                                        fetchPayrollDetails(staff.id);
                                    }}
                                    className={`w-full flex items-center gap-5 p-5 rounded-[2rem] border transition-all duration-300 group ${
                                        selectedStaff?.id === staff.id 
                                        ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/20 translate-x-2' 
                                        : 'bg-[var(--card-bg)] border-[var(--card-border)]/30 hover:border-primary/30 hover:bg-slate-50/50'
                                    }`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xs shadow-sm transition-all duration-300 ${
                                        selectedStaff?.id === staff.id ? 'bg-white/20 border border-white/20' : 'bg-slate-100 text-[var(--text-muted)] border border-transparent'
                                    }`}>
                                        {staff.first_name[0]}{staff.last_name[0]}
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className={`text-sm font-black tracking-tight ${selectedStaff?.id === staff.id ? 'text-white' : 'text-[var(--text-main)]'}`}>{staff.first_name} {staff.last_name}</p>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 opacity-60 ${selectedStaff?.id === staff.id ? 'text-white' : 'text-[var(--text-muted)]'}`}>{staff.role_slug || 'Academic Staff'}</p>
                                    </div>
                                    <ChevronRight size={18} className={`transition-transform duration-300 ${selectedStaff?.id === staff.id ? 'text-white translate-x-1' : 'text-slate-200 group-hover:text-primary group-hover:translate-x-1'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Details / Management */}
                <div className="col-span-12 lg:col-span-8">
                    {!selectedStaff ? (
                        <div className="h-full min-h-[500px] premium-card border-dashed border-2 bg-slate-50/30 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                            <div className="w-24 h-24 bg-[var(--card-bg)] rounded-[2rem] shadow-2xl shadow-slate-200 flex items-center justify-center text-[var(--text-muted)] mb-8 border border-[var(--card-border)]/50">
                                <Users size={40} className="opacity-20" />
                            </div>
                            <h3 className="text-2xl font-black text-[var(--text-main)] mb-2 tracking-tight">Select a Staff Member</h3>
                            <p className="text-[var(--text-muted)] max-w-sm mx-auto font-medium leading-relaxed">Choose a faculty or staff member from the directory to manage their compensation and salary history.</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Salary Structure Card */}
                            <div className="premium-card p-10 bg-[var(--card-bg)] rounded-[3rem] shadow-2xl shadow-slate-200/50 border-[var(--card-border)]/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-10 relative z-10">
                                    <div>
                                        <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Compensation Model</h3>
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Verified Salary Parameters</p>
                                    </div>
                                    <button 
                                        onClick={openConfigModal}
                                        className="flex items-center gap-3 px-6 py-3 bg-slate-50 border border-[var(--card-border)]/50 text-[var(--text-muted)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-primary hover:bg-primary/5 hover:border-primary/20 transition-all shadow-sm"
                                    >
                                        <Settings size={18} />
                                        Configure Structure
                                    </button>
                                </div>

                                {payrollData?.structure ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                                        <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-[var(--card-border)]/50 group hover:border-primary/20 transition-all">
                                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-3 opacity-60">Base Compensation</p>
                                            <p className="text-3xl font-black text-[var(--text-main)] font-mono">${Number(payrollData.structure.base_salary).toLocaleString()}</p>
                                        </div>
                                        <div className="p-8 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100 group hover:bg-emerald-50 transition-all">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-3 opacity-60">Variable Allowances</p>
                                            <div className="flex items-center gap-3">
                                                <TrendingUp size={24} className="text-emerald-500" />
                                                <p className="text-3xl font-black text-emerald-700 font-mono">
                                                    +${payrollData.structure.allowances?.reduce((a: any, c: any) => a + Number(c.amount), 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="p-8 bg-rose-50/50 rounded-[2.5rem] border border-rose-100 group hover:bg-rose-50 transition-all">
                                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mb-3 opacity-60">Statutory Deductions</p>
                                            <p className="text-3xl font-black text-rose-700 font-mono">
                                                -${payrollData.structure.deductions?.reduce((a: any, c: any) => a + Number(c.amount), 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-16 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-[var(--card-border)]/50">
                                        <p className="text-sm font-black text-[var(--text-muted)] mb-8 uppercase tracking-widest">No verified structure detected</p>
                                        <button 
                                            onClick={openConfigModal}
                                            className="px-10 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center gap-3 mx-auto"
                                        >
                                            <Plus size={18} /> Initialize Compensation Model
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Payslips Card */}
                            <div className="premium-card p-0 overflow-hidden bg-[var(--card-bg)] rounded-[3rem] shadow-2xl shadow-slate-200/50 border-[var(--card-border)]/50 flex flex-col">
                                <div className="p-10 border-b border-[var(--card-border)]/30 flex items-center justify-between bg-slate-50/50">
                                    <div>
                                        <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">Disbursement Ledger</h3>
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Verified Payment History</p>
                                    </div>
                                    <button 
                                        onClick={handleGenerate}
                                        disabled={processing}
                                        className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50"
                                    >
                                        {processing ? <Activity size={16} className="animate-spin" /> : <Plus size={16} />}
                                        Issue {new Date(0, month-1).toLocaleString('default', { month: 'short' })} Payslip
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Payroll Period</th>
                                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Net Disbursement</th>
                                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Status</th>
                                                <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Compliance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--card-border)]/30">
                                            {payrollData?.payslips?.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="py-24 text-center">
                                                        <FileText size={48} className="mx-auto mb-6 text-slate-100" />
                                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">No historical records found</p>
                                                    </td>
                                                </tr>
                                            ) : payrollData?.payslips?.map((slip: any) => (
                                                <tr key={slip.id} className="group hover:bg-slate-50/50 transition-all">
                                                    <td className="px-10 py-7">
                                                        <p className="text-sm font-black text-[var(--text-main)] tracking-tight">{new Date(0, slip.month-1).toLocaleString('default', { month: 'long' })} {slip.year}</p>
                                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1.5 opacity-60">Ref: PR-{slip.id}</p>
                                                    </td>
                                                    <td className="px-10 py-7">
                                                        <p className="text-lg font-black text-[var(--text-main)] font-mono">${Number(slip.net_salary).toLocaleString()}</p>
                                                    </td>
                                                    <td className="px-10 py-7">
                                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${
                                                            slip.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                                        }`}>
                                                            {slip.status === 'paid' ? <ShieldCheck size={14} /> : <Activity size={14} className="animate-pulse" />}
                                                            {slip.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-10 py-7 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <button 
                                                                onClick={() => {
                                                                    setSelectedPayslip(slip);
                                                                    setIsPrintModalOpen(true);
                                                                }}
                                                                className="w-10 h-10 rounded-xl bg-white border border-[var(--card-border)]/50 flex items-center justify-center text-[var(--text-muted)] hover:text-primary transition-all shadow-sm" 
                                                                title="Print Payslip / View Details"
                                                            >
                                                                <Printer size={18} />
                                                            </button>
                                                            {slip.status === 'generated' && (
                                                                <button 
                                                                    onClick={() => handlePay(slip.id)}
                                                                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:scale-[1.05] active:scale-[0.95] transition-all"
                                                                >
                                                                    <CreditCard size={16} />
                                                                    Execute Payment
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

            {/* 1. Configuration Modal */}
            {isConfigModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Configure Salary Structure</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                    {selectedStaff.first_name} {selectedStaff.last_name} ({selectedStaff.employee_id || 'Staff'})
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsConfigModalOpen(false)}
                                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            {/* Base Compensation */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Base Monthly Salary ($)</label>
                                <input 
                                    type="number"
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none font-mono text-lg font-bold text-slate-700"
                                    value={baseSalary}
                                    onChange={e => setBaseSalary(e.target.value)}
                                    placeholder="Enter base salary"
                                />
                            </div>

                            {/* Allowances */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Allowances</label>
                                    <button 
                                        type="button"
                                        onClick={() => setAllowances([...allowances, { name: '', amount: 0 }])}
                                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary hover:text-primary-dark transition-all"
                                    >
                                        <Plus size={14} /> Add Allowance
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {allowances.map((al, idx) => (
                                        <div key={idx} className="flex gap-4 items-center">
                                            <input 
                                                type="text"
                                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-xs font-semibold text-slate-600"
                                                value={al.name}
                                                onChange={e => {
                                                    const updated = [...allowances];
                                                    updated[idx].name = e.target.value;
                                                    setAllowances(updated);
                                                }}
                                                placeholder="Allowance Name (e.g. HRA)"
                                            />
                                            <input 
                                                type="number"
                                                className="w-32 px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none font-mono text-xs font-bold text-slate-600"
                                                value={al.amount}
                                                onChange={e => {
                                                    const updated = [...allowances];
                                                    updated[idx].amount = parseFloat(e.target.value) || 0;
                                                    setAllowances(updated);
                                                }}
                                                placeholder="Amount"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setAllowances(allowances.filter((_, i) => i !== idx))}
                                                className="w-10 h-10 rounded-xl hover:bg-rose-50 text-rose-400 hover:text-rose-600 flex items-center justify-center transition-all flex-shrink-0"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {allowances.length === 0 && (
                                        <p className="text-[10px] font-bold text-slate-400 italic">No allowances configured.</p>
                                    )}
                                </div>
                            </div>

                            {/* Deductions */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deductions</label>
                                    <button 
                                        type="button"
                                        onClick={() => setDeductions([...deductions, { name: '', amount: 0 }])}
                                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary hover:text-primary-dark transition-all"
                                    >
                                        <Plus size={14} /> Add Deduction
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {deductions.map((de, idx) => (
                                        <div key={idx} className="flex gap-4 items-center">
                                            <input 
                                                type="text"
                                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-xs font-semibold text-slate-600"
                                                value={de.name}
                                                onChange={e => {
                                                    const updated = [...deductions];
                                                    updated[idx].name = e.target.value;
                                                    setDeductions(updated);
                                                }}
                                                placeholder="Deduction Name (e.g. PF)"
                                            />
                                            <input 
                                                type="number"
                                                className="w-32 px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none font-mono text-xs font-bold text-slate-600"
                                                value={de.amount}
                                                onChange={e => {
                                                    const updated = [...deductions];
                                                    updated[idx].amount = parseFloat(e.target.value) || 0;
                                                    setDeductions(updated);
                                                }}
                                                placeholder="Amount"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setDeductions(deductions.filter((_, i) => i !== idx))}
                                                className="w-10 h-10 rounded-xl hover:bg-rose-50 text-rose-400 hover:text-rose-600 flex items-center justify-center transition-all flex-shrink-0"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {deductions.length === 0 && (
                                        <p className="text-[10px] font-bold text-slate-400 italic">No deductions configured.</p>
                                    )}
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment & Bank Details</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Payment Mode</label>
                                        <select 
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-xs font-semibold text-slate-600"
                                            value={paymentMode}
                                            onChange={e => setPaymentMode(e.target.value)}
                                        >
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="cash">Cash</option>
                                            <option value="cheque">Cheque</option>
                                        </select>
                                    </div>
                                    {paymentMode === 'bank_transfer' && (
                                        <>
                                            <div>
                                                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Bank Name</label>
                                                <input 
                                                    type="text"
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-xs font-semibold text-slate-600"
                                                    value={bankName}
                                                    onChange={e => setBankName(e.target.value)}
                                                    placeholder="e.g. Chase Bank"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Account Number</label>
                                                <input 
                                                    type="text"
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none font-mono text-xs text-slate-600"
                                                    value={accountNumber}
                                                    onChange={e => setAccountNumber(e.target.value)}
                                                    placeholder="Account Number"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">IFSC / Routing Code</label>
                                                <input 
                                                    type="text"
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none font-mono text-xs text-slate-600"
                                                    value={ifscCode}
                                                    onChange={e => setIfscCode(e.target.value)}
                                                    placeholder="Routing Code"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
                            <button 
                                onClick={() => setIsConfigModalOpen(false)}
                                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveStructure}
                                className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-all"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Bulk Payslip Generation Modal */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[3rem] w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                    <Activity size={20} className="text-primary animate-pulse" />
                                    Bulk Issue Payslips
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                    Period: {new Date(0, month - 1).toLocaleString('default', { month: 'long' })} {year}
                                </p>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsBulkModalOpen(false);
                                    setBulkResults(null);
                                }}
                                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            {!bulkResults ? (
                                <div className="space-y-6 text-center py-6">
                                    <div className="w-20 h-20 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto shadow-inner">
                                        <Wallet size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-lg font-black text-slate-800">Ready to execute bulk processing?</h4>
                                        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                                            This will generate monthly payslips for all active institutional staff for the selected month (**{new Date(0, month - 1).toLocaleString('default', { month: 'long' })} {year}**).
                                        </p>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-200/50 p-6 rounded-2xl text-left max-w-lg mx-auto space-y-3">
                                        <h5 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-2">
                                            ⚠️ Important Guardrails
                                        </h5>
                                        <ul className="text-xs text-amber-700 space-y-1.5 list-disc pl-4 font-medium">
                                            <li>Already issued payslips will not be duplicated.</li>
                                            <li>Staff with unconfigured compensation structures will be safely skipped.</li>
                                            <li>A complete, transparent report of all processed and skipped staff will be displayed post-execution.</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Success/Summary Overview Cards */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center space-y-1">
                                            <p className="text-3xl font-black text-emerald-600 font-mono">{bulkResults.processed.length}</p>
                                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Successfully Processed</p>
                                        </div>
                                        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl text-center space-y-1">
                                            <p className="text-3xl font-black text-amber-600 font-mono">{bulkResults.skipped.length}</p>
                                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Skipped / Excluded</p>
                                        </div>
                                    </div>

                                    {/* Detailed Report Tabs/Lists */}
                                    <div className="space-y-6">
                                        {bulkResults.processed.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    Processed Staff
                                                </h4>
                                                <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                                                    {bulkResults.processed.map((p: any) => (
                                                        <div key={p.staffId} className="flex justify-between items-center p-4 text-xs font-bold text-slate-700">
                                                            <span>{p.name}</span>
                                                            <span className="font-mono text-slate-900">${Number(p.netSalary).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {bulkResults.skipped.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                    Skipped Staff
                                                </h4>
                                                <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                                                    {bulkResults.skipped.map((s: any) => (
                                                        <div key={s.staffId} className="flex flex-col md:flex-row md:justify-between p-4 text-xs gap-1 md:items-center">
                                                            <span className="font-bold text-slate-700">{s.name}</span>
                                                            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100/50">{s.reason}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            {!bulkResults ? (
                                <>
                                    <button 
                                        onClick={() => setIsBulkModalOpen(false)}
                                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleBulkGenerate}
                                        disabled={isBulkProcessing}
                                        className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {isBulkProcessing ? 'Processing...' : 'Execute Issue'}
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => {
                                        setIsBulkModalOpen(false);
                                        setBulkResults(null);
                                        fetchStaff(); // Refresh the main roster list
                                    }}
                                    className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 cursor-pointer"
                                >
                                    Done & Refresh
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Print Payslip Modal */}
            {isPrintModalOpen && selectedPayslip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
                    <div className="bg-white rounded-[3rem] w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:w-full print:max-h-full print:rounded-none">
                        {/* Header for Screen */}
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between print:hidden">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                    <FileText size={20} className="text-primary" />
                                    Payslip Preview
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ref: PR-{selectedPayslip.id}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-all"
                                >
                                    <Printer size={16} /> Print Payslip
                                </button>
                                <button 
                                    onClick={() => {
                                        setSelectedPayslip(null);
                                        setIsPrintModalOpen(false);
                                    }}
                                    className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Printable Area */}
                        <div className="p-12 overflow-y-auto custom-scrollbar flex-1 space-y-8 print:p-0 print:overflow-visible" id="printable-payslip">
                            {/* Institution Header */}
                            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">LUVIA INSTITUTIONAL OS</h2>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">100 Innovation Way, Silicon Valley, CA</p>
                                    <p className="text-[10px] font-medium text-slate-400">Email: accounts@luvia.edu | Tel: (555) 019-2834</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                        selectedPayslip.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                        {selectedPayslip.status}
                                    </span>
                                    <p className="text-xs font-black text-slate-700 mt-4 uppercase tracking-wider">Salary Payslip</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1">Period: {new Date(0, selectedPayslip.month-1).toLocaleString('default', { month: 'long' })} {selectedPayslip.year}</p>
                                </div>
                            </div>

                            {/* Employee Information */}
                            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl print:bg-slate-100 print:border print:border-slate-200">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Details</p>
                                    <p className="text-sm font-black text-slate-800">{selectedStaff.first_name} {selectedStaff.last_name}</p>
                                    <p className="text-xs font-bold text-slate-500">Role: <span className="text-slate-700">{selectedStaff.role_slug || 'Academic Staff'}</span></p>
                                    <p className="text-xs font-bold text-slate-500">Employee ID: <span className="text-slate-700">{selectedStaff.employee_id || `EMP-${selectedStaff.id}`}</span></p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disbursement Parameters</p>
                                    <p className="text-xs font-bold text-slate-500">Payment Mode: <span className="text-slate-700 uppercase">{payrollData?.structure?.payment_mode?.replace('_', ' ') || 'Bank Transfer'}</span></p>
                                    {payrollData?.structure?.bank_name && (
                                        <>
                                            <p className="text-xs font-bold text-slate-500">Bank Name: <span className="text-slate-700">{payrollData.structure.bank_name}</span></p>
                                            <p className="text-xs font-bold text-slate-500">Account No: <span className="text-slate-700 font-mono">{payrollData.structure.account_number}</span></p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Earnings & Deductions Breakdown */}
                            <div className="grid grid-cols-2 gap-8 pt-4">
                                {/* Earnings (Allowances) */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2">Earnings</h4>
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between text-xs text-slate-600 font-semibold">
                                            <span>Base Salary</span>
                                            <span className="font-mono">${Number(selectedPayslip.base_salary).toLocaleString()}</span>
                                        </div>
                                        {payrollData?.structure?.allowances?.map((al: any, i: number) => (
                                            <div key={i} className="flex justify-between text-xs text-slate-600">
                                                <span>{al.name}</span>
                                                <span className="font-mono">+${Number(al.amount).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="border-t pt-2 flex justify-between text-xs font-black text-slate-800">
                                            <span>Total Earnings</span>
                                            <span className="font-mono">${(Number(selectedPayslip.base_salary) + Number(selectedPayslip.total_allowances || 0)).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Deductions */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2">Deductions</h4>
                                    <div className="space-y-2.5">
                                        {payrollData?.structure?.deductions?.map((de: any, i: number) => (
                                            <div key={i} className="flex justify-between text-xs text-slate-600">
                                                <span>{de.name}</span>
                                                <span className="font-mono">-${Number(de.amount).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        {(!payrollData?.structure?.deductions || payrollData.structure.deductions.length === 0) && (
                                            <p className="text-xs text-slate-400 italic">No deductions applied.</p>
                                        )}
                                        <div className="border-t pt-2 flex justify-between text-xs font-black text-slate-800">
                                            <span>Total Deductions</span>
                                            <span className="font-mono">${Number(selectedPayslip.total_deductions || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Net Pay Calculation */}
                            <div className="border-t-2 border-slate-950 pt-6 flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl print:bg-slate-200 print:text-slate-900 print:border print:border-slate-300">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wider opacity-80">Net Disbursement Pay</p>
                                    <p className="text-[9px] font-semibold opacity-60">Verified & authorized by Institutional Registry</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black font-mono">${Number(selectedPayslip.net_salary).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Signatures */}
                            <div className="grid grid-cols-2 gap-12 pt-16">
                                <div className="text-center space-y-4">
                                    <div className="border-b border-slate-400 h-10 w-48 mx-auto" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Signature</p>
                                </div>
                                <div className="text-center space-y-4">
                                    <div className="border-b border-slate-400 h-10 w-48 mx-auto flex items-end justify-center">
                                        <span className="font-serif italic text-sm text-slate-500 font-bold">Luvia Treasury</span>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Signatory</p>
                                </div>
                            </div>

                            {/* Compliance footer */}
                            <div className="pt-8 border-t border-slate-100 text-center space-y-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">This is a computer-generated document and does not require a physical signature for validity.</p>
                                <p className="text-[8px] font-medium text-slate-400">Generated on: {new Date(selectedPayslip.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-payslip, #printable-payslip * {
                        visibility: visible;
                    }
                    #printable-payslip {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                }
            `}</style>

            <footer className="mt-8 pt-8 border-t border-[var(--card-border)]/50 text-center print:hidden">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">LuviaEdu Institutional Payroll Engine v5.0 • Financial Compliance Guaranteed</p>
            </footer>
        </div>
    );
}

