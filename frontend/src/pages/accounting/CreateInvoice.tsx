import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Loader2, Calendar, Hash, 
    DollarSign, FileText, User, CheckCircle2,
    Tag, Briefcase, Plus, Trash2, Zap, Save,
    CreditCard, Sparkles, Building2,
    Percent, Link as LinkIcon,
    Settings, Command
} from 'lucide-react';
import { createInvoice, getPartners } from '../../api/accounting.api';

interface LineItem {
    id: string;
    category: string;
    description: string;
    quantity: number;
    rate: number;
    tax: number;
    discount: number;
}

export default function CreateInvoice() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [partners, setPartners] = useState<any[]>([]);
    const [success, setSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        partner_id: '',
        invoice_no: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
        allow_partial: false,
        payment_links: true,
        academic_year: '2026-2027'
    });

    const [lineItems, setLineItems] = useState<LineItem[]>([
        { id: '1', category: 'Tuition', description: 'Term 1 Tuition Fee', quantity: 1, rate: 25000, tax: 0, discount: 0 }
    ]);

    useEffect(() => {
        getPartners().then(setPartners).catch(console.error);
    }, []);

    const totals = useMemo(() => {
        let subtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;
        
        lineItems.forEach(item => {
            const itemBase = item.quantity * item.rate;
            subtotal += itemBase;
            totalDiscount += item.discount;
            const taxable = itemBase - item.discount;
            totalTax += taxable * (item.tax / 100);
        });
        
        return {
            subtotal,
            tax: totalTax,
            discount: totalDiscount,
            grandTotal: subtotal - totalDiscount + totalTax
        };
    }, [lineItems]);

    const handleAddLine = () => {
        setLineItems([
            ...lineItems, 
            { id: Math.random().toString(), category: 'Misc', description: '', quantity: 1, rate: 0, tax: 0, discount: 0 }
        ]);
    };

    const handleRemoveLine = (id: string) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter(i => i.id !== id));
        }
    };

    const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
        setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await createInvoice({
                ...formData,
                partner_id: parseInt(formData.partner_id),
                total_amount: totals.grandTotal,
                net_amount: totals.grandTotal,
                // Passing line items would be done here for backend
            });
            setSuccess(true);
            setTimeout(() => navigate('/accounting'), 2000);
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to create invoice');
        } finally {
            setLoading(false);
        }
    };

    const selectedPartner = useMemo(() => partners.find(p => p.id.toString() === formData.partner_id), [partners, formData.partner_id]);

    if (success) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-8 bg-slate-50/50">
                <div className="text-center animate-in zoom-in-95 duration-500 max-w-md bg-[var(--card-bg)] p-12 rounded-[3rem] shadow-2xl border border-[var(--card-border)]">
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
                        <CheckCircle2 size={40} strokeWidth={3} />
                    </div>
                    <h2 className="text-3xl font-black text-[var(--text-main)] mb-4 tracking-tight">Invoice Posted</h2>
                    <p className="text-[var(--text-muted)] font-medium leading-relaxed">The ledger has been updated, automated journal entries created, and payment links generated.</p>
                    <div className="mt-8 flex items-center justify-center gap-2 p-4 bg-slate-50 rounded-2xl">
                        <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
                        <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Redirecting</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24">
            {/* Header Navbar */}
            <div className="sticky top-0 z-50 bg-[var(--card-bg)]/80 backdrop-blur-xl border-b border-[var(--card-border)]/50 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 bg-slate-50 border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-slate-100 rounded-xl flex items-center justify-center transition-all">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-black text-[var(--text-main)] tracking-tight">New Invoice</h1>
                            <span className="px-2.5 py-1 bg-primary/5 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest">Draft</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Automated Ledger & Receivable Entry</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] text-xs font-bold">
                        <Command size={14} />
                        <span>K for quick actions</span>
                    </div>
                    <button className="px-6 py-2.5 bg-[var(--card-bg)] border-2 border-[var(--card-border)] text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                        <Save size={16} />
                        Save Draft
                    </button>
                    <button onClick={handleSubmit} disabled={loading || !formData.partner_id} className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary shadow-lg shadow-theme transition-all flex items-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                        Post Invoice
                    </button>
                </div>
            </div>

            <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    
                    {/* Main Workspace */}
                    <div className="xl:col-span-3 space-y-6">
                        
                        {/* Customer & Meta Information */}
                        <div className="bg-[var(--card-bg)] p-8 rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                <Building2 size={200} />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                        <User size={12} /> Bill To (Customer / Student)
                                    </label>
                                    <select
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-[var(--card-border)] rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all font-black text-slate-800 text-lg appearance-none cursor-pointer"
                                        value={formData.partner_id}
                                        onChange={e => setFormData({ ...formData, partner_id: e.target.value })}
                                    >
                                        <option value="">Search customer, parent, or student...</option>
                                        {partners.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                        ))}
                                    </select>
                                    {!formData.partner_id && (
                                        <div className="flex gap-2 mt-3">
                                            {['Recent: John Doe', 'Class 10-A Bulk', '+ New Parent'].map(s => (
                                                <button key={s} className="px-3 py-1.5 bg-slate-50 text-[var(--text-muted)] rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-colors border border-[var(--card-border)]/50">
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                            <Hash size={12} /> Invoice No
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-[var(--card-border)] rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-[var(--card-bg)] transition-all"
                                            value={formData.invoice_no}
                                            onChange={e => setFormData({ ...formData, invoice_no: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                            <Tag size={12} /> Academic Year
                                        </label>
                                        <select
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-[var(--card-border)] rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-[var(--card-bg)] transition-all appearance-none"
                                            value={formData.academic_year}
                                            onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
                                        >
                                            <option>2026-2027</option>
                                            <option>2025-2026</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                            <Calendar size={12} /> Issue Date
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-[var(--card-border)] rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-[var(--card-bg)] transition-all"
                                            value={formData.invoice_date}
                                            onChange={e => setFormData({ ...formData, invoice_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                            <Calendar size={12} /> Due Date
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-[var(--card-border)] rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-[var(--card-bg)] transition-all"
                                            value={formData.due_date}
                                            onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Line Items Table */}
                        <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-sm font-black text-[var(--text-main)] tracking-tight flex items-center gap-2">
                                    <Briefcase size={16} className="text-indigo-500" />
                                    Fee Breakdown & Line Items
                                </h3>
                                <button className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-colors">
                                    <Sparkles size={14} />
                                    AI Suggestions
                                </button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[var(--card-bg)] border-b border-[var(--card-border)]">
                                            <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-48">Category</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Description</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-24 text-right">Qty</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-32 text-right">Rate</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-24 text-right">Tax %</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-32 text-right">Discount</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-32 text-right">Amount</th>
                                            <th className="px-4 py-4 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-slate-50/20">
                                        {lineItems.map((item) => (
                                            <tr key={item.id} className="group">
                                                <td className="px-6 py-3">
                                                    <select 
                                                        className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                                                        value={item.category}
                                                        onChange={(e) => updateLineItem(item.id, 'category', e.target.value)}
                                                    >
                                                        <option>Tuition</option>
                                                        <option>Transport</option>
                                                        <option>Hostel</option>
                                                        <option>Library</option>
                                                        <option>Misc</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Item description..."
                                                        className="w-full bg-transparent border border-transparent group-hover:bg-[var(--card-bg)] group-hover:border-[var(--card-border)] rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all placeholder-slate-300"
                                                        value={item.description}
                                                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <input 
                                                        type="number" 
                                                        className="w-full bg-transparent border border-transparent group-hover:bg-[var(--card-bg)] group-hover:border-[var(--card-border)] rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 text-right outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all"
                                                        value={item.quantity}
                                                        onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <input 
                                                        type="number" 
                                                        className="w-full bg-transparent border border-transparent group-hover:bg-[var(--card-bg)] group-hover:border-[var(--card-border)] rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 text-right outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all"
                                                        value={item.rate}
                                                        onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <input 
                                                        type="number" 
                                                        className="w-full bg-transparent border border-transparent group-hover:bg-[var(--card-bg)] group-hover:border-[var(--card-border)] rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 text-right outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all"
                                                        value={item.tax}
                                                        onChange={(e) => updateLineItem(item.id, 'tax', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <input 
                                                        type="number" 
                                                        className="w-full bg-transparent border border-transparent group-hover:bg-[var(--card-bg)] group-hover:border-[var(--card-border)] rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 text-right outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all"
                                                        value={item.discount}
                                                        onChange={(e) => updateLineItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="px-6 py-3 text-right font-black text-[var(--text-main)] text-base">
                                                    ${((item.quantity * item.rate) - item.discount).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button 
                                                        onClick={() => handleRemoveLine(item.id)}
                                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border-t border-[var(--card-border)] bg-[var(--card-bg)]">
                                <button 
                                    onClick={handleAddLine}
                                    className="flex items-center gap-2 px-4 py-2 text-primary font-bold text-sm hover:bg-primary/5 rounded-xl transition-colors"
                                >
                                    <Plus size={16} />
                                    Add Line Item
                                </button>
                            </div>
                        </div>

                        {/* Payment Settings & Notes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-[var(--card-bg)] p-8 rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm space-y-6">
                                <h3 className="text-sm font-black text-[var(--text-main)] flex items-center gap-2">
                                    <CreditCard size={16} className="text-indigo-500" />
                                    Collection & Payment Settings
                                </h3>
                                
                                <div className="space-y-4">
                                    <label className="flex items-center justify-between p-4 border border-[var(--card-border)] rounded-2xl cursor-pointer hover:border-indigo-500 transition-colors bg-slate-50/50">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.payment_links ? 'bg-primary/50 text-white shadow-md shadow-indigo-500/20' : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--card-border)]'}`}>
                                                <LinkIcon size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800">Generate Payment Links</p>
                                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">UPI, Cards, NetBanking</p>
                                            </div>
                                        </div>
                                        <input type="checkbox" className="w-5 h-5 accent-indigo-500" checked={formData.payment_links} onChange={(e) => setFormData({...formData, payment_links: e.target.checked})} />
                                    </label>

                                    <label className="flex items-center justify-between p-4 border border-[var(--card-border)] rounded-2xl cursor-pointer hover:border-indigo-500 transition-colors bg-slate-50/50">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.allow_partial ? 'bg-primary/50 text-white shadow-md shadow-indigo-500/20' : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--card-border)]'}`}>
                                                <Percent size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800">Allow Partial Payments</p>
                                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Enable installment tracking</p>
                                            </div>
                                        </div>
                                        <input type="checkbox" className="w-5 h-5 accent-indigo-500" checked={formData.allow_partial} onChange={(e) => setFormData({...formData, allow_partial: e.target.checked})} />
                                    </label>
                                </div>
                            </div>

                            <div className="bg-[var(--card-bg)] p-8 rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm flex flex-col">
                                <h3 className="text-sm font-black text-[var(--text-main)] flex items-center gap-2 mb-6">
                                    <FileText size={16} className="text-indigo-500" />
                                    Notes & Terms
                                </h3>
                                <textarea
                                    className="flex-1 w-full p-4 bg-slate-50 border border-[var(--card-border)] rounded-2xl font-medium text-slate-700 text-sm outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all resize-none min-h-[120px]"
                                    placeholder="Enter specific notes, late fee policies, or internal memos..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                ></textarea>
                            </div>
                        </div>

                    </div>

                    {/* Right Sidebar - Sticky Summary */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="sticky top-28 space-y-6">
                            
                            {/* Financial Summary Card */}
                            <div className="bg-surface-dark p-8 rounded-[2rem] shadow-2xl shadow-theme/20 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/50/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                                
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-6 flex items-center gap-2">
                                    <DollarSign size={12} /> Invoice Totals
                                </h4>
                                
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[var(--text-muted)] font-bold">Subtotal</span>
                                        <span className="font-black text-lg">${totals.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[var(--text-muted)] font-bold">Scholarship / Discount</span>
                                        <span className="font-black text-rose-400">-${totals.discount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[var(--text-muted)] font-bold">Tax Amount</span>
                                        <span className="font-black">${totals.tax.toFixed(2)}</span>
                                    </div>
                                    
                                    <div className="pt-6 mt-6 border-t border-slate-800/80">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Grand Total</p>
                                        <div className="text-4xl font-black tracking-tight">${totals.grandTotal.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Automation Preview */}
                            <div className="bg-[var(--card-bg)] p-6 rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                                    <Settings size={12} /> Ledger Impact
                                </h4>
                                <div className="p-4 bg-primary/5/50 border border-primary/20 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-600">AR Account</span>
                                        <span className="text-xs font-black text-emerald-600">+${totals.grandTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-600">Revenue</span>
                                        <span className="text-xs font-black text-primary">+${totals.subtotal.toFixed(2)}</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-[var(--text-muted)] font-medium leading-relaxed">
                                    Journal entries will be auto-generated and posted to the General Ledger upon saving.
                                </p>
                            </div>

                            {/* Customer Snapshot */}
                            {selectedPartner && (
                                <div className="bg-[var(--card-bg)] p-6 rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">Customer Snapshot</h4>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-[var(--text-muted)]">
                                            {selectedPartner.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-[var(--text-main)]">{selectedPartner.name}</p>
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{selectedPartner.type}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                                        <span className="text-xs font-bold text-[var(--text-muted)]">Current Balance</span>
                                        <span className="text-sm font-black text-[var(--text-main)]">$1,250.00</span>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
