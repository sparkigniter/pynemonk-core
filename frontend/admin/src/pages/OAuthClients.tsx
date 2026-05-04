import React, { useEffect, useState } from 'react';
import * as authApi from '../api/auth.api';
import {
    Shield, Plus, RefreshCw, Globe, Key,
    Layers, CheckCircle2, Info, ArrowRight, Lock, Search, Trash2,
    Eye, Settings, AlertTriangle, UserCheck, XCircle, ChevronRight, Zap,
    Copy, ExternalLink, Fingerprint, Wand2, CheckSquare, Square, Circle, CheckCircle,
    User, Cpu, Sparkles
} from 'lucide-react';

type TabType = 'clients' | 'roles' | 'scopes';

const OAuthClients: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('clients');
    const [loading, setLoading] = useState(true);

    // Data states
    const [clients, setClients] = useState<authApi.OauthClient[]>([]);
    const [scopes, setScopes] = useState<authApi.OauthScope[]>([]);
    const [roles, setRoles] = useState<authApi.OauthRole[]>([]);
    const [roleScopes, setRoleScopes] = useState<authApi.RoleScope[]>([]);
    const [clientScopes, setClientScopes] = useState<authApi.ClientScope[]>([]);
    const [clientRoles, setClientRoles] = useState<authApi.ClientRole[]>([]);

    // UI states
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSecret, setShowSecret] = useState(false);

    // Context State: 'role' or 'client' (machine)
    const [managementContext, setManagementContext] = useState<'client' | 'role'>('role');

    const fetchData = async () => {
        setLoading(true);
        try {
            const targetClient = clients.find(c => c.id === selectedClientId);
            const clientContextId = activeTab === 'clients' ? targetClient?.client_id : undefined;

            const [clientsData, scopesData, rolesData, roleScopesData, clientScopesData, clientRolesData] = await Promise.all([
                authApi.getOAuthClients(),
                authApi.getScopes(),
                authApi.getRoles(clientContextId),
                authApi.getRoleScopes(clientContextId),
                authApi.getClientScopes(),
                authApi.getClientRoles()
            ]);
            setClients(clientsData);
            setScopes(scopesData);
            setRoles(rolesData);
            setRoleScopes(roleScopesData);
            setClientScopes(clientScopesData);
            setClientRoles(clientRolesData);

            if (rolesData.length > 0 && activeTab === 'roles' && !selectedRoleId) {
                setSelectedRoleId(rolesData[0].id);
            }
            if (clientsData.length > 0 && activeTab === 'clients' && !selectedClientId) {
                setSelectedClientId(clientsData[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch OAuth data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab, selectedClientId]);

    const handleSetClientRole = async (clientId: number, roleId: number) => {
        try {
            const existingRoles = clientRoles.filter(cr => cr.client_id === clientId);
            for (const er of existingRoles) {
                await authApi.removeClientRole(clientId, er.role_id);
            }
            await authApi.assignClientRole(clientId, roleId);
            setManagementContext('role');
            setSelectedRoleId(roleId);
            fetchData();
        } catch (error) {
            alert('Failed to update client role');
        }
    };

    const handleBulkAction = async (action: 'grant' | 'revoke', forcedRoleId?: number) => {
        const targetRoleId = forcedRoleId || selectedRoleId;
        const targetClient = clients.find(c => c.id === selectedClientId);
        
        if (managementContext === 'role' || activeTab === 'roles') {
            if (!targetRoleId) return;
            const roleName = roles.find(r => r.id === targetRoleId)?.name;
            const contextMsg = targetClient ? `for the ${targetClient.client_name} app` : 'globally';
            
            if (!confirm(`Are you sure you want to ${action} ALL permissions for the ${roleName} role ${contextMsg}?`)) return;
            
            try {
                if (action === 'grant') {
                    await authApi.bulkGrantRoleScopes(targetRoleId, targetClient?.client_id);
                } else {
                    await authApi.bulkRevokeRoleScopes(targetRoleId, targetClient?.client_id);
                }
                fetchData();
            } catch (e) { alert('Action failed'); }
        } else {
            if (!selectedClientId) return;
            if (!confirm(`Are you sure you want to ${action} ALL service scopes for this app?`)) return;
            try {
                if (action === 'grant') await authApi.bulkGrantClientScopes(selectedClientId);
                else await authApi.bulkRevokeClientScopes(selectedClientId);
                fetchData();
            } catch (e) { alert('Action failed'); }
        }
    };

    const handleScopeToggle = async (scopeId: number, isAssigned: boolean, forcedRoleId?: number) => {
        const targetRoleId = forcedRoleId || selectedRoleId;
        const targetClient = clients.find(c => c.id === selectedClientId);
        
        try {
            if (managementContext === 'role' || activeTab === 'roles') {
                if (!targetRoleId) return;
                if (isAssigned) {
                    await authApi.removeRoleScope(targetRoleId, scopeId, targetClient?.client_id);
                } else {
                    await authApi.assignRoleScope(targetRoleId, scopeId, targetClient?.client_id);
                }
            } else {
                if (!selectedClientId) return;
                if (isAssigned) await authApi.removeClientScope(selectedClientId, scopeId);
                else await authApi.assignClientScope(selectedClientId, scopeId);
            }
            fetchData();
        } catch (e) { alert('Toggle failed'); }
    };

    const handleSyncWithTemplate = async () => {
        const targetRoleId = selectedRoleId;
        if (!targetRoleId) return;
        
        const role = roles.find(r => r.id === targetRoleId);
        if (!role) return;

        const targetClient = clients.find(c => c.id === selectedClientId);
        const contextMsg = targetClient ? `for the ${targetClient.client_name} app` : 'globally';

        if (!confirm(`Sync ${role.name} permissions with the platform template ${contextMsg}? This will overwrite current permissions.`)) return;
        
        try {
            await authApi.syncRoleWithTemplate(targetRoleId, targetClient?.client_id);
            fetchData();
        } catch (e) { alert('Sync failed'); }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    if (loading) return <div className="p-12 text-slate-400">Loading Access Matrix...</div>;

    const selectedClient = clients.find(c => c.id === selectedClientId);
    const assignedRoleForClient = clientRoles.find(cr => cr.client_id === selectedClientId);
    const activeRoleInClientContext = roles.find(r => r.id === (selectedRoleId || assignedRoleForClient?.role_id));

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Lock className="text-indigo-600" size={24} />
                        Identity & Access Management
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-black text-[10px]">
                        Priority-Based RBAC System
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                {[
                    { id: 'clients', label: 'OAuth Clients & Apps', icon: Layers, desc: 'Provision apps and override role permissions' },
                    { id: 'roles', label: 'Role Templates', icon: Shield, desc: 'Manage global permission standards' },
                    { id: 'scopes', label: 'Global Registry', icon: Key, desc: 'System-wide scope definitions' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id as TabType);
                            if (tab.id === 'roles' && !selectedRoleId) setSelectedRoleId(roles[0]?.id);
                            if (tab.id === 'clients' && !selectedClientId) setSelectedClientId(clients[0]?.id);
                        }}
                        className={`flex flex-col gap-1 pb-4 px-2 text-left transition-all relative group
                            ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className="flex items-center gap-2">
                            <tab.icon size={16} />
                            <span className="text-sm font-bold">{tab.label}</span>
                        </div>
                        <span className="text-[10px] opacity-60 font-medium group-hover:opacity-100 transition-opacity">{tab.desc}</span>
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full shadow-[0_-2px_8px_rgba(79,70,229,0.4)]" />
                        )}
                    </button>
                ))}
            </div>

            {activeTab === 'clients' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in slide-in-from-bottom-2 duration-300">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-[2rem] p-4 shadow-sm">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">OAuth Clients</h3>
                            <div className="space-y-1">
                                {clients.map((client) => (
                                    <button
                                        key={client.id}
                                        onClick={() => { setSelectedClientId(client.id); setManagementContext('role'); }}
                                        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left group
                                            ${selectedClientId === client.id ? 'bg-indigo-50 ring-1 ring-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                                            ${selectedClientId === client.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                            <Globe size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold truncate ${selectedClientId === client.id ? 'text-indigo-900' : 'text-slate-900'}`}>{client.client_name}</p>
                                            <p className={`text-[10px] font-mono truncate ${selectedClientId === client.id ? 'text-indigo-400' : 'text-slate-400'}`}>{client.client_id}</p>
                                        </div>
                                        {selectedClientId === client.id && <ChevronRight size={14} className="text-indigo-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedClientId && (
                            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Role</h4>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">ACTIVE ROLE</span>
                                </div>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {roles.map(role => {
                                        const isAssigned = clientRoles.some(cr => cr.client_id === selectedClientId && cr.role_id === role.id);
                                        return (
                                            <button
                                                key={role.id}
                                                onClick={() => { handleSetClientRole(selectedClientId, role.id); }}
                                                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left
                                                    ${isAssigned ? 'bg-indigo-900 border-indigo-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {isAssigned ? <CheckCircle size={16} className="text-indigo-400" /> : <Circle size={16} className="text-slate-300" />}
                                                    <span className="text-xs font-bold">{role.name}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-8 space-y-6">
                        {selectedClient ? (
                            <>
                                <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-8 border-l-4 border-l-indigo-600">
                                    <div className="flex items-start justify-between mb-8">
                                        <div>
                                            <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                                <Fingerprint size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">OAuth Credentials</span>
                                            </div>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedClient.client_name}</h2>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client ID</label>
                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                                                <code className="text-xs font-mono text-slate-700 flex-1">{selectedClient.client_id}</code>
                                                <button onClick={() => copyToClipboard(selectedClient.client_id)} className="text-slate-400 hover:text-indigo-600"><Copy size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Secret</label>
                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                                                <code className="text-xs font-mono text-slate-700 flex-1">{showSecret ? selectedClient.client_secret : '••••••••••••••••'}</code>
                                                <button onClick={() => setShowSecret(!showSecret)} className="text-slate-400 hover:text-indigo-600 mr-1">
                                                    {showSecret ? <XCircle size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button onClick={() => copyToClipboard(selectedClient.client_secret)} className="text-slate-400 hover:text-indigo-600"><Copy size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden border-t-4 border-t-indigo-600">
                                    <div className="px-8 py-8 border-b border-slate-100 bg-slate-50/50">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                                    {managementContext === 'role' ? <Shield className="text-indigo-600" size={20} /> : <Cpu className="text-indigo-600" size={20} />}
                                                    {managementContext === 'role' ? `Permissions for ${activeRoleInClientContext?.name}` : 'Service-to-Service Scopes'}
                                                </h2>
                                                <p className="text-xs text-slate-500 mt-2 italic leading-relaxed">
                                                    {managementContext === 'role'
                                                        ? `Manage the specific permissions granted to the ${activeRoleInClientContext?.name} role for this app.`
                                                        : 'Manage scopes granted directly to this client ID (no user context).'}
                                                </p>
                                            </div>

                                            <div className="flex items-center p-1 bg-slate-200 rounded-2xl">
                                                <button onClick={() => setManagementContext('role')} className={`px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2 transition-all ${managementContext === 'role' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                                                    <User size={12} /> User Role
                                                </button>
                                                <button onClick={() => setManagementContext('client')} className={`px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2 transition-all ${managementContext === 'client' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                                                    <Cpu size={12} /> Service
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-slate-200/50">
                                            <button onClick={() => handleBulkAction('grant')} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[11px] font-bold hover:bg-indigo-600 shadow-lg transition-all">
                                                <CheckSquare size={14} /> Grant All
                                            </button>
                                            <button onClick={() => handleBulkAction('revoke')} className="flex items-center gap-2 bg-white border border-slate-200 text-rose-500 px-5 py-2.5 rounded-xl text-[11px] font-bold hover:bg-rose-50 shadow-sm transition-all">
                                                <Trash2 size={14} /> Revoke All
                                            </button>
                                            {managementContext === 'role' && (
                                                <button onClick={handleSyncWithTemplate} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-xl text-[11px] font-bold hover:bg-indigo-100 transition-all border border-indigo-100">
                                                    <Wand2 size={14} /> Sync Template
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {scopes.filter(s => s.value.toLowerCase().includes(searchQuery.toLowerCase())).map((scope) => {
                                            const isAssigned = managementContext === 'role'
                                                ? roleScopes.some(rs => rs.role_id === activeRoleInClientContext?.id && rs.scope_id === scope.id)
                                                : clientScopes.some(cs => cs.client_id === selectedClientId && cs.scope_id === scope.id);
                                            return (
                                                <div key={scope.id} className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between ${isAssigned ? 'border-indigo-100 bg-indigo-50/10' : 'border-slate-50 bg-white opacity-60'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAssigned ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                                            <Zap size={16} />
                                                        </div>
                                                        <div>
                                                            <p className={`text-xs font-bold font-mono ${isAssigned ? 'text-indigo-900' : 'text-slate-700'}`}>{scope.value}</p>
                                                            <p className="text-[10px] text-slate-400 leading-tight">{scope.description}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleScopeToggle(scope.id, isAssigned)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${isAssigned ? 'text-rose-500 hover:bg-rose-50' : 'text-indigo-600 hover:bg-indigo-50'}`}>
                                                        {isAssigned ? 'Remove' : 'Add'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-20 text-center text-slate-400">
                                <Layers size={64} className="mx-auto mb-6 opacity-10" />
                                <p className="font-medium">Select a client to manage access.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'roles' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in slide-in-from-bottom-2 duration-300">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-[2rem] p-4 shadow-sm">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">Role Templates</h3>
                            <div className="space-y-1">
                                {roles.map((role) => (
                                    <button
                                        key={role.id}
                                        onClick={() => setSelectedRoleId(role.id)}
                                        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left group
                                            ${selectedRoleId === role.id ? 'bg-emerald-600 text-white shadow-xl ring-4 ring-emerald-50' : 'hover:bg-slate-50 text-slate-600'}`}
                                    >
                                        <Shield size={18} className={selectedRoleId === role.id ? 'text-emerald-200' : 'text-slate-400'} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{role.name}</p>
                                            <p className={`text-[10px] font-mono truncate ${selectedRoleId === role.id ? 'text-emerald-300' : 'text-slate-400'}`}>{role.slug}</p>
                                        </div>
                                        {selectedRoleId === role.id && <ArrowRight size={14} className="text-white" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-6">
                        {selectedRoleId ? (
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden border-t-4 border-t-emerald-500">
                                <div className="px-8 py-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                            <Sparkles size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Global Standard Template</span>
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                            {roles.find(r => r.id === selectedRoleId)?.name} Template
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-2 max-w-xl leading-relaxed">
                                            Any changes here define the **Global Default** for this role. Use this to maintain platform-wide standards.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={handleSyncWithTemplate}
                                            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-bold hover:bg-emerald-700 shadow-lg transition-all"
                                        >
                                            <RefreshCw size={14} /> Reset to System Default
                                        </button>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleBulkAction('grant')} className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-slate-800 shadow-sm transition-all">
                                                <CheckSquare size={14} /> Grant All
                                            </button>
                                            <button onClick={() => handleBulkAction('revoke')} className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-rose-500 px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-rose-50 shadow-sm transition-all">
                                                <Trash2 size={14} /> Revoke All
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {scopes.filter(s => s.value.toLowerCase().includes(searchQuery.toLowerCase())).map((scope) => {
                                        const isAssigned = roleScopes.some(rs => rs.role_id === selectedRoleId && rs.scope_id === scope.id);
                                        return (
                                            <div key={scope.id} className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between ${isAssigned ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-50 bg-white opacity-60'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAssigned ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                                        <Key size={16} />
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs font-bold font-mono ${isAssigned ? 'text-emerald-900' : 'text-slate-700'}`}>{scope.value}</p>
                                                        <p className="text-[10px] text-slate-400 leading-tight">{scope.description}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleScopeToggle(scope.id, isAssigned)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${isAssigned ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                                                    {isAssigned ? 'Remove' : 'Add'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-20 text-center text-slate-400">
                                <Shield size={64} className="mx-auto mb-6 opacity-10" />
                                <p className="font-medium">Select a role to manage its global template.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'scopes' && (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden p-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Key size={20} className="text-indigo-600" />
                        System-Wide Scopes Registry
                    </h3>
                    <div className="divide-y divide-slate-100">
                        {scopes.map((scope) => (
                            <div key={scope.id} className="py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400"><Key size={18} /></div>
                                    <div><p className="text-sm font-bold text-slate-900 font-mono">{scope.value}</p><p className="text-xs text-slate-500">{scope.description}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OAuthClients;
