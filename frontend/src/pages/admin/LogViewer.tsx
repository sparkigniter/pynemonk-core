import { useState, useEffect } from 'react';
import { 
    Terminal, Search, Trash2, 
    RefreshCw, AlertTriangle, 
    Info, Bug, Clock, Filter
} from 'lucide-react';
import * as systemApi from '../../api/system.api';
import { useNotification } from '../../contexts/NotificationContext';

export default function LogViewer() {
    const { notify } = useNotification();
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterLevel, setFilterLevel] = useState<string>('ALL');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await systemApi.getSystemLogs();
            setLogs(data);
        } catch (err) {
            console.error('Failed to fetch logs', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        if (!window.confirm('Are you sure you want to purge all system logs?')) return;
        try {
            await systemApi.clearSystemLogs();
            notify('success', 'Logs Purged', 'System log file has been truncated.');
            setLogs([]);
        } catch (err) {
            notify('error', 'Purge Failed', 'Could not clear log file.');
        }
    };

    const filteredLogs = logs.map(line => {
        try {
            return JSON.parse(line);
        } catch (err) {
            return { timestamp: new Date().toISOString(), level: 'INFO', message: line, context: null };
        }
    }).filter(log => {
        const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase()) || 
                             (log.context && JSON.stringify(log.context).toLowerCase().includes(search.toLowerCase()));
        const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
        return matchesSearch && matchesLevel;
    });

    const getLevelColor = (level: string) => {
        if (level === 'ERROR') return 'text-rose-600 bg-rose-50 border-rose-100';
        if (level === 'WARN') return 'text-amber-600 bg-amber-50 border-amber-100';
        if (level === 'DEBUG') return 'text-blue-600 bg-blue-50 border-blue-100';
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    };

    const getLevelIcon = (level: string) => {
        if (level === 'ERROR') return <AlertTriangle size={14} />;
        if (level === 'WARN') return <Info size={14} />;
        if (level === 'DEBUG') return <Bug size={14} />;
        return <Clock size={14} />;
    };

    return (
        <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="bg-slate-900 p-4 rounded-3xl shadow-xl">
                        <Terminal className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">System <span className="text-primary">Logs</span></h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Real-time audit trail & diagnostic data</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={fetchLogs} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button onClick={handleClear} className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all">
                        <Trash2 size={14} />
                        Purge Logs
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Search log entries (message, timestamp, context)..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 ring-primary/20 transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-2">
                    <Filter size={14} className="text-slate-400 ml-2" />
                    <select 
                        className="bg-transparent text-xs font-black uppercase py-3 px-2 outline-none cursor-pointer"
                        value={filterLevel}
                        onChange={e => setFilterLevel(e.target.value)}
                    >
                        <option value="ALL">All Levels</option>
                        <option value="ERROR">Errors</option>
                        <option value="WARN">Warnings</option>
                        <option value="INFO">Info</option>
                        <option value="DEBUG">Debug</option>
                    </select>
                </div>
            </div>

            {/* Log Container */}
            <div className="bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[600px]">
                <div className="flex items-center justify-between px-8 py-4 bg-slate-900 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">pynemonk.log</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{filteredLogs.length} Lines</span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 font-mono text-xs custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <RefreshCw className="animate-spin text-slate-700" size={32} />
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                            <Search size={40} className="opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No matching logs found</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {filteredLogs.map((log, i) => (
                                <div key={i} className="group border-b border-white/5 last:border-none py-4 px-4 hover:bg-white/5 transition-all">
                                    <div className="flex items-start gap-4">
                                        <span className="text-slate-700 select-none w-8 font-bold">{filteredLogs.length - i}</span>
                                        <div className="flex-1 min-w-0 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`px-2 py-0.5 rounded flex items-center gap-2 whitespace-nowrap border ${getLevelColor(log.level)}`}>
                                                    {getLevelIcon(log.level)}
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{log.level}</span>
                                                </div>
                                                <span className="text-slate-500 text-[10px] font-bold">{new Date(log.timestamp).toLocaleString()}</span>
                                                <span className="text-primary/40 text-[9px] font-black uppercase tracking-[0.2em] px-2 bg-primary/5 rounded border border-primary/10">Diagnostic Event</span>
                                            </div>
                                            <p className="text-slate-200 text-sm leading-relaxed font-bold tracking-tight">{log.message}</p>
                                            {log.context && (
                                                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 mt-4">
                                                    <pre className="text-[10px] text-emerald-400/80 whitespace-pre-wrap break-all leading-normal">
                                                        {JSON.stringify(log.context, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
