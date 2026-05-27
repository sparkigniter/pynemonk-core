import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Printer, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { getBaseURL } from '../../api/base.api';
import { useAuth } from '../../contexts/AuthContext';

interface PaymentCallbackProps {
    status: 'success' | 'failed';
}

export default function PaymentCallback({ status }: PaymentCallbackProps) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [syncing, setSyncing] = useState(status === 'success');
    const [syncError, setSyncError] = useState<string | null>(null);

    const reference = searchParams.get('reference') || searchParams.get('session_id') || `TXN-${Date.now()}`;
    const amount = searchParams.get('amount') || '0.00';
    const isSuccess = status === 'success';

    useEffect(() => {
        const reconcilePayment = async () => {
            if (!isSuccess) return;

            try {
                // Instantly sync the callback with the ledger to guarantee zero-delay updates
                const tenantId = user?.tenant_id || 1;
                
                // Determine gateway type based on reference prefix
                let gateway = 'mock_demo';
                if (reference.startsWith('cs_') || reference.startsWith('mock_cs_')) {
                    gateway = 'stripe';
                } else if (reference.startsWith('order_') || reference.startsWith('mock_order_')) {
                    gateway = 'razorpay';
                }

                const res = await fetch(`${getBaseURL()}/accounting/payments/webhook?tenant_id=${tenantId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gateway,
                        reference,
                        status: 'success'
                    })
                });

                if (!res.ok) {
                    const errJson = await res.json().catch(() => ({}));
                    throw new Error(errJson.message || "Failed to reconcile ledger entries.");
                }

                setSyncing(false);
            } catch (err: any) {
                console.error("Ledger reconciliation failed:", err);
                setSyncError(err.message || "Institutional double-entry posting timed out. The payment was captured, but background reconciliation is still processing.");
                setSyncing(false);
            }
        };

        reconcilePayment();
    }, [isSuccess, reference, user]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center p-6 bg-slate-50/50 animate-in fade-in duration-500">
            <div className="w-full max-w-xl bg-white border border-slate-100 rounded-[3rem] shadow-2xl p-10 lg:p-14 text-center space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-slate-100 rounded-full blur-3xl opacity-40 -mr-20 -mt-20" />
                
                {isSuccess ? (
                    <div className="space-y-8 relative z-10">
                        {/* Success Graphic */}
                        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping duration-1000" />
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 relative z-10 border border-emerald-100/50 shadow-lg shadow-emerald-50">
                                <CheckCircle2 size={44} />
                            </div>
                        </div>

                        {/* Success Messages */}
                        <div className="space-y-3">
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Payment Captured</h2>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Digital Invoice Settlement Complete</p>
                        </div>

                        {/* Reconciliation Tracker */}
                        {syncing ? (
                            <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-3xl flex items-center justify-center gap-3 text-indigo-600 animate-pulse">
                                <RefreshCw className="animate-spin" size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Syncing with Institutional Ledgers...</span>
                            </div>
                        ) : syncError ? (
                            <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-3 text-amber-700 text-left">
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Reconciliation Pending</p>
                                    <p className="text-[10px] font-medium leading-relaxed opacity-90 mt-1">{syncError}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 bg-emerald-50/60 border border-emerald-100 rounded-3xl flex items-center justify-center gap-3 text-emerald-700">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Double-Entry Journals Balanced & Closed</span>
                            </div>
                        )}

                        {/* Transaction Receipt Details */}
                        <div className="bg-slate-50 rounded-[2rem] p-8 text-left space-y-4 border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200/60 pb-3">Official Transaction Summary</h4>
                            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase block">Transaction Reference</span>
                                    <span className="font-mono mt-0.5 text-[11px] text-slate-800 break-all">{reference}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase block">Settled Date</span>
                                    <span className="mt-0.5 text-slate-800">{new Date().toLocaleDateString()}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase block">Payment Method</span>
                                    <span className="mt-0.5 text-slate-800">Online Gateway (API)</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase block">Amount Paid</span>
                                    <span className="mt-0.5 text-slate-900 font-black text-sm">${amount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Print / Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={handlePrint}
                                className="flex-1 py-4 bg-slate-950 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
                            >
                                <Printer size={15} />
                                Print Receipt
                            </button>
                            <button
                                onClick={() => navigate('/accounting/hub')}
                                className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-slate-800 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={15} />
                                Back to Portal
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 relative z-10">
                        {/* Failure Graphic */}
                        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                            <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-pulse" />
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 relative z-10 border border-rose-100 shadow-lg shadow-rose-50">
                                <XCircle size={44} />
                            </div>
                        </div>

                        {/* Failure Messages */}
                        <div className="space-y-3">
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Transaction Interrupted</h2>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Bank Authentication Failure</p>
                        </div>

                        {/* Failure Details */}
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left text-xs font-medium text-slate-500 leading-relaxed space-y-4">
                            <p>
                                Your financial institution was unable to complete this payment authorization. No funds have been debited from your account.
                            </p>
                            <div className="border-t border-slate-200/60 pt-4 flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                                <span>Error reference</span>
                                <span className="font-mono text-slate-600">{reference}</span>
                            </div>
                        </div>

                        {/* Retry Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={15} />
                                Retry Payment
                            </button>
                            <button
                                onClick={() => navigate('/accounting/hub')}
                                className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-slate-800 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                            >
                                Back to Portal
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
