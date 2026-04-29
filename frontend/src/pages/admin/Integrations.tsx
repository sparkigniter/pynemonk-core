import { useState, useEffect } from 'react';
import { Zap, ShieldCheck, AlertCircle, ArrowRight, RefreshCw, CheckCircle2, Search, Power, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAvailableIntegrations, getIntegrationHealth, downloadIntegrationExport, toggleIntegration } from '../../api/integration.api';
import type { IntegrationManifest, IntegrationHealth } from '../../api/integration.api';

export default function Integrations() {
    const { user } = useAuth();
    const [available, setAvailable] = useState<IntegrationManifest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
    const [health, setHealth] = useState<IntegrationHealth | null>(null);
    const [healthLoading, setHealthLoading] = useState(false);

    useEffect(() => {
        fetchIntegrations();
    }, [user?.tenant_id]);

    const fetchIntegrations = async () => {
        try {
            const data = await getAvailableIntegrations(user?.tenant_id);
            setAvailable(data);
            if (data.length > 0) {
                handleSelect(data[0].slug);
            }
        } catch (error) {
            console.error('Failed to load integrations', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (slug: string) => {
        setSelectedSlug(slug);
        setHealthLoading(true);
        try {
            const data = await getIntegrationHealth(slug, user?.tenant_id);
            setHealth(data);
        } catch (error) {
            console.error(error);
        } finally {
            setHealthLoading(false);
        }
    };

    const currentIntegration = available.find(a => a.slug === selectedSlug);

    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (!selectedSlug) return;
        setIsExporting(true);
        try {
            await downloadIntegrationExport(selectedSlug, 'export_students', {
                tenantId: user?.tenant_id,
            });
        } catch (error) {
            console.error('Failed to generate export', error);
            alert('Failed to generate export. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleToggle = async () => {
        if (!selectedSlug || !currentIntegration) return;
        const newStatus = !currentIntegration.isEnabled;
        try {
            await toggleIntegration(selectedSlug, newStatus, user?.tenant_id);
            setAvailable(prev => prev.map(a =>
                a.slug === selectedSlug ? { ...a, isEnabled: newStatus } : a
            ));
        } catch (error) {
            alert('Failed to update integration status');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="text-2xl font-bold text-slate-900 font-heading">Integration Hub</h1>
                <p className="text-sm text-slate-500 mt-1">Connect Pynemonk with government portals and third-party systems.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Available Integrations List */}
                <div className="lg:col-span-4 space-y-4 animate-fade-in-up delay-100">
                    <div className="card p-4">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search integrations..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            {available.map((item) => {
                                const isActive = selectedSlug === item.slug;
                                return (
                                    <button
                                        key={item.slug}
                                        onClick={() => handleSelect(item.slug)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left
                                            ${isActive ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-slate-50 border border-transparent'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                                            ${isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            <Zap size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold truncate ${isActive ? 'text-primary' : 'text-slate-900'}`}>{item.name}</p>
                                            <p className="text-[10px] text-slate-500 truncate">{item.description}</p>
                                        </div>
                                        {isActive && <ArrowRight size={14} className="text-primary" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="card p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <ShieldCheck size={16} className="text-emerald-400" />
                                Custom Plugins
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                                Need an integration for your state? Our plugin architecture allows for easy extension to any third-party software.
                            </p>
                            <button className="mt-4 text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors">
                                Developer Documentation →
                            </button>
                        </div>
                        <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 rotate-12" />
                    </div>
                </div>

                {/* Integration Details & Sync Dashboard */}
                <div className="lg:col-span-8 space-y-6 animate-fade-in-up delay-150">
                    {selectedSlug ? (
                        <>
                            {/* Header Info */}
                            <div className="card p-6 flex flex-col md:flex-row md:items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Zap size={32} className="text-primary" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-slate-900 font-heading">{currentIntegration?.name}</h2>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentIntegration?.isEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {currentIntegration?.isEnabled ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">{currentIntegration?.description}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={handleToggle}
                                        className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover-lift
                                            ${currentIntegration?.isEnabled
                                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                : 'bg-emerald-500 text-white shadow-lg hover:opacity-90'}`}
                                    >
                                        <Power size={16} />
                                        {currentIntegration?.isEnabled ? 'Disable' : 'Enable'}
                                    </button>
                                    {currentIntegration?.isEnabled && (
                                        <button
                                            onClick={handleExport}
                                            disabled={isExporting}
                                            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg hover:opacity-90 transition-all hover-lift disabled:opacity-60"
                                        >
                                            {isExporting ? <RefreshCw size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                                            {isExporting ? 'Exporting…' : 'Export to Excel'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Health Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="card p-5 border-l-4 border-l-primary">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
                                    <div className="flex items-end gap-2 mt-2">
                                        <p className="text-2xl font-black text-slate-900 leading-none">{health?.total || 0}</p>
                                        <span className="text-[10px] text-slate-400 mb-1">In current year</span>
                                    </div>
                                </div>
                                <div className="card p-5 border-l-4 border-l-emerald-500">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mapped Identities</p>
                                    <div className="flex items-end gap-2 mt-2">
                                        <p className="text-2xl font-black text-slate-900 leading-none">{health?.mapped || 0}</p>
                                        <span className="text-[10px] text-emerald-500 mb-1 font-bold">{(health?.mapped && health?.total) ? Math.round((health.mapped / health.total) * 100) : 0}% Complete</span>
                                    </div>
                                </div>
                                <div className="card p-5 border-l-4 border-l-amber-500">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Missing SATS IDs</p>
                                    <div className="flex items-end gap-2 mt-2">
                                        <p className="text-2xl font-black text-slate-900 leading-none">{health?.unmapped || 0}</p>
                                        <button className="text-[10px] text-primary mb-1 font-bold hover:underline">Fix Errors →</button>
                                    </div>
                                </div>
                            </div>

                            {/* Validation Errors List */}
                            <div className="card overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <AlertCircle size={16} className="text-amber-500" />
                                        Data Completeness Check
                                    </h3>
                                    <button className="text-xs font-bold text-primary hover:bg-primary/5 px-2 py-1 rounded-lg transition-colors">
                                        Refresh Check
                                    </button>
                                </div>
                                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                                    {healthLoading ? (
                                        <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                                            <RefreshCw className="w-6 h-6 animate-spin" />
                                            <p className="text-xs font-medium">Analyzing data health...</p>
                                        </div>
                                    ) : health?.validationErrors && health.validationErrors.length > 0 ? (
                                        health.validationErrors.map((error, idx) => (
                                            <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                                                        <AlertCircle size={14} className="text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{error.entityName}</p>
                                                        <p className="text-xs text-slate-500">{error.message}</p>
                                                    </div>
                                                </div>
                                                <button className="text-xs font-semibold text-primary px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all">
                                                    Edit Profile
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                                            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-800">All Clear!</p>
                                            <p className="text-xs max-w-xs text-center">Your data meets all mandatory requirements for this integration.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-center">
                                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                                        View All Issues
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="card flex flex-col items-center justify-center p-12 text-center h-full min-h-[500px]">
                            <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
                                <Zap size={40} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 font-heading">
                                {available.length === 0 ? "Select a School First" : "Select an Integration"}
                            </h2>
                            <p className="text-sm text-slate-400 mt-2 max-w-sm">
                                {available.length === 0
                                    ? "You are currently in Global Admin mode. Integrations are managed per-school. Please select a school from the switcher in the sidebar to continue."
                                    : "Choose a government portal or third-party system from the left to manage sync and data health."}
                            </p>
                            {available.length === 0 && (
                                <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3 text-left">
                                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">Why am I seeing this?</p>
                                        <p className="text-[11px] text-amber-700/80 mt-1 leading-relaxed">
                                            Integrations like SATS and SARAL require school-specific credentials and data mapping. Switch to a specific school context to configure them.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
