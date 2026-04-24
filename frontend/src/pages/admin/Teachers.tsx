import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    Plus, Search, Filter, MoreVertical,
    Mail, Phone, BookOpen, Loader2, UserPlus,
    Calendar, ShieldCheck
} from 'lucide-react';
import * as staffApi from '../../api/staff.api';

export default function Teachers() {
    const [staff, setStaff] = useState<staffApi.Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // Search & Pagination state
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

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
        </div>
    );
}
