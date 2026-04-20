import { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, MoreVertical, MapPin,
    Mail, Phone, BookOpen, Star, Loader2, UserPlus,
    CheckCircle2, CreditCard, Calendar, ShieldCheck,
    ChevronRight, User
} from 'lucide-react';
import * as staffApi from '../api/staff.api';
import Modal from '../components/ui/Modal';

export default function Teachers() {
    const [staff, setStaff] = useState<staffApi.Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Search & Pagination state
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

    // Form state
    const [activeSection, setActiveSection] = useState('identity');
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
        password: 'Password123!',
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStaff();
        }, 300); // Simple debounce
        return () => clearTimeout(timer);
    }, [search, pagination.page]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const response = await staffApi.getStaffList({ 
                search, 
                page: pagination.page, 
                limit: pagination.limit 
            });
            setStaff(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Failed to fetch staff', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await staffApi.createStaff(formData);
            await fetchStaff();
            setIsModalOpen(false);
            resetForm();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
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
            password: 'Password123!',
        });
        setActiveSection('identity');
    };

    const sections = [
        { id: 'identity', label: 'Identity', icon: UserPlus },
        { id: 'academic', label: 'Academic', icon: BookOpen },
        { id: 'contact', label: 'Contact', icon: Mail },
        { id: 'finance', label: 'Finance & ID', icon: CreditCard },
    ];

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-theme-primary/5 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-theme-primary/10 flex items-center justify-center text-theme-primary">
                                <UserPlus size={22} />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-800 font-heading tracking-tight">Staff Directory</h1>
                        </div>
                        <p className="text-slate-500 font-medium">Manage your school's faculty and administrative team in one place.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-theme-primary text-white rounded-2xl hover:bg-theme-primary/90 transition-all shadow-lg shadow-theme-primary/20 font-bold text-sm"
                        >
                            <Plus size={18} />
                            Register Staff
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Staff', value: staff.length, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Teaching', value: staff.filter(s => s.designation.toLowerCase().includes('teacher')).length, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'On Leave', value: staff.filter(s => s.status === 'on_leave').length, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Departments', value: 4, icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                    <div key={i} className="card p-5 flex items-center gap-4 hover-lift">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm`}>
                            <stat.icon size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <h4 className="text-2xl font-bold text-slate-800 tracking-tight">{stat.value}</h4>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters bar */}
            <div className="card p-4 flex flex-col lg:flex-row gap-4 items-center justify-between border-slate-100 shadow-sm">
                <div className="relative w-full lg:w-96">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, employee code, or subject..."
                        className="w-full pl-11 pr-4 py-3 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-theme-primary/10 bg-slate-50/50 transition-all font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full lg:w-auto">
                    <select className="flex-1 lg:w-48 px-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm text-slate-600 focus:outline-none focus:ring-4 focus:ring-theme-primary/10 font-medium">
                        <option>All Departments</option>
                        <option>Mathematics</option>
                        <option>Science</option>
                        <option>Administration</option>
                    </select>
                    <button className="flex items-center gap-2 px-4 py-3 border border-slate-100 rounded-2xl text-sm text-slate-600 hover:bg-slate-50 font-bold transition-colors">
                        <Filter size={18} />
                        Filters
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <div className="relative">
                        <Loader2 size={48} className="text-theme-primary animate-spin" />
                        <div className="absolute inset-0 blur-xl bg-theme-primary/20 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-slate-500 font-bold tracking-tight">Syncing Staff Records...</p>
                </div>
            ) : staff.length === 0 ? (
                <div className="card p-20 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-100 bg-slate-50/30">
                    <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center text-slate-400 mb-6 transform -rotate-6">
                        <UserPlus size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2 font-heading">The Faculty Room is Empty</h3>
                    <p className="text-slate-500 max-w-sm mb-8 font-medium">Get started by registering your first staff member. You can manage roles and permissions once they are added.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-8 py-3.5 bg-theme-primary text-white rounded-2xl font-bold shadow-xl shadow-theme-primary/30 hover:scale-105 transition-transform"
                    >
                        Register New Staff
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {staff.map((s, i) => (
                        <div key={s.id} className={`card p-6 hover-lift delay-${(i % 3) * 100} group bg-white border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all`}>
                            <div className="flex justify-between items-start mb-5">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-theme-primary to-theme-primary/70 flex items-center justify-center text-white font-bold text-2xl uppercase shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                            {s.first_name[0]}{s.last_name[0]}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${s.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'} shadow-sm`}></div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 tracking-tight text-lg group-hover:text-theme-primary transition-colors">{s.first_name} {s.last_name}</h3>
                                        <div className="px-2 py-0.5 rounded-lg bg-theme-primary/5 text-theme-primary text-[10px] font-black uppercase inline-block mt-0.5">
                                            {s.designation}
                                        </div>
                                    </div>
                                </div>
                                <button className="text-slate-300 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-50 transition-all">
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-3 mb-6">
                                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50/50 p-2 rounded-xl group-hover:bg-white transition-colors">
                                    <Mail size={16} className="text-slate-400 group-hover:text-theme-primary" />
                                    <span className="font-medium truncate">{s.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50/50 p-2 rounded-xl group-hover:bg-white transition-colors">
                                    <Phone size={16} className="text-slate-400 group-hover:text-theme-primary" />
                                    <span className="font-medium">{s.phone || 'No phone'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-50">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><BookOpen size={12} /> Qualification</div>
                                    <div className="font-bold text-slate-700 truncate text-xs">{s.qualification || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><ShieldCheck size={12} /> Specialization</div>
                                    <div className="font-bold text-slate-700 truncate text-xs">{s.specialization || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modern Sidebar Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title="Staff Member Registration"
                size="5xl"
            >
                <div className="flex h-full min-h-[500px] gap-8">
                    {/* Modal Sidebar */}
                    <div className="w-64 flex flex-col gap-1 pr-4 border-r border-slate-100">
                        {sections.map((sec) => (
                            <button
                                key={sec.id}
                                onClick={() => setActiveSection(sec.id)}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-sm font-bold ${activeSection === sec.id
                                    ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/20 scale-[1.02]'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                            >
                                <sec.icon size={18} strokeWidth={activeSection === sec.id ? 2.5 : 2} />
                                {sec.label}
                                {activeSection === sec.id && <ChevronRight size={14} className="ml-auto" />}
                            </button>
                        ))}

                        <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Registration Status</p>
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                                <CheckCircle2 size={14} />
                                <span>Profile Ready</span>
                            </div>
                        </div>
                    </div>

                    {/* Modal Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <form onSubmit={handleAddStaff} className="flex-1 flex flex-col">
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {activeSection === 'identity' && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-400">
                                        <div className="flex items-center gap-4 pb-4 border-b border-slate-50">
                                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><UserPlus size={24} /></div>
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-800">Basic Information</h4>
                                                <p className="text-xs text-slate-400 font-medium">Primary details to identify the staff member.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">First Name</label>
                                                <div className="relative">
                                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-theme-primary transition-colors" />
                                                    <input required className="input-field-modern pl-11" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} placeholder="e.g. John" />
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Last Name</label>
                                                <div className="relative">
                                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-theme-primary transition-colors" />
                                                    <input required className="input-field-modern pl-11" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} placeholder="e.g. Doe" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Gender</label>
                                                <select className="input-field-modern" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                                    <option>Male</option>
                                                    <option>Female</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Date of Birth</label>
                                                <div className="relative">
                                                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-theme-primary transition-colors" />
                                                    <input type="date" className="input-field-modern pl-11" value={formData.date_of_birth} onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Blood Group</label>
                                                <input className="input-field-modern" value={formData.blood_group} onChange={e => setFormData({ ...formData, blood_group: e.target.value })} placeholder="O+" />
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Nationality</label>
                                                <input className="input-field-modern" value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} />
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Marital Status</label>
                                                <select className="input-field-modern" value={formData.marital_status} onChange={e => setFormData({ ...formData, marital_status: e.target.value })}>
                                                    <option>Single</option>
                                                    <option>Married</option>
                                                    <option>Widowed</option>
                                                    <option>Divorced</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'academic' && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-400">
                                        <div className="flex items-center gap-4 pb-4 border-b border-slate-50">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><BookOpen size={24} /></div>
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-800">Academic & Professional</h4>
                                                <p className="text-xs text-slate-400 font-medium">Work history and institutional records.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Employee Code</label>
                                                <div className="relative">
                                                    <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-theme-primary transition-colors" />
                                                    <input required className="input-field-modern pl-11" value={formData.employee_code} onChange={e => setFormData({ ...formData, employee_code: e.target.value })} placeholder="e.g. EMP102" />
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Designation</label>
                                                <div className="relative">
                                                    <Star size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-theme-primary transition-colors" />
                                                    <input required className="input-field-modern pl-11" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} placeholder="e.g. Senior Teacher" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Qualification</label>
                                                <input className="input-field-modern" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} placeholder="e.g. M.Sc, B.Ed" />
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Specialization</label>
                                                <input className="input-field-modern" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} placeholder="e.g. Mathematics" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Years of Experience</label>
                                                <input type="number" className="input-field-modern" value={formData.experience_years} onChange={e => setFormData({ ...formData, experience_years: parseInt(e.target.value) })} />
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Date of Joining</label>
                                                <input type="date" className="input-field-modern" value={formData.joining_date} onChange={e => setFormData({ ...formData, joining_date: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'contact' && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-400">
                                        <div className="flex items-center gap-4 pb-4 border-b border-slate-50">
                                            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Mail size={24} /></div>
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-800">Communication & Emergency</h4>
                                                <p className="text-xs text-slate-400 font-medium">How to reach the staff and their emergency contacts.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Work Email</label>
                                                <div className="relative">
                                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-theme-primary transition-colors" />
                                                    <input required type="email" className="input-field-modern pl-11" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="staff@school.com" />
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Phone Number</label>
                                                <div className="relative">
                                                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-theme-primary transition-colors" />
                                                    <input className="input-field-modern pl-11" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1..." />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 group">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Residential Address</label>
                                            <div className="relative">
                                                <MapPin size={16} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-theme-primary transition-colors" />
                                                <textarea rows={3} className="input-field-modern pl-11 py-3" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Full address..."></textarea>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                                            <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                                <ShieldCheck size={14} className="text-theme-primary" />
                                                Emergency Contact
                                            </h5>
                                            <div className="grid grid-cols-2 gap-4">
                                                <input className="input-field-modern bg-white group-focus-within:border-theme" value={formData.emergency_contact_name} onChange={e => setFormData({ ...formData, emergency_contact_name: e.target.value })} placeholder="Contact Name" />
                                                <input className="input-field-modern bg-white group-focus-within:border-theme" value={formData.emergency_contact_phone} onChange={e => setFormData({ ...formData, emergency_contact_phone: e.target.value })} placeholder="Contact Phone" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'finance' && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-400">
                                        <div className="flex items-center gap-4 pb-4 border-b border-slate-50">
                                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><CreditCard size={24} /></div>
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-800">Financial & ID Verification</h4>
                                                <p className="text-xs text-slate-400 font-medium">Payroll details and government identification.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Aadhaar (National ID)</label>
                                                <input className="input-field-modern" value={formData.aadhaar_number} onChange={e => setFormData({ ...formData, aadhaar_number: e.target.value })} placeholder="1234 5678 9012" />
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">PAN Card</label>
                                                <input className="input-field-modern" value={formData.pan_number} onChange={e => setFormData({ ...formData, pan_number: e.target.value })} placeholder="ABCDE1234F" />
                                            </div>
                                        </div>

                                        <div className="p-6 border-2 border-dashed border-slate-100 rounded-3xl space-y-4 bg-slate-50/20">
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Bank Name</label>
                                                <input className="input-field-modern bg-white" value={formData.bank_name} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} placeholder="e.g. HDFC Bank" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2 group">
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">Account Number</label>
                                                    <input className="input-field-modern bg-white" value={formData.bank_account_no} onChange={e => setFormData({ ...formData, bank_account_no: e.target.value })} placeholder="0000 0000 0000" />
                                                </div>
                                                <div className="space-y-2 group">
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider group-focus-within:text-theme-primary transition-colors">IFSC / Swift Code</label>
                                                    <input className="input-field-modern bg-white" value={formData.ifsc_code} onChange={e => setFormData({ ...formData, ifsc_code: e.target.value })} placeholder="HDFC000123" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-6 mt-6 border-t border-slate-100 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="px-6 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-8 py-3.5 rounded-2xl bg-theme-primary text-white text-sm font-bold hover:bg-theme-primary/90 transition-all shadow-xl shadow-theme-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                                >
                                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                    {activeSection === 'finance' ? 'Complete Profile Registration' : 'Next: Academic Details'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
