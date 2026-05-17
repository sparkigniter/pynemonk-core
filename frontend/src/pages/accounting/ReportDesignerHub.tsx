import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Layout, Plus, 
    FileText, CheckCircle2, 
    Edit3, Trash2
} from 'lucide-react';
import { getReportTemplates } from '../../api/accounting.api';

export default function ReportDesignerHub() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<any[]>([]);
    const [, setLoading] = useState(true);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                setLoading(true);
                const res = await getReportTemplates();
                setTemplates(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Template Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Total Templates</p>
                        <h3 className="text-3xl font-black">{templates.length}</h3>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl">
                        <FileText size={24} />
                    </div>
                </div>
                <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Active Designs</p>
                        <h3 className="text-3xl font-black text-slate-800">{templates.filter(t => t.is_default).length}</h3>
                    </div>
                    <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl">
                        <CheckCircle2 size={24} />
                    </div>
                </div>
                <button 
                    onClick={() => navigate('/accounting/reports/designer')}
                    className="p-8 bg-primary text-white rounded-[2.5rem] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between"
                >
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Build New</p>
                        <h3 className="text-2xl font-black">Design Studio</h3>
                    </div>
                    <div className="p-4 bg-white/20 rounded-2xl">
                        <Plus size={24} />
                    </div>
                </button>
            </div>

            {/* Template List */}
            <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-xl">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Institutional Layouts</h3>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-slate-100 text-[10px] font-black text-slate-400 rounded-lg uppercase tracking-widest">Manual Sort</span>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Template Name</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Type</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Modified</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {templates.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-300">
                                            <Layout size={48} className="opacity-20" />
                                            <p className="text-sm font-bold uppercase tracking-widest">No custom templates found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : templates.map((template, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                <Layout size={18} />
                                            </div>
                                            <p className="text-sm font-black text-slate-800">{template.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg border border-indigo-100">
                                            {template.report_type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        {template.is_default ? (
                                            <div className="flex items-center gap-2 text-emerald-500">
                                                <CheckCircle2 size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Active Default</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Secondary</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-slate-400">
                                        {new Date(template.updated_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                                                <Edit3 size={16} />
                                            </button>
                                            <button className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
