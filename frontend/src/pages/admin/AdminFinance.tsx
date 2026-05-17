import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    CreditCard, Plus, Search,
    ArrowUpRight, Download, Filter,
    CheckCircle2, AlertCircle, Clock,
    DollarSign, BookOpen, Layers, Trash2, FileText, User, Users,
    GraduationCap, ChevronRight, Scale, ArrowRight
} from 'lucide-react';
import {
    getFeeHeads, getFeeStructures,
    createFeeHead, createFeeStructure,
    getFeeCollections, getFeeReceipts,
    getFeeFinanceStats, recordFeePayment,
    allocateFeeToStudent, updateFeeHead, deleteFeeHead
} from '../../api/fee.api';
import { getAccountingSettings, getCOA, getBankAccounts } from '../../api/accounting.api';
import LateFeeManagement from './finance/LateFeeManagement';

import type { Account } from '../../api/accounting.api';
import { getStudentList } from '../../api/student.api';
import type { FeeHead, FeeStructure } from '../../api/fee.api';
import Modal from '../../components/ui/Modal';
import { useNotification } from '../../contexts/NotificationContext';

export default function AdminFinance() {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'overview' | 'allocation' | 'structures' | 'heads' | 'concessions' | 'receipts' | 'latefees'>('overview');

    // Data states
    const [heads, setHeads] = useState<FeeHead[]>([]);
    const [structures, setStructures] = useState<FeeStructure[]>([]);
    const [collections, setCollections] = useState<any[]>([]);
    const [receipts, setReceipts] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [summaryStats, setSummaryStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [accountingSettings, setAccountingSettings] = useState<any>({ base_currency: 'USD', currency_symbol: '$' });
    const [coa, setCOA] = useState<Account[]>([]);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [searchFilter, setSearchFilter] = useState('');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'HEAD' | 'STRUCTURE' | 'CONCESSION' | 'RECEIVE_FEES' | 'ALLOCATION' | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

    // Form states
    const [headForm, setHeadForm] = useState({ name: '', code: '', is_refundable: false, ledger_account_id: 0 });
    const [structForm, setStructForm] = useState({
        name: '',
        total_amount: 0,
        items: [] as { fee_head_id: number, amount: number, installment_name: string, due_date: string }[]
    });
    const [paymentForm, setPaymentForm] = useState({
        student_id: 0,
        installment_id: 0,
        amount: 0,
        student_name: '',
        payment_method: 'cash',
        bank_account_id: 0,
        reference: ''
    });
    const [allocationForm, setAllocationForm] = useState({
        student_id: 0,
        student_name: '',
        structure_id: 0
    });

    const formatCurrency = (amount: number) => {
        return `${accountingSettings.currency_symbol}${amount.toLocaleString()}`;
    };

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'structures' || tab === 'heads' || tab === 'concessions' || tab === 'receipts' || tab === 'overview' || tab === 'allocation' || tab === 'latefees') {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchData();
        fetchStats();
    }, [activeTab, showModal]);

    useEffect(() => {
        const total = structForm.items.reduce((sum, item) => sum + (item.amount || 0), 0);
        setStructForm(prev => ({ ...prev, total_amount: total }));
    }, [structForm.items]);

    const fetchStats = async () => {
        try {
            const stats = await getFeeFinanceStats();
            setSummaryStats(stats);
        } catch (err) {
            console.error('Failed to fetch finance stats', err);
        }
    };

    useEffect(() => {
        const querySearch = searchParams.get('search');
        const action = searchParams.get('action');
        const studentId = searchParams.get('studentId');

        if (querySearch) {
            setSearchFilter(querySearch);
            if (activeTab !== 'overview' && action !== 'assign') setActiveTab('overview');
        }

        if (action === 'assign' && studentId && querySearch) {
            if (activeTab !== 'allocation') {
                setActiveTab('allocation');
            } else if (structures.length > 0) {
                setAllocationForm({
                    student_id: parseInt(studentId),
                    student_name: querySearch,
                    structure_id: structures[0]?.id || 0
                });
                setModalType('ALLOCATION');
                setShowModal(true);

                const newParams = new URLSearchParams(searchParams);
                newParams.delete('action');
                newParams.delete('studentId');
                setSearchParams(newParams, { replace: true });
            }
        }

        if (action === 'receive' && studentId && collections.length > 0) {
            const student = collections.find(c => c.student_id === parseInt(studentId));
            if (student) {
                openReceiveFeesModal(student);
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('action');
                newParams.delete('studentId');
                setSearchParams(newParams, { replace: true });
            }
        }
    }, [searchParams, structures, collections]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'heads' || modalType === 'STRUCTURE') {
                const data = await getFeeHeads();
                setHeads(data);
            }

            if (activeTab === 'structures' || modalType === 'ALLOCATION' || searchParams.get('action') === 'assign') {
                const data = await getFeeStructures();
                setStructures(data);
            }

            const settings = await getAccountingSettings();
            setAccountingSettings(settings);

            const banks = await getBankAccounts();
            setBankAccounts(banks);

            if (activeTab === 'overview' || searchParams.get('action') === 'receive') {
                const data = await getFeeCollections();
                setCollections(data);
            } else if (activeTab === 'receipts') {
                const data = await getFeeReceipts();
                setReceipts(data);
            } else if (activeTab === 'allocation') {
                const data = await getStudentList({ limit: 100, unallocated_only: true });
                setStudents(data.data);
            }

            if (modalType === 'HEAD') {
                const accounts = await getCOA();
                setCOA(accounts.filter(a => a.type_name?.toLowerCase().includes('revenue') || a.type_name?.toLowerCase().includes('income')));
            }
        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHead = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                await updateFeeHead(editingId, headForm);
            } else {
                await createFeeHead(headForm);
            }
            setShowModal(false);
            setEditingId(null);
            setHeadForm({ name: '', code: '', is_refundable: false, ledger_account_id: 0 });
            fetchData();
        } catch (err) {
            notify('error', 'Operation Failed', 'Failed to save fee head');
        } finally {
            setSubmitting(false);
        }
    };

    const openEditHead = (head: FeeHead) => {
        setHeadForm({
            name: head.name,
            code: head.code,
            is_refundable: head.is_refundable,
            ledger_account_id: head.ledger_account_id || 0
        });
        setEditingId(head.id);
        setModalType('HEAD');
        setShowModal(true);
    };

    const handleDeleteHead = async (id: number) => {
        if (!confirm('Are you sure you want to delete this fee component?')) return;
        try {
            await deleteFeeHead(id);
            fetchData();
        } catch (err) {
            notify('error', 'Dependency Conflict', 'Failed to delete component. It might be in use.');
        }
    };

    const handleCreateStructure = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createFeeStructure(structForm);
            setShowModal(false);
            setStructForm({ name: '', total_amount: 0, items: [] });
            fetchData();
            fetchStats();
        } catch (err) {
            notify('error', 'Error', 'Failed to create fee structure');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await recordFeePayment({
                installment_id: paymentForm.installment_id,
                amount: paymentForm.amount,
                payment_method: paymentForm.payment_method,
                bank_account_id: paymentForm.bank_account_id,
                reference: paymentForm.reference || `FEES-${Date.now()}`
            });
            setShowModal(false);
            fetchData();
            fetchStats();
        } catch (err) {
            notify('error', 'Processing Error', 'Failed to generate receipt.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAllocateFee = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await allocateFeeToStudent({
                student_id: allocationForm.student_id,
                structure_id: allocationForm.structure_id
            });
            setShowModal(false);
            setActiveTab('overview');
            fetchData();
        } catch (err) {
            notify('error', 'Workflow Error', 'Failed to generate fee schedule.');
        } finally {
            setSubmitting(false);
        }
    };

    const openReceiveFeesModal = (student: any) => {
        setPaymentForm({
            student_id: student.student_id,
            installment_id: student.oldest_installment_id || 0,
            amount: student.balance,
            student_name: student.student_name,
            payment_method: 'cash',
            bank_account_id: 0,
            reference: ''
        });
        setModalType('RECEIVE_FEES');
        setShowModal(true);
    };

    const openAllocationModal = (student: any) => {
        setAllocationForm({
            student_id: student.id,
            student_name: `${student.first_name} ${student.last_name}`,
            structure_id: structures[0]?.id || 0
        });
        setModalType('ALLOCATION');
        setShowModal(true);
    };

    const addStructItem = () => {
        setStructForm(prev => ({
            ...prev,
            items: [...prev.items, { fee_head_id: heads[0]?.id || 0, amount: 0, installment_name: 'Annual', due_date: new Date().toISOString().split('T')[0] }]
        }));
    };

    const removeStructItem = (index: number) => {
        setStructForm(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const stats = [
        { label: 'Total Expected', value: summaryStats ? formatCurrency(summaryStats.total_expected) : formatCurrency(0), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Collected', value: summaryStats ? formatCurrency(summaryStats.total_collected) : formatCurrency(0), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Outstanding', value: summaryStats ? formatCurrency(summaryStats.total_outstanding) : formatCurrency(0), icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Late Payments', value: summaryStats ? summaryStats.late_payments : '0', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fee <span className="text-primary">Management</span></h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Collect fees, manage installments and see reports</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setActiveTab('allocation'); }}
                        className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Generate Fees
                    </button>
                    <button className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
                        <Download size={18} className="text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 group hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                                <ArrowUpRight size={14} />
                                +4.2%
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <h2 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h2>
                    </div>
                ))}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-[1.5rem] w-fit">
                {[
                    { id: 'overview', label: 'Collect Fees', icon: CreditCard },
                    { id: 'allocation', label: 'Generate Fees', icon: Users },
                    { id: 'receipts', label: 'History', icon: FileText },
                    { id: 'structures', label: 'Templates', icon: Layers },
                    { id: 'heads', label: 'Fee Types', icon: BookOpen },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                            ? 'bg-white text-slate-900 shadow-sm shadow-slate-200'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Dynamic Content */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 min-h-[500px] overflow-hidden">
                {activeTab === 'overview' && (
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by student name..."
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 ring-primary/20"
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                />
                            </div>
                            <button className="flex items-center gap-2 px-6 py-3 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
                                <Filter size={16} />
                                Advanced Filters
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading collections...</div>
                        ) : collections.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50/30 rounded-3xl border border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary shadow-sm">
                                    <CreditCard size={32} />
                                </div>
                                <h4 className="text-lg font-black text-slate-900">No Pending Collections</h4>
                                <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto mt-2">
                                    To see students here, you must first generate fee schedules for them in the **Generate Fees** tab.
                                </p>
                                <button
                                    onClick={() => setActiveTab('allocation')}
                                    className="mt-6 px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                                >
                                    Go to Generate Fees
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-50">
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission #</th>
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade</th>
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Due</th>
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</th>
                                            <th className="text-right py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {collections
                                            .filter(item =>
                                                item.student_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                                                (item.admission_no && item.admission_no.toLowerCase().includes(searchFilter.toLowerCase()))
                                            )
                                            .map((item, i) => (
                                                <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                                <User size={14} />
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-800">{item.student_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className="text-xs font-bold text-slate-500">{item.admission_no}</span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className="text-xs font-bold text-slate-600">{item.classroom_name || 'Unassigned'}</span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className="text-sm font-black text-slate-900">{formatCurrency(item.total_due)}</span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className="text-sm font-black text-rose-500">{formatCurrency(item.balance)}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <button
                                                            onClick={() => openReceiveFeesModal(item)}
                                                            className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 ml-auto"
                                                        >
                                                            Receive Fees
                                                            <ChevronRight size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'allocation' && (
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Institutional <span className="text-primary">Fee Generation</span></h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Generate fee schedules for students to create invoices</p>
                            </div>
                            <div className="flex items-center gap-4 flex-1 justify-end">
                                <button 
                                    onClick={() => navigate('/bulk-fee-allocation')}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2"
                                >
                                    <Layers size={16} />
                                    Bulk Allocation Tool
                                </button>
                                <div className="relative flex-1 max-w-xs">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search student to allocate..."
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 ring-primary/20"
                                        value={searchFilter}
                                        onChange={(e) => setSearchFilter(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading student directory...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-50">
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission #</th>
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Grade</th>
                                            <th className="text-right py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {students
                                            .filter(s => 
                                                `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchFilter.toLowerCase()) ||
                                                (s.admission_no && s.admission_no.toLowerCase().includes(searchFilter.toLowerCase()))
                                            )
                                            .map((student, i) => (
                                                <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 font-black">
                                                            {student.first_name[0]}{student.last_name[0]}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-800">{student.first_name} {student.last_name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="text-xs font-bold text-slate-500">{student.admission_no}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-tight text-slate-600">Grade {student.current_grade_sequence || 'N/A'}</span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <button
                                                        onClick={() => openAllocationModal(student)}
                                                        className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 ml-auto"
                                                    >
                                                        <Layers size={14} />
                                                        Generate Schedule
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'receipts' && (
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Receipts <span className="text-primary">Archive</span></h3>
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by receipt number..."
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 ring-primary/20"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading receipts...</div>
                        ) : receipts.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50/30 rounded-3xl border border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <FileText size={32} />
                                </div>
                                <h4 className="text-lg font-black text-slate-900">No Receipts Found</h4>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-50">
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt #</th>
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Component</th>
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                            <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                            <th className="text-right py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {receipts.map((item, i) => (
                                            <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                            <FileText size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">RCP-{item.receipt_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="text-sm font-bold text-slate-600">{item.student_name}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="text-xs font-bold text-slate-500">{item.fee_heads}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="text-sm font-black text-emerald-600">{formatCurrency(item.amount)}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{item.payment_date ? new Date(item.payment_date).toLocaleDateString() : 'N/A'}</span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setSelectedReceipt(item)}
                                                            className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                                            title="View Receipt"
                                                        >
                                                            <FileText size={14} />
                                                            View Receipt
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'latefees' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <LateFeeManagement />
                    </div>
                )}

                {activeTab === 'structures' && (
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Active Fee <span className="text-primary">Structures</span></h3>
                            <button
                                onClick={() => { setModalType('STRUCTURE'); setShowModal(true); fetchData(); }}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                            >
                                <Plus size={16} />
                                Define Structure
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading && structures.length === 0 ? (
                                <div className="col-span-3 py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading structures...</div>
                            ) : structures.length === 0 ? (
                                <div className="col-span-3 py-20 text-center text-slate-400 font-bold uppercase tracking-widest">No fee structures found</div>
                            ) : structures.map((struct) => (
                                <div key={struct.id} className="bg-slate-50/50 border border-slate-100 p-6 rounded-[2rem] hover:border-primary/20 hover:bg-white hover:shadow-xl transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-white rounded-2xl text-primary shadow-sm">
                                            <Layers size={20} />
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 group-hover:text-primary transition-colors">{struct.name}</h4>
                                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Annual Total</p>
                                            <p className="text-xl font-black text-slate-900">${struct.total_amount}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'heads' && (
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Fee <span className="text-primary">Components</span></h3>
                            <button
                                onClick={() => { setModalType('HEAD'); setShowModal(true); }}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                            >
                                <Plus size={16} />
                                Add Component
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {heads.map((head) => (
                                <div key={head.id} className="p-5 bg-white border border-slate-100 rounded-[1.5rem] flex items-center gap-4 hover:shadow-lg transition-all border-l-4 border-l-primary group relative">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                        <BookOpen size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{head.name}</p>
                                        {head.account_name && (
                                            <p className="text-[10px] font-bold text-primary uppercase mt-0.5">{head.account_name}</p>
                                        )}
                                    </div>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditHead(head)}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                        >
                                            <FileText size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteHead(head.id)}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingId(null); setHeadForm({ name: '', code: '', is_refundable: false, ledger_account_id: 0 }); }}
                title={
                    modalType === 'HEAD' ? (editingId ? 'Edit Fee Component' : 'Add Fee Component') :
                        modalType === 'STRUCTURE' ? 'Define Fee Structure' :
                            modalType === 'RECEIVE_FEES' ? 'Receive Fees' :
                                modalType === 'ALLOCATION' ? 'Generate Fee Schedule' :
                                    'Create Concession'
                }
                size={modalType === 'STRUCTURE' ? '3xl' : 'lg'}
            >
                {modalType === 'HEAD' && (
                    <form onSubmit={handleCreateHead} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Component Name</label>
                            <input type="text" required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm" value={headForm.name} onChange={e => setHeadForm({ ...headForm, name: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Ledger Account (Revenue)</label>
                            <select
                                required
                                value={headForm.ledger_account_id}
                                onChange={e => setHeadForm({ ...headForm, ledger_account_id: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold"
                            >
                                <option value={0}>Select Revenue Account...</option>
                                {coa.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" disabled={submitting} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest">
                            {submitting ? 'Saving...' : (editingId ? 'Update Component' : 'Create Component')}
                        </button>
                    </form>
                )}

                {modalType === 'STRUCTURE' && (
                    <form onSubmit={handleCreateStructure} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structure Name</label>
                                <input type="text" required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl" value={structForm.name} onChange={e => setStructForm({ ...structForm, name: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</label>
                                <input type="number" readOnly className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl font-black text-primary" value={structForm.total_amount} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <button type="button" onClick={addStructItem} className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                                <Plus size={14} /> Add Line Item
                            </button>
                            {structForm.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                                    <select
                                        value={item.fee_head_id}
                                        onChange={e => {
                                            const newItems = [...structForm.items];
                                            newItems[idx].fee_head_id = parseInt(e.target.value);
                                            setStructForm({ ...structForm, items: newItems });
                                        }}
                                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                                    >
                                        <option value={0}>Select Head</option>
                                        {heads.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                    </select>
                                    <input type="number" placeholder="Amount" value={item.amount} onChange={e => {
                                        const newItems = [...structForm.items];
                                        newItems[idx].amount = parseFloat(e.target.value);
                                        setStructForm({ ...structForm, items: newItems });
                                    }} className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" />
                                    <input type="date" value={item.due_date} onChange={e => {
                                        const newItems = [...structForm.items];
                                        newItems[idx].due_date = e.target.value;
                                        setStructForm({ ...structForm, items: newItems });
                                    }} className="w-32 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                                    <button type="button" onClick={() => removeStructItem(idx)} className="text-rose-400 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                </div>
                            ))}
                        </div>
                        <button type="submit" disabled={submitting} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest">
                            {submitting ? 'Saving...' : 'Save Fee Structure'}
                        </button>
                    </form>
                )}

                {modalType === 'RECEIVE_FEES' && (
                    <form onSubmit={handleRecordPayment} className="space-y-6">
                        <div className="bg-slate-50 p-6 rounded-[2rem] flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                <User size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receiving fees for</p>
                                <h4 className="text-xl font-black text-slate-900">{paymentForm.student_name}</h4>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold"
                                    value={paymentForm.payment_method}
                                    onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank">Bank Transfer</option>
                                    <option value="online">Online / UPI</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount ($)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-black"
                                    value={paymentForm.amount}
                                    onChange={e => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        {paymentForm.payment_method !== 'cash' && (
                            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Bank Account</label>
                                    <select
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold"
                                        value={paymentForm.bank_account_id}
                                        onChange={e => setPaymentForm({ ...paymentForm, bank_account_id: parseInt(e.target.value) })}
                                    >
                                        <option value={0}>Choose account...</option>
                                        {bankAccounts.map(b => (
                                            <option key={b.id} value={b.id}>{b.name} ({b.bank_name})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference / UTR No.</label>
                                    <input
                                        type="text"
                                        placeholder="TXN-1234..."
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm"
                                        value={paymentForm.reference}
                                        onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={submitting} className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest">
                            {submitting ? 'Processing...' : 'Confirm Receipt'}
                        </button>
                    </form>
                )}

                {modalType === 'ALLOCATION' && (
                    <form onSubmit={handleAllocateFee} className="space-y-6">
                        <div className="bg-blue-50 p-6 rounded-[2rem] flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                                <GraduationCap size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Generating fee schedule for</p>
                                <h4 className="text-xl font-black text-blue-900">{allocationForm.student_name}</h4>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Fee Structure</label>
                            <select
                                required
                                value={allocationForm.structure_id}
                                onChange={e => setAllocationForm({ ...allocationForm, structure_id: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold"
                            >
                                <option value={0}>Choose a structure...</option>
                                {structures.map(s => <option key={s.id} value={s.id}>{s.name} (${s.total_amount})</option>)}
                            </select>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                By generating this schedule, you will create all planned fee installments (invoices) for this student for the current academic year.
                            </p>
                        </div>
                        <button type="submit" disabled={submitting || !allocationForm.structure_id} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest disabled:opacity-50">
                            {submitting ? 'Generating...' : 'Confirm Generation'}
                        </button>
                    </form>
                )}
            </Modal>

            {/* Receipt View Modal */}
            <Modal
                isOpen={!!selectedReceipt}
                onClose={() => setSelectedReceipt(null)}
                title="Fee Receipt"
                size="lg"
            >
                {selectedReceipt && (
                    <div className="space-y-8 p-2">
                        {/* Receipt Header */}
                        <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">RECEIPT</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">No: RCP-{selectedReceipt.receipt_id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                                <p className="text-sm font-bold text-slate-900">{new Date(selectedReceipt.payment_date).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Student Info */}
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Student Name</p>
                                <p className="text-sm font-bold text-slate-900">{selectedReceipt.student_name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Admission No.</p>
                                <p className="text-sm font-bold text-slate-900">{selectedReceipt.admission_no}</p>
                            </div>
                        </div>

                        {/* Components Table */}
                        <div className="bg-slate-50 rounded-2xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-100/50">
                                        <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                                        <th className="text-right py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedReceipt.components?.map((comp: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="py-3 px-4">
                                                <p className="text-sm font-bold text-slate-800">{comp.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{comp.installment}</p>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="text-sm font-black text-slate-900">{formatCurrency(comp.amount)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-900 text-white">
                                        <td className="py-4 px-4 text-[10px] font-black uppercase tracking-widest">Total Paid</td>
                                        <td className="py-4 px-4 text-right text-lg font-black">{formatCurrency(selectedReceipt.amount)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="pt-6 text-center border-t border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thank you for your payment</p>
                            <button
                                onClick={() => window.print()}
                                className="mt-6 w-full py-4 bg-slate-100 text-slate-900 rounded-xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={18} />
                                Download PDF
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Receipt View Modal */}
            <Modal
                isOpen={!!selectedReceipt}
                onClose={() => setSelectedReceipt(null)}
                title="Fee Receipt"
                size="lg"
            >
                {selectedReceipt && (
                    <div className="space-y-8 p-2">
                        {/* Receipt Header */}
                        <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">RECEIPT</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">No: RCP-{selectedReceipt.receipt_id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                                <p className="text-sm font-bold text-slate-900">{new Date(selectedReceipt.payment_date).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Student Info */}
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Student Name</p>
                                <p className="text-sm font-bold text-slate-900">{selectedReceipt.student_name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Admission No.</p>
                                <p className="text-sm font-bold text-slate-900">{selectedReceipt.admission_no}</p>
                            </div>
                        </div>

                        {/* Components Table */}
                        <div className="bg-slate-50 rounded-2xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-100/50">
                                        <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                                        <th className="text-right py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedReceipt.components?.map((comp: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="py-3 px-4">
                                                <p className="text-sm font-bold text-slate-800">{comp.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{comp.installment}</p>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="text-sm font-black text-slate-900">{formatCurrency(comp.amount)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-900 text-white">
                                        <td className="py-4 px-4 text-[10px] font-black uppercase tracking-widest">Total Paid</td>
                                        <td className="py-4 px-4 text-right text-lg font-black">{formatCurrency(selectedReceipt.amount)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="pt-6 text-center border-t border-slate-100">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-center gap-2">
                                <Scale size={12} /> Balanced in General Ledger
                            </p>
                            <button 
                                onClick={() => navigate('/accounting/coa')}
                                className="mt-2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                                View Journal Entry <ArrowRight size={12} />
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="mt-6 w-full py-4 bg-slate-100 text-slate-900 rounded-xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={18} />
                                Download PDF
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
