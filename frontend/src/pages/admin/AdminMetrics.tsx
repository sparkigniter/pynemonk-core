import { useState, useEffect } from 'react';
import { 
    Users, Building2, Server, 
    ArrowUpRight, Globe,
    ShieldCheck, RefreshCw
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer
} from 'recharts';
import * as systemApi from '../../api/system.api';

export default function AdminMetrics() {
    const [metrics, setMetrics] = useState<systemApi.SystemMetric | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const data = await systemApi.getSystemMetrics();
            setMetrics(data);
        } catch (err) {
            console.error('Failed to fetch metrics', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Collecting System Intelligence...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">System <span className="text-primary">Intelligence</span></h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Cross-tenant operational metrics & KPIs</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">All Systems Operational</span>
                    </div>
                    <button onClick={fetchMetrics} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                        <RefreshCw size={18} className="text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Tenants', value: metrics?.totalTenants, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Total Users', value: metrics?.totalUsers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Total Students', value: metrics?.totalStudents, icon: Globe, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Staff Count', value: metrics?.totalStaff, icon: Server, color: 'text-primary', bg: 'bg-primary/5' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 group hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                                <ArrowUpRight size={14} />
                                +12%
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <h2 className="text-3xl font-black text-slate-900 mt-1">{stat.value?.toLocaleString()}</h2>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Main Activity Chart */}
                <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900">System Activity</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Logins vs Transactions (Last 7 Days)</p>
                        </div>
                        <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-black outline-none">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics?.activityData}>
                                <defs>
                                    <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 900 }}
                                />
                                <Area type="monotone" dataKey="logins" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorLogins)" />
                                <Area type="monotone" dataKey="transactions" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorTrans)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                        <h3 className="text-lg font-black text-slate-900 mb-6">Efficiency KPIs</h3>
                        <div className="space-y-6">
                            {metrics?.kpis.map((kpi, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-600">{kpi.name}</span>
                                        <span className="text-xs font-black text-primary">{kpi.value}{kpi.unit}</span>
                                    </div>
                                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary rounded-full" 
                                            style={{ width: `${kpi.value}%` }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <ShieldCheck size={24} className="text-primary" />
                            </div>
                            <div>
                                <h4 className="font-black text-sm uppercase tracking-widest">Platform Status</h4>
                                <p className="text-[10px] text-white/50">Next scheduled audit in 4 days</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs font-bold p-3 bg-white/5 rounded-xl border border-white/10">
                                <span>API Integrity</span>
                                <span className="text-emerald-400">Stable</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold p-3 bg-white/5 rounded-xl border border-white/10">
                                <span>DB Health</span>
                                <span className="text-emerald-400">99.9%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
