import React, { useEffect, useState } from 'react';
import { 
    LayoutDashboard, Globe, Users, GraduationCap, 
    Activity, Server, ShieldCheck, RefreshCw 
} from 'lucide-react';
import { getSystemStats } from '../api/system.api';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const data = await getSystemStats();
            setStats(data.data);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const cards = [
        { 
            title: 'Onboarded Schools', 
            value: stats?.totalSchools ?? '...', 
            icon: Globe, 
            gradient: 'stats-gradient-1',
            subtitle: `${stats?.activeSchools ?? '...'} currently active`
        },
        { 
            title: 'Global Students', 
            value: stats?.totalStudents?.toLocaleString() ?? '...', 
            icon: GraduationCap, 
            gradient: 'stats-gradient-2',
            subtitle: 'Across all regions'
        },
        { 
            title: 'Active Faculty', 
            value: stats?.totalTeachers?.toLocaleString() ?? '...', 
            icon: Users, 
            gradient: 'stats-gradient-3',
            subtitle: 'Total teaching staff'
        }
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Quick Actions Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Platform Overview</h2>
                    <p className="text-slate-500 text-sm mt-1">Real-time metrics and system health monitoring.</p>
                </div>
                <button 
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh Stats
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                {cards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div key={i} className="glass-card overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                            <div className={`h-2 ${card.gradient}`} />
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                                        <Icon size={24} className="text-indigo-600" />
                                    </div>
                                    <div className="h-6 w-12 bg-slate-100 rounded-full animate-pulse-slow" />
                                </div>
                                <h3 className="text-slate-500 font-medium text-sm">{card.title}</h3>
                                <div className="text-4xl font-black text-slate-900 mt-2 tracking-tight">
                                    {card.value}
                                </div>
                                <p className="text-slate-400 text-xs mt-4 flex items-center gap-1">
                                    <Activity size={12} className="text-emerald-500" />
                                    {card.subtitle}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* System Health Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-8">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Server size={20} className="text-indigo-600" />
                        Infrastructure Health
                    </h3>
                    <div className="space-y-6">
                        {[
                            { label: 'API Gateway', status: 'Operational', color: 'bg-emerald-500' },
                            { label: 'School Service (v1.0.4)', status: 'Operational', color: 'bg-emerald-500' },
                            { label: 'Auth Service (v1.0.2)', status: 'Operational', color: 'bg-emerald-500' },
                            { label: 'Massive Seeder Worker', status: 'Running', color: 'bg-amber-500' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.status}</span>
                                    <div className={`w-2.5 h-2.5 rounded-full ${item.color} shadow-[0_0_8px_rgba(16,185,129,0.5)]`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
                        <LayoutDashboard size={40} className="text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Platform Overview</h3>
                    <p className="text-slate-500 text-sm max-w-xs mb-8">
                        Global metrics are aggregated in real-time from our distributed school nodes.
                    </p>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full stats-gradient-1 animate-pulse" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest">Processing Data Streams</span>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
