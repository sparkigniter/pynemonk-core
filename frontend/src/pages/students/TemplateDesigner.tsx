import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
    ChevronLeft, Save, Printer, QrCode, 
    User, FileText, Layout, Info,
    Eye, RefreshCw, Zap
} from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import * as studentApi from '../../api/student.api';
import { useNotification } from '../../contexts/NotificationContext';

const DOCUMENT_STYLES = `
  .ql-editor {
    padding: 0;
    height: auto;
    overflow: visible;
    color: inherit;
    font-family: inherit;
    text-align: inherit;
    white-space: normal;
  }
  .ql-editor p, .ql-editor ol, .ql-editor ul, .ql-editor pre, .ql-editor blockquote, .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4, .ql-editor h5, .ql-editor h6 {
    margin: 0;
    padding: 0;
    counter-reset: list-1 list-2 list-3 list-4 list-5 list-6 list-7 list-8 list-9;
  }
  .ql-editor p { 
    line-height: 1.6; 
    min-height: 1.2em;
  }
  
  .ql-align-center { text-align: center !important; }
  .ql-align-right { text-align: right !important; }
  .ql-align-justify { text-align: justify !important; }
  
  .ql-indent-1 { padding-left: 3em; }
  .ql-indent-2 { padding-left: 6em; }
  .ql-indent-3 { padding-left: 9em; }
  .ql-indent-4 { padding-left: 12em; }
  .ql-indent-5 { padding-left: 15em; }
  
  .ql-font-serif { font-family: serif; }
  .ql-font-monospace { font-family: monospace; }
  
  .ql-size-small { font-size: 0.75em; }
  .ql-size-large { font-size: 1.5em; }
  .ql-size-huge { font-size: 2.5em; }
  
  .ql-editor strong, .ql-editor b { font-weight: bold !important; }
  .ql-editor em, .ql-editor i { font-style: italic !important; }
  .ql-editor u { text-decoration: underline !important; }
  
  .ql-editor ul, .ql-editor ol {
    padding-left: 0 !important;
    margin: 0.5em 0 !important;
  }
  .ql-editor li {
    list-style-type: none;
    position: relative;
    padding-left: 1.5em;
  }
  .ql-editor ul > li::before {
    content: "•";
    position: absolute;
    left: 0;
  }
  .ql-editor ol > li {
    counter-increment: list-0;
  }
  .ql-editor ol > li::before {
    content: counter(list-0) ".";
    position: absolute;
    left: 0;
    font-weight: bold;
  }
  
  .ql-editor img {
    max-width: 100%;
    height: auto;
    display: inline-block;
    vertical-align: middle;
  }

  .ql-full-height {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .ql-full-height .quill {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .ql-full-height .ql-container {
    flex: 1;
    overflow-y: auto;
    font-size: 14px;
  }

  @media print {
    @page {
      margin: 0;
      size: auto;
    }
    body * { visibility: hidden !important; }
    .print-area, .print-area * { 
      visibility: visible !important; 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-area { 
      position: absolute !important; 
      left: 0 !important; 
      top: 0 !important; 
      width: 100% !important;
      height: 100% !important;
      background: white !important;
      display: block !important;
    }
  }
`;

export default function TemplateDesigner() {
    const { studentId } = useParams<{ studentId: string }>();
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'ID_CARD';
    const navigate = useNavigate();
    const { notify } = useNotification();
    
    const [student, setStudent] = useState<any>(null);
    const [template, setTemplate] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');

    const variables = [
        { key: '{{NAME}}', label: 'Full Name', icon: User },
        { key: '{{ADMISSION_NO}}', label: 'Admission No', icon: FileText },
        { key: '{{GRADE}}', label: 'Current Grade', icon: Layout },
        { key: '{{DOB}}', label: 'Date of Birth', icon: Info },
        { key: '{{GUARDIAN}}', label: 'Guardian Name', icon: User },
        { key: '{{AVATAR}}', label: 'Student Photo', icon: Eye },
        { key: '{{QR}}', label: 'Verification QR', icon: QrCode },
    ];

    const defaultTC = `
        <h1 style="text-align: center;">TRANSFER CERTIFICATE</h1>
        <p style="text-align: center;"><strong>LuviaEdu Academy of Excellence</strong></p>
        <p style="text-align: center; font-size: 10px;">Affiliation No: 123456 | School Code: 7890</p>
        <p><br></p>
        <p>This is to certify that <strong>{{NAME}}</strong>, son/daughter of <strong>{{GUARDIAN}}</strong> bearing Admission No: <strong>{{ADMISSION_NO}}</strong> was a student of this institution.</p>
        <p><br></p>
        <p>His/Her Date of Birth according to the Admission Register is <strong>{{DOB}}</strong>.</p>
        <p><br></p>
        <p>He/She was studying in <strong>{{GRADE}}</strong> and has left the school on <strong>{{EXIT_DATE}}</strong>.</p>
        <p><br></p>
        <p>His/Her conduct during the period of stay in the school was <strong>Excellent</strong>.</p>
        <p><br></p>
        <div style="display: flex; justify-content: space-between; margin-top: 50px;">
            <p>___________________<br>Prepared By</p>
            <p>___________________<br>Principal</p>
        </div>
    `;

    const defaultID = `
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 25px; border-radius: 24px; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; font-family: sans-serif;">
            <div style="width: 100px; height: 100px; border-radius: 20px; border: 4px solid rgba(255,255,255,0.1); margin-bottom: 20px; background: rgba(255,255,255,0.05); overflow: hidden;">
                 <img src="{{AVATAR}}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <h2 style="font-size: 20px; font-weight: 900; margin: 0; letter-spacing: -0.02em;">{{NAME}}</h2>
            <p style="font-size: 11px; opacity: 0.5; margin: 5px 0 20px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Student Identity</p>
            
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 20px; width: 100%; text-align: left; border: 1px solid rgba(255,255,255,0.05);">
                <div style="margin-bottom: 12px;">
                    <p style="font-size: 8px; opacity: 0.4; margin: 0; text-transform: uppercase; font-weight: 900; letter-spacing: 0.1em;">Admission No</p>
                    <p style="font-size: 12px; font-weight: 800; margin: 2px 0 0 0;">{{ADMISSION_NO}}</p>
                </div>
                <div>
                    <p style="font-size: 8px; opacity: 0.4; margin: 0; text-transform: uppercase; font-weight: 900; letter-spacing: 0.1em;">Grade / Level</p>
                    <p style="font-size: 12px; font-weight: 800; margin: 2px 0 0 0;">{{GRADE}}</p>
                </div>
            </div>
            
            <div style="margin-top: 25px; width: 70px; height: 70px; background: white; padding: 6px; border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.2);">
                <img src="{{QR}}" style="width: 100%; height: 100%;" />
            </div>
        </div>
    `;

    useEffect(() => {
        const load = async () => {
            try {
                if (studentId) {
                    const s = await studentApi.getStudentProfile(parseInt(studentId));
                    setStudent(s);
                }
                const saved = await studentApi.getCertificateTemplate(type);
                setTemplate(saved?.html_content || (type === 'ID_CARD' ? defaultID : defaultTC));
            } catch (err) {
                console.error('Failed to load designer', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [studentId, type]);

    const renderTemplate = (content: string) => {
        if (!student || !content) return '';
        let html = content;
        
        // No default pic logic: If avatar_url is missing, don't show the dicebear fallback in the template
        // We'll replace it with a transparent pixel or empty string so it doesn't render a broken image or default
        const avatar = student.avatar_url || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        const data: any = {
            '{{NAME}}': `${student.first_name || ''} ${student.last_name || ''}`.trim(),
            '{{ADMISSION_NO}}': student.admission_no || 'PENDING',
            '{{DOB}}': student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A',
            '{{GRADE}}': student.current_grade_name || 'N/A',
            '{{GUARDIAN}}': student.guardians?.[0]?.first_name || 'N/A',
            '{{AVATAR}}': avatar,
            '{{QR}}': `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${student.admission_no || 'NA'}`,
            '{{EXIT_DATE}}': new Date().toLocaleDateString(),
        };

        Object.keys(data).forEach(key => {
            html = html.replaceAll(key, String(data[key] ?? ''));
        });
        return html;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await studentApi.saveCertificateTemplate({
                name: type === 'ID_CARD' ? 'Institutional ID Card' : 'Transfer Certificate',
                type,
                html_content: template
            });
            notify('success', 'Design Saved', 'The template has been successfully persisted to the vault.');
        } catch (err: any) {
            notify('error', 'Save Failed', err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-primary animate-pulse">Initializing Designer...</div>;

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden">
            <style>{DOCUMENT_STYLES}</style>
            
            {/* Top Navigation Bar */}
            <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-20 shrink-0">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-primary"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="h-8 w-px bg-slate-100" />
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                            {type.replace('_', ' ')} <span className="text-primary">Designer</span>
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Institutional Identity Center</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl mr-4">
                        <button 
                            onClick={() => setViewMode('split')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'split' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                        >
                            Split
                        </button>
                        <button 
                            onClick={() => setViewMode('edit')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'edit' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                        >
                            Edit
                        </button>
                        <button 
                            onClick={() => setViewMode('preview')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'preview' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                        >
                            Preview
                        </button>
                    </div>
                    
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black hover:opacity-90 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Template
                    </button>
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-xs font-black hover:opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-95"
                    >
                        <Printer size={16} />
                        Print Document
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Variable Sidebar */}
                <aside className="w-80 bg-white border-r border-slate-200 overflow-y-auto shrink-0 p-8 space-y-10">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Dynamic Data</h3>
                        <div className="space-y-3">
                            {variables.map(v => (
                                <button 
                                    key={v.key}
                                    onClick={() => {
                                        // Simple append for now
                                        setTemplate(prev => prev + `<p>${v.key}</p>`);
                                    }}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-primary hover:bg-primary/5 transition-all group text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-primary shadow-sm transition-all">
                                            <v.icon size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800">{v.label}</p>
                                            <code className="text-[9px] font-bold text-slate-400 group-hover:text-primary transition-colors">{v.key}</code>
                                        </div>
                                    </div>
                                    <Zap size={14} className="text-slate-200 group-hover:text-primary" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <Info className="text-primary" size={20} />
                            <h4 className="text-sm font-black text-slate-900">Designer Tips</h4>
                        </div>
                        <ul className="space-y-3">
                            <li className="text-[11px] font-medium text-slate-500 leading-relaxed">• Use the toolbar to align and center your content.</li>
                            <li className="text-[11px] font-medium text-slate-500 leading-relaxed">• Placeholders will be replaced by actual data on print.</li>
                            <li className="text-[11px] font-medium text-slate-500 leading-relaxed">• ID Cards are optimized for PVC size (54mm x 86mm).</li>
                        </ul>
                        <button 
                            onClick={() => {
                                if (window.confirm('This will discard your current edits. Continue?')) {
                                    setTemplate(type === 'ID_CARD' ? defaultID : defaultTC);
                                }
                            }}
                            className="w-full mt-6 flex items-center justify-center gap-2 text-rose-500 text-[9px] font-black uppercase tracking-widest hover:text-rose-600 transition-colors"
                        >
                            <RefreshCw size={12} />
                            Reset to Default
                        </button>
                    </div>
                </aside>

                {/* Main Workspace */}
                <main className="flex-1 flex overflow-hidden">
                    {/* Editor Section */}
                    {(viewMode === 'split' || viewMode === 'edit') && (
                        <div className={`flex-1 flex flex-col bg-white ${viewMode === 'split' ? 'border-r border-slate-200' : ''}`}>
                            <div className="h-12 bg-slate-50 flex items-center px-6 border-b border-slate-200">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Source HTML Editor</span>
                            </div>
                            <div className="flex-1 overflow-y-auto ql-full-height">
                                <ReactQuill 
                                    theme="snow"
                                    value={template}
                                    onChange={setTemplate}
                                    className="h-full"
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, 3, false] }],
                                            ['bold', 'italic', 'underline', 'strike'],
                                            [{ 'color': [] }, { 'background': [] }],
                                            [{ 'align': [] }],
                                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                            ['link', 'image'],
                                            ['clean']
                                        ]
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Preview Section */}
                    {(viewMode === 'split' || viewMode === 'preview') && (
                        <div className="flex-1 flex flex-col bg-slate-100 p-12 overflow-y-auto">
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Real-time Academic Preview</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                    <span className="text-[10px] font-bold text-success uppercase tracking-widest">Live Sync</span>
                                </div>
                            </div>
                            
                            <div className="flex-1 flex items-center justify-center">
                                {type === 'ID_CARD' ? (
                                    <div className="w-80 aspect-[1/1.58] bg-white shadow-2xl rounded-[3rem] overflow-hidden relative group transition-transform duration-500">
                                        <div className="w-full h-full ql-editor !p-0" dangerouslySetInnerHTML={{ __html: renderTemplate(template) }} />
                                    </div>
                                ) : (
                                    <div className="w-full max-w-3xl aspect-[1/1.41] bg-white shadow-2xl rounded-2xl overflow-hidden p-[20mm]">
                                        <div className="w-full h-full ql-editor !p-0" dangerouslySetInnerHTML={{ __html: renderTemplate(template) }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Hidden Print Container */}
            <div className="hidden print:block print-area fixed inset-0 bg-white">
                 <div 
                    className="ql-editor !p-0"
                    style={type === 'ID_CARD' ? { width: '54mm', height: '86mm' } : { padding: '20mm' }}
                    dangerouslySetInnerHTML={{ __html: renderTemplate(template) }} 
                />
            </div>
        </div>
    );
}
