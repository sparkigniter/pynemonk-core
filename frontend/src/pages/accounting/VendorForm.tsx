import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ArrowLeft, Save, Loader2, 
    Building2, Mail, DollarSign, 
    Briefcase, ChevronRight
} from 'lucide-react';
import { createVendor } from '../../api/accounting.api';

export default function VendorForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        opening_balance: 0,
        tax_id: '',
        payment_terms: 'net_30'
    });

    useEffect(() => {
        if (id && id !== 'new') {
            setIsEdit(true);
            // Fetch vendor data if editing
            // for now we'll just mock it or assume creation for this task
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await createVendor(formData);
            navigate('/accounting/ap');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Navigation & Actions */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">
                            <span>Accounts Payable</span>
                            <ChevronRight size={10} />
                            <span>Vendors</span>
                        </div>
                        <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">
                            {isEdit ? 'Edit Vendor Profile' : 'Onboard New Vendor'}
                        </h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 text-sm font-bold text-[var(--text-muted)] hover:text-slate-700 transition-colors"
                    >
                        Discard
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isEdit ? 'Update Directory' : 'Save & Register'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Fields */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="premium-card p-8 space-y-8">
                        <div>
                            <h3 className="text-sm font-bold text-[var(--text-main)] mb-6 flex items-center gap-2">
                                <Building2 size={18} className="text-primary" />
                                Core Identity
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Legal Entity Name</label>
                                    <input 
                                        required
                                        className="premium-input w-full"
                                        placeholder="e.g. Global Supplies Ltd"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Internal ID / Code</label>
                                    <input 
                                        className="premium-input w-full"
                                        placeholder="e.g. VND-992"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50">
                            <h3 className="text-sm font-bold text-[var(--text-main)] mb-6 flex items-center gap-2">
                                <Mail size={18} className="text-primary" />
                                Communication Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Point of Contact</label>
                                    <input 
                                        className="premium-input w-full"
                                        placeholder="Full Name"
                                        value={formData.contact_person}
                                        onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Primary Email</label>
                                    <input 
                                        type="email"
                                        className="premium-input w-full"
                                        placeholder="billing@vendor.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Phone Number</label>
                                    <input 
                                        className="premium-input w-full"
                                        placeholder="+1 (000) 000-0000"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Tax ID / TIN</label>
                                    <input 
                                        className="premium-input w-full"
                                        placeholder="Tax registration number"
                                        value={formData.tax_id}
                                        onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="mt-6 space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Registered Address</label>
                                <textarea 
                                    rows={3}
                                    className="premium-input w-full resize-none"
                                    placeholder="Full physical address"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar / Financial Settings */}
                <div className="space-y-8">
                    <div className="premium-card p-8 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-[var(--text-main)] mb-6 flex items-center gap-2">
                            <DollarSign size={18} className="text-primary" />
                            Ledger Configuration
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Opening Balance</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">$</div>
                                    <input 
                                        type="number"
                                        className="premium-input w-full pl-8"
                                        placeholder="0.00"
                                        value={formData.opening_balance}
                                        onChange={e => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <p className="text-[10px] text-[var(--text-muted)] font-medium italic">Unpaid amount at the time of migration</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Payment Terms</label>
                                <select 
                                    className="premium-input w-full"
                                    value={formData.payment_terms}
                                    onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
                                >
                                    <option value="due_on_receipt">Due on Receipt</option>
                                    <option value="net_15">Net 15</option>
                                    <option value="net_30">Net 30 (Default)</option>
                                    <option value="net_60">Net 60</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-6 border-none bg-primary text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <Briefcase className="w-12 h-12 mb-4 opacity-40" />
                            <h4 className="text-lg font-black mb-2">Institutional AP</h4>
                            <p className="text-indigo-100 text-xs font-medium leading-relaxed">Proper vendor onboarding ensures accurate 1099 reporting and expenditure tracking.</p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[var(--card-bg)]/10 rounded-full blur-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
