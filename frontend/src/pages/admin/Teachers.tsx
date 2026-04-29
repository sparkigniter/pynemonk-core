import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    Plus, Search, Filter,
    Mail, Phone, BookOpen, UserPlus,
    Calendar, ShieldCheck, X
} from 'lucide-react';
import * as staffApi from '../../api/staff.api';
import { ComboBox } from '../../components/ui/ComboBox';

export default function Teachers() {
    const [staff, setStaff] = useState<staffApi.Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Search & Pagination state
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
    const [selectedStaff, setSelectedStaff] = useState<staffApi.Staff | null>(null);

    const canRegister = user?.permissions?.includes('staff:write');

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
                        {canRegister && (
                            <button
                                onClick={() => navigate('/teachers/register')}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-theme-primary text-white rounded-2xl hover:bg-theme-primary/90 transition-all shadow-lg shadow-theme-primary/20 font-bold text-sm"
                            >
                                <Plus size={18} />
                                Register Staff
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Staff', value: staff.length, icon: UserPlus, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Teaching', value: staff.filter(s => s.designation.toLowerCase().includes('teacher')).length, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'On Leave', value: staff.filter(s => s.status === 'on_leave').length, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Departments', value: 4, icon: ShieldCheck, color: 'text-accent', bg: 'bg-accent/10' },
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
                    <ComboBox
                        value="All Departments"
                        onChange={() => { }}
                        options={[
                            { value: 'All Departments', label: 'All Departments' },
                            { value: 'Mathematics', label: 'Mathematics' },
                            { value: 'Science', label: 'Science' },
                            { value: 'Administration', label: 'Administration' },
                        ]}
                        className="flex-1 lg:w-56"
                    />
                    <button className="flex items-center gap-2 px-4 py-3 border border-slate-100 rounded-2xl text-sm text-slate-600 hover:bg-slate-50 font-bold transition-colors">
                        <Filter size={18} />
                        Filters
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-theme-primary/20 border-t-theme-primary rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <UserPlus className="w-8 h-8 text-theme-primary animate-pulse" />
                        </div>
                    </div>
                    <p className="text-slate-500 font-bold tracking-tight">Updating Staff Records...</p>
                </div>
            ) : staff.length === 0 ? (
                <div className="card p-20 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-100 bg-slate-50/30">
                    <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center text-slate-400 mb-6 transform -rotate-6">
                        <UserPlus size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2 font-heading">The Faculty Room is Empty</h3>
                    <p className="text-slate-500 max-w-sm mb-8 font-medium">Get started by registering your first staff member. You can manage roles and permissions once they are added.</p>
                    {canRegister && (
                        <button
                            onClick={() => navigate('/teachers/register')}
                            className="px-8 py-3.5 bg-theme-primary text-white rounded-2xl font-bold shadow-xl shadow-theme-primary/30 hover:scale-105 transition-transform"
                        >
                            Register New Staff
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {staff.map((s, i) => (
                        <div
                            key={s.id}
                            onClick={() => setSelectedStaff(s)}
                            className={`
                                card p-6 hover-lift delay-${(i % 3) * 100} group bg-white cursor-pointer transition-all relative
                                ${s.assignments?.length === 0 ? 'border-amber-200 bg-amber-50/20 shadow-amber-100/50' : 'border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50'}
                            `}
                        >
                            {s.assignments?.length === 0 && (
                                <div className="absolute -top-3 right-6 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-amber-500/20 animate-bounce">
                                    UNASSIGNED
                                </div>
                            )}

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
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="px-2 py-0.5 rounded-lg bg-theme-primary/5 text-theme-primary text-[10px] font-black uppercase inline-block">
                                                {s.designation}
                                            </div>
                                            {s.is_class_teacher && (
                                                <div className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase inline-block">
                                                    Class Teacher
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50/50 p-2 rounded-xl group-hover:bg-white transition-colors">
                                        <Mail size={14} className="text-slate-400 group-hover:text-theme-primary" />
                                        <span className="font-medium truncate">{s.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50/50 p-2 rounded-xl group-hover:bg-white transition-colors">
                                        <Phone size={14} className="text-slate-400 group-hover:text-theme-primary" />
                                        <span className="font-medium">{s.phone || 'No phone'}</span>
                                    </div>
                                </div>

                                <div className="border-t border-slate-50 pt-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <BookOpen size={12} /> Assigned Subjects
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {s.assignments && s.assignments.length > 0 ? (
                                            Array.from(new Set(s.assignments.map((a: any) => a.subject_name))).map((sub: any, idx) => (
                                                <span key={idx} className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                                    {sub}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-slate-400 text-[10px] font-medium italic">No subjects assigned yet</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Qualification</div>
                                        <div className="font-bold text-slate-700 truncate text-xs">{s.qualification || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Specialization</div>
                                        <div className="font-bold text-slate-700 truncate text-xs">{s.specialization || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Teacher Profile Modal */}
            {selectedStaff && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-end">
                    <div className="h-full w-full max-w-2xl bg-slate-50 shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto">
                        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-6 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Teacher Profile</h2>
                            <button
                                onClick={() => setSelectedStaff(null)}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Profile Header */}
                            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-theme-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                                    <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-theme-primary to-theme-primary/80 flex items-center justify-center text-white text-5xl font-black shadow-xl">
                                        {selectedStaff.first_name[0]}{selectedStaff.last_name[0]}
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h1 className="text-3xl font-black text-slate-900 mb-2">{selectedStaff.first_name} {selectedStaff.last_name}</h1>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                            <span className="px-3 py-1 bg-theme-primary/10 text-theme-primary text-xs font-black uppercase rounded-full">
                                                {selectedStaff.designation}
                                            </span>
                                            <span className={`px-3 py-1 ${selectedStaff.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} text-xs font-black uppercase rounded-full`}>
                                                {selectedStaff.status}
                                            </span>
                                            {selectedStaff.is_class_teacher && (
                                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-black uppercase rounded-full">
                                                    Class Teacher
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Academic Load */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">Academic Load</h3>
                                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                                        {selectedStaff.assignments && selectedStaff.assignments.length > 0 ? (
                                            selectedStaff.assignments.map((a: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-theme-primary/30 transition-all">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">{a.classroom_name}</p>
                                                        <p className="text-sm font-extrabold text-slate-800">{a.subject_name}</p>
                                                    </div>
                                                    <div className="p-2 bg-white rounded-xl shadow-sm text-theme-primary">
                                                        <BookOpen size={16} />
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center bg-amber-50 rounded-2xl border border-amber-100">
                                                <ShieldCheck className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                                                <p className="text-xs font-bold text-amber-600">No active assignments</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Details */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">Contact Info</h3>
                                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Mail size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Email Address</p>
                                                <p className="text-sm font-bold text-slate-700">{selectedStaff.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Phone size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Mobile Number</p>
                                                <p className="text-sm font-bold text-slate-700">{selectedStaff.phone || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bio / Professional Details */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">Professional Background</h3>
                                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-8">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Qualification</p>
                                        <p className="text-sm font-extrabold text-slate-800">{selectedStaff.qualification}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Specialization</p>
                                        <p className="text-sm font-extrabold text-slate-800">{selectedStaff.specialization}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Experience</p>
                                        <p className="text-sm font-extrabold text-slate-800">{selectedStaff.experience_years || 0} Years</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Employee ID</p>
                                        <p className="text-sm font-extrabold text-slate-800">{selectedStaff.employee_code}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
