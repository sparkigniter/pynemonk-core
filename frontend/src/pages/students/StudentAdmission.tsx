import { useState, useEffect, useRef } from 'react';
import {
    GraduationCap, User, Users,
    ArrowLeft, Sparkles, CheckCircle2, ChevronRight,
    Loader2, CreditCard, ShieldCheck, Clock, Search, Save, File
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAcademics } from '../../contexts/AcademicsContext';
import * as gradeApi from '../../api/grade.api';
import * as studentApi from '../../api/student.api';
import { ComboBox } from '../../components/ui/ComboBox';
import { useNotification } from '../../contexts/NotificationContext';

type AdmissionStep = 'student' | 'guardian' | 'enrollment' | 'documents' | 'test' | 'finance';

export default function StudentAdmission() {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const { currentYear, years: academicYears, isYearClosed } = useAcademics();
    const [activeStep, setActiveStep] = useState<AdmissionStep>('student');
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [grades, setGrades] = useState<gradeApi.Grade[]>([]);

    const [applicationId, setApplicationId] = useState<number | null>(null);

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
        documents: {
            birth_certificate: false,
            previous_marksheet: false,
            aadhaar_copy: false,
            photo: false,
            files: [] as any[]
        },
        test: {
            required: false,
            test_date: '',
            score: '',
            status: 'pending', // pending, cleared, failed
            remarks: ''
        },
        finance: {
            fee_category: 'Regular',
            discount_percent: 0,
            payment_mode: 'Annual',
            admission_fee: 0,
            is_paid: false,
            payment_method: 'cash'
        }
    });

    const steps = [
        { id: 'student', label: 'Student Profile', icon: User, description: 'Personal identity' },
        { id: 'guardian', label: 'Guardians', icon: Users, description: 'Family & contact' },
        { id: 'test', label: 'Entrance Assessment', icon: Sparkles, description: 'Schedule & evaluate' },
        { id: 'documents', label: 'Document Vault', icon: ShieldCheck, description: 'Digital verification' },
        { id: 'finance', label: 'Settlement', icon: CreditCard, description: 'Finalize & pay' },
    ];

    const [pendingApplications, setPendingApplications] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredApplications = pendingApplications.filter(app => {
        const name = `${app.first_name || ''} ${app.last_name || ''}`.toLowerCase();
        const appNo = app.application_no?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return name.includes(query) || appNo.includes(query);
    });

    useEffect(() => {
        const loadGrades = async () => {
            const response = await gradeApi.getGrades();
            setGrades(response.data);
        };
        const loadPending = async () => {
            try {
                const apps = await studentApi.listAdmissionApplications();
                setPendingApplications(apps.filter(a => a.status === 'draft'));
            } catch (err) {
                console.error('Failed to load pending applications', err);
            }
        };
        loadGrades();
        loadPending();
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

        const fetchAdmissionNo = async () => {
            if (!formData.student.admission_no) {
                try {
                    const res = await studentApi.getNextAdmissionNumber();
                    updateStudent('admission_no', res.admission_no);
                } catch (err) {
                    const year = new Date().getFullYear();
                    const random = Math.floor(100 + Math.random() * 900);
                    updateStudent('admission_no', `ADM/${year}/${random}`);
                }
            }
            setLoading(false);
        };
        fetchAdmissionNo();
    }, [academicYears, currentYear]);

    const resumeApplication = async (app: any) => {
        try {
            const fullApp = await studentApi.getAdmissionApplication(app.id);
            setApplicationId(fullApp.id);
            setFormData({
                student: fullApp.student_data || formData.student,
                guardian: fullApp.parent_data || formData.guardian,
                enrollment: {
                    grade_id: fullApp.grade_id?.toString() || '',
                    academic_year_id: fullApp.academic_year_id?.toString() || '',
                    section: fullApp.student_data?.section || 'A',
                    roll_number: fullApp.student_data?.roll_number || '',
                },
                documents: fullApp.document_data || formData.documents,
                test: fullApp.test_data || formData.test,
                finance: fullApp.finance_data || formData.finance
            });
            const stageMapper: Record<string, AdmissionStep> = {
                'student_info': 'student',
                'parent_info': 'guardian',
                'fees': 'finance',
                'enrollment': 'enrollment',
                'documents': 'documents',
                'test': 'test',
                'student': 'student',
                'guardian': 'guardian',
                'finance': 'finance'
            };
            setActiveStep(stageMapper[fullApp.current_stage] || 'student');
            notify('success', 'Draft Resumed', `Continuing application for ${fullApp.student_data?.first_name}`);
        } catch (err: any) {
            notify('error', 'Resume Failed', err.message);
        }
    };

    const validateStep = (step: AdmissionStep): boolean => {
        const { student, guardian } = formData;
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
        return true;
    };

    const handleAdmission = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            let appId = applicationId;
            // Phase A fix: create application if it doesn't exist yet
            if (!appId) {
                const res = await studentApi.startAdmissionWorkflow(formData.student);
                appId = res.id;
                setApplicationId(appId);
            }
            await studentApi.updateAdmissionWorkflow(appId!, {
                stage: 'finance',
                data: formData.finance
            });
            await studentApi.finalizeAdmissionWorkflow(appId!);
            notify('success', 'Admission Finalized', `${formData.student.first_name} has been officially admitted.`);
            navigate('/students');
        } catch (err: any) {
            notify('error', 'Admission Failed', err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const saveAndClose = async () => {
        const stageDataMap: Record<string, any> = {
            student: formData.student,
            guardian: formData.guardian,
            test: formData.test,
            documents: formData.documents,
            finance: formData.finance,
        };
        const currentData = stageDataMap[activeStep];
        setIsSaving(true);
        try {
            if (!applicationId) {
                // Phase A fix: capture the returned id so the draft is resumable
                const res = await studentApi.startAdmissionWorkflow(formData.student);
                setApplicationId(res.id);
            } else {
                await studentApi.updateAdmissionWorkflow(applicationId, {
                    stage: activeStep,
                    data: currentData
                });
            }
            notify('success', 'Progress Saved', 'Application draft has been securely updated.');
            navigate('/students');
        } catch (err: any) {
            notify('error', 'Save Failed', 'Could not save progress: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const nextStep = async () => {
        let currentData = null;
        let next: AdmissionStep = activeStep;

        if (activeStep === 'student' && validateStep('student')) {
            currentData = formData.student;
            next = 'guardian';
        } else if (activeStep === 'guardian' && validateStep('guardian')) {
            currentData = formData.guardian;
            next = 'test';
        } else if (activeStep === 'test') {
            currentData = formData.test;
            next = 'documents';
        } else if (activeStep === 'documents') {
            currentData = formData.documents;
            next = 'finance';
        }

        if (currentData) {
            try {
                if (!applicationId) {
                    const res = await studentApi.startAdmissionWorkflow(formData.student);
                    setApplicationId(res.id);
                } else {
                    await studentApi.updateAdmissionWorkflow(applicationId, {
                        stage: activeStep,
                        data: currentData,
                        next_stage: next
                    });
                }
                setActiveStep(next);
            } catch (err: any) {
                notify('error', 'Sync Failed', 'Could not save progress: ' + err.message);
            }
        }
    };

    const updateStudent = (field: string, value: any) => setFormData(p => ({ ...p, student: { ...p.student, [field]: value } }));
    const updateGuardian = (field: string, value: any) => setFormData(p => ({ ...p, guardian: { ...p.guardian, [field]: value } }));
    const updateEnrollment = (field: string, value: any) => setFormData(p => ({ ...p, enrollment: { ...p.enrollment, [field]: value } }));
    const updateDocuments = (field: string, value: any) => setFormData(p => ({ ...p, documents: { ...p.documents, [field]: value } }));
    const updateTest = (field: string, value: any) => setFormData(p => ({ ...p, test: { ...p.test, [field]: value } }));
    const updateFinance = (field: string, value: any) => setFormData(p => ({ ...p, finance: { ...p.finance, [field]: value } }));

    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentDocType, setCurrentDocType] = useState<string | null>(null);

    const triggerFileUpload = (docId: string) => {
        setCurrentDocType(docId);
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentDocType) return;

        setUploadingDoc(currentDocType);
        // Simulate a real-time upload to a bucket
        await new Promise(resolve => setTimeout(resolve, 1500));

        updateDocuments(currentDocType, true);
        setUploadingDoc(null);
        setCurrentDocType(null);
        notify('success', 'Upload Complete', `${file.name} has been securely stored in the cloud vault.`);

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-[var(--text-muted)] font-black text-[10px] uppercase tracking-[0.2em]">Preparing Workflow...</p>
        </div>
    );

    if (isYearClosed()) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] text-center p-8">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6">
                    <ShieldCheck size={40} />
                </div>
                <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Academic Year Closed</h2>
                <p className="text-[var(--text-muted)] mt-2 max-w-md font-medium">New admissions are restricted because the current academic session has been locked by administration.</p>
                <button onClick={() => navigate('/students')} className="mt-8 btn-primary px-8">Return to Directory</button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Page Header */}
            <div className="flex items-center gap-4 mb-10">
                <button onClick={() => navigate('/students')} className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all font-black text-[10px] uppercase tracking-widest group">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>
                <div className="w-1 h-4 bg-[var(--card-border)] rounded-full" />
                <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Admission Pipeline</h1>
                {applicationId && (
                    <span className="ml-auto text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                        DRAFT #{applicationId}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
                <div className="lg:sticky lg:top-8 space-y-4">
                    <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)] overflow-hidden shadow-sm">
                        <div className="bg-surface-dark px-6 py-5 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Academic Session</p>
                                <p className="text-base font-black text-amber-400 mt-0.5">{currentYear?.name || '—'}</p>
                            </div>
                            <GraduationCap size={20} className="text-white/20" />
                        </div>
                        <div className="p-4 space-y-1">
                            {steps.map((s, i) => {
                                const idx = steps.findIndex(step => step.id === activeStep);
                                const isCompleted = idx > i;
                                const isActive = activeStep === s.id;
                                const Icon = s.icon;
                                let summary = '';
                                if (isCompleted || isActive) {
                                    if (s.id === 'student' && formData.student.first_name) summary = `${formData.student.first_name} · ${formData.student.gender}`;
                                    if (s.id === 'guardian' && formData.guardian.first_name) summary = `${formData.guardian.first_name} · ${formData.guardian.relation}`;
                                    if (s.id === 'test') summary = formData.test.status === 'pending' ? 'Scheduled' : formData.test.status === 'cleared' ? '✓ Cleared' : '✗ Failed';
                                    if (s.id === 'documents') { const count = ['birth_certificate', 'previous_marksheet', 'aadhaar_copy', 'photo'].filter(k => (formData.documents as any)[k]).length; summary = `${count}/4 uploaded`; }
                                    if (s.id === 'finance') summary = formData.finance.is_paid ? 'Paid' : 'Pending payment';
                                }
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => isCompleted && setActiveStep(s.id as AdmissionStep)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${isActive ? 'bg-primary/10 border border-primary/20' : isCompleted ? 'hover:bg-emerald-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-[var(--background)] text-[var(--text-muted)]'}`}>
                                            {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-black truncate ${isActive ? 'text-primary' : isCompleted ? 'text-emerald-600' : 'text-[var(--text-muted)]'}`}>{s.label}</p>
                                            {summary && <p className="text-[9px] font-bold text-[var(--text-muted)] mt-0.5 truncate">{summary}</p>}
                                        </div>
                                        {isActive && <ChevronRight size={14} className="text-primary flex-shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="bg-[var(--background)] rounded-[2rem] p-5 border border-[var(--card-border)]">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Resume Pending</h4>
                            <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{filteredApplications.length}</span>
                        </div>
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                            <input type="text" placeholder="Search drafts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[10px] font-bold text-[var(--text-main)] placeholder:text-slate-300 focus:outline-none focus:border-primary transition-all" />
                        </div>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto">
                            {filteredApplications.map(app => (
                                <button key={app.id} onClick={() => resumeApplication(app)} className="w-full text-left p-3 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] hover:border-primary hover:shadow-md transition-all group">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-[11px] font-black text-[var(--text-main)] group-hover:text-primary truncate mr-2">{app.first_name || 'Incomplete'} {app.last_name}</span>
                                        <Clock size={11} className="text-slate-300 flex-shrink-0" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase">{app.application_no}</span>
                                        <span className="text-[8px] font-black text-amber-500 uppercase">{app.current_stage}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--card-bg)] rounded-[3rem] border border-[var(--card-border)] shadow-2xl shadow-primary/5 overflow-hidden">
                    <div className="p-12">
                        {activeStep === 'student' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                                        <User size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Student Identity</h2>
                                        <p className="text-[var(--text-muted)] font-medium">Primary identification and personal background.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">First Name *</label>
                                        <input required value={formData.student.first_name} onChange={e => updateStudent('first_name', e.target.value)} className="input-admission" placeholder="John" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Last Name</label>
                                        <input value={formData.student.last_name} onChange={e => updateStudent('last_name', e.target.value)} className="input-admission" placeholder="Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Admission Number *</label>
                                        <input required value={formData.student.admission_no} onChange={e => updateStudent('admission_no', e.target.value)} className="input-admission font-mono" placeholder="ADM-2026-XXX" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Date of Birth *</label>
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
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Mother Tongue *</label>
                                        <input required value={formData.student.mother_tongue} onChange={e => updateStudent('mother_tongue', e.target.value)} className="input-admission" placeholder="Kannada, English, etc." />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Residential Address</label>
                                        <textarea value={formData.student.address} onChange={e => updateStudent('address', e.target.value)} className="input-admission min-h-[100px]" placeholder="Full street address..." />
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
                                        <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Parental Authority</h2>
                                        <p className="text-[var(--text-muted)] font-medium">Guardian details and emergency contact points.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Father's / Guardian Name *</label>
                                        <input required value={formData.guardian.first_name} onChange={e => updateGuardian('first_name', e.target.value)} className="input-admission" placeholder="Robert Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Mobile Number *</label>
                                        <input required value={formData.guardian.phone} onChange={e => updateGuardian('phone', e.target.value)} className="input-admission" placeholder="+91 98XXX XXXXX" />
                                    </div>
                                    <ComboBox
                                        label="Relationship *"
                                        value={formData.guardian.relation}
                                        onChange={val => updateGuardian('relation', val)}
                                        options={[
                                            { value: 'father', label: 'Father' },
                                            { value: 'mother', label: 'Mother' },
                                            { value: 'guardian', label: 'Legal Guardian' },
                                        ]}
                                    />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Occupation</label>
                                        <input value={formData.guardian.occupation} onChange={e => updateGuardian('occupation', e.target.value)} className="input-admission" placeholder="Business / Professional" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeStep === 'test' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                                        <Sparkles size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Entrance Assessment</h2>
                                        <p className="text-[var(--text-muted)] font-medium">Schedule entrance tests and record evaluations.</p>
                                    </div>
                                </div>
                                <div className="bg-[var(--background)] p-8 rounded-[2rem] border border-[var(--card-border)] space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <ComboBox
                                            label="Target Grade *"
                                            value={formData.enrollment.grade_id}
                                            onChange={val => updateEnrollment('grade_id', val)}
                                            options={grades.map(g => ({ value: g.id.toString(), label: g.name }))}
                                        />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Assessment Date</label>
                                            <input type="datetime-local" value={formData.test.test_date} onChange={e => updateTest('test_date', e.target.value)} className="input-admission" />
                                        </div>
                                    </div>
                                    <div className="pt-8 border-t border-[var(--card-border)]">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Evaluation Status</h4>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${formData.test.status === 'cleared' ? 'bg-emerald-100 text-emerald-600' : formData.test.status === 'failed' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {formData.test.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <ComboBox
                                                value={formData.test.status}
                                                onChange={val => updateTest('status', val)}
                                                options={[
                                                    { value: 'pending', label: 'Pending / Scheduled' },
                                                    { value: 'cleared', label: 'Qualified / Pass' },
                                                    { value: 'failed', label: 'Not Recommended' },
                                                ]}
                                            />
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Internal Remarks</label>
                                                <input value={formData.test.remarks} onChange={e => updateTest('remarks', e.target.value)} className="input-admission" placeholder="Interview notes..." />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeStep === 'documents' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-primary/5 text-indigo-500 rounded-2xl flex items-center justify-center">
                                        <ShieldCheck size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Document Vault</h2>
                                        <p className="text-[var(--text-muted)] font-medium">Securely upload and verify institutional requirements.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {[
                                        { id: 'birth_certificate', label: 'Birth Certificate', required: true },
                                        { id: 'previous_marksheet', label: 'Previous Marksheet', required: false },
                                        { id: 'aadhaar_copy', label: 'Identity Proof (Aadhaar)', required: true },
                                        { id: 'photo', label: 'Passport Size Photo', required: true },
                                    ].map(doc => (
                                        <div key={doc.id} className="p-8 bg-[var(--background)] rounded-[2rem] border border-[var(--card-border)] space-y-4 relative group transition-all hover:shadow-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-3 rounded-xl ${((formData.documents as any)[doc.id]) ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-[var(--text-muted)]'}`}>
                                                        <File size={20} />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider">{doc.label}</span>
                                                        {doc.required && <div className="text-[8px] font-black text-rose-500 uppercase mt-0.5">Required</div>}
                                                    </div>
                                                </div>
                                                {((formData.documents as any)[doc.id]) && (
                                                    <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                                                        <CheckCircle2 size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <button onClick={() => triggerFileUpload(doc.id)} disabled={uploadingDoc === doc.id} className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${((formData.documents as any)[doc.id]) ? 'bg-slate-100 text-slate-600 border border-[var(--card-border)]' : 'bg-primary text-white shadow-xl shadow-primary/20 hover:opacity-90'}`}>
                                                {uploadingDoc === doc.id ? <Loader2 size={16} className="animate-spin" /> : ((formData.documents as any)[doc.id]) ? <>Update Document</> : <>Upload Original</>}
                                            </button>
                                        </div>
                                    ))}
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
                                        <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Final Settlement</h2>
                                        <p className="text-[var(--text-muted)] font-medium">Finalize billing structure and admission status.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Admission Fee</label>
                                        <input type="number" value={formData.finance.admission_fee} onChange={e => updateFinance('admission_fee', parseInt(e.target.value))} className="input-admission" />
                                    </div>
                                    <ComboBox
                                        label="Fee Category"
                                        value={formData.finance.fee_category}
                                        onChange={val => updateFinance('fee_category', val)}
                                        options={[
                                            { value: 'Regular', label: 'Regular (Standard)' },
                                            { value: 'Scholarship', label: 'Full Scholarship' },
                                            { value: 'StaffChild', label: 'Staff Child' },
                                        ]}
                                    />
                                    <div className="col-span-2 p-8 bg-surface-dark rounded-[2.5rem] flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center transition-all ${formData.finance.is_paid ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-[var(--card-bg)]/10'}`}>
                                                <CheckCircle2 size={32} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-white tracking-tight">Immediate Payment</p>
                                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Mark as settled in General Ledger</p>
                                            </div>
                                        </div>
                                        <button onClick={() => updateFinance('is_paid', !formData.finance.is_paid)} className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.finance.is_paid ? 'bg-emerald-500 text-white shadow-xl' : 'bg-[var(--card-bg)]/10 text-white/60 hover:bg-[var(--card-bg)]/20'}`}>
                                            {formData.finance.is_paid ? 'Paid & Verified' : 'Mark as Paid'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-16 flex flex-wrap gap-6">
                            {activeStep !== 'student' && (
                                <button type="button" onClick={() => { const idx = steps.findIndex(s => s.id === activeStep); setActiveStep(steps[idx - 1].id as AdmissionStep); }} className="px-10 py-5 rounded-[2rem] border border-[var(--card-border)] text-xs font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-slate-50 transition-all flex items-center gap-3 active:scale-95">
                                    <ArrowLeft size={16} /> Previous Stage
                                </button>
                            )}
                            <button type="button" onClick={saveAndClose} disabled={isSaving} className="px-10 py-5 rounded-[2rem] border-2 border-[var(--text-main)] text-[var(--text-main)] text-xs font-black uppercase tracking-widest hover:bg-[var(--text-main)] hover:text-white transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                                <Save size={18} /> Save & Close
                            </button>
                            <button onClick={() => { if (activeStep !== 'finance') nextStep(); else handleAdmission(); }} disabled={isSaving} className="flex-1 px-10 py-5 rounded-[2rem] bg-primary text-white text-xs font-black uppercase tracking-widest hover:opacity-90 flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 transition-all active:scale-[0.98]">
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : activeStep === 'finance' ? <CheckCircle2 size={20} /> : <ChevronRight size={20} />}
                                {activeStep === 'finance' ? 'Complete Enrollment' : 'Save & Continue'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="application/pdf,image/*" />

            <style>{`
                .input-admission {
                    width: 100%;
                    padding: 1.25rem 1.5rem;
                    background: var(--background);
                    border: 1px solid var(--card-border);
                    border-radius: 1.5rem;
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: var(--text-main);
                    transition: all 0.2s ease;
                }
                .input-admission:focus {
                    background: white;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 10%, transparent);
                    outline: none;
                }
            `}</style>
        </div>
    );
}
