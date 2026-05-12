import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Loader2, Calendar, Hash,
    FileText, CheckCircle2, Plus, Trash2, Save,
    Building2, Scan, Receipt,
    AlertTriangle, ShieldCheck
} from 'lucide-react';
import { getCOA, getVendors, createBill, getAccountingSettings } from '../../api/accounting.api';
import SearchableSelect from '../../components/accounting/SearchableSelect';

interface LineItem {
    id: string;
    account_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_percent: number;
    campus: string;
}

export default function BillEntryForm() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [currencySymbol, setCurrencySymbol] = useState('$');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        vendor_id: '',
        bill_no: '',
        reference: '',
        bill_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
        gstin: '',
        require_approval: true
    });

    const [items, setItems] = useState<LineItem[]>([
        { id: '1', account_id: '', description: '', quantity: 1, unit_price: 0, tax_percent: 0, campus: 'Main Campus' }
    ]);

    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        getAccountingSettings().then(s => setCurrencySymbol(s.currency_symbol || '$')).catch(console.error);
    }, []);

    const totals = useMemo(() => {
        let subtotal = 0;
        let totalTax = 0;
        items.forEach(item => {
            const baseAmount = item.quantity * item.unit_price;
            subtotal += baseAmount;
            totalTax += baseAmount * (item.tax_percent / 100);
        });
        return {
            subtotal,
            tax: totalTax,
            grandTotal: subtotal + totalTax
        };
    }, [items]);

    const handleAddItem = () => {
        setItems([
            ...items,
            { id: Math.random().toString(), account_id: '', description: '', quantity: 1, unit_price: 0, tax_percent: 0, campus: 'Main Campus' }
        ]);
    };

    const handleRemoveItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof LineItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleScanInvoice = () => {
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            setFormData(p => ({
                ...p,
                bill_no: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
                reference: 'Auto-Scanned'
            }));
            updateItem(items[0].id, 'description', 'Office Supplies');
            updateItem(items[0].id, 'unit_price', 1450.00);
            updateItem(items[0].id, 'tax_percent', 18);
        }, 1500);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        try {
            setSubmitting(true);
            const formattedItems = items.map(i => ({
                account_id: i.account_id,
                description: i.description,
                amount: i.quantity * i.unit_price * (1 + i.tax_percent / 100)
            }));

            await createBill({
                ...formData,
                vendor_id: parseInt(formData.vendor_id),
                total_amount: totals.grandTotal,
                items: formattedItems
            });
            setSuccess(true);
            setTimeout(() => navigate('/accounting/ap'), 2000);
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to create bill');
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-8 bg-slate-50/50">
                <div className="text-center animate-in zoom-in-95 duration-500 max-w-md bg-[var(--card-bg)] p-12 rounded-[3rem] shadow-2xl border border-[var(--card-border)]">
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
                        <CheckCircle2 size={40} strokeWidth={3} />
                    </div>
                    <h2 className="text-3xl font-black text-[var(--text-main)] mb-4 tracking-tight">Bill Recorded!</h2>
                    <p className="text-[var(--text-muted)] font-medium leading-relaxed">The vendor bill has been logged and sent to the Finance Department for approval.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24">
            {/* Enterprise Command Bar */}
            <div className="sticky top-0 z-50 bg-[var(--card-bg)]/90 backdrop-blur-xl border-b border-[var(--card-border)]/50 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 bg-slate-50 border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-slate-100 rounded-xl flex items-center justify-center transition-all">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-black text-[var(--text-main)] tracking-tight flex items-center gap-2">
                                <Receipt className="text-primary" size={20} /> Record Vendor Bill
                            </h1>
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-200/50 rounded-lg text-[9px] font-black uppercase tracking-widest">Pending Approval</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Accounts Payable • Institutional Ledger</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={handleScanInvoice} className="px-6 py-2.5 bg-primary/5 border border-primary/20 text-primary rounded-xl font-bold text-sm hover:bg-primary/10 transition-all flex items-center gap-2">
                        {isScanning ? <Loader2 size={16} className="animate-spin" /> : <Scan size={16} />}
                        {isScanning ? 'Scanning...' : 'Smart Scan PDF'}
                    </button>
                    <button onClick={handleSubmit} disabled={submitting || !formData.vendor_id} className="px-8 py-2.5 bg-surface-dark text-white rounded-xl font-bold text-sm hover:bg-black shadow-lg shadow-theme/20 transition-all flex items-center gap-2 disabled:opacity-50">
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save & Route for Approval
                    </button>
                </div>
            </div>

            <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

                    {/* Main Entry Workspace */}
                    <div className="xl:col-span-3 space-y-6">

                        {/* Intelligent Vendor Identification */}
                        <div className="bg-[var(--card-bg)] p-8 rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                <Building2 size={200} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 mb-3">
                                            <Building2 size={12} /> Select Vendor
                                        </label>
                                        <SearchableSelect
                                            icon={Building2}
                                            placeholder="Search vendor name, GSTIN..."
                                            value={formData.vendor_id}
                                            onSearch={getVendors}
                                            formatOption={(v) => ({ id: v.id, label: v.name, sublabel: v.code || 'NO CODE', original: v })}
                                            onSelect={(opt) => setFormData(p => ({ ...p, vendor_id: opt.id.toString() }))}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                                <Hash size={12} /> Bill Number
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-5 py-4 bg-slate-50 border border-[var(--card-border)] rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-[var(--card-bg)] transition-all"
                                                value={formData.bill_no}
                                                onChange={e => setFormData({ ...formData, bill_no: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                                <FileText size={12} /> Reference / P.O.
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-5 py-4 bg-slate-50 border border-[var(--card-border)] rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-[var(--card-bg)] transition-all"
                                                value={formData.reference}
                                                onChange={e => setFormData({ ...formData, reference: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 lg:pl-10 lg:border-l border-[var(--card-border)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                                <Calendar size={12} /> Bill Date
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full px-5 py-4 bg-slate-50 border border-[var(--card-border)] rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-[var(--card-bg)] transition-all"
                                                value={formData.bill_date}
                                                onChange={e => setFormData({ ...formData, bill_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                                <Calendar size={12} /> Due Date
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full px-5 py-4 bg-slate-50 border border-[var(--card-border)] rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-[var(--card-bg)] transition-all"
                                                value={formData.due_date}
                                                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                            />
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </div>

                        {/* Itemized Spreadsheet UX */}
                        <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm">
                            <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-slate-50/50 rounded-t-[2rem]">
                                <h3 className="text-sm font-black text-[var(--text-main)] tracking-tight flex items-center gap-2">
                                    <FileText size={16} className="text-[var(--text-muted)]" />
                                    Itemized Billing Details
                                </h3>
                            </div>

                            <div className="w-full">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[var(--card-bg)] border-b border-[var(--card-border)]">
                                            <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-[25%]">Expense Account</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Description</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-24 text-right">Qty</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-32 text-right">Unit Price</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-24 text-right">Tax %</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-32">Campus</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-32 text-right">Amount</th>
                                            <th className="px-4 py-4 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-slate-50/20">
                                        {items.map((item) => (
                                            <tr key={item.id} className="group">
                                                <td className="px-6 py-3">
                                                    <SearchableSelect
                                                        compact
                                                        placeholder="Select Account..."
                                                        value={item.account_id}
                                                        onSearch={getCOA}
                                                        formatOption={(acc) => ({ id: acc.id, label: acc.name, sublabel: acc.code, original: acc })}
                                                        onSelect={(opt) => updateItem(item.id, 'account_id', opt.id.toString())}
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Item description..."
                                                        className="w-full bg-transparent border border-transparent group-hover:bg-[var(--card-bg)] group-hover:border-[var(--card-border)] rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all placeholder-slate-300"
                                                        value={item.description}
                                                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <input
                                                        type="number"
                                                        className="w-full bg-transparent border border-transparent group-hover:bg-[var(--card-bg)] group-hover:border-[var(--card-border)] rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 text-right outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <input
                                                        type="number"
                                                        className="w-full bg-transparent border border-transparent group-hover:bg-[var(--card-bg)] group-hover:border-[var(--card-border)] rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 text-right outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all"
                                                        value={item.unit_price}
                                                        onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <input
                                                        type="number"
                                                        className="w-full bg-transparent border border-transparent group-hover:bg-[var(--card-bg)] group-hover:border-[var(--card-border)] rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 text-right outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all"
                                                        value={item.tax_percent}
                                                        onChange={(e) => updateItem(item.id, 'tax_percent', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <select
                                                        className="w-full bg-transparent border border-transparent group-hover:bg-[var(--card-bg)] group-hover:border-[var(--card-border)] rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:bg-[var(--card-bg)] focus:border-indigo-500 transition-all"
                                                        value={item.campus}
                                                        onChange={(e) => updateItem(item.id, 'campus', e.target.value)}
                                                    >
                                                        <option>Main Campus</option>
                                                        <option>North Wing</option>
                                                        <option>Hostel Block A</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-3 text-right font-black text-[var(--text-main)] text-base">
                                                    {currencySymbol}{(item.quantity * item.unit_price * (1 + item.tax_percent / 100)).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
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
                                    onClick={handleAddItem}
                                    className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    <Plus size={16} />
                                    Add Expense Line
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Smart Floating Panel */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="sticky top-28 space-y-6">

                            {/* Summary Card */}
                            <div className="bg-surface-dark p-8 rounded-[2rem] shadow-2xl shadow-theme/20 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-6">Bill Summary</h4>

                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[var(--text-muted)] font-bold">Subtotal</span>
                                        <span className="font-black text-lg">{currencySymbol}{totals.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[var(--text-muted)] font-bold">Total Tax (GST)</span>
                                        <span className="font-black">{currencySymbol}{totals.tax.toFixed(2)}</span>
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-slate-800/80">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Net Payable</p>
                                        <div className="text-4xl font-black tracking-tight">{currencySymbol}{totals.grandTotal.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Compliance & Approval */}
                            <div className="bg-[var(--card-bg)] p-6 rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                                    <ShieldCheck size={12} /> Compliance & Routing
                                </h4>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3 border border-[var(--card-border)] rounded-xl bg-slate-50/50">
                                        <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={formData.require_approval} onChange={(e) => setFormData({ ...formData, require_approval: e.target.checked })} />
                                        <span className="text-xs font-bold text-slate-700">Route to Finance Manager for Approval</span>
                                    </label>
                                    {totals.grandTotal > 5000 && (
                                        <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold">
                                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                            <span>High value bill. Requires Principal/Director approval before AP posting.</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Vendor Insights */}
                            {formData.vendor_id && (
                                <div className="bg-[var(--card-bg)] p-6 rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">Vendor Insights</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-[var(--text-muted)]">Outstanding</span>
                                            <span className="font-black text-rose-500">{currencySymbol}2,450.00</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-[var(--text-muted)]">Last Paid</span>
                                            <span className="font-black text-slate-800">12 Days Ago</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-[var(--text-muted)]">Primary Category</span>
                                            <span className="font-black text-primary bg-primary/5 px-2 py-0.5 rounded">Stationery</span>
                                        </div>
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
