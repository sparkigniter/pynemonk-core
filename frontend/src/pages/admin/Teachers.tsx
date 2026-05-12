import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    Plus, Search, Filter,
    Mail, Phone, BookOpen, UserPlus,
    Calendar, ShieldCheck, X, ChevronRight
} from 'lucide-react';
import * as staffApi from '../../api/staff.api';
import AdvancedFilters from '../../components/ui/AdvancedFilters';
import type { FilterField } from '../../components/ui/AdvancedFilters';

export default function Teachers() {
    const [staff, setStaff] = useState<staffApi.Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { can } = useAuth();

    // Search & Pagination state
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
    const [selectedStaff, setSelectedStaff] = useState<staffApi.Staff | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState<any>({});

    const filterFields: FilterField[] = [
        { 
            id: 'status', 
            label: 'Status', 
            type: 'select', 
            options: [
                { value: 'active', label: 'Active' },
                { value: 'on_leave', label: 'On Leave' },
                { value: 'inactive', label: 'Inactive' }
            ]
        },
        { 
            id: 'gender', 
            label: 'Gender', 
            type: 'select', 
            options: [
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' }
            ]
        },
        { id: 'designation', label: 'Designation', type: 'text', placeholder: 'e.g. Teacher' },
        { 
            id: 'blood_group', 
            label: 'Blood Group', 
            type: 'select', 
            options: [
                { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' }
            ]
        },
        { id: 'nationality', label: 'Nationality', type: 'text', placeholder: 'e.g. Indian' }
    ];

    const canRegister = can('staff:write');

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStaff();
        }, 300); // Simple debounce
        return () => clearTimeout(timer);
    }, [search, pagination.page, advancedFilters]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const response = await staffApi.getStaffList({
                search,
                page: pagination.page,
                limit: pagination.limit,
                ...advancedFilters
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
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <div 
                            className="p-3.5 rounded-2xl shadow-lg shadow-primary/10"
                            style={{ background: 'var(--primary)' }}
                        >
                            <UserPlus className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">Staff Directory</h1>
                            <p className="text-[var(--text-muted)] font-medium mt-1">Manage your academic faculty and administrative team.</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {canRegister && (
                        <button
                            onClick={() => navigate('/teachers/register')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 btn-primary rounded-xl hover:opacity-90 transition-all shadow-xl shadow-primary/20 font-bold text-xs uppercase tracking-wider group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                            Register Staff
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Personnel', value: pagination.total, icon: UserPlus, color: 'text-primary', bg: 'bg-primary/5' },
                    { label: 'Academic Staff', value: staff.filter(s => s.designation.toLowerCase().includes('teacher')).length, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'On Leave', value: staff.filter(s => s.status === 'on_leave').length, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Operational', value: staff.filter(s => s.status === 'active').length, icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map((stat, i) => (
                    <div key={i} className="premium-card p-5 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm`}>
                            <stat.icon size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{stat.label}</p>
                            <h4 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">{stat.value}</h4>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative w-full lg:w-96 group">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name or code..."
                        className="w-full pl-11 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[13px] font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-[var(--text-muted)] shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full lg:w-auto">
                    <div className="relative w-full lg:w-auto">
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-6 py-3 border rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all w-full lg:w-auto justify-center shadow-sm ${Object.keys(advancedFilters).length > 0 ? 'bg-surface-dark text-white border-slate-900' : 'bg-[var(--card-bg)] border-[var(--card-border)] text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Filter size={16} />
                            {Object.keys(advancedFilters).length > 0 ? `Active (${Object.keys(advancedFilters).length})` : 'Advanced Filters'}
                        </button>

                        <AdvancedFilters 
                            isOpen={isFilterOpen}
                            onClose={() => setIsFilterOpen(false)}
                            fields={filterFields}
                            currentFilters={advancedFilters}
                            onFilter={(f) => { setAdvancedFilters(f); setPagination(prev => ({ ...prev, page: 1 })); }}
                            onReset={() => { setAdvancedFilters({}); setPagination(prev => ({ ...prev, page: 1 })); }}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="h-[50vh] flex flex-col items-center justify-center gap-6 bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)]">
                    <div className="w-10 h-10 border-4 border-[var(--card-border)] border-t-primary rounded-full animate-spin" />
                    <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Refreshing Records...</p>
                </div>
            ) : staff.length === 0 ? (
                <div className="h-[50vh] flex flex-col items-center justify-center text-center bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] border-dashed border-2">
                    <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-300 mb-6">
                        <UserPlus size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">The Directory is Empty</h3>
                    <p className="text-[var(--text-muted)] max-w-sm mb-8 font-medium">Get started by registering your first faculty member.</p>
                    {canRegister && (
                        <button
                            onClick={() => navigate('/teachers/register')}
                            className="px-8 py-4 btn-primary rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all"
                        >
                            Register New Staff
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {staff.map((s) => (
                        <div
                            key={s.id}
                            onClick={() => setSelectedStaff(s)}
                            className={`
                                premium-card p-6 flex flex-col group cursor-pointer h-full relative
                                ${s.assignments?.length === 0 ? 'bg-amber-50/10 border-amber-200' : ''}
                            `}
                        >
                            {s.assignments?.length === 0 && (
                                <div className="absolute -top-3 right-6 bg-surface-dark text-white text-[9px] font-bold px-3 py-1 rounded-full shadow-lg border border-white/20 uppercase tracking-widest">
                                    Unassigned
                                </div>
                            )}

                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-2xl uppercase shadow-lg group-hover:scale-105 transition-transform duration-300">
                                        {s.first_name[0]}{s.last_name[0]}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${s.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-[var(--text-main)] tracking-tight text-[16px] truncate group-hover:text-primary transition-colors">{s.first_name} {s.last_name}</h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 rounded bg-primary/5 text-primary text-[9px] font-bold uppercase tracking-wider">
                                            {s.designation}
                                        </span>
                                        {s.is_class_teacher && (
                                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-wider">
                                                Class Teacher
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-[var(--card-border)]">
                                    <Mail size={14} className="text-[var(--text-muted)] group-hover:text-primary transition-colors" />
                                    <span className="font-medium truncate">{s.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-[var(--card-border)]">
                                    <Phone size={14} className="text-[var(--text-muted)] group-hover:text-primary transition-colors" />
                                    <span className="font-medium">{s.phone || 'No phone'}</span>
                                </div>
                            </div>

                            <div className="mt-auto border-t border-slate-50 pt-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Assigned Load</span>
                                        <span className="text-[12px] font-bold text-slate-700">
                                            {s.assignments?.length || 0} Subjects
                                        </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 text-[var(--text-muted)] rounded-xl group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-sm">
                    <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        Total <span className="text-[var(--text-main)] font-bold">{pagination.total}</span> Staff Members
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                        >
                            <ChevronRight size={18} className="rotate-180" />
                        </button>
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                                    className={`w-10 h-10 rounded-xl text-[11px] font-bold transition-all ${pagination.page === p ? 'bg-surface-dark text-white shadow-lg shadow-theme/20' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:border-slate-300'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={pagination.page === pagination.pages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Teacher Profile Modal */}
            {selectedStaff && (
                <div className="fixed inset-0 bg-surface-dark/40 backdrop-blur-sm z-[100] flex items-center justify-end">
                    <div className="h-full w-full max-w-2xl bg-[#F9FAFB] shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto">
                        <div className="sticky top-0 z-10 bg-[var(--card-bg)] border-b border-[var(--card-border)] px-8 py-6 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-[var(--text-main)] uppercase tracking-tight">Personnel Profile</h2>
                            <div className="flex items-center gap-4">
                                {can('staff:write') && (
                                    <button
                                        onClick={() => navigate(`/teachers/edit/${selectedStaff.id}`)}
                                        className="px-5 py-2.5 btn-primary text-[11px] font-bold uppercase rounded-xl shadow-lg shadow-primary/10 hover:opacity-90 transition-all active:scale-95 tracking-wider"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedStaff(null)}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Profile Header */}
                            <div className="premium-card p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                                    <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-5xl font-bold shadow-xl">
                                        {selectedStaff.first_name[0]}{selectedStaff.last_name[0]}
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2 tracking-tight">{selectedStaff.first_name} {selectedStaff.last_name}</h1>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                            <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold uppercase rounded-full tracking-wider border border-primary/10">
                                                {selectedStaff.designation}
                                            </span>
                                            <span className={`px-3 py-1 ${selectedStaff.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'} text-[10px] font-bold uppercase rounded-full tracking-wider border`}>
                                                {selectedStaff.status}
                                            </span>
                                            {selectedStaff.is_class_teacher && (
                                                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-full tracking-wider border border-blue-100">
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
                                    <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-2">Academic Load</h3>
                                    <div className="space-y-3">
                                        {selectedStaff.assignments && selectedStaff.assignments.length > 0 ? (
                                            selectedStaff.assignments.map((a: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] hover:border-primary/20 transition-all shadow-sm">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight mb-0.5">{a.classroom_name}</p>
                                                        <p className="text-sm font-bold text-slate-800">{a.subject_name}</p>
                                                    </div>
                                                    <div className="p-2.5 bg-slate-50 rounded-xl text-primary">
                                                        <BookOpen size={18} />
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-10 text-center bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-sm">
                                                <ShieldCheck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">No Load Assigned</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Details */}
                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-2">Contact Intelligence</h3>
                                    <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--card-border)] shadow-sm space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-[var(--text-muted)]">
                                                <Mail size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight mb-0.5">Primary Email</p>
                                                <p className="text-sm font-bold text-slate-800">{selectedStaff.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-[var(--text-muted)]">
                                                <Phone size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight mb-0.5">Mobile Number</p>
                                                <p className="text-sm font-bold text-slate-800">{selectedStaff.phone || 'Not available'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Professional Details */}
                            <div className="space-y-4">
                                <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-2">Professional Credentials</h3>
                                <div className="bg-[var(--card-bg)] rounded-[1.5rem] p-8 border border-[var(--card-border)] shadow-sm grid grid-cols-2 md:grid-cols-4 gap-8">
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight mb-1.5">Qualification</p>
                                        <p className="text-[13px] font-bold text-[var(--text-main)] leading-tight">{selectedStaff.qualification || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight mb-1.5">Specialization</p>
                                        <p className="text-[13px] font-bold text-[var(--text-main)] leading-tight">{selectedStaff.specialization || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight mb-1.5">Experience</p>
                                        <p className="text-[13px] font-bold text-[var(--text-main)] leading-tight">{selectedStaff.experience_years || 0} Academic Years</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight mb-1.5">Employee ID</p>
                                        <p className="text-[13px] font-bold text-[var(--text-main)] leading-tight">{selectedStaff.employee_code || 'N/A'}</p>
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
