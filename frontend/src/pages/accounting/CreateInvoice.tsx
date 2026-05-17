import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Loader2, Calendar, Hash, 
    DollarSign, FileText, User, CheckCircle2,
    Tag, Briefcase, Plus, Trash2, Zap, Save,
    CreditCard, Building2,
    Percent, Link as LinkIcon,
    Settings, X
} from 'lucide-react';
import { createInvoice, getPartners, getCOA, getFiscalYears } from '../../api/accounting.api';
import SearchableSelect from '../../components/accounting/SearchableSelect';

interface LineItem {
    id: string;
    account_id: string;
    description: string;
    quantity: number;
    rate: number;
    tax: number;
    discount: number;
}

export default function CreateInvoice() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
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
        { id: '1', account_id: '', description: '', quantity: 1, rate: 0, tax: 0, discount: 0 }
    ]);
    const [activeDescriptionId, setActiveDescriptionId] = useState<string | null>(null);
    const [fiscalYears, setFiscalYears] = useState<any[]>([]);

    useEffect(() => {
        // Partners loaded via SearchableSelect dynamically
        getFiscalYears().then(setFiscalYears).catch(console.error);
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
        const newLine: LineItem = {
            id: Math.random().toString(36).substr(2, 9),
            account_id: '',
            description: '',
            quantity: 1,
            rate: 0,
            tax: 0,
            discount: 0
        };
        setLineItems([...lineItems, newLine]);
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
                                        <User size={12} /> Recipient / Institutional Partner
                                    </label>
                                    <div className="relative group">
                                        <SearchableSelect 
                                            icon={User}
                                            placeholder="Select Recipient / Institutional Partner..."
                                            value={formData.partner_id}
                                            onSearch={(q) => getPartners('customer', q)}
                                            formatOption={(p) => ({ id: p.id, label: p.name, sublabel: p.type, original: p })}
                                            onSelect={(opt) => setFormData(p => ({ ...p, partner_id: opt.id.toString() }))}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                            <Hash size={12} /> Invoice No
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-base outline-none focus:border-indigo-500 focus:bg-[var(--card-bg)] transition-all shadow-sm hover:border-slate-300"
                                            value={formData.invoice_no}
                                            onChange={e => setFormData({ ...formData, invoice_no: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                            <Tag size={12} /> Fiscal Period
                                        </label>
                                        <select
                                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-base outline-none focus:border-indigo-500 focus:bg-[var(--card-bg)] transition-all appearance-none shadow-sm hover:border-slate-300"
                                            value={formData.academic_year}
                                            onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
                                        >
                                            <option value="">Select Period...</option>
                                            {fiscalYears.map(fy => (
                                                <option key={fy.id} value={fy.year_name}>{fy.year_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                            <Calendar size={12} /> Issue Date
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-base outline-none focus:border-indigo-500 focus:bg-[var(--card-bg)] transition-all shadow-sm hover:border-slate-300"
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
                                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-base outline-none focus:border-indigo-500 focus:bg-[var(--card-bg)] transition-all shadow-sm hover:border-slate-300"
                                            value={formData.due_date}
                                            onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Line Items Table */}
                        <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm overflow-visible pb-24">
                            <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-slate-50/50 rounded-t-[2rem]">
                                <h3 className="text-sm font-black text-[var(--text-main)] tracking-tight flex items-center gap-2">
                                    <Briefcase size={16} className="text-indigo-500" />
                                    Itemized Revenue & Service Details
                                </h3>
                            </div>
                            
                            <div className="overflow-visible min-h-[300px]">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[var(--card-bg)] border-b border-[var(--card-border)]">
                                            <th className="px-4 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-[25%]">Revenue Account</th>
                                            <th className="px-4 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Description</th>
                                            <th className="px-4 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-28 text-right">Qty</th>
                                            <th className="px-4 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-40 text-right">Rate</th>
                                            <th className="px-4 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-28 text-right">Tax %</th>
                                            <th className="px-4 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-32 text-right">Discount</th>
                                            <th className="px-4 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-40 text-right">Amount</th>
                                            <th className="px-4 py-4 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-slate-50/20">
                                        {lineItems.map((item) => (
                                            <tr key={item.id} className="group hover:bg-slate-50/30 transition-colors">
                                                <td className="px-4 py-4">
                                                    <SearchableSelect 
                                                        compact
                                                        placeholder="Select Account..."
                                                        value={item.account_id}
                                                        onSearch={getCOA}
                                                        formatOption={(acc) => ({ id: acc.id, label: acc.name, sublabel: acc.code, original: acc })}
                                                        onSelect={(opt) => updateLineItem(item.id, 'account_id', opt.id.toString())}
                                                    />
                                                </td>
                                                <td className="px-4 py-4 relative">
                                                    <div 
                                                        onClick={() => setActiveDescriptionId(item.id)}
                                                        className="w-full min-h-[44px] bg-[var(--card-bg)] border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all shadow-sm flex items-center line-clamp-1 break-all"
                                                    >
                                                        {item.description || <span className="text-slate-400 italic">Add log description...</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input 
                                                        type="number" 
                                                        className="w-full bg-[var(--card-bg)] border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 text-right outline-none focus:border-indigo-500 transition-all shadow-sm"
                                                        value={item.quantity}
                                                        onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="relative">
                                                        <input 
                                                            type="number" 
                                                            className="w-full bg-[var(--card-bg)] border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-slate-700 text-right outline-none focus:border-indigo-500 transition-all shadow-sm"
                                                            value={item.rate}
                                                            onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                                        />
                                                        <DollarSign size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input 
                                                        type="number" 
                                                        className="w-full bg-[var(--card-bg)] border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 text-right outline-none focus:border-indigo-500 transition-all shadow-sm"
                                                        value={item.tax}
                                                        onChange={(e) => updateLineItem(item.id, 'tax', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input 
                                                        type="number" 
                                                        className="w-full bg-[var(--card-bg)] border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 text-right outline-none focus:border-indigo-500 transition-all shadow-sm"
                                                        value={item.discount}
                                                        onChange={(e) => updateLineItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-[var(--text-main)] text-base">
                                                    ${((item.quantity * item.rate) - item.discount).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button 
                                                        onClick={() => handleRemoveLine(item.id)}
                                                        className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
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

                            {/* Customer Snapshot Removed */}

                        </div>
                    </div>

                </div>
            </div>

            {/* Description Modal */}
            {activeDescriptionId && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[var(--card-bg)] w-full max-w-lg rounded-[2rem] shadow-2xl p-6 animate-in zoom-in-95 duration-200 border border-[var(--card-border)]/60">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black text-lg text-[var(--text-main)]">Item Description</h3>
                            <button onClick={() => setActiveDescriptionId(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <textarea
                            autoFocus
                            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-700 text-sm outline-none focus:border-indigo-500 focus:bg-[var(--card-bg)] transition-all resize-none shadow-inner"
                            placeholder="Enter detailed description or log notes..."
                            value={lineItems.find(i => i.id === activeDescriptionId)?.description || ''}
                            onChange={e => updateLineItem(activeDescriptionId, 'description', e.target.value)}
                        />
                        <div className="flex justify-end mt-6">
                            <button onClick={() => setActiveDescriptionId(null)} className="px-8 py-3 bg-primary text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
