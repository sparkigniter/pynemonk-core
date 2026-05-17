import { useState, useEffect } from 'react';
import { 
    Activity, TrendingUp, TrendingDown,
    ArrowUpRight, ArrowDownRight,
    PieChart as PieChartIcon
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RePie, Pie, Cell
} from 'recharts';
import { getFinancialTrends, getARAging } from '../../api/accounting.api';

export default function FinancialAnalytics() {
    const [loading, setLoading] = useState(true);
    const [trends, setTrends] = useState<any[]>([]);
    const [agingSummary, setAgingSummary] = useState<any[]>([]);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const [trendData, arData] = await Promise.all([
                    getFinancialTrends(),
                    getARAging()
                ]);
                
                // Sanitize trend data for Recharts
                const sanitizedTrends = (trendData || []).map((t: any) => ({
                    ...t,
                    revenue: parseFloat(t.revenue || 0),
                    expenses: parseFloat(t.expenses || 0),
                    name: t.month // Use month as name for the XAxis
                }));
                setTrends(sanitizedTrends);
                
                const totals = arData.reduce((acc: any, item: any) => {
                    acc.current += parseFloat(item.current_30 || 0);
                    acc.overdue30 += parseFloat(item.overdue_31_60 || 0);
                    acc.overdue60 += parseFloat(item.overdue_61_90 || 0);
                    acc.overdue90 += parseFloat(item.overdue_91_plus || 0);
                    return acc;
                }, { current: 0, overdue30: 0, overdue60: 0, overdue90: 0 });

                setAgingSummary([
                    { name: '0-30 Days', value: totals.current, color: '#10b981' },
                    { name: '31-60 Days', value: totals.overdue30, color: '#f59e0b' },
                    { name: '61-90 Days', value: totals.overdue60, color: '#f97316' },
                    { name: '90+ Days', value: totals.overdue90, color: '#ef4444' },
                ]);

            } catch (err: any) {
                console.warn('Failed to load reports summary', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin shadow-lg" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating Financial Insights...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Visual Analytics Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue vs Expenses Chart */}
                <div className="lg:col-span-2 p-10 rounded-[3rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden border border-white/5">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Performance Trend</p>
                            <h3 className="text-2xl font-black tracking-tight">Revenue vs Expenses</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Revenue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Expenses</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#ffffff40" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px' }}
                                    itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" connectNulls animationDuration={1500} />
                                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" connectNulls animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Debt Aging Distribution */}
                <div className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Debt Exposure</p>
                    <h3 className="text-2xl font-black tracking-tight text-slate-800 mb-8">Aging Distribution</h3>
                    
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePie>
                                <Pie
                                    data={agingSummary}
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {agingSummary.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RePie>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {agingSummary.map((item: any, i: number) => (
                            <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.name}</span>
                                </div>
                                <p className="text-sm font-black text-slate-800">${(item.value / 1000).toFixed(1)}k</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Performance Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Avg Collection Time', value: '18 Days', change: '-4d', icon: Activity, up: false },
                    { label: 'Revenue Growth', value: '+24.5%', change: '+2.1%', icon: TrendingUp, up: true },
                    { label: 'Expense Ratio', value: '38%', change: '-1.5%', icon: TrendingDown, up: false },
                    { label: 'Cash Reserve', value: '$842k', change: '+$42k', icon: PieChartIcon, up: true },
                ].map((stat, i) => (
                    <div key={i} className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                <stat.icon size={20} />
                            </div>
                            <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${stat.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {stat.change}
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h4 className="text-2xl font-black text-slate-800">{stat.value}</h4>
                    </div>
                ))}
            </div>
        </div>
    );
}
