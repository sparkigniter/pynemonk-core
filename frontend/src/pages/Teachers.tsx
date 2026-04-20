import { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, MoreVertical, MapPin,
    Mail, Phone, BookOpen, Star, Loader2, UserPlus
} from 'lucide-react';
import * as staffApi from '../api/staff.api';
import Modal from '../components/ui/Modal';

export default function Teachers() {
    const [staff, setStaff] = useState<staffApi.Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        designation: '',
        employee_code: '',
        password: 'Password123!', // Temporary default
    });

    const fetchStaff = async () => {
        try {
            const data = await staffApi.getStaffList();
            setStaff(data);
        } catch (err) {
            console.error('Failed to fetch staff:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await staffApi.createStaff(formData);
            await fetchStaff();
            setIsModalOpen(false);
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                designation: '',
                employee_code: '',
                password: 'Password123!',
            });
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-heading tracking-tight">Staff Directory</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage teachers, staff records, and assignments.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-theme-primary text-white rounded-xl hover:bg-theme-primary/90 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Plus size={16} />
                        Add Staff
                    </button>
                </div>
            </div>

            {/* Filters bar */}
            <div className="card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, subject..."
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50/50"
                    />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <select className="flex-1 sm:w-40 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option>All Subjects</option>
                        <option>Mathematics</option>
                        <option>Science</option>
                        <option>Humanities</option>
                    </select>
                    <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">
                        <Filter size={16} />
                        More Filters
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 size={40} className="text-theme-primary animate-spin" />
                    <p className="text-slate-500 font-medium">Loading staff records...</p>
                </div>
            ) : staff.length === 0 ? (
                <div className="card p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
                        <UserPlus size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No staff records yet</h3>
                    <p className="text-slate-500 max-w-sm mb-6">Start building your school team by adding your first staff member.</p>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary"
                    >
                        Add Your First Staff
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staff.map((s, i) => (
                        <div key={s.id} className={`card p-6 hover-lift delay-${(i % 3) * 100}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-theme-primary/10 flex items-center justify-center text-theme-primary font-bold text-xl uppercase">
                                        {s.first_name[0]}{s.last_name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 tracking-tight">{s.first_name} {s.last_name}</h3>
                                        <p className="text-sm font-medium text-theme-primary">{s.designation}</p>
                                    </div>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors">
                                    <MoreVertical size={18} />
                                </button>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Mail size={14} className="text-slate-400" />
                                    <span className="truncate">{s.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Phone size={14} className="text-slate-400" />
                                    <span>{s.phone || 'No phone'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <MapPin size={14} className="text-slate-400" />
                                    <span>Code: {s.employee_code}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div>
                                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><BookOpen size={12} /> Qual.</div>
                                    <div className="font-semibold text-slate-800 truncate">{s.qualification || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Star size={12} /> Spec.</div>
                                    <div className="font-semibold text-slate-800 truncate">{s.specialization || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Staff Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Staff Member"
            >
                <form onSubmit={handleAddStaff} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">First Name</label>
                            <input 
                                required
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-theme-primary transition-colors"
                                value={formData.first_name}
                                onChange={e => setFormData({...formData, first_name: e.target.value})}
                                placeholder="John"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Last Name</label>
                            <input 
                                required
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-theme-primary transition-colors"
                                value={formData.last_name}
                                onChange={e => setFormData({...formData, last_name: e.target.value})}
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                        <input 
                            required
                            type="email"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-theme-primary transition-colors"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            placeholder="john.doe@school.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Designation</label>
                            <input 
                                required
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-theme-primary transition-colors"
                                value={formData.designation}
                                onChange={e => setFormData({...formData, designation: e.target.value})}
                                placeholder="Senior Teacher"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Employee Code</label>
                            <input 
                                required
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-theme-primary transition-colors"
                                value={formData.employee_code}
                                onChange={e => setFormData({...formData, employee_code: e.target.value})}
                                placeholder="EMP001"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                        <input 
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-theme-primary transition-colors"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            placeholder="+1 234 567 890"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-theme-primary text-white text-sm font-semibold hover:bg-theme-primary/90 transition-colors flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Save Staff
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
