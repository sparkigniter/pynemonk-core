import { useState, useRef, useEffect } from 'react';
import { 
    Eye, Save, 
    RotateCcw,
    ChevronLeft, Palette,
    Layout, Table,
    Image as ImageIcon,
    Plus,
    Bold, Italic, List, 
    AlignCenter, AlignLeft, AlignRight,
    Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { post } from '../../api/base.api';

const REPORT_TYPES = [
    { id: 'trial_balance', name: 'Trial Balance', variables: ['accounts', 'total_debit', 'total_credit'] },
    { id: 'profit_loss', name: 'Profit & Loss', variables: ['income_accounts', 'expense_accounts', 'net_profit'] },
    { id: 'balance_sheet', name: 'Balance Sheet', variables: ['assets', 'liabilities', 'equity'] },
    { id: 'aging_report', name: 'Aging Report', variables: ['partners', 'overdue_summary'] }
];

const GLOBAL_VARIABLES = [
    { name: 'report_name', label: 'Report Title', color: 'bg-indigo-500' },
    { name: 'tenant_name', label: 'School Name', color: 'bg-emerald-500' },
    { name: 'fiscal_year', label: 'Fiscal Year', color: 'bg-amber-500' },
    { name: 'generated_at', label: 'Current Date', color: 'bg-rose-500' }
];

export default function ReportTemplateDesigner() {
    const navigate = useNavigate();
    const editorRef = useRef<HTMLDivElement>(null);
    const [selectedReport, setSelectedReport] = useState(REPORT_TYPES[0]);
    const [templateName, setTemplateName] = useState('New Report Template');
    const [zoom, setZoom] = useState(0.85);
    const [settings, setSettings] = useState({
        pageSize: 'A4',
        orientation: 'portrait',
        fontFamily: 'Inter',
        primaryColor: '#0f172a'
    });

    // Default starting content
    const [content, setContent] = useState(`
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-size: 28px; font-weight: 900; margin-bottom: 10px;">{{tenant_name}}</h1>
            <p style="text-transform: uppercase; letter-spacing: 2px; font-size: 12px; color: #64748b; font-weight: 700;">{{report_name}}</p>
        </div>
        <p style="margin-bottom: 20px;">Dear Stakeholders,</p>
        <p>This document presents the institutional financial status for the period of <strong>{{fiscal_year}}</strong>.</p>
        <br/>
        <div class="data-matrix-placeholder" style="padding: 20px; border: 2px dashed #4f46e5; border-radius: 20px; background: #f8fafc; text-align: center;">
            <p style="font-size: 10px; color: #4f46e5; font-weight: 800; text-transform: uppercase; margin-bottom: 5px;">Dynamic Data Matrix</p>
            <p style="font-size: 11px; color: #64748b; margin: 0;">Ledger details will be automatically injected here.</p>
            <div style="display: none;">{{#table}}</div>
        </div>
    `);

    // Initialize editor content once on mount to prevent cursor jumping
    useEffect(() => {
        if (editorRef.current && content) {
            editorRef.current.innerHTML = content;
        }
    }, []);

    const execCommand = (command: string, value: string = '') => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            setContent(editorRef.current.innerHTML);
        }
    };

    const insertVariable = (variable: string) => {
        const variableObj = [...GLOBAL_VARIABLES, ...selectedReport.variables.map(v => ({ name: v, label: v.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' '), color: 'bg-primary' }))].find(v => v.name === variable);
        const pillHtml = `<span contenteditable="false" class="var-chip" data-var="${variable}" style="display: inline-flex; align-items: center; background: ${variableObj?.color === 'bg-primary' ? '#4f46e5' : '#0f172a'}; color: white; padding: 2px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; margin: 0 4px; vertical-align: middle;">${variableObj?.label || variable}</span>&nbsp;`;
        execCommand('insertHTML', pillHtml);
    };

    const handleSave = async () => {
        try {
            await post('/reports/templates', {
                name: templateName,
                reportType: selectedReport.id,
                html: editorRef.current?.innerHTML || content,
                css: '', 
                settings: settings,
                isDefault: true
            });

            alert('Report template finalized and saved successfully!');
        } catch (error: any) {
            console.error('Save error:', error);
            alert(`Failed to save template: ${error.message || 'Unknown error'}`);
        }
    };

    const insertLayout = (type: string) => {
        let html = '';
        switch (type) {
            case 'section':
                html = `
                    <div class="report-section" style="margin: 30px 0; padding: 20px; border-left: 4px solid #4f46e5; background: #f8fafc;">
                        <h3 style="margin-top: 0; color: #1e293b; font-size: 18px;">New Section Title</h3>
                        <p style="color: #64748b;">Type your section content here...</p>
                    </div>
                `;
                break;
            case 'table':
                html = `
                    <div class="data-matrix-placeholder" style="margin: 30px 0; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 40px; text-align: center; background: #fcfdfe;">
                        <div style="color: #4f46e5; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Dynamic Report Table</div>
                        <p style="color: #94a3b8; font-size: 11px; margin: 0;">The system will automatically generate the <strong>${selectedReport.name}</strong> data grid here.</p>
                        <div style="display: none;">{{#table}}</div>
                    </div>
                `;
                break;
            case 'branding':
                html = `
                    <div style="margin: 20px 0; text-align: left;">
                        <img src="https://api.dicebear.com/7.x/shapes/svg?seed=school" style="width: 80px; height: 80px; border-radius: 16px; object-fit: cover;" alt="School Logo" />
                    </div>
                `;
                break;
        }
        execCommand('insertHTML', html);
    };

    const handleInput = () => {
        if (editorRef.current) {
            setContent(editorRef.current.innerHTML);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-200/50 overflow-hidden font-sans">
            {/* High-Fidelity Design Header */}
            <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between z-40 shadow-sm sticky top-0">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-400 transition-all border border-slate-100">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="h-10 w-px bg-slate-200" />
                    <div>
                        <div className="flex items-center gap-3">
                            <input 
                                value={templateName}
                                onChange={e => setTemplateName(e.target.value)}
                                className="text-lg font-black text-slate-800 tracking-tight bg-transparent border-none outline-none focus:ring-0 p-0 w-64"
                            />
                            <div className="px-2 py-0.5 bg-emerald-500 text-white rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Active</div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <select 
                                value={selectedReport.id}
                                onChange={e => setSelectedReport(REPORT_TYPES.find(r => r.id === e.target.value)!)}
                                className="text-[10px] font-black text-primary uppercase tracking-widest bg-transparent border-none outline-none p-0 cursor-pointer hover:underline"
                            >
                                {REPORT_TYPES.map(r => <option key={r.id} value={r.id}>{r.name} Configuration</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl mr-4">
                        <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-slate-400 transition-all">-</button>
                        <span className="text-[10px] font-black text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-slate-400 transition-all">+</button>
                    </div>

                    <button 
                        onClick={() => { if(confirm('Clear all content?')) { if(editorRef.current) editorRef.current.innerHTML = ''; setContent(''); }}}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-500 font-black text-xs hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <RotateCcw size={14} /> Clear
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Save size={14} /> Finalize
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Side: Element Browser (Collapsible-ready) */}
                <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-30 overflow-y-auto custom-scrollbar shrink-0">
                    <div className="p-6">
                        <div className="mb-8">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Layout</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'section', icon: Layout, label: 'New Section' },
                                    { id: 'table', icon: Table, label: 'Data Matrix' },
                                    { id: 'branding', icon: ImageIcon, label: 'Branding' }
                                ].map((item, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => insertLayout(item.id)}
                                        className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all text-left group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-white transition-all">
                                            <item.icon size={16} />
                                        </div>
                                        <span className="text-[11px] font-black text-slate-700 uppercase">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Data Points</h3>
                            <div className="space-y-1.5">
                                {[...GLOBAL_VARIABLES, ...selectedReport.variables.map(v => ({ name: v, label: v.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' '), color: 'bg-primary' }))].map((v, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => insertVariable(v.name)}
                                        className="w-full flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-primary/30 hover:shadow-md transition-all group"
                                    >
                                        <span className="text-[10px] font-bold text-slate-600">{v.label}</span>
                                        <Plus size={10} className="text-slate-300 group-hover:text-primary" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Workspace */}
                <main className="flex-1 flex flex-col items-center overflow-auto custom-scrollbar bg-slate-200/30 p-8 pt-4 relative">
                    <div className="sticky top-0 z-40 w-full max-w-4xl bg-white/90 backdrop-blur-md border border-slate-200 rounded-[1.5rem] p-2 mb-8 flex items-center justify-between shadow-2xl shadow-slate-200/50">
                        <div className="flex items-center gap-0.5">
                            <button onClick={() => execCommand('bold')} className="p-2.5 hover:bg-slate-50 rounded-lg text-slate-600 transition-all active:scale-90"><Bold size={15} /></button>
                            <button onClick={() => execCommand('italic')} className="p-2.5 hover:bg-slate-50 rounded-lg text-slate-600 transition-all active:scale-90"><Italic size={15} /></button>
                            <div className="w-px h-5 bg-slate-100 mx-1" />
                            <button onClick={() => execCommand('justifyLeft')} className="p-2.5 hover:bg-slate-50 rounded-lg text-slate-600 transition-all active:scale-90"><AlignLeft size={15} /></button>
                            <button onClick={() => execCommand('justifyCenter')} className="p-2.5 hover:bg-slate-50 rounded-lg text-slate-600 transition-all active:scale-90"><AlignCenter size={15} /></button>
                            <button onClick={() => execCommand('justifyRight')} className="p-2.5 hover:bg-slate-50 rounded-lg text-slate-600 transition-all active:scale-90"><AlignRight size={15} /></button>
                            <div className="w-px h-5 bg-slate-100 mx-1" />
                            <button onClick={() => execCommand('insertUnorderedList')} className="p-2.5 hover:bg-slate-50 rounded-lg text-slate-600 transition-all active:scale-90"><List size={15} /></button>
                        </div>
                        <div className="flex items-center gap-3 px-3">
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <Palette size={13} />
                                <input type="color" className="w-5 h-5 border-none bg-transparent cursor-pointer rounded overflow-hidden" onChange={e => execCommand('foreColor', e.target.value)} />
                            </div>
                            <div className="h-6 w-px bg-slate-100" />
                            <button className="text-[9px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">Advanced</button>
                        </div>
                    </div>

                    {/* Canvas */}
                    <div className="transition-transform duration-300 origin-top" style={{ transform: `scale(${zoom})` }}>
                        <div 
                            className={`bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-200 p-[80px] min-h-[1123px] relative overflow-hidden ${settings.pageSize === 'A4' ? 'w-[794px]' : 'w-[850px]'}`}
                            style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b', lineHeight: '1.6' }}
                        >
                            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-200" />
                            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-200" />
                            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-200" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-200" />

                            <div 
                                ref={editorRef}
                                contentEditable 
                                onInput={handleInput}
                                suppressContentEditableWarning={true}
                                className="outline-none min-h-full prose max-w-none prose-slate"
                                style={{ outline: 'none', whiteSpace: 'pre-wrap' }}
                            />
                        </div>
                    </div>

                    <div className="mt-8 mb-12 flex items-center gap-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                        <span className="flex items-center gap-1.5"><Info size={12} /> Page 1 of 1</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>Autosave: {new Date().toLocaleTimeString()}</span>
                    </div>
                </main>

                {/* Right Panel */}
                <aside className="w-72 bg-white border-l border-slate-200 flex flex-col z-30 p-6 overflow-y-auto shrink-0">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Page Settings</h3>
                    <div className="space-y-6">
                        <section className="space-y-3">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Dimension</label>
                            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
                                <button onClick={() => setSettings({...settings, pageSize: 'A4'})} className={`py-2 rounded-lg text-[9px] font-black uppercase transition-all ${settings.pageSize === 'A4' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}>A4</button>
                                <button onClick={() => setSettings({...settings, pageSize: 'Letter'})} className={`py-2 rounded-lg text-[9px] font-black uppercase transition-all ${settings.pageSize === 'Letter' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}>Letter</button>
                            </div>
                        </section>
                        <section className="space-y-3">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Orientation</label>
                            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
                                <button onClick={() => setSettings({...settings, orientation: 'portrait'})} className={`py-2 rounded-lg text-[9px] font-black uppercase transition-all ${settings.orientation === 'portrait' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}>Portrait</button>
                                <button onClick={() => setSettings({...settings, orientation: 'landscape'})} className={`py-2 rounded-lg text-[9px] font-black uppercase transition-all ${settings.orientation === 'landscape' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}>Landscape</button>
                            </div>
                        </section>
                        <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                            <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                <Eye size={16} />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Status</h4>
                            </div>
                            <p className="text-[9px] text-indigo-700/60 font-bold leading-relaxed uppercase tracking-tight">Document is optimized for institutional distribution.</p>
                        </div>
                    </div>
                </aside>
            </div>
            
            <style>{`
                .var-chip { cursor: default; user-select: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                .prose p { margin-top: 0.5em; margin-bottom: 0.5em; }
            `}</style>
        </div>
    );
}
