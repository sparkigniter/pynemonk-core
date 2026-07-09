import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
    Printer, Download, Mail, 
    ArrowLeft, CheckCircle2, XCircle,
    User, School, Calendar, Award
} from 'lucide-react';
import { get, getBaseURL, getAuthHeaders } from '../../api/base.api';

interface ReportCard {
    student: {
        name: string;
        admission_no: string;
        classroom: string;
        grade: string;
        academic_year: string;
    };
    exam: {
        name: string;
        type: string;
    };
    subjects: {
        name: string;
        code: string;
        max: number;
        passing: number;
        obtained: number;
        status: 'PASS' | 'FAIL' | 'ABSENT';
        remarks: string;
    }[];
    summary: {
        total_max: number;
        total_obtained: number;
        percentage: number;
        result: 'PASS' | 'FAIL';
    };
}

export default function ReportCardView() {
    const { examId, studentId } = useParams();
    const [report, setReport] = useState<ReportCard | null>(null);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [examId, studentId]);

    const fetchReport = async () => {
        try {
            const [reportData, settingsData] = await Promise.all([
                get<ReportCard>(`/school/exams/${examId}/students/${studentId}/report`),
                get<any>('/school/exams/report-settings')
            ]);
            setReport(reportData);
            setSettings(settingsData || {
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
            });
        } catch (err) {
            console.error('Failed to fetch report card', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
            const baseURL = getBaseURL();
            const response = await fetch(`${baseURL}/school/exams/${examId}/students/${studentId}/report/pdf`, {
                headers: getAuthHeaders()
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_card_${report?.student.name.replace(/\s+/g, '_') || studentId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            console.error('Failed to download PDF', err);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Generating Official Document...</div>;
    if (!report) return <div className="p-8 text-center text-rose-500">Report card not found.</div>;

    const colorMap = {
        indigo: { text: 'text-indigo-600', fill: 'bg-indigo-600', border: 'border-indigo-500', hex: '#4f46e5', light: 'bg-indigo-50/50' },
        emerald: { text: 'text-emerald-600', fill: 'bg-emerald-600', border: 'border-emerald-500', hex: '#059669', light: 'bg-emerald-50/50' },
        royal: { text: 'text-violet-600', fill: 'bg-violet-600', border: 'border-violet-500', hex: '#7c3aed', light: 'bg-violet-50/50' },
        crimson: { text: 'text-rose-600', fill: 'bg-rose-600', border: 'border-rose-500', hex: '#dc2626', light: 'bg-rose-50/50' }
    };

    const activeColor = settings ? (colorMap[settings.theme as 'indigo' | 'emerald' | 'royal' | 'crimson'] || colorMap.indigo) : colorMap.indigo;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Action Bar (Non-Printable) */}
            <div className="flex items-center justify-between no-print bg-white p-4 rounded-2xl border border-slate-100 shadow-xl mb-8">
                <button onClick={() => window.history.back()} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex items-center gap-3">
                    <button onClick={() => window.print()} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
                        <Printer size={14} /> Print Document
                    </button>
                    <button 
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className={`px-5 py-2.5 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 ${activeColor.fill}`}
                    >
                        <Download size={14} /> {downloading ? 'Downloading...' : 'Download PDF'}
                    </button>
                    <button className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                        <Mail size={18} className="text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Official Report Card (Printable) */}
            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl relative overflow-hidden print:p-0 print:border-0 print:shadow-none print:rounded-0" id="report-card">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-80" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-50 rounded-full -ml-24 -mb-24 opacity-80" />

                {/* Double Border Frame */}
                <div className="absolute inset-4 border-2 rounded-[2rem] pointer-events-none opacity-80 print:inset-0 print:border-none" style={{ borderColor: activeColor.hex }} />
                <div className="absolute inset-5 border rounded-[1.8rem] pointer-events-none opacity-40 print:inset-0 print:border-none" style={{ borderColor: activeColor.hex }} />

                {/* Institution Header */}
                <div className="flex flex-col items-center text-center mb-12 relative z-10">
                    {settings.showLogo && (
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white mb-4 shadow-xl ${activeColor.fill}`}>
                            <School size={40} />
                        </div>
                    )}
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Luvia International Academy</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">{settings.title}</p>
                    <div className={`w-16 h-1 mt-6 rounded-full ${activeColor.fill}`} />
                </div>

                {/* Student & Exam Info */}
                {settings.showStudentInfo && (
                    <div className="grid grid-cols-2 gap-12 mb-12 relative z-10 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Student Name</p>
                                    <p className="text-lg font-black text-slate-900">{report.student.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enrollment No</p>
                                    <p className="text-lg font-black text-slate-900">{report.student.admission_no}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Academic Term</p>
                                    <p className="text-lg font-black text-slate-900">{report.exam.name} ({report.student.academic_year})</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                    <Layers size={20} className="text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grade / Classroom</p>
                                    <p className="text-lg font-black text-slate-900">{report.student.grade} - {report.student.classroom}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Marks Table */}
                <div className="mb-12 relative z-10">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest rounded-tl-2xl">Subject Description</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Max Marks</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Passing</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Obtained</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right rounded-tr-2xl">Status</th>
                            </tr>
                        </thead>
                        <tbody className="border-x border-b border-slate-100">
                            {report.subjects.map((sub, i) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                                    <td className="px-6 py-5 border-b border-slate-100">
                                        <p className="text-sm font-black text-slate-900">{sub.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{sub.code}</p>
                                    </td>
                                    <td className="px-6 py-5 border-b border-slate-100 text-center font-bold text-slate-600">{sub.max}</td>
                                    <td className="px-6 py-5 border-b border-slate-100 text-center font-bold text-slate-400">{sub.passing}</td>
                                    <td className="px-6 py-5 border-b border-slate-100 text-center">
                                        <span className={`text-lg font-black ${sub.status === 'FAIL' ? 'text-rose-500' : 'text-slate-900'}`}>{sub.obtained}</span>
                                    </td>
                                    <td className="px-6 py-5 border-b border-slate-100 text-right">
                                        {sub.status === 'PASS' ? (
                                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${activeColor.text}`}>
                                                <CheckCircle2 size={14} /> Pass
                                            </span>
                                        ) : sub.status === 'FAIL' ? (
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-rose-600 uppercase tracking-widest">
                                                <XCircle size={14} /> Fail
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Absent
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-50/80">
                                <td className="px-6 py-6 font-black text-slate-900 text-right uppercase tracking-widest text-[10px]">Aggregated Totals</td>
                                <td className="px-6 py-6 text-center font-black text-slate-900">{report.summary.total_max}</td>
                                <td className="px-6 py-6"></td>
                                <td className="px-6 py-6 text-center font-black text-xl" style={{ color: activeColor.hex }}>{report.summary.total_obtained}</td>
                                <td className="px-6 py-6 text-right">
                                    {settings.showAggregate ? (
                                        <span className="text-2xl font-black text-slate-900">{report.summary.percentage}%</span>
                                    ) : (
                                        <span className="text-slate-300">-</span>
                                    )}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Signature & Result */}
                {settings.showSignatures && (
                    <div className="grid grid-cols-3 gap-12 mt-20 relative z-10">
                        <div className="flex flex-col items-center">
                            <div className="w-full border-t-2 border-slate-200 mt-12 mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{settings.teacherLabel || 'Class Teacher'}</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="p-8 rounded-[3rem] border-4 flex flex-col items-center justify-center" style={{
                                borderColor: report.summary.result === 'PASS' ? activeColor.hex + '33' : '#dc262633',
                                backgroundColor: report.summary.result === 'PASS' ? activeColor.hex + '0a' : '#dc26260a',
                                color: report.summary.result === 'PASS' ? activeColor.hex : '#dc2626'
                            }}>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2">Final Result</p>
                                <h2 className="text-4xl font-black">{report.summary.result}</h2>
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-full border-t-2 border-slate-200 mt-12 mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{settings.principalLabel || 'Principal'}</p>
                        </div>
                    </div>
                )}

                {/* Footer Quote */}
                <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-24 italic relative z-10">
                    "Intelligence plus character - that is the goal of true education." — MLK Jr.
                </p>
            </div>
            
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:border-0 { border: 0 !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                }
            `}</style>
        </div>
    );
}

const Layers = ({ size, className }: { size: number, className: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
        <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
        <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </svg>
);
