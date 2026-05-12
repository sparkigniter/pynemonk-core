import { useState } from 'react';
import {
    UserPlus, Mail, Phone, BookOpen, Star, Loader2,
    CheckCircle2, CreditCard, Calendar, ShieldCheck,
    ChevronRight, User, MapPin, ArrowLeft, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as staffApi from '../../api/staff.api';
import { ComboBox } from '../../components/ui/ComboBox';
import { useNotification } from '../../contexts/NotificationContext';

export default function StaffRegistration() {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [activeSection, setActiveSection] = useState('identity');
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: 'Male',
        date_of_birth: '',
        blood_group: '',
        religion: '',
        nationality: 'Indian',
        marital_status: 'Single',
        designation: '',
        employee_code: '',
        qualification: '',
        specialization: '',
        experience_years: 0,
        joining_date: new Date().toISOString().split('T')[0],
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        aadhaar_number: '',
        pan_number: '',
        bank_account_no: '',
        bank_name: '',
        ifsc_code: '',
        password: '',
    });

    const handleAddStaff = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            await staffApi.createStaff(formData);
            notify('success', 'Staff Registered', `${formData.first_name} ${formData.last_name} has been added to the system.`);
            navigate('/teachers');
        } catch (err: any) {
            notify('error', 'Registration Failed', err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const sections = [
        { id: 'identity', label: 'Identity', icon: UserPlus, description: 'Basic personal information' },
        { id: 'academic', label: 'Academic', icon: BookOpen, description: 'Qualifications & designation' },
        { id: 'contact', label: 'Contact', icon: Mail, description: 'Communication & address' },
        { id: 'finance', label: 'Finance & ID', icon: CreditCard, description: 'Bank details & verification' },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/teachers')}
                        className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-slate-300 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={16} className="text-theme-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Human Resources</span>
                        </div>
                        <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight leading-none">Register New Staff</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Progress</p>
                        <p className="text-sm font-bold text-[var(--text-main)]">{sections.findIndex(s => s.id === activeSection) + 1} / {sections.length} Sections</p>
                    </div>
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-theme-primary transition-all duration-500"
                            style={{ width: `${((sections.findIndex(s => s.id === activeSection) + 1) / sections.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Navigation Sidebar */}
                <div className="lg:sticky lg:top-8 space-y-3 bg-[var(--card-bg)] p-4 rounded-[2rem] border border-[var(--card-border)] shadow-xl shadow-slate-200/50">
                    {sections.map((sec, i) => {
                        const Icon = sec.icon;
                        const isActive = activeSection === sec.id;
                        const isPast = sections.findIndex(s => s.id === activeSection) > i;

                        return (
                            <button
                                key={sec.id}
                                onClick={() => setActiveSection(sec.id)}
                                className={`w-full group flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 text-left
                                    ${isActive
                                        ? 'bg-surface-dark text-white shadow-xl shadow-theme/20 scale-[1.02]'
                                        : 'hover:bg-slate-50'}`}
                            >
                                <div className={`mt-0.5 p-2 rounded-xl transition-colors
                                    ${isActive ? 'bg-[var(--card-bg)]/10 text-white' : isPast ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-[var(--text-muted)]'}`}>
                                    {isPast ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-sm font-black tracking-tight ${isActive ? 'text-white' : 'text-slate-700'}`}>{sec.label}</p>
                                    <p className={`text-[10px] font-medium truncate ${isActive ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>{sec.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Form Content */}
                <div className="lg:col-span-3">
                    <div className="bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] shadow-2xl shadow-slate-200/40 overflow-hidden">
                        <div className="p-10">
                            {activeSection === 'identity' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
                                    <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-theme-primary/10 text-theme-primary flex items-center justify-center">
                                            <User size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Basic Information</h4>
                                            <p className="text-[var(--text-muted)] font-medium">Please provide the legal name and personal details of the staff member.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">First Name *</label>
                                            <div className="relative">
                                                <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-theme-primary transition-colors" />
                                                <input required className="input-field-premium pl-14" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} placeholder="e.g. John" />
                                            </div>
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Last Name *</label>
                                            <div className="relative">
                                                <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-theme-primary transition-colors" />
                                                <input required className="input-field-premium pl-14" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} placeholder="e.g. Doe" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <ComboBox
                                            label="Gender"
                                            value={formData.gender}
                                            onChange={val => setFormData({ ...formData, gender: val as string })}
                                            options={[
                                                { value: 'Male', label: 'Male' },
                                                { value: 'Female', label: 'Female' },
                                                { value: 'Other', label: 'Other' },
                                            ]}
                                        />
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Date of Birth</label>
                                            <div className="relative">
                                                <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-theme-primary transition-colors" />
                                                <input type="date" className="input-field-premium pl-14" value={formData.date_of_birth} onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-8">
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Blood Group</label>
                                            <input className="input-field-premium" value={formData.blood_group} onChange={e => setFormData({ ...formData, blood_group: e.target.value })} placeholder="O+" />
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Nationality</label>
                                            <input className="input-field-premium" value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} />
                                        </div>
                                        <ComboBox
                                            label="Marital Status"
                                            value={formData.marital_status}
                                            onChange={val => setFormData({ ...formData, marital_status: val as string })}
                                            options={[
                                                { value: 'Single', label: 'Single' },
                                                { value: 'Married', label: 'Married' },
                                                { value: 'Widowed', label: 'Widowed' },
                                                { value: 'Divorced', label: 'Divorced' },
                                            ]}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeSection === 'academic' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
                                    <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                            <BookOpen size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Professional Credentials</h4>
                                            <p className="text-[var(--text-muted)] font-medium">Information regarding their role and academic qualifications.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Employee Code *</label>
                                            <div className="relative">
                                                <ShieldCheck size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-theme-primary transition-colors" />
                                                <input required className="input-field-premium pl-14" value={formData.employee_code} onChange={e => setFormData({ ...formData, employee_code: e.target.value })} placeholder="e.g. EMP102" />
                                            </div>
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Designation *</label>
                                            <div className="relative">
                                                <Star size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-theme-primary transition-colors" />
                                                <input required className="input-field-premium pl-14" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} placeholder="e.g. Senior Teacher" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Qualification</label>
                                            <input className="input-field-premium" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} placeholder="e.g. M.Sc, B.Ed" />
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Specialization</label>
                                            <input className="input-field-premium" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} placeholder="e.g. Mathematics" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Years of Experience</label>
                                            <input type="number" className="input-field-premium" value={formData.experience_years} onChange={e => setFormData({ ...formData, experience_years: parseInt(e.target.value) })} />
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Date of Joining</label>
                                            <input type="date" className="input-field-premium" value={formData.joining_date} onChange={e => setFormData({ ...formData, joining_date: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'contact' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
                                    <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-purple-50 text-purple-600 flex items-center justify-center">
                                            <Mail size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Communication Details</h4>
                                            <p className="text-[var(--text-muted)] font-medium">How to reach the staff member and emergency protocols.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Official Email *</label>
                                            <div className="relative">
                                                <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-theme-primary transition-colors" />
                                                <input required type="email" className="input-field-premium pl-14" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="staff@school.com" />
                                            </div>
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Phone Number *</label>
                                            <div className="relative">
                                                <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-theme-primary transition-colors" />
                                                <input required className="input-field-premium pl-14" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1..." />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 group">
                                        <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Residential Address</label>
                                        <div className="relative">
                                            <MapPin size={18} className="absolute left-5 top-5 text-slate-300 group-focus-within:text-theme-primary transition-colors" />
                                            <textarea rows={4} className="input-field-premium pl-14 py-4" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Full residential address..."></textarea>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-[var(--card-border)] space-y-6">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck size={20} className="text-theme-primary" />
                                            <h5 className="text-sm font-black text-slate-800 uppercase tracking-widest">Emergency Contact</h5>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <input className="input-field-premium bg-[var(--card-bg)] shadow-sm" value={formData.emergency_contact_name} onChange={e => setFormData({ ...formData, emergency_contact_name: e.target.value })} placeholder="Contact Person Name" />
                                            <input className="input-field-premium bg-[var(--card-bg)] shadow-sm" value={formData.emergency_contact_phone} onChange={e => setFormData({ ...formData, emergency_contact_phone: e.target.value })} placeholder="Contact Person Phone" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'finance' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
                                    <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-amber-50 text-amber-600 flex items-center justify-center">
                                            <CreditCard size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Finance & Identity</h4>
                                            <p className="text-[var(--text-muted)] font-medium">Payroll configuration and official government identification.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Aadhaar (National ID)</label>
                                            <input className="input-field-premium" value={formData.aadhaar_number} onChange={e => setFormData({ ...formData, aadhaar_number: e.target.value })} placeholder="1234 5678 9012" />
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">PAN Card</label>
                                            <input className="input-field-premium" value={formData.pan_number} onChange={e => setFormData({ ...formData, pan_number: e.target.value })} placeholder="ABCDE1234F" />
                                        </div>
                                    </div>

                                    <div className="p-10 border-2 border-dashed border-[var(--card-border)] rounded-[2.5rem] space-y-8 bg-slate-50/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[var(--card-bg)] shadow-sm flex items-center justify-center text-[var(--text-muted)]">
                                                <CreditCard size={20} />
                                            </div>
                                            <h5 className="text-sm font-black text-slate-800 uppercase tracking-widest">Bank Account Details</h5>
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Bank Name</label>
                                            <input className="input-field-premium bg-[var(--card-bg)] shadow-sm" value={formData.bank_name} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} placeholder="e.g. Chase Bank, HDFC, etc." />
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-3 group">
                                                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">Account Number</label>
                                                <input className="input-field-premium bg-[var(--card-bg)] shadow-sm font-mono" value={formData.bank_account_no} onChange={e => setFormData({ ...formData, bank_account_no: e.target.value })} placeholder="0000 0000 0000" />
                                            </div>
                                            <div className="space-y-3 group">
                                                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest group-focus-within:text-theme-primary transition-colors">IFSC / Swift Code</label>
                                                <input className="input-field-premium bg-[var(--card-bg)] shadow-sm font-mono" value={formData.ifsc_code} onChange={e => setFormData({ ...formData, ifsc_code: e.target.value })} placeholder="SWIFT123" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer / Navigation */}
                            <div className="mt-12 pt-10 border-t border-slate-50 flex gap-6">
                                <button
                                    type="button"
                                    onClick={() => navigate('/teachers')}
                                    className="px-10 py-5 rounded-[1.5rem] border border-[var(--card-border)] text-sm font-black text-[var(--text-muted)] hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>

                                <div className="flex-1 flex gap-4">
                                    {activeSection !== 'identity' && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const currentIndex = sections.findIndex(s => s.id === activeSection);
                                                setActiveSection(sections[currentIndex - 1].id);
                                                window.scrollTo(0, 0);
                                            }}
                                            className="px-10 py-5 rounded-[1.5rem] border border-[var(--card-border)] text-sm font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                                        >
                                            Back
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (activeSection !== 'finance') {
                                                const currentIndex = sections.findIndex(s => s.id === activeSection);
                                                setActiveSection(sections[currentIndex + 1].id);
                                                window.scrollTo(0, 0);
                                            } else {
                                                handleAddStaff();
                                            }
                                        }}
                                        disabled={isSaving}
                                        className="flex-1 px-10 py-5 rounded-[1.5rem] bg-theme-primary text-white text-sm font-black hover:opacity-90 transition-all shadow-2xl shadow-theme-primary/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
                                    >
                                        {isSaving ? <Loader2 size={20} className="animate-spin" /> : activeSection === 'finance' ? <CheckCircle2 size={20} /> : <ChevronRight size={20} />}
                                        {activeSection === 'finance' ? 'Complete & Save Profile' : 'Continue to Next Step'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .input-field-premium {
                    width: 100%;
                    padding: 1rem 1.5rem;
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 1.25rem;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #1E293B;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    outline: none;
                }
                .input-field-premium:focus {
                    background: white;
                    border-color: var(--theme-primary);
                    box-shadow: 0 0 0 4px rgba(var(--theme-primary-rgb), 0.1);
                }
                .input-field-premium::placeholder {
                    color: #CBD5E1;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
}
