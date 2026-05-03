import { useState, useEffect, useMemo } from 'react';
import {
    Plus, Layers, CheckCircle2, Search, ChevronRight, GraduationCap,
    Landmark, UserCheck, AppWindow, ArrowRight, ChevronLeft, Target, Zap,
    History as HistoryIcon, AlertCircle, X, Lock as LockIcon
} from 'lucide-react';
import * as authApi from '../../api/auth.api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const BASE = (import.meta as any).env?.VITE_AUTH_API_URL ?? 'http://localhost:3000';

type View = 'CLIENT_LIST' | 'CLIENT_EDIT';

export default function IAM() {
    const { notify } = useNotification();
    const { accessToken: token } = useAuth();

    const [view, setView] = useState<View>('CLIENT_LIST');
    const [clients, setClients] = useState<authApi.OauthClient[]>([]);
    const [scopes, setScopes] = useState<authApi.OauthScope[]>([]);
    const [roles, setRoles] = useState<authApi.OauthRole[]>([]);
    const [roleScopes, setRoleScopes] = useState<authApi.RoleScope[]>([]);

    const [activeClientId, setActiveClientId] = useState<string>('');   // oauth client_id string
    const [activeRoleId, setActiveRoleId] = useState<number | null>(null);

    const [isBooting, setIsBooting] = useState(true);
    const [isBusy, setIsBusy] = useState(false);
    const [isLoadingRoleScopes, setIsLoadingRoleScopes] = useState(false);

    const [clientSearch, setClientSearch] = useState('');
    const [roleSearch, setRoleSearch] = useState('');
    const [showCreateRole, setShowCreateRole] = useState(false);
    const [newRole, setNewRole] = useState({ name: '', slug: '', description: '' });

    // ── Boot: load clients + scopes once ─────────────────────────────────────
    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                setIsBooting(true);
                const [c, s] = await Promise.all([authApi.getClients(token), authApi.getScopes(token)]);
                setClients(c);
                setScopes(s);
            } catch {
                notify('error', 'Boot Error', 'Could not load security metadata.');
            } finally {
                setIsBooting(false);
            }
        })();
    }, [token]);

    // ── Load roles for a client (explicit, no race) ───────────────────────────
    const loadRoles = async (clientId: string): Promise<authApi.OauthRole[]> => {
        if (!token || !clientId) return [];
        console.log(`[IAM] loadRoles fetching for clientId: ${clientId}`);
        const res = await fetch(`${BASE}/api/v1/oauth2/role?clientId=${clientId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        console.log(`[IAM] loadRoles response:`, json);
        return json.data || [];
    };

    // ── Load scopes assigned to a (client, role) pair ─────────────────────────
    const loadRoleScopes = async (clientId: string, roleId: number) => {
        if (!token || !clientId || !roleId) return;
        setIsLoadingRoleScopes(true);
        try {
            const url = new URL(`${BASE}/api/v1/oauth2/role-scope`);
            url.searchParams.set('clientId', clientId);
            url.searchParams.set('roleId', String(roleId));
            const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            setRoleScopes(json.data || []);
        } catch {
            console.error('loadRoleScopes failed');
        } finally {
            setIsLoadingRoleScopes(false);
        }
    };

    // ── Navigate INTO a client — reset everything synchronously ───────────────
    const enterClient = async (clientId: string) => {
        setActiveClientId(clientId);
        setActiveRoleId(null);
        setRoleScopes([]);
        setRoles([]);
        setView('CLIENT_EDIT');

        const loaded = await loadRoles(clientId);
        setRoles(loaded);
        if (loaded.length > 0) {
            setActiveRoleId(loaded[0].id);
            await loadRoleScopes(clientId, loaded[0].id);
        }
    };

    // ── Select a role within the current client ───────────────────────────────
    const selectRole = async (roleId: number) => {
        setActiveRoleId(roleId);
        setRoleScopes([]);
        await loadRoleScopes(activeClientId, roleId);
    };

    // ── Go back to client list ────────────────────────────────────────────────
    const goBack = () => {
        setView('CLIENT_LIST');
        setActiveClientId('');
        setActiveRoleId(null);
        setRoles([]);
        setRoleScopes([]);
    };

    // ── Toggle a single scope ─────────────────────────────────────────────────
    const toggleScope = async (scopeId: number, granted: boolean) => {
        if (!activeRoleId || !activeClientId || !token) return;
        setIsBusy(true);
        try {
            if (granted) {
                await authApi.removeRoleScope(token, activeRoleId, scopeId, activeClientId);
                notify('warning', 'Scope Revoked', 'Permission removed.');
            } else {
                const res = await fetch(`${BASE}/api/v1/oauth2/role-scope`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role_id: activeRoleId, scope_id: scopeId, clientId: activeClientId })
                });
                if (!res.ok) throw new Error('Assign failed');
                notify('success', 'Scope Granted', 'Permission enabled.');
            }
            await loadRoleScopes(activeClientId, activeRoleId);
        } catch (err: any) {
            notify('error', 'Failed', err.message);
        } finally {
            setIsBusy(false);
        }
    };

    // ── Bulk actions ──────────────────────────────────────────────────────────
    const handleBulk = async (action: 'GRANT' | 'REVOKE' | 'SYNC' | 'PRESET_TEACHER' | 'PRESET_ACADEMIC' | 'PRESET_FINANCE') => {
        if (!activeRoleId || !activeClientId || !token) {
            notify('error', 'No Context', 'Please select a role first.');
            return;
        }
        setIsBusy(true);
        try {
            if (action === 'GRANT') {
                await authApi.bulkGrantRoleScopes(token, activeRoleId, activeClientId);
                notify('success', 'Grant All', 'All scopes granted for this app context.');
            } else if (action === 'REVOKE') {
                await authApi.bulkRevokeRoleScopes(token, activeRoleId, activeClientId);
                notify('warning', 'Revoke All', 'All scopes revoked.');
            } else if (action === 'SYNC') {
                await authApi.syncRoleTemplate(token, activeRoleId, activeClientId);
                notify('success', 'Synced', 'Role synced with global template.');
            } else if (action.startsWith('PRESET_')) {
                const presetMap: Record<string, string[]> = {
                    'PRESET_TEACHER': ['student:read', 'student.academic:read', 'student.attendance:write', 'class:read', 'assignment:write', 'teacher_note:write', 'timetable:read'],
                    'PRESET_ACADEMIC': ['student:read', 'student.academic:write', 'exam:write', 'mark:write', 'report.class:read', 'class:write'],
                    'PRESET_FINANCE': ['billing:read', 'billing:write', 'fee:read', 'fee:write', 'fee.collection:write', 'report.financial:read']
                };
                const targets = presetMap[action] || [];
                const targetIds = scopes.filter(s => targets.some(t => s.value.startsWith(t))).map(s => s.id);
                
                // For a production system, we'd have a single bulk-grant-list endpoint.
                // For now, we perform sequential grants.
                for (const sid of targetIds) {
                    await fetch(`${BASE}/api/v1/oauth2/role-scope`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role_id: activeRoleId, scope_id: sid, clientId: activeClientId })
                    });
                }
                notify('success', 'Preset Applied', 'Role updated with business-specific permissions.');
            }
            await loadRoleScopes(activeClientId, activeRoleId);
        } catch (err: any) {
            notify('error', 'Action Failed', err.message);
        } finally {
            setIsBusy(false);
        }
    };

    const getScopeCategory = (val: string) => {
        const parts = val.split(':');
        const main = parts[0];
        if (main.includes('.')) return main.split('.')[0].toUpperCase();
        return main.toUpperCase();
    };

    const groupedScopes = scopes.reduce((acc, scope) => {
        const cat = getScopeCategory(scope.value);
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(scope);
        return acc;
    }, {} as Record<string, typeof scopes>);

    // ── Create new role ───────────────────────────────────────────────────────
    const handleCreateRole = async () => {
        if (!token || !newRole.name || !newRole.slug) return;
        setIsBusy(true);
        try {
            const client = clients.find(c => c.client_id === activeClientId) as any;
            const role = await authApi.createRole(token, {
                ...newRole,
                tenant_id: client?.tenant_id ?? undefined
            });
            notify('success', 'Role Created', `"${role.name}" added.`);
            setShowCreateRole(false);
            setNewRole({ name: '', slug: '', description: '' });
            const updated = await loadRoles(activeClientId);
            setRoles(updated);
            setActiveRoleId(role.id);
            await loadRoleScopes(activeClientId, role.id);
        } catch (err: any) {
            notify('error', 'Create Failed', err.message);
        } finally {
            setIsBusy(false);
        }
    };

    const filteredClients = useMemo(() =>
        clients.filter(c =>
            c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
            c.client_id.toLowerCase().includes(clientSearch.toLowerCase())
        ), [clients, clientSearch]);

    const filteredRoles = useMemo(() =>
        roles.filter(r =>
            r.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
            r.slug.toLowerCase().includes(roleSearch.toLowerCase())
        ), [roles, roleSearch]);

    const activeClient = clients.find(c => c.client_id === activeClientId);
    const activeRole = roles.find(r => r.id === activeRoleId);

    // ── Loading spinner ───────────────────────────────────────────────────────
    if (isBooting) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Initializing IAM...</p>
            </div>
        );
    }

    // ── CLIENT LIST VIEW ──────────────────────────────────────────────────────
    if (view === 'CLIENT_LIST') {
        return (
            <div className="p-8 bg-[#F8FAFC] min-h-[calc(100vh-100px)] rounded-[3rem] border border-slate-200 shadow-2xl flex flex-col gap-10">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-xl"><AppWindow size={20} /></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Identity Orchestration</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight">Select Application</h1>
                        <p className="text-slate-500 font-semibold mt-2 text-lg">Choose a system to manage its roles and permissions.</p>
                    </div>
                    <div className="relative group min-w-[300px]">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text" placeholder="Search apps..."
                            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/5 shadow-sm"
                            value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                        />
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredClients.map(client => (
                        <button
                            key={client.id}
                            onClick={() => enterClient(client.client_id)}
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl text-left group hover:scale-[1.02] hover:border-primary/20 transition-all duration-300"
                        >
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-xl text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-300 mb-6">
                                {client.name[0]}
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">{client.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{client.client_id}</p>
                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                                </div>
                                <ArrowRight size={18} className="text-slate-200 group-hover:text-primary group-hover:translate-x-2 transition-all duration-300" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ── CLIENT EDIT VIEW ──────────────────────────────────────────────────────
    return (
        <div className="p-8 bg-[#F8FAFC] min-h-[calc(100vh-100px)] rounded-[3rem] border border-slate-200 shadow-2xl flex flex-col gap-8">

            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button onClick={goBack} className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-slate-900 transition-all active:scale-90 shadow-sm">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Editing Application</span>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 mt-1">
                            {activeClient?.name}
                            <span className="text-xs font-bold text-slate-300 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 uppercase tracking-widest">
                                {activeClient?.client_id}
                            </span>
                        </h1>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateRole(true)}
                    className="px-5 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={14} /> New Role
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">

                {/* Left: Role List */}
                <div className="lg:col-span-4 flex flex-col bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-50 space-y-4">
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-3">
                            <Layers size={20} className="text-indigo-500" /> Context Roles
                        </h3>
                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                                type="text" placeholder="Search roles..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl font-bold text-xs text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                                value={roleSearch} onChange={e => setRoleSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredRoles.length === 0 && (
                            <div className="text-center py-12 text-slate-300">
                                <Target size={32} className="mx-auto mb-3" />
                                <p className="text-xs font-bold">No roles found</p>
                            </div>
                        )}
                        {filteredRoles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => selectRole(role.id)}
                                className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all
                                    ${activeRoleId === role.id
                                        ? 'bg-slate-900 text-white shadow-xl'
                                        : 'hover:bg-slate-50 text-slate-500'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                                        ${activeRoleId === role.id ? 'bg-white/10' : 'bg-slate-100'}`}>
                                        <Target size={16} className={activeRoleId === role.id ? 'text-indigo-400' : 'text-slate-400'} />
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-sm font-black ${activeRoleId === role.id ? 'text-white' : 'text-slate-800'}`}>{role.name}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{role.slug}</p>
                                    </div>
                                </div>
                                {activeRoleId === role.id && <ChevronRight size={18} className="text-primary" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Scope Manager */}
                <div className="lg:col-span-8 flex flex-col bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Zap size={22} className="text-amber-500" />
                                <h2 className="text-xl font-black text-slate-900">Scope Manager</h2>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {activeRole ? <>Editing: <span className="text-indigo-500">{activeRole.name}</span></> : 'Select a role to manage scopes'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleBulk('SYNC')}
                                disabled={isBusy || isLoadingRoleScopes || !activeRoleId}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-40"
                            >
                                <HistoryIcon size={14} /> Sync Definition
                            </button>
                            <div className="w-px h-8 bg-slate-100" />
                            <button
                                onClick={() => handleBulk('REVOKE')}
                                disabled={isBusy || isLoadingRoleScopes || !activeRoleId}
                                className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-95 disabled:opacity-40"
                                title="Revoke All"
                            >
                                <AlertCircle size={20} />
                            </button>
                            <button
                                onClick={() => handleBulk('GRANT')}
                                disabled={isBusy || isLoadingRoleScopes || !activeRoleId}
                                className="p-3 bg-emerald-50 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all active:scale-95 disabled:opacity-40"
                                title="Grant All"
                            >
                                <CheckCircle2 size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-10">
                        {/* Persona Presets */}
                        <div className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Business Persona Presets</h4>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { id: 'PRESET_TEACHER', label: 'Classroom Teacher', icon: UserCheck, color: 'text-sky-600 bg-sky-50' },
                                    { id: 'PRESET_ACADEMIC', label: 'Academic Head', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50' },
                                    { id: 'PRESET_FINANCE', label: 'Finance Admin', icon: Landmark, color: 'text-amber-600 bg-amber-50' }
                                ].map(p => (
                                    <button
                                        key={p.id}
                                        disabled={isBusy || !activeRoleId}
                                        onClick={() => handleBulk(p.id as any)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:shadow-md active:scale-95 disabled:opacity-50 ${p.color}`}
                                    >
                                        <p.icon size={14} />
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {isLoadingRoleScopes ? (
                            <div className="flex items-center justify-center h-40 gap-3 text-slate-300">
                                <div className="w-6 h-6 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
                                <span className="text-xs font-bold">Loading scopes...</span>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {Object.entries(groupedScopes).sort(([a], [b]) => a.localeCompare(b)).map(([category, catScopes]) => (
                                    <div key={category} className="space-y-4">
                                        <div className="flex items-center gap-4 px-2">
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">{category}</h3>
                                            <div className="flex-1 h-[1px] bg-slate-100" />
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{catScopes.length} PERMISSIONS</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                                            {catScopes.map(scope => {
                                                const mapping = roleScopes.find(rs => rs.scope_id === scope.id);
                                                const granted = mapping?.granted ?? false;
                                                return (
                                                    <button
                                                        key={scope.id}
                                                        onClick={() => toggleScope(scope.id, granted)}
                                                        disabled={isBusy || !activeRoleId}
                                                        className={`group p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col gap-3 disabled:cursor-not-allowed
                                                            ${granted
                                                                ? 'bg-emerald-50/30 border-emerald-400/30 hover:border-emerald-500'
                                                                : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest
                                                                ${granted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                                {scope.value.split(':')[0]}
                                                            </span>
                                                            {granted && <CheckCircle2 size={15} className="text-emerald-500" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">{scope.value}</p>
                                                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{scope.description || 'Granular access policy'}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Role Modal */}
            {showCreateRole && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowCreateRole(false)} />
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-slate-100">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Create Context Role</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">App: {activeClient?.name}</p>
                            </div>
                            <button onClick={() => setShowCreateRole(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role Name</label>
                                <div className="relative">
                                    <Target size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input type="text" placeholder="e.g. Senior Faculty"
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:bg-white focus:border-primary/20 transition-all"
                                        value={newRole.name}
                                        onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Slug Identifier</label>
                                <div className="relative">
                                    <LockIcon size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input type="text" placeholder="e.g. senior_teacher"
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:bg-white focus:border-primary/20 transition-all"
                                        value={newRole.slug}
                                        onChange={e => setNewRole({ ...newRole, slug: e.target.value.toLowerCase().replace(/ /g, '_') })}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleCreateRole}
                                disabled={isBusy || !newRole.name || !newRole.slug}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isBusy ? 'Creating...' : 'Deploy New Role'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
