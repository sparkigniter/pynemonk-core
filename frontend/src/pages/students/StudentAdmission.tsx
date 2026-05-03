import { useState, useEffect } from 'react';
import {
    GraduationCap, User, Users,
    ArrowLeft, Sparkles, CheckCircle2, ChevronRight,
    Loader2, UserCheck, CreditCard, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAcademics } from '../../contexts/AcademicsContext';
import * as gradeApi from '../../api/grade.api';
import * as studentApi from '../../api/student.api';
import { ComboBox } from '../../components/ui/ComboBox';
import { useNotification } from '../../contexts/NotificationContext';

type AdmissionStep = 'student' | 'guardian' | 'enrollment' | 'finance';

export default function StudentAdmission() {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const { currentYear, years: academicYears, isYearClosed } = useAcademics();
    const [activeStep, setActiveStep] = useState<AdmissionStep>('student');
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [grades, setGrades] = useState<gradeApi.Grade[]>([]);

    const [formData, setFormData] = useState({
        student: {
            first_name: '',
            last_name: '',
            email: '',
            gender: 'male',
            date_of_birth: '',
            admission_no: '',
            blood_group: '',
            mother_tongue: '',
            religion: '',
            nationality: 'Indian',
            phone: '',
            address: '',
        },
        guardian: {
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            relation: 'father',
            occupation: '',
            is_emergency: true,
        },
        enrollment: {
            grade_id: '',
            section: 'A',
            academic_year_id: '',
            roll_number: '',
        },
        finance: {
            fee_category: 'Regular',
            discount_percent: 0,
            payment_mode: 'Annual'
        }
    });

    useEffect(() => {
        const loadGrades = async () => {
            const response = await gradeApi.getGrades();
            setGrades(response.data);
        };
        loadGrades();
    }, []);

    useEffect(() => {
        if (academicYears.length > 0 && !formData.enrollment.academic_year_id) {
            setFormData(prev => ({
                ...prev,
                enrollment: {
                    ...prev.enrollment,
                    academic_year_id: (currentYear?.id || academicYears[0].id).toString()
                }
            }));
        }

        // Auto-generate admission number from backend
        const fetchAdmissionNo = async () => {
            if (!formData.student.admission_no) {
                try {
                    const res = await studentApi.getNextAdmissionNumber();
                    updateStudent('admission_no', res.admission_no);
                } catch (err) {
                    // Fallback to year-based if API fails
                    const year = new Date().getFullYear();
                    const random = Math.floor(100 + Math.random() * 900);
                    updateStudent('admission_no', `ADM/${year}/${random}`);
                }
            }
            setLoading(false);
        };
        fetchAdmissionNo();
    }, [academicYears, currentYear]);

    const validateStep = (step: AdmissionStep): boolean => {
        const { student, guardian, enrollment } = formData;
        if (step === 'student') {
            if (!student.first_name || !student.admission_no || !student.gender || !student.date_of_birth) {
                notify('warning', 'Missing Information', 'Please fill all required student identity fields.');
                return false;
            }
        }
        if (step === 'guardian') {
            if (!guardian.first_name || !guardian.phone || !guardian.relation) {
                notify('warning', 'Missing Information', 'Please fill basic guardian details.');
                return false;
            }
        }
        if (step === 'enrollment') {
            if (!enrollment.grade_id) {
                notify('warning', 'Missing Information', 'Please select a Grade/Class for enrollment.');
                return false;
            }
        }
        return true;
    };

    const handleAdmission = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Final validation
        if (!validateStep('student') || !validateStep('guardian') || !validateStep('enrollment')) return;

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                student: {
                    ...formData.student,
                    email: formData.student.email || undefined,
                    status: 'pending' // Initialize as lead/pending
                },
                enrollment: {
                    ...formData.enrollment,
                    grade_id: parseInt(formData.enrollment.grade_id),
                    academic_year_id: parseInt(formData.enrollment.academic_year_id as string)
                }
            };
            await studentApi.admitStudent(payload);
            notify('success', 'Admission Lead Created', `${formData.student.first_name} has been added to the admission pipeline.`);
            navigate('/students');
        } catch (err: any) {
            notify('error', 'Admission Failed', err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const nextStep = () => {
        if (activeStep === 'student' && validateStep('student')) setActiveStep('guardian');
        else if (activeStep === 'guardian' && validateStep('guardian')) setActiveStep('enrollment');
        else if (activeStep === 'enrollment' && validateStep('enrollment')) setActiveStep('finance');
    };

    const updateStudent = (field: string, value: any) => setFormData(p => ({ ...p, student: { ...p.student, [field]: value } }));
    const updateGuardian = (field: string, value: any) => setFormData(p => ({ ...p, guardian: { ...p.guardian, [field]: value } }));
    const updateEnrollment = (field: string, value: any) => setFormData(p => ({ ...p, enrollment: { ...p.enrollment, [field]: value } }));
    const updateFinance = (field: string, value: any) => setFormData(p => ({ ...p, finance: { ...p.finance, [field]: value } }));

    const steps = [
        { id: 'student', label: 'Student Profile', icon: User, description: 'Personal identity' },
        { id: 'guardian', label: 'Guardians', icon: Users, description: 'Family & contact' },
        { id: 'enrollment', label: 'Enrollment', icon: UserCheck, description: 'Grade & academic' },
        { id: 'finance', label: 'Finance', icon: CreditCard, description: 'Fees & scholarship' },
    ];

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Preparing Wizard...</p>
        </div>
    );

    if (isYearClosed()) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] text-center p-8">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6">
                    <ShieldCheck size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Academic Year Closed</h2>
                <p className="text-slate-400 mt-2 max-w-md font-medium">New admissions are restricted because the current academic session has been locked by administration.</p>
                <button onClick={() => navigate('/students')} className="mt-8 btn-primary px-8">Return to Directory</button>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2.5rem] flex items-center justify-center shadow-inner">
                        <Sparkles size={32} />
                    </div>
                    <div>
                        <button onClick={() => navigate('/students')} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-all font-black text-[10px] uppercase tracking-widest mb-2 group">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Directory
                        </button>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Student Admission</h1>
                        <p className="text-slate-500 font-medium">Create a new student identity and manage enrollment pipeline.</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {steps.map((s, i) => (
                        <div key={s.id} className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all
                                ${activeStep === s.id ? 'bg-primary text-white shadow-xl scale-110' :
                                    (steps.findIndex(step => step.id === activeStep) > i) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {(steps.findIndex(step => step.id === activeStep) > i) ? <CheckCircle2 size={18} /> : i + 1}
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${activeStep === s.id ? 'text-primary' : 'text-slate-400'}`}>{s.id}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Visual Card / Context */}
                <div className="lg:sticky lg:top-8 space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                                <GraduationCap size={24} className="text-white" />
                            </div>
                            <h3 className="text-xl font-black leading-tight mb-2">Academic Session<br />{currentYear?.name || 'Loading...'}</h3>
                            <p className="text-white/50 text-sm font-medium">You are currently processing an admission for the active term.</p>
                        </div>
                        <div className="mt-10 pt-8 border-t border-white/10 space-y-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Entry Type</span>
                                <span className="text-xs font-black">Direct Admission</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Status</span>
                                <span className="text-xs font-black text-amber-400 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                                    In Pipeline
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Panels */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                        <div className="p-12">
                            {activeStep === 'student' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                                            <User size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Student Identity</h2>
                                            <p className="text-slate-400 font-medium">Primary identification and personal background.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name *</label>
                                            <input required value={formData.student.first_name} onChange={e => updateStudent('first_name', e.target.value)} className="input-admission" placeholder="John" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name</label>
                                            <input value={formData.student.last_name} onChange={e => updateStudent('last_name', e.target.value)} className="input-admission" placeholder="Doe" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission Number *</label>
                                            <input required value={formData.student.admission_no} onChange={e => updateStudent('admission_no', e.target.value)} className="input-admission font-mono" placeholder="ADM-2026-XXX" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Email (Optional)</label>
                                            <input type="email" value={formData.student.email} onChange={e => updateStudent('email', e.target.value)} className="input-admission" placeholder="john@edu.com" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth *</label>
                                            <input required type="date" value={formData.student.date_of_birth} onChange={e => updateStudent('date_of_birth', e.target.value)} className="input-admission" />
                                        </div>
                                        <ComboBox
                                            label="Gender *"
                                            value={formData.student.gender}
                                            onChange={val => updateStudent('gender', val)}
                                            options={[
                                                { value: 'male', label: 'Male' },
                                                { value: 'female', label: 'Female' },
                                                { value: 'other', label: 'Other' },
                                            ]}
                                        />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mother Tongue *</label>
                                            <input required value={formData.student.mother_tongue} onChange={e => updateStudent('mother_tongue', e.target.value)} className="input-admission" placeholder="Kannada, English, etc." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Religion *</label>
                                            <input required value={formData.student.religion} onChange={e => updateStudent('religion', e.target.value)} className="input-admission" placeholder="Hindu, Muslim, etc." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nationality *</label>
                                            <input required value={formData.student.nationality} onChange={e => updateStudent('nationality', e.target.value)} className="input-admission" placeholder="Indian" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blood Group</label>
                                            <input value={formData.student.blood_group} onChange={e => updateStudent('blood_group', e.target.value)} className="input-admission" placeholder="O+" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeStep === 'guardian' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                                            <Users size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Parent / Guardian</h2>
                                            <p className="text-slate-400 font-medium">Point of contact and family information.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name *</label>
                                            <input required value={formData.guardian.first_name} onChange={e => updateGuardian('first_name', e.target.value)} className="input-admission" placeholder="Robert" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name *</label>
                                            <input required value={formData.guardian.last_name} onChange={e => updateGuardian('last_name', e.target.value)} className="input-admission" placeholder="Doe" />
                                        </div>
                                        <ComboBox
                                            label="Relation *"
                                            value={formData.guardian.relation}
                                            onChange={val => updateGuardian('relation', val)}
                                            options={[
                                                { value: 'father', label: 'Father' },
                                                { value: 'mother', label: 'Mother' },
                                                { value: 'guardian', label: 'Legal Guardian' },
                                            ]}
                                        />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Number *</label>
                                            <input required value={formData.guardian.phone} onChange={e => updateGuardian('phone', e.target.value)} className="input-admission" placeholder="+1 555-0123" />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                                            <input type="email" value={formData.guardian.email} onChange={e => updateGuardian('email', e.target.value)} className="input-admission" placeholder="robert@mail.com" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeStep === 'enrollment' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                                            <GraduationCap size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Academic Placement</h2>
                                            <p className="text-slate-400 font-medium">Assign the student to a grade and session.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <ComboBox
                                            label="Target Grade *"
                                            value={formData.enrollment.grade_id}
                                            onChange={val => updateEnrollment('grade_id', val)}
                                            placeholder="Select Grade"
                                            options={grades.map(g => ({ value: g.id.toString(), label: g.name }))}
                                        />
                                        <ComboBox
                                            label="Target Section *"
                                            value={formData.enrollment.section}
                                            onChange={val => updateEnrollment('section', val)}
                                            options={[
                                                { value: 'A', label: 'Section A' },
                                                { value: 'B', label: 'Section B' },
                                                { value: 'C', label: 'Section C' },
                                            ]}
                                        />
                                        <ComboBox
                                            label="Academic Year *"
                                            value={formData.enrollment.academic_year_id}
                                            onChange={val => updateEnrollment('academic_year_id', val)}
                                            options={academicYears.map(y => ({
                                                value: y.id.toString(),
                                                label: `${y.name} ${y.is_current ? '(Current)' : ''}`
                                            }))}
                                        />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Roll Number</label>
                                            <input value={formData.enrollment.roll_number} onChange={e => updateEnrollment('roll_number', e.target.value)} className="input-admission" placeholder="e.g. 101" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeStep === 'finance' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                                            <CreditCard size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Billing Configuration</h2>
                                            <p className="text-slate-400 font-medium">Setup fee structures and financial aid.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <ComboBox
                                            label="Fee Category"
                                            value={formData.finance.fee_category}
                                            onChange={val => updateFinance('fee_category', val)}
                                            options={[
                                                { value: 'Regular', label: 'Regular (Standard)' },
                                                { value: 'Scholarship', label: 'Full Scholarship' },
                                                { value: 'Sibling', label: 'Sibling Discount' },
                                                { value: 'StaffChild', label: 'Staff Child' },
                                            ]}
                                        />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scholarship / Discount %</label>
                                            <input type="number" value={formData.finance.discount_percent} onChange={e => updateFinance('discount_percent', parseInt(e.target.value))} className="input-admission" />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Frequency</label>
                                            <div className="flex gap-4">
                                                {['Annual', 'Quarterly', 'Monthly'].map(mode => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => updateFinance('payment_mode', mode)}
                                                        className={`flex-1 p-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all
                                                            ${formData.finance.payment_mode === mode ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
                                                    >
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="mt-16 flex gap-6">
                                {activeStep !== 'student' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const idx = steps.findIndex(s => s.id === activeStep);
                                            setActiveStep(steps[idx - 1].id as AdmissionStep);
                                        }}
                                        className="px-10 py-5 rounded-[1.5rem] border border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all flex items-center gap-3 active:scale-95"
                                    >
                                        Back
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (activeStep !== 'finance') {
                                            nextStep();
                                        } else {
                                            handleAdmission();
                                        }
                                    }}
                                    disabled={isSaving}
                                    className="flex-1 px-10 py-5 rounded-[1.5rem] bg-primary text-white text-xs font-black uppercase tracking-widest hover:opacity-90 flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-[0.98]"
                                >
                                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : activeStep === 'finance' ? <UserCheck size={20} /> : <ChevronRight size={20} />}
                                    {activeStep === 'finance' ? 'Initiate Pipeline' : 'Continue to Next Step'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .input-admission {
                    width: 100%;
                    padding: 1.25rem 1.5rem;
                    background: #f8fafc;
                    border: 1px solid #f1f5f9;
                    border-radius: 1.25rem;
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #1e293b;
                    transition: all 0.2s ease;
                }
                .input-admission:focus {
                    background: white;
                    border-color: #6366f1;
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
                    outline: none;
                }
            `}</style>
        </div>
    );
}
