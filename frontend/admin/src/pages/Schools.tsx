import React, { useEffect, useState } from 'react';
import * as authApi from '../api/auth.api';
import * as integrationApi from '../api/integration.api';
import { School, Search, ChevronRight, Zap, ShieldCheck, Power, RefreshCw, X, AlertCircle } from 'lucide-react';

const Schools: React.FC = () => {
    const [schools, setSchools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedSchool, setSelectedSchool] = useState<any | null>(null);
    const [integrations, setIntegrations] = useState<integrationApi.IntegrationManifest[]>([]);
    const [intLoading, setIntLoading] = useState(false);

    const fetchSchools = async () => {
        setLoading(true);
        try {
            const data = await authApi.getTenants();
            setSchools(data);
        } catch (err) {
            console.error('Failed to fetch schools', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchIntegrations = async (tenantId: number) => {
        setIntLoading(true);
        try {
            const data = await integrationApi.getAvailableIntegrations(tenantId);
            setIntegrations(data);
        } catch (err) {
            console.error('Failed to fetch integrations', err);
        } finally {
            setIntLoading(false);
        }
    };

    useEffect(() => {
        fetchSchools();
    }, []);

    useEffect(() => {
        if (selectedSchool) {
            fetchIntegrations(selectedSchool.id);
        }
    }, [selectedSchool]);

    const handleToggle = async (slug: string, currentStatus: boolean) => {
        if (!selectedSchool) return;
        try {
            await integrationApi.toggleIntegration(slug, !currentStatus, selectedSchool.id);
            setIntegrations(prev => prev.map(i => i.slug === slug ? { ...i, isEnabled: !currentStatus } : i));
        } catch (err) {
            alert('Failed to update integration status');
        }
    };

    const filteredSchools = schools.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.slug.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-4">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <p className="font-bold uppercase tracking-widest text-xs">Loading Schools...</p>
        </div>
    );

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* School List */}
                <div className="w-full lg:w-96 flex-shrink-0 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search schools..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                        />
                    </div>

                    <div className="space-y-3">
                        {filteredSchools.map(school => (
                            <button
                                key={school.id}
                                onClick={() => setSelectedSchool(school)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left
                                    ${selectedSchool?.id === school.id 
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                                        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                        ${selectedSchool?.id === school.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                                        <School size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold leading-tight truncate">{school.name}</p>
                                        <p className="text-[10px] opacity-60 font-mono tracking-wider truncate">{school.slug}</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className={`transition-transform shrink-0 ${selectedSchool?.id === school.id ? 'rotate-90 text-indigo-600' : 'text-slate-300'}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* School Detail / Integration Management */}
                <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-8 min-h-[600px] shadow-xl shadow-slate-200/50">
                    {selectedSchool ? (
                        <div className="space-y-8">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-inner">
                                        <School size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">{selectedSchool.name}</h2>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                {selectedSchool.package_name}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                                <ShieldCheck size={12} />
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors" onClick={() => setSelectedSchool(null)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <h3 className="text-lg font-bold text-slate-800">Integration Plugins</h3>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Provisioning Control</p>
                                </div>

                                {intLoading ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                                        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Fetching Config...</p>
                                    </div>
                                ) : integrations.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {integrations.map(integration => (
                                            <div 
                                                key={integration.slug}
                                                className={`p-5 rounded-2xl border transition-all flex items-center justify-between
                                                    ${integration.isEnabled ? 'bg-white border-emerald-100 shadow-sm' : 'bg-slate-50/50 border-slate-100 grayscale-[0.5]'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                                                        ${integration.isEnabled ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-400'}`}>
                                                        <Zap size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{integration.name}</p>
                                                        <p className="text-[11px] text-slate-500 line-clamp-1">{integration.description}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleToggle(integration.slug, !!integration.isEnabled)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                                        ${integration.isEnabled 
                                                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white' 
                                                            : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700'}`}
                                                >
                                                    <Power size={14} />
                                                    {integration.isEnabled ? 'Disable' : 'Enable'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                                            <AlertCircle size={32} />
                                        </div>
                                        <p className="text-slate-400 text-sm">No integration plugins found for this school.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[500px] flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-4 rotate-12">
                                <School size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Select a School</h3>
                                <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">
                                    Choose a school from the left to manage its plugins, configurations, and platform status.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Schools;
