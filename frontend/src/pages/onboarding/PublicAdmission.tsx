import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
    School, User, Users, 
    ArrowRight, CheckCircle2, 
    Loader2, Sparkles, GraduationCap,
    Phone, Mail
} from 'lucide-react';
import { get, post } from '../../api/base.api';

export default function PublicAdmission() {
    const { slug } = useParams();
    const [step, setStep] = useState(1);
    const [schoolInfo, setSchoolInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        student: {
            first_name: '',
            last_name: '',
            gender: 'Male',
            date_of_birth: '',
            address: '',
        },
        parent: {
            father_name: '',
            mother_name: '',
            primary_phone: '',
            email: '',
        },
        grade_id: '',
        academic_year_id: ''
    });

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const data = await get<any>(`/school/admission/public/${slug}`);
                setSchoolInfo(data);
            } catch (err) {
                console.error('Failed to load school info', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInfo();
    }, [slug]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const res = await post<any>('/school/admission/public/submit', {
                school_slug: slug,
                student_data: formData.student,
                parent_data: formData.parent,
                grade_id: formData.grade_id,
                academic_year_id: formData.academic_year_id
            });
            setSuccess(res.application_no);
        } catch (err: any) {
            alert('Submission failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Opening Admission Portal...</p>
        </div>
    );

    if (!schoolInfo) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center p-12 bg-white rounded-[3rem] shadow-xl">
                <School size={64} className="mx-auto text-slate-200 mb-6" />
                <h2 className="text-2xl font-black text-slate-900">School Not Found</h2>
                <p className="text-slate-500 mt-2">The admission link you followed is invalid.</p>
            </div>
        </div>
    );

    if (success) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF] p-6">
            <div className="max-w-2xl w-full bg-white p-16 rounded-[4rem] shadow-2xl shadow-primary/5 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32" />
                <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-200 relative z-10">
                    <CheckCircle2 size={48} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4 relative z-10">Application Received!</h1>
                <p className="text-slate-500 mb-12 relative z-10 font-medium">Thank you for choosing <span className="text-slate-900 font-bold">{schoolInfo.school.name}</span>. We have initiated your application process.</p>
                
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-8 relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reference Number</p>
                    <p className="text-5xl font-black text-primary tracking-tighter">{success}</p>
                </div>
                
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">Please save this number for future tracking.</p>
                
                <button 
                    onClick={() => window.location.reload()}
                    className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                >
                    Apply for Another Sibling
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center p-6 py-20">
            {/* School Header */}
            <div className="text-center mb-16">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-primary mx-auto mb-6 shadow-xl shadow-primary/5 border border-primary/5">
                    <GraduationCap size={40} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{schoolInfo.school.name}</h1>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2">Official Online Admission Portal</p>
            </div>

            <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Progress Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                    {[
                        { id: 1, label: 'Student Details', icon: User, desc: 'Candidate info' },
                        { id: 2, label: 'Parent/Guardian', icon: Users, desc: 'Contact details' },
                        { id: 3, label: 'Academic & Review', icon: Sparkles, desc: 'Submit application' },
                    ].map((s) => (
                        <div 
                            key={s.id}
                            className={`p-6 rounded-[2rem] border transition-all duration-500 flex items-center gap-4 ${
                                step === s.id 
                                ? 'bg-white border-primary/10 shadow-xl shadow-primary/5' 
                                : step > s.id ? 'bg-emerald-50/50 border-emerald-100 opacity-60' : 'bg-slate-50 border-transparent opacity-40'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                step === s.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-slate-400'
                            }`}>
                                <s.icon size={20} />
                            </div>
                            <div className="text-left">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${step === s.id ? 'text-primary' : 'text-slate-400'}`}>Step 0{s.id}</p>
                                <p className="text-sm font-black text-slate-900">{s.label}</p>
                            </div>
                        </div>
                    ))}
                    
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl mt-8">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Support</p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-primary/60" />
                                <span className="text-xs font-bold">+1 (555) 000-1234</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-primary/60" />
                                <span className="text-xs font-bold">admissions@luvia.edu</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="lg:col-span-8 bg-white p-10 lg:p-14 rounded-[3.5rem] shadow-2xl shadow-primary/5 border border-slate-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full -mr-24 -mt-24" />
                    
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Student Particulars</h2>
                                <p className="text-xs font-bold text-slate-400 mt-1">Tell us about the candidate applying for admission.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5"
                                        placeholder="John"
                                        value={formData.student.first_name}
                                        onChange={e => setFormData({ ...formData, student: { ...formData.student, first_name: e.target.value }})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5"
                                        placeholder="Doe"
                                        value={formData.student.last_name}
                                        onChange={e => setFormData({ ...formData, student: { ...formData.student, last_name: e.target.value }})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                                    <input 
                                        type="date" 
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5"
                                        value={formData.student.date_of_birth}
                                        onChange={e => setFormData({ ...formData, student: { ...formData.student, date_of_birth: e.target.value }})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                                    <select 
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 appearance-none"
                                        value={formData.student.gender}
                                        onChange={e => setFormData({ ...formData, student: { ...formData.student, gender: e.target.value }})}
                                    >
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Address</label>
                                    <textarea 
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 h-32 resize-none"
                                        placeholder="123 Academic Street, City"
                                        value={formData.student.address}
                                        onChange={e => setFormData({ ...formData, student: { ...formData.student, address: e.target.value }})}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Parental Context</h2>
                                <p className="text-xs font-bold text-slate-400 mt-1">Whom should we contact regarding this application?</p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Father's Full Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5"
                                        value={formData.parent.father_name}
                                        onChange={e => setFormData({ ...formData, parent: { ...formData.parent, father_name: e.target.value }})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mother's Full Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5"
                                        value={formData.parent.mother_name}
                                        onChange={e => setFormData({ ...formData, parent: { ...formData.parent, mother_name: e.target.value }})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input 
                                            type="tel" 
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5"
                                            placeholder="+1 (000) 000-0000"
                                            value={formData.parent.primary_phone}
                                            onChange={e => setFormData({ ...formData, parent: { ...formData.parent, primary_phone: e.target.value }})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input 
                                            type="email" 
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5"
                                            placeholder="parent@example.com"
                                            value={formData.parent.email}
                                            onChange={e => setFormData({ ...formData, parent: { ...formData.parent, email: e.target.value }})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Academic Placement</h2>
                                <p className="text-xs font-bold text-slate-400 mt-1">Select the target grade and session.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Grade</label>
                                    <select 
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5"
                                        value={formData.grade_id}
                                        onChange={e => setFormData({ ...formData, grade_id: e.target.value })}
                                    >
                                        <option value="">Select Grade</option>
                                        {schoolInfo.grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Year</label>
                                    <select 
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5"
                                        value={formData.academic_year_id}
                                        onChange={e => setFormData({ ...formData, academic_year_id: e.target.value })}
                                    >
                                        <option value="">Select Session</option>
                                        {schoolInfo.academic_years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                                <div className="flex items-start gap-4">
                                    <input type="checkbox" className="mt-1.5 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" required />
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        I hereby declare that the information provided above is true to the best of my knowledge and I agree to abide by the school's terms and conditions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-12 flex items-center justify-between">
                        {step > 1 ? (
                            <button 
                                onClick={() => setStep(step - 1)}
                                className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                            >
                                Previous
                            </button>
                        ) : <div />}
                        
                        {step < 3 ? (
                            <button 
                                onClick={() => setStep(step + 1)}
                                className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
                            >
                                Next Step <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-10 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                Submit Application
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
