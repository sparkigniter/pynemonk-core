import { 
    Sparkles, DollarSign, CalendarCheck, Users, GraduationCap, 
    BookOpen, PenTool, AlertCircle, Clock, 
    BookCheck, ShieldCheck, 
    Phone, Wallet, X, Lock, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardData } from '../../api/dashboard.api';
import { getInvoices, getPaymentConfig, createCheckoutSession } from '../../api/accounting.api';
import { get, getBaseURL } from '../../api/base.api';
import { useState, useEffect } from 'react';
import DragDropWidgetContainer from './components/DragDropWidgetContainer';

// ── Parent Dashboard Subcomponent ──
interface ParentDashboardProps {
    user: any;
    initialData: any;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ user, initialData }) => {
    const [activeChild, setActiveChild] = useState<any>(initialData.children?.[0] || null);
    const [attendance, setAttendance] = useState<any>(null);
    const [exams, setExams] = useState<any>(null);
    const [classroom, setClassroom] = useState<any>(null);
    const [homeworks, setHomeworks] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [childLoading, setChildLoading] = useState(false);
    
    // Sub-panel tabs: 'homework' | 'academics' | 'attendance' | 'timetable'
    const [activeSubTab, setActiveSubTab] = useState<'homework' | 'academics' | 'attendance' | 'timetable'>('homework');
    
    // Fee checkout drawer states
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [isPayDrawerOpen, setIsPayDrawerOpen] = useState(false);
    const [payAmount, setPayAmount] = useState('');
    const [paymentConfig, setPaymentConfig] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    // Fetch initial child data & payments configuration
    useEffect(() => {
        const fetchPayConfig = async () => {
            try {
                const config = await getPaymentConfig();
                setPaymentConfig(config);
            } catch (err) {
                console.error("Failed to load payment config:", err);
            }
        };
        fetchPayConfig();
    }, []);

    // Sync child-specific panels on change
    useEffect(() => {
        if (!activeChild) return;
        
        const fetchChildDetails = async () => {
            setChildLoading(true);
            try {
                const [attRes, examRes, classRes, invRes] = await Promise.all([
                    get<any>(`/school/guardian/student/${activeChild.id}/attendance`),
                    get<any>(`/school/guardian/student/${activeChild.id}/exams`),
                    get<any>(`/school/guardian/student/${activeChild.id}/classroom`),
                    getInvoices({ studentId: activeChild.id })
                ]);
                
                setAttendance(attRes?.data || attRes);
                setExams(examRes?.data || examRes);
                setClassroom(classRes?.data || classRes);
                setInvoices(invRes || []);
                
                const clsId = classRes?.data?.classroom?.id || classRes?.classroom?.id;
                if (clsId) {
                    const hwRes = await get<any>(`/school/homework?classroomId=${clsId}`);
                    setHomeworks(hwRes?.data || hwRes || []);
                } else {
                    setHomeworks([]);
                }
            } catch (err) {
                console.error("Failed to load child details:", err);
            } finally {
                setChildLoading(false);
            }
        };
        
        fetchChildDetails();
    }, [activeChild]);

    const handlePayTrigger = (invoice: any) => {
        setSelectedInvoice(invoice);
        const outstanding = parseFloat(invoice.net_amount) - parseFloat(invoice.paid_amount || 0);
        setPayAmount(outstanding.toString());
        setIsPayDrawerOpen(true);
    };

    const handlePaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setPaymentError(null);
        try {
            // strip gen or alloc prefix to get raw database primary key
            const rawId = selectedInvoice.id.replace('GEN-', '').replace('ALLOC-', '');
            const session = await createCheckoutSession({
                invoiceId: Number(rawId),
                amount: Number(payAmount)
            });

            if (session.success) {
                if (session.checkoutUrl) {
                    setTimeout(() => {
                        window.location.href = session.checkoutUrl;
                    }, 1500);
                } else if (session.gateway === 'razorpay') {
                    // Simulated checkout callback webhook integration
                    setTimeout(async () => {
                        try {
                            const tenantId = user?.tenant_id || 1;
                            const res = await fetch(`${getBaseURL()}/accounting/payments/webhook?tenant_id=${tenantId}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    gateway: 'razorpay',
                                    reference: session.orderId || `mock_order_${selectedInvoice.id}`,
                                    status: 'success'
                                })
                            });
                            if (res.ok) {
                                window.location.href = `/payment/success?reference=${session.orderId || `mock_order_${selectedInvoice.id}`}&amount=${payAmount}`;
                            } else {
                                throw new Error("Failed to post mock payment success callback.");
                            }
                        } catch (webhookErr: any) {
                            setPaymentError(webhookErr.message);
                            setIsProcessing(false);
                        }
                    }, 2000);
                } else {
                    setTimeout(() => {
                        window.location.href = `/payment/success?reference=${session.sessionId}&amount=${payAmount}`;
                    }, 1500);
                }
            } else {
                throw new Error("Could not initialize payment session.");
            }
        } catch (err: any) {
            setPaymentError(err.message || "An unexpected error occurred.");
            setIsProcessing(false);
        }
    };

    const formatCurrency = (amount: any) => {
        const val = parseFloat(amount || 0);
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(val);
    };

    const studentSummary = classroom?.classroom || {};
    const mentorInitials = studentSummary.teacher_first_name 
        ? `${studentSummary.teacher_first_name[0]}${studentSummary.teacher_last_name?.[0] || ''}` 
        : 'T';

    const outstandingFees = invoices.reduce((sum, inv) => {
        if (inv.status !== 'paid') {
            return sum + (parseFloat(inv.net_amount) - parseFloat(inv.paid_amount || 0));
        }
        return sum;
    }, 0);

    const activeDaysPresent = attendance?.summary?.find((s: any) => s.status === 'present')?.count || 0;
    const activeDaysAbsent = attendance?.summary?.find((s: any) => s.status === 'absent')?.count || 0;
    const activeDaysLate = attendance?.summary?.find((s: any) => s.status === 'late')?.count || 0;
    const totalAttendanceDays = activeDaysPresent + activeDaysAbsent + activeDaysLate;
    const attendancePercentage = totalAttendanceDays > 0 
        ? Math.round((activeDaysPresent / totalAttendanceDays) * 100) 
        : 100;

    const gpaPercent = exams?.past?.length > 0
        ? Math.round(exams.past.reduce((sum: number, r: any) => sum + ((r.marks / r.max_marks) * 100), 0) / exams.past.length)
        : 0;

    return (
        <div className="space-y-10 max-w-[1650px] mx-auto pb-16 animate-in fade-in duration-700">
            {/* ── Visual Header & Children Switcher ── */}
            <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-8 sm:p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                            <Sparkles size={14} className="text-amber-400" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">Parent Dashboard</span>
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-none">
                                Welcome, <span className="text-primary">{user?.email?.split('@')[0]}</span>
                            </h1>
                            <p className="text-white/50 text-sm font-semibold mt-2">
                                Keep track of your children's learning records, attendance details, marks, and fee invoices.
                            </p>
                        </div>
                    </div>

                    {/* Switcher Card */}
                    {initialData.children && initialData.children.length > 0 && (
                        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 space-y-4 md:w-[360px] shrink-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/55">Linked Students</p>
                            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto no-scrollbar">
                                {initialData.children.map((child: any) => {
                                    const isSelected = activeChild?.id === child.id;
                                    return (
                                        <button
                                            key={child.id}
                                            onClick={() => setActiveChild(child)}
                                            className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all text-left ${
                                                isSelected 
                                                ? 'bg-white text-slate-900 shadow-xl font-bold' 
                                                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                                                isSelected ? 'bg-slate-900 text-white' : 'bg-white/10 text-white'
                                            }`}>
                                                {child.name?.[0] || 'S'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs truncate font-bold">{child.name}</p>
                                                <p className={`text-[9px] uppercase font-black tracking-wider ${isSelected ? 'text-slate-400' : 'text-white/40'}`}>
                                                    {child.grade_name} • {child.classroom_name}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* If no children linked */}
            {(!initialData.children || initialData.children.length === 0) && (
                <div className="p-16 text-center bg-white border border-slate-100 rounded-[3rem] shadow-sm max-w-2xl mx-auto space-y-6">
                    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                        <Users size={36} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">No Students Linked</h3>
                        <p className="text-sm text-slate-400 leading-relaxed font-semibold max-w-md mx-auto">
                            No student profiles have been linked to your parent account in this school system. Please reach out to your administrator to request child linkage.
                        </p>
                    </div>
                </div>
            )}

            {activeChild && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
                    {/* ── Sidebar & Stats Panel ── */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Child Profile summary */}
                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100/80 shadow-sm space-y-6 relative overflow-hidden">
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="w-16 h-16 bg-primary/10 text-primary border-4 border-white shadow-inner rounded-2xl flex items-center justify-center shrink-0 text-2xl font-black">
                                    {activeChild.name?.[0] || 'C'}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-slate-800 leading-none">{activeChild.name}</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
                                        {activeChild.grade_name} • {activeChild.classroom_name}
                                    </p>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[8px] font-black uppercase tracking-wider text-emerald-600">
                                        <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                                        Roll No: {studentSummary.roll_number || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="absolute right-0 bottom-0 w-32 h-32 bg-slate-50 rounded-full blur-2xl opacity-40 -mr-16 -mb-16 pointer-events-none" />
                        </div>

                        {/* Analytic Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Attendance</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-emerald-600">{attendancePercentage}%</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">Rate</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${attendancePercentage}%` }} />
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Average score</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-indigo-600">{gpaPercent}%</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">GPA</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${gpaPercent}%` }} />
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2 col-span-2 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Pending Homework</p>
                                    <h4 className="text-xl font-black text-slate-800">{homeworks.length} Assignments</h4>
                                </div>
                                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                                    <BookCheck size={20} />
                                </div>
                            </div>
                        </div>

                        {/* Invoices and Payments Widget */}
                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100/80 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest">Fees & Invoices</h4>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Outstanding Statements</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-slate-800">{formatCurrency(outstandingFees)}</p>
                                    <p className="text-[8px] text-rose-500 font-black uppercase tracking-widest">Due Total</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {invoices.map((inv, idx) => {
                                    const isPaid = inv.status === 'paid';
                                    const outstanding = parseFloat(inv.net_amount) - parseFloat(inv.paid_amount || 0);
                                    return (
                                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3 group hover:bg-white hover:border-slate-200 transition-all duration-300">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">{inv.invoice_no}</p>
                                                    <p className="text-[9px] text-slate-400 font-semibold uppercase">{inv.source_type?.replace('_', ' ')}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border
                                                    ${isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                    {inv.status}
                                                </span>
                                            </div>
                                            {!isPaid && (
                                                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase block">Remaining</span>
                                                        <span className="text-xs font-black text-slate-800">{formatCurrency(outstanding)}</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => handlePayTrigger(inv)}
                                                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-md shadow-slate-200"
                                                    >
                                                        Pay Online
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {invoices.length === 0 && (
                                    <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No invoice logs found</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Class Mentor Profile */}
                        <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-4 opacity-10"><ShieldCheck size={72} /></div>
                            <div>
                                <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Class Mentor</p>
                                <h4 className="text-md font-bold mt-1">Institutional Support</h4>
                            </div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-md">
                                    {mentorInitials}
                                </div>
                                <div>
                                    <h5 className="font-bold text-sm leading-none">
                                        {studentSummary.teacher_first_name} {studentSummary.teacher_last_name || 'Not Mapped'}
                                    </h5>
                                    <p className="text-white/50 text-[10px] uppercase font-bold mt-1">Class Teacher</p>
                                    {studentSummary.teacher_phone && (
                                        <a href={`tel:${studentSummary.teacher_phone}`} className="flex items-center gap-1.5 text-white/60 text-[10px] mt-1 hover:text-white">
                                            <Phone size={10} /> {studentSummary.teacher_phone}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Main Panel View tabs ── */}
                    <div className="lg:col-span-8 bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm min-h-[650px] relative overflow-hidden">
                        {childLoading ? (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            </div>
                        ) : null}

                        {/* Sub Tab Buttons */}
                        <div className="flex gap-4 border-b border-slate-100 pb-4 mb-8 overflow-x-auto no-scrollbar">
                            {[
                                { id: 'homework', label: 'Diary & Homework', icon: BookOpen },
                                { id: 'academics', label: 'Academics & Exams', icon: GraduationCap },
                                { id: 'attendance', label: 'Attendance logs', icon: CalendarCheck },
                                { id: 'timetable', label: 'Timetable', icon: Clock }
                            ].map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeSubTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSubTab(tab.id as any)}
                                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border
                                            ${isActive 
                                                ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' 
                                                : 'bg-white border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Icon size={14} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tab Content rendering */}
                        <div className="space-y-6">
                            {/* Homework view */}
                            {activeSubTab === 'homework' && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    {homeworks.map((hw, idx) => (
                                        <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 hover:bg-white hover:border-slate-200 transition-all duration-300">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-[8px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block">
                                                        {hw.subject_name || 'Subject'}
                                                    </span>
                                                    <h5 className="text-md font-bold text-slate-800 mt-2">{hw.title}</h5>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Assigned on {new Date(hw.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className="inline-flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-3 py-1 rounded-xl w-fit self-start sm:self-center">
                                                    <Clock size={12} />
                                                    DUE: {new Date(hw.due_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed font-semibold">{hw.description}</p>
                                        </div>
                                    ))}

                                    {homeworks.length === 0 && (
                                        <div className="py-20 text-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
                                            <BookCheck size={36} className="text-slate-200 mx-auto mb-4" />
                                            <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest">No pending assignments</h5>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Academics view */}
                            {activeSubTab === 'academics' && (
                                <div className="space-y-8 animate-in fade-in duration-300">
                                    {/* Upcoming schedule */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest px-2">Upcoming Exam Schedule</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {exams?.upcoming?.map((exam: any, idx: number) => (
                                                <div key={idx} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex gap-4">
                                                    <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col items-center justify-center text-indigo-600 shrink-0 font-bold">
                                                        <span className="text-[8px] uppercase">{new Date(exam.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                        <span className="text-md leading-none mt-0.5">{new Date(exam.date).getDate()}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h5 className="font-bold text-slate-800 text-sm truncate">{exam.subject_name}</h5>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
                                                            {exam.exam_name} • {exam.start_time || '09:00 AM'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}

                                            {(!exams?.upcoming || exams.upcoming.length === 0) && (
                                                <div className="col-span-full py-8 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No upcoming exams mapped</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Performance history */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Past Grade Performance</h4>
                                        <div className="space-y-3">
                                            {exams?.past?.map((res: any, idx: number) => (
                                                <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 space-y-3 hover:shadow-md hover:shadow-slate-100 transition-all duration-300">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h5 className="font-bold text-slate-800 text-sm">{res.subject_name}</h5>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{res.exam_name}</p>
                                                        </div>
                                                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl text-[9px] font-black uppercase">
                                                            Grade: {res.grade}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                                                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(res.marks / res.max_marks) * 100}%` }} />
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                                        <span className="uppercase">{new Date(res.date).toLocaleDateString()}</span>
                                                        <span className="text-slate-700 font-black">{res.marks} / {res.max_marks} marks</span>
                                                    </div>
                                                </div>
                                            ))}

                                            {(!exams?.past || exams.past.length === 0) && (
                                                <div className="py-12 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No past evaluations recorded</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Attendance view */}
                            {activeSubTab === 'attendance' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { label: 'Present', count: activeDaysPresent, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                                            { label: 'Absent', count: activeDaysAbsent, color: 'text-rose-500 bg-rose-50 border-rose-100' },
                                            { label: 'Late', count: activeDaysLate, color: 'text-amber-500 bg-amber-50 border-amber-100' }
                                        ].map((stat) => (
                                            <div key={stat.label} className={`p-4 rounded-3xl border text-center ${stat.color}`}>
                                                <p className="text-[9px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                                                <h4 className="text-2xl font-black">{stat.count}</h4>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Recent Record logs</h4>
                                        <div className="space-y-2">
                                            {attendance?.recent?.map((rec: any, idx: number) => (
                                                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">
                                                            {new Date(rec.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                        {rec.remarks && <p className="text-[9px] text-slate-400 italic mt-0.5">Note: {rec.remarks}</p>}
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border
                                                        ${rec.status === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                          rec.status === 'absent' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                                        }`}>
                                                        {rec.status}
                                                    </span>
                                                </div>
                                            ))}

                                            {(!attendance?.recent || attendance.recent.length === 0) && (
                                                <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No recent attendance records</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Timetable view */}
                            {activeSubTab === 'timetable' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    {classroom?.subjects?.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                        <th className="px-6 py-4">Subject</th>
                                                        <th className="px-6 py-4">Assigned Instructor</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {classroom.subjects.map((sub: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <p className="text-xs font-bold text-slate-700">{sub.subject_name}</p>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                                    {sub.teacher_first_name} {sub.teacher_last_name || ''}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="py-16 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No subjects mapped in classroom</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Slide-out Online Payment Checkout Drawer ── */}
            {isPayDrawerOpen && selectedInvoice && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-all duration-300 animate-in fade-in"
                        onClick={() => !isProcessing && setIsPayDrawerOpen(false)}
                    />
                    
                    {/* Drawer Panel */}
                    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-slate-100 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <Wallet size={16} className="text-primary" />
                                    Online Fee Checkout
                                </h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
                                    Invoice {selectedInvoice.invoice_no}
                                </p>
                            </div>
                            <button 
                                onClick={() => !isProcessing && setIsPayDrawerOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
                                disabled={isProcessing}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-4 shadow-xl">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Student / Child</p>
                                    <p className="text-sm font-bold text-white mt-0.5">{activeChild.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Payable</p>
                                        <p className="text-md font-black text-white">{formatCurrency(selectedInvoice.net_amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Outstanding</p>
                                        <p className="text-md font-black text-amber-400 text-right">
                                            {formatCurrency(parseFloat(selectedInvoice.net_amount) - parseFloat(selectedInvoice.paid_amount || 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handlePaySubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">₹</span>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            className="w-full pl-10 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm text-slate-800 focus:bg-white focus:border-slate-200 transition-all outline-none"
                                            value={payAmount}
                                            onChange={e => setPayAmount(e.target.value)}
                                            max={parseFloat(selectedInvoice.net_amount) - parseFloat(selectedInvoice.paid_amount || 0)}
                                            required
                                            disabled={isProcessing}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-slate-50">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</span>
                                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-[9px] font-black uppercase text-indigo-600 tracking-widest">
                                            {paymentConfig?.payment_gateway || 'MOCK_DEMO'}
                                        </span>
                                    </div>

                                    {paymentConfig?.payment_gateway === 'MOCK_DEMO' && (
                                        <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-3xl text-center space-y-3">
                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Simulated Sandbox Portal</p>
                                            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                                                This mock sandbox lets you fully verify receipt generation and double-entry journal balance reconciliations instantly.
                                            </p>
                                        </div>
                                    )}

                                    {paymentConfig?.payment_gateway !== 'MOCK_DEMO' && (
                                        <div className="p-6 bg-indigo-50/30 border border-indigo-100/50 rounded-3xl text-center space-y-3">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Live merchant integration</p>
                                            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                                                You will be securely redirected to the {paymentConfig?.payment_gateway} hosted portal to complete the transaction.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {paymentError && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
                                        <AlertCircle size={16} className="shrink-0" />
                                        <p className="text-[10px] font-bold uppercase tracking-wider">{paymentError}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isProcessing || Number(payAmount) <= 0}
                                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Redirecting to gateway...
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={14} />
                                            Authorize Payment
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// ── Main Dashboard Controller Page ──
const Dashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframeDays] = useState('30');
    
    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            try {
                const res = await getDashboardData(timeframeDays);
                setData(res);
            } catch (err: any) {
                console.error('Failed to fetch dashboard', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [timeframeDays]);

    if (loading) {
        return (
            <div className="h-[70vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center shadow-lg shadow-rose-500/5">
                    <AlertCircle size={40} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Restricted Access</h2>
                    <p className="text-[var(--text-muted)] max-w-md mx-auto">Your current role does not have the permissions required to view the global school dashboard. Please contact your administrator if you believe this is an error.</p>
                </div>
            </div>
        );
    }

    // Direct route to the Parent dashboard subcomponent if user's role is parent/guardian
    if (data.type === 'parent') {
        return <ParentDashboard user={user} initialData={data} />;
    }
    
    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const primaryRole = user?.roles[0] || 'User';
    const capitalizedRole = primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1).replace('_', ' ');

    const getMiniStats = () => {
        if (!data) return [];
        
        if (data.type === 'admin') {
            return [
                { label: 'Staff on Leave', value: data.insights?.staffOnLeave?.length?.toString() || '0', icon: Users, color: '#f59e0b' },
                { label: 'New Admissions', value: data.insights?.recentAdmissions?.length?.toString() || '0', icon: GraduationCap, color: 'var(--primary)' },
                { label: 'Today Attendance', value: (data.attendanceTrends?.slice(-1)[0]?.percentage || '0') + '%', icon: CalendarCheck, color: '#10b981' },
            ];
        }

        if (data.type === 'principal') {
            return [
                { label: 'Today Attendance', value: (data.stats?.today_attendance || '0') + '%', icon: CalendarCheck, color: '#10b981' },
                { label: 'Leaves Pending', value: data.pendingLeaves?.length?.toString() || '0', icon: Users, color: '#f59e0b' },
                { label: 'Collections Rate', value: (data.stats?.fee_collection_rate || '0') + '%', icon: DollarSign, color: 'var(--primary)' },
            ];
        }

        if (data.type === 'teacher') {
            return [
                { label: 'Urgent Marking', value: data.insights?.urgentMarking?.length?.toString() || '0', icon: PenTool, color: '#f43f5e' },
                { label: 'My Classes Today', value: data.stats?.classCount?.toString() || '0', icon: BookOpen, color: 'var(--primary)' },
                { label: 'HW Handled', value: data.stats?.my_homework_count?.toString() || '0', icon: CalendarCheck, color: '#10b981' },
            ];
        }

        return [];
    };

    const activeMiniStats = getMiniStats();

    return (
        <div className="space-y-10 max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-1000">
            {/* ── Modern Hero Section ── */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-surface-dark p-8 sm:p-12 text-white shadow-2xl shadow-theme/20">
                {/* Visual accents */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)]/5 rounded-full border border-white/10 backdrop-blur-md">
                            <Sparkles size={14} className="text-amber-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        
                        <div className="space-y-2">
                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
                                {greeting()}, <span className="text-primary">{capitalizedRole}</span>.
                            </h1>
                            <p className="text-white/50 text-lg font-medium max-w-xl">
                                Your school's digital command center is ready. Here's what's happening across the campus today.
                            </p>
                        </div>
                    </div>

                    <div className="lg:w-[400px] bg-[var(--card-bg)]/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 space-y-6 shrink-0">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-widest">Today at a Glance</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        
                        <div className="space-y-4">
                            {activeMiniStats.length > 0 ? activeMiniStats.map((stat) => (
                                <div key={stat.label} className="flex items-center justify-between p-4 bg-[var(--card-bg)]/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-xl bg-[var(--card-bg)]/5 text-white/70 group-hover:text-white transition-colors">
                                            <stat.icon size={18} />
                                        </div>
                                        <span className="text-sm font-bold text-white/70 group-hover:text-white transition-colors">{stat.label}</span>
                                    </div>
                                    <span className="text-lg font-bold text-white">{stat.value}</span>
                                </div>
                            )) : (
                                <div className="text-center py-6 text-white/30 text-xs font-bold uppercase tracking-widest">
                                    No immediate alerts
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Drag & Drop Widget Cockpit ── */}
            <DragDropWidgetContainer 
                role={data.type}
                userId={user?.sub || 'anonymous'}
                data={data}
            />
        </div>
    );
};

export default Dashboard;
