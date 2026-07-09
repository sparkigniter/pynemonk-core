import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Save, Sparkles, Check, 
    School, Award, Calendar, Layers, User,
    CheckCircle2, Printer
} from 'lucide-react';
import { get, post } from '../../api/base.api';

interface ReportCardTemplate {
    theme: 'indigo' | 'emerald' | 'royal' | 'crimson';
    title: string;
    showLogo: boolean;
    showStudentInfo: boolean;
    showAggregate: boolean;
    showRemarks: boolean;
    showSignatures: boolean;
    teacherLabel: string;
    principalLabel: string;
    parentLabel: string;
}

const defaultTemplate: ReportCardTemplate = {
    theme: 'indigo',
    title: 'Academic Achievement Record',
    showLogo: true,
    showStudentInfo: true,
    showAggregate: true,
    showRemarks: true,
    showSignatures: true,
    teacherLabel: 'Class Teacher',
    principalLabel: 'Principal',
    parentLabel: 'Parent'
};

export default function ReportCardBuilder() {
    const navigate = useNavigate();
    const [config, setConfig] = useState<ReportCardTemplate>(defaultTemplate);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await get<ReportCardTemplate>('/school/exams/report-settings');
            if (data) {
                setConfig({ ...defaultTemplate, ...data });
            }
        } catch (err) {
            console.error('Failed to load settings', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await post('/school/exams/report-settings', config);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save settings', err);
        } finally {
            setSaving(false);
        }
    };

    const colorMap = {
        indigo: { primary: 'bg-indigo-600', border: 'border-indigo-500', text: 'text-indigo-600', fill: '#4f46e5', light: 'bg-indigo-50/50' },
        emerald: { primary: 'bg-emerald-600', border: 'border-emerald-500', text: 'text-emerald-600', fill: '#059669', light: 'bg-emerald-50/50' },
        royal: { primary: 'bg-violet-600', border: 'border-violet-500', text: 'text-violet-600', fill: '#7c3aed', light: 'bg-violet-50/50' },
        crimson: { primary: 'bg-rose-600', border: 'border-rose-500', text: 'text-rose-600', fill: '#dc2626', light: 'bg-rose-50/50' }
    };

    const activeColor = colorMap[config.theme] || colorMap.indigo;

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
            <div className="w-12 h-12 rounded-2xl border-4 border-slate-200 border-t-indigo-600 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Configuration Canvas...</p>
        </div>
    );

    return (
        <div className="p-10 bg-[#FBFBFE] min-h-screen">
            {/* Header */}
            <header className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/exams')}
                        className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-90"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Report Card Builder</h1>
                            <span className="px-3.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                                <Sparkles size={11} /> Visual Designer
                            </span>
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest mt-2 text-xs">
                            Format and customize official student achievement certificates
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-3 px-8 py-4.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 text-white ${
                        saved 
                            ? 'bg-emerald-500 shadow-emerald-100' 
                            : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
                    }`}
                >
                    {saved ? <Check size={16} /> : <Save size={16} />}
                    {saving ? 'Saving...' : saved ? 'Saved Successfully' : 'Save Template'}
                </button>
            </header>

            {/* Split Screen Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* 1. CONFIGURATION DASHBOARD (Left) */}
                <div className="lg:col-span-5 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 h-fit">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-1">Canvas Options</h2>
                        <p className="text-xs text-slate-400 font-semibold">Tweak color palettes, labels, and display visibility toggles.</p>
                    </div>

                    {/* Theme selector */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Color Theme</label>
                        <div className="flex items-center gap-4">
                            {Object.entries(colorMap).map(([key, value]) => (
                                <button
                                    key={key}
                                    onClick={() => setConfig(prev => ({ ...prev, theme: key as any }))}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 transition-all hover:scale-105 ${value.primary} ${
                                        config.theme === key ? 'border-slate-900 scale-105 shadow-lg' : 'border-transparent opacity-75 hover:opacity-100'
                                    }`}
                                    title={`Theme: ${key}`}
                                >
                                    {config.theme === key && <Check size={18} className="text-white" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Report Card Title */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Achievement Record Title</label>
                        <input
                            type="text"
                            value={config.title}
                            onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                            placeholder="e.g. Academic Achievement Record"
                        />
                    </div>

                    {/* Display toggles */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Section Toggles</h3>
                        
                        {/* Logo switch */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-black text-slate-900">Academic Crest</p>
                                <p className="text-[10px] font-bold text-slate-400">Show school vector logo shield at the top</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={config.showLogo}
                                onChange={(e) => setConfig(prev => ({ ...prev, showLogo: e.target.checked }))}
                                className="w-12 h-6 bg-slate-100 rounded-full appearance-none cursor-pointer relative checked:bg-indigo-600 transition-colors after:content-[''] after:w-5 after:h-5 after:bg-white after:rounded-full after:absolute after:top-0.5 after:left-0.5 checked:after:translate-x-6 after:transition-transform shadow-inner"
                            />
                        </div>

                        {/* Student Details switch */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-black text-slate-900">Student Profile Dossier</p>
                                <p className="text-[10px] font-bold text-slate-400">Display name, class, grade, and admission info</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={config.showStudentInfo}
                                onChange={(e) => setConfig(prev => ({ ...prev, showStudentInfo: e.target.checked }))}
                                className="w-12 h-6 bg-slate-100 rounded-full appearance-none cursor-pointer relative checked:bg-indigo-600 transition-colors after:content-[''] after:w-5 after:h-5 after:bg-white after:rounded-full after:absolute after:top-0.5 after:left-0.5 checked:after:translate-x-6 after:transition-transform shadow-inner"
                            />
                        </div>

                        {/* Aggregate switch */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-black text-slate-900">Aggregate Percentage</p>
                                <p className="text-[10px] font-bold text-slate-400">Show calculated final grade percentage badge</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={config.showAggregate}
                                onChange={(e) => setConfig(prev => ({ ...prev, showAggregate: e.target.checked }))}
                                className="w-12 h-6 bg-slate-100 rounded-full appearance-none cursor-pointer relative checked:bg-indigo-600 transition-colors after:content-[''] after:w-5 after:h-5 after:bg-white after:rounded-full after:absolute after:top-0.5 after:left-0.5 checked:after:translate-x-6 after:transition-transform shadow-inner"
                            />
                        </div>

                        {/* Signatures switch */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-black text-slate-900">Sign-Off Signature Grid</p>
                                <p className="text-[10px] font-bold text-slate-400">Show signature lines at the bottom</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={config.showSignatures}
                                onChange={(e) => setConfig(prev => ({ ...prev, showSignatures: e.target.checked }))}
                                className="w-12 h-6 bg-slate-100 rounded-full appearance-none cursor-pointer relative checked:bg-indigo-600 transition-colors after:content-[''] after:w-5 after:h-5 after:bg-white after:rounded-full after:absolute after:top-0.5 after:left-0.5 checked:after:translate-x-6 after:transition-transform shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Signature labels config */}
                    {config.showSignatures && (
                        <div className="space-y-4 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Custom Signature Labels</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Left Signature Label</label>
                                    <input
                                        type="text"
                                        value={config.teacherLabel}
                                        onChange={(e) => setConfig(prev => ({ ...prev, teacherLabel: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Right Signature Label</label>
                                    <input
                                        type="text"
                                        value={config.principalLabel}
                                        onChange={(e) => setConfig(prev => ({ ...prev, principalLabel: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. REAL-TIME CANVAS PREVIEW (Right) */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center gap-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Printer size={12} /> Interactive Document Live Preview
                    </div>

                    {/* Scaled-down mock A4 Certificate */}
                    <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl relative overflow-hidden aspect-[1/1.4] w-full flex flex-col justify-between">
                        {/* Decorative background vectors */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-80" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-50 rounded-full -ml-24 -mb-24 opacity-80" />

                        {/* Outer template double frame */}
                        <div className="absolute inset-4 border-2 rounded-[2rem] pointer-events-none opacity-80" style={{ borderColor: activeColor.fill }} />
                        <div className="absolute inset-5 border rounded-[1.8rem] pointer-events-none opacity-40" style={{ borderColor: activeColor.fill }} />

                        {/* Top Crest Logo */}
                        <div className="flex flex-col items-center text-center mt-4">
                            {config.showLogo ? (
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-3 shadow-lg" style={{ backgroundColor: activeColor.fill }}>
                                    <School size={30} />
                                </div>
                            ) : (
                                <div className="h-10" />
                            )}
                            <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Luvia International Academy</h3>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">{config.title || 'Academic Achievement Record'}</p>
                            <div className="w-12 h-0.5 mt-4 rounded-full" style={{ backgroundColor: activeColor.fill }} />
                        </div>

                        {/* Student Details Grid */}
                        {config.showStudentInfo ? (
                            <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 mx-4 text-left my-2">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                            <User size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Student Name</p>
                                            <p className="text-xs font-black text-slate-900">Ishani Patel</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                            <Award size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Enrollment No</p>
                                            <p className="text-xs font-black text-slate-900">ADM-2026-1005</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                            <Calendar size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Academic Term</p>
                                            <p className="text-xs font-black text-slate-900">Mid-Term Exam (2026-27)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                            <Layers size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Grade / Classroom</p>
                                            <p className="text-xs font-black text-slate-900">Grade 1 - Class 1-Alpha</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-4" />
                        )}

                        {/* Marks Table */}
                        <div className="mx-4 flex-1 my-4 flex flex-col justify-center">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-white bg-slate-950">
                                        <th className="px-4 py-2 text-[8px] font-black uppercase tracking-wider rounded-tl-xl">Subject Description</th>
                                        <th className="px-4 py-2 text-[8px] font-black uppercase tracking-wider text-center">Max</th>
                                        <th className="px-4 py-2 text-[8px] font-black uppercase tracking-wider text-center">Passing</th>
                                        <th className="px-4 py-2 text-[8px] font-black uppercase tracking-wider text-center">Obtained</th>
                                        <th className="px-4 py-2 text-[8px] font-black uppercase tracking-wider text-right rounded-tr-xl">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="border-x border-b border-slate-100 text-xs">
                                    <tr className="bg-white border-b border-slate-100">
                                        <td className="px-4 py-2.5">
                                            <p className="font-black text-slate-900">Mathematics</p>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase">MAT-0-1005</p>
                                        </td>
                                        <td className="px-4 py-2.5 text-center font-bold text-slate-500">100.00</td>
                                        <td className="px-4 py-2.5 text-center font-bold text-slate-300">35.00</td>
                                        <td className="px-4 py-2.5 text-center font-black text-slate-900">82.00</td>
                                        <td className="px-4 py-2.5 text-right font-black text-emerald-600 text-[8px]">PASS</td>
                                    </tr>
                                    <tr className="bg-slate-50/20 border-b border-slate-100">
                                        <td className="px-4 py-2.5">
                                            <p className="font-black text-slate-900">Science</p>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase">SCI-1-1005</p>
                                        </td>
                                        <td className="px-4 py-2.5 text-center font-bold text-slate-500">100.00</td>
                                        <td className="px-4 py-2.5 text-center font-bold text-slate-300">35.00</td>
                                        <td className="px-4 py-2.5 text-center font-black text-slate-900">70.00</td>
                                        <td className="px-4 py-2.5 text-right font-black text-emerald-600 text-[8px]">PASS</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-50/50">
                                        <td className="px-4 py-3 font-black text-slate-900 text-right uppercase tracking-wider text-[8px]">Aggregated Totals</td>
                                        <td className="px-4 py-3 text-center font-black text-slate-900">200.00</td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3 text-center font-black text-slate-900 text-sm">152.00</td>
                                        <td className="px-4 py-3 text-right">
                                            {config.showAggregate ? (
                                                <span className="text-sm font-black text-slate-900">76.0%</span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Bottom signature grid & circular approved stamp */}
                        {config.showSignatures ? (
                            <div className="grid grid-cols-3 gap-6 items-end mx-4 mt-2">
                                <div className="flex flex-col items-center">
                                    <div className="w-full border-t border-slate-200 mb-2" />
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{config.teacherLabel || 'Class Teacher'}</p>
                                </div>
                                <div className="flex justify-center mb-1">
                                    {/* Small round circular stamp replica */}
                                    <div className="w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center" style={{ borderColor: activeColor.fill, color: activeColor.fill }}>
                                        <p className="text-[4px] font-black uppercase text-center" style={{ transform: 'scale(0.8)' }}>ASSESSMENT</p>
                                        <p className="text-[7px] font-black leading-none my-0.5">PASS</p>
                                        <CheckCircle2 size={8} style={{ color: activeColor.fill }} />
                                    </div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-full border-t border-slate-200 mb-2" />
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{config.principalLabel || 'Principal'}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-6" />
                        )}

                        {/* Motivational Quote at bottom */}
                        <p className="text-center text-[7px] font-bold text-slate-300 uppercase tracking-widest mt-6 italic">
                            "Intelligence plus character - that is the goal of true education." — MLK Jr.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
