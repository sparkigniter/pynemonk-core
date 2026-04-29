import React, { useEffect, useState } from 'react';
import * as authApi from '../api/auth.api';
import { Layers, Shield, Plus, Power, RefreshCw, X, Check, Search, Globe, Key } from 'lucide-react';

const OAuthClients: React.FC = () => {
    const [clients, setClients] = useState<authApi.OauthClient[]>([]);
    const [scopes, setScopes] = useState<authApi.OauthScope[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [formData, setFormData] = useState({
        client_name: '',
        client_id: '',
        client_secret: '',
        redirect_uris: '',
        grant_types: ['authorization_code', 'refresh_token']
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [clientsData, scopesData] = await Promise.all([
                authApi.getOAuthClients(),
                authApi.getScopes()
            ]);
            setClients(clientsData);
            setScopes(scopesData);
        } catch (error) {
            console.error('Failed to fetch clients', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authApi.createClient({
                ...formData,
                redirect_uris: formData.redirect_uris.split(',').map(s => s.trim())
            });
            setShowNewModal(false);
            fetchData();
        } catch (error) {
            alert('Failed to create client');
        }
    };

    if (loading) return <div className="p-12 text-slate-400">Loading clients...</div>;

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">OAuth2 Clients</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage applications authorized to access the Pynemonk API.</p>
                </div>
                <button 
                    onClick={() => setShowNewModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    Register New Client
                </button>
            </div>

            {/* Clients Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {clients.map(client => (
                    <div key={client.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{client.client_name}</h3>
                                    <p className="text-xs font-mono text-slate-400 mt-0.5">{client.client_id}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${client.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                {client.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Allowed Grant Types</p>
                                <div className="flex flex-wrap gap-2">
                                    {client.grant_types?.map(gt => (
                                        <span key={gt} className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                                            {gt}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Redirect URIs</p>
                                <div className="space-y-1">
                                    {client.redirect_uris?.map(uri => (
                                        <div key={uri} className="text-xs text-indigo-600 font-medium truncate flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-indigo-400" />
                                            {uri}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                            <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2">
                                <RefreshCw size={14} />
                                Rotate Secret
                            </button>
                            <button className="text-xs font-bold text-indigo-600 hover:underline">
                                Manage Scopes →
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Scopes Catalogue Sidebar (Optional View) */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                        <Shield size={20} className="text-indigo-400" />
                        Available Scopes Catalogue
                    </h3>
                    <p className="text-slate-400 text-sm mb-6 max-w-2xl">These are the permissions clients can request during the OAuth2 handshake. All scopes must be registered here before they can be assigned to clients or roles.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {scopes.map(scope => (
                            <div key={scope.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                                <p className="text-xs font-mono text-indigo-400 font-bold">{scope.value}</p>
                                <p className="text-[10px] text-white/50 mt-1 leading-relaxed">{scope.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Shield size={200} />
                </div>
            </div>

            {/* New Client Modal */}
            {showNewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowNewModal(false)} />
                    <div className="relative bg-white rounded-[2.5rem] p-10 w-full max-w-xl shadow-2xl animate-scale-in">
                        <h3 className="text-2xl font-bold text-slate-900 mb-6">Register OAuth2 Client</h3>
                        <form onSubmit={handleCreate} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Client Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                    value={formData.client_name}
                                    onChange={e => setFormData({...formData, client_name: e.target.value})}
                                    placeholder="e.g. Mobile App"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Client ID</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                    value={formData.client_id}
                                    onChange={e => setFormData({...formData, client_id: e.target.value})}
                                    placeholder="mobile_app_prod"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Redirect URIs (comma separated)</label>
                                <input 
                                    type="text" 
                                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                    value={formData.redirect_uris}
                                    onChange={e => setFormData({...formData, redirect_uris: e.target.value})}
                                    placeholder="https://app.example.com/callback"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setShowNewModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                                >
                                    Register Client
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OAuthClients;
