import React, { useState, useRef } from 'react';
import { 
    X, Upload, Download, CheckCircle2, AlertCircle, 
    Play, Loader2, ArrowRight, Table, HelpCircle, FileSpreadsheet,
    FileText, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { request } from '../../api/base.api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAcademics } from '../../contexts/AcademicsContext';

interface BulkImportWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    grades: any[];
    classrooms: any[];
}

export default function BulkImportWizard({ isOpen, onClose, onSuccess, grades, classrooms }: BulkImportWizardProps) {
    const { notify } = useNotification();
    const { currentYear } = useAcademics();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [selectedGradeId, setSelectedGradeId] = useState<string>('');
    const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
    const [validationReport, setValidationReport] = useState<{ index: number; errors: string[] }[]>([]);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, successes: 0, failures: 0 });
    const [importResults, setImportResults] = useState<{ row: number; name: string; success: boolean; error?: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // Dynamically generate a premium formatted CSV template
    const downloadCSVTemplate = () => {
        const headers = [
            'Admission No',
            'First Name',
            'Last Name',
            'Gender (male/female/other)',
            'Date of Birth (YYYY-MM-DD)',
            'Mother Tongue',
            'Address',
            'Email',
            'Phone',
            'Nationality',
            'Religion',
            'Blood Group',
            'Guardian First Name',
            'Guardian Last Name',
            'Guardian Phone',
            'Guardian Relation',
            'Roll Number'
        ];
        const rows = [
            'ADM-2026-001,Aarav,Sharma,male,2015-08-12,Hindi,123 MG Road Bangalore,aarav.sharma@gmail.com,9876543210,Indian,Hindu,O+,Rajesh,Sharma,9988776655,Father,15',
            'ADM-2026-002,Ananya,Patel,female,2016-03-24,Gujarati,456 Residency Rd Bangalore,ananya.patel@gmail.com,9876543211,Indian,Hindu,A+,Suresh,Patel,9988776656,Father,12'
        ];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "luvia_student_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        notify('success', 'Template Downloaded', 'Use this sample to structure your institutional data.');
    };

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFileSelection(files[0]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) handleFileSelection(files[0]);
    };

    const handleFileSelection = (selectedFile: File) => {
        const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
        if (fileExt !== 'csv' && fileExt !== 'xlsx' && fileExt !== 'xls') {
            notify('error', 'Invalid File Format', 'Please upload a valid CSV or Excel file.');
            return;
        }
        parseFile(selectedFile);
    };

    const parseFile = (fileToParse: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                
                if (json.length === 0) {
                    notify('error', 'Empty File', 'The uploaded file contains no data rows.');
                    return;
                }
                setParsedData(json);
                // Pre-select first grade if available
                if (grades.length > 0) {
                    setSelectedGradeId(String(grades[0].id));
                }
                setStep(2);
            } catch (err) {
                console.error(err);
                notify('error', 'Parsing Failed', 'Could not parse Excel/CSV contents. Check file encoding.');
            }
        };
        reader.readAsArrayBuffer(fileToParse);
    };

    const runLocalValidation = () => {
        const reports: { index: number; errors: string[] }[] = [];
        
        parsedData.forEach((row, idx) => {
            const errors: string[] = [];
            const admissionNo = String(row['Admission No'] || row['admission_no'] || '').trim();
            const firstName = String(row['First Name'] || row['first_name'] || '').trim();
            const motherTongue = String(row['Mother Tongue'] || row['mother_tongue'] || 'English').trim();
            const address = String(row['Address'] || row['address'] || '').trim();
            const guardianName = String(row['Guardian First Name'] || row['guardian_first_name'] || '').trim();
            const guardianPhone = String(row['Guardian Phone'] || row['guardian_phone'] || '').trim();
            const guardianRelation = String(row['Guardian Relation'] || row['guardian_relation'] || '').trim();
            const email = String(row['Email'] || row['email'] || '').trim();
            const dob = String(row['Date of Birth (YYYY-MM-DD)'] || row['date_of_birth'] || '').trim();

            if (!admissionNo) errors.push("Admission number is required.");
            if (!firstName) errors.push("Student first name is required.");
            if (!motherTongue) errors.push("Mother tongue is required.");
            if (!address) errors.push("Residential address is required.");
            if (!guardianName) errors.push("Guardian first name is required.");
            if (!guardianPhone) errors.push("Guardian emergency phone is required.");
            if (!guardianRelation) errors.push("Guardian relationship is required.");
            
            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) errors.push("Invalid student email format.");
            }

            if (dob) {
                const dateCheck = new Date(dob);
                if (isNaN(dateCheck.getTime())) errors.push("Date of Birth must be in YYYY-MM-DD format.");
            }

            if (errors.length > 0) {
                reports.push({ index: idx + 1, errors });
            }
        });

        setValidationReport(reports);
        return reports.length === 0;
    };

    const handleConfirmMapping = () => {
        if (!selectedGradeId) {
            notify('error', 'Select Destination Grade', 'Please select a grade to allocate the imported students.');
            return;
        }
        if (!currentYear?.id) {
            notify('error', 'No Active Academic Year', 'Please close this wizard and select an active academic year first.');
            return;
        }

        const isValid = runLocalValidation();
        setStep(3);
        if (isValid) {
            notify('success', 'Validation Passed', 'All rows match the system requirements. Ready for import!');
        } else {
            notify('warning', 'Validation Mismatches Found', 'Some records have missing columns or formatting issues.');
        }
    };

    // Sequential batch ingestion to protect database threads and show live progress
    const handleStartImport = async () => {
        setImporting(true);
        const total = parsedData.length;
        setProgress({ current: 0, total, successes: 0, failures: 0 });
        setImportResults([]);

        const results: typeof importResults = [];
        let successCount = 0;
        let failureCount = 0;

        for (let i = 0; i < total; i++) {
            const row = parsedData[i];
            const studentName = `${row['First Name'] || 'Row'} ${row['Last Name'] || i + 1}`;
            
            // Format structured register JSON
            const payload = {
                student: {
                    admission_no: String(row['Admission No'] || row['admission_no'] || `AUTO-${Math.floor(1000 + Math.random() * 9000)}`).trim(),
                    first_name: String(row['First Name'] || row['first_name'] || '').trim(),
                    last_name: String(row['Last Name'] || row['last_name'] || '').trim(),
                    gender: String(row['Gender (male/female/other)'] || row['Gender'] || row['gender'] || 'male').toLowerCase().trim(),
                    date_of_birth: row['Date of Birth (YYYY-MM-DD)'] || row['date_of_birth'] || null,
                    mother_tongue: String(row['Mother Tongue'] || row['mother_tongue'] || 'English').trim(),
                    address: String(row['Address'] || row['address'] || 'Not Provided').trim(),
                    email: row['Email'] || row['email'] || null,
                    phone: row['Phone'] || row['phone'] || null,
                    nationality: row['Nationality'] || row['nationality'] || 'Indian',
                    religion: row['Religion'] || row['religion'] || 'Hindu',
                    blood_group: row['Blood Group'] || row['blood_group'] || null,
                    status: 'active'
                },
                guardian: {
                    first_name: String(row['Guardian First Name'] || row['guardian_first_name'] || 'Parent').trim(),
                    last_name: String(row['Guardian Last Name'] || row['guardian_last_name'] || '').trim(),
                    phone: String(row['Guardian Phone'] || row['guardian_phone'] || '0000000000').trim(),
                    relation: String(row['Guardian Relation'] || row['guardian_relation'] || 'Father').trim(),
                    is_emergency: true
                },
                enrollment: {
                    grade_id: Number(selectedGradeId),
                    classroom_id: selectedClassroomId ? Number(selectedClassroomId) : undefined,
                    academic_year_id: currentYear?.id || 0,
                    roll_number: String(row['Roll Number'] || row['roll_number'] || '').trim()
                },
                password: 'Student@123'
            };

            try {
                // Directly POST to register student endpoint
                await request('/school/students', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                successCount++;
                results.push({ row: i + 1, name: studentName, success: true });
            } catch (err: any) {
                failureCount++;
                results.push({ 
                    row: i + 1, 
                    name: studentName, 
                    success: false, 
                    error: err.message || 'Unknown network error' 
                });
            }

            setProgress({
                current: i + 1,
                total,
                successes: successCount,
                failures: failureCount
            });
            setImportResults([...results]);
        }

        setImporting(false);
        if (failureCount === 0) {
            notify('success', 'Import Completed', `Successfully ingested all ${successCount} student profiles!`);
            onSuccess();
        } else {
            notify('warning', 'Import Partial Success', `Imported ${successCount} students successfully. ${failureCount} rows failed.`);
            onSuccess();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <FileSpreadsheet size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Bulk Student Import Wizard</h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                Step {step} of 3 · {step === 1 ? 'Upload File' : step === 2 ? 'Target Placement' : 'Validate & Import'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={importing}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-20"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Wizard Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    {/* STEP 1: Upload File */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="p-5 bg-blue-50/40 border border-blue-100/50 rounded-2xl flex gap-4">
                                <HelpCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest">Enrolling existing data?</h4>
                                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                                        Importing data is simple. Download our formatted template, copy-paste your existing student directory into it, and drop it below. We will handle user generation, credentials, and parent relations automatically.
                                    </p>
                                </div>
                            </div>

                            <div 
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleFileDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 hover:border-primary/40 bg-slate-50/50 hover:bg-primary/5 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group"
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".csv,.xlsx,.xls"
                                    className="hidden" 
                                />
                                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 group-hover:scale-110 transition-transform shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary mb-4">
                                    <Upload size={28} />
                                </div>
                                <h3 className="text-base font-bold text-slate-800">Drag & Drop school data file here</h3>
                                <p className="text-xs text-slate-400 mt-1 font-medium">Supports CSV or Microsoft Excel (.xlsx, .xls) files up to 10MB</p>
                                <button className="mt-6 px-6 py-2.5 bg-slate-900 group-hover:bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all">
                                    Browse Files
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <FileText className="text-slate-400" size={24} />
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800">Need the correct column structure?</h4>
                                        <p className="text-xs text-slate-400 font-medium">Download our pre-structured template CSV containing sample data rows.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={downloadCSVTemplate}
                                    className="btn-dark flex items-center gap-2 !px-5 !py-2.5 !text-[10px] !font-black !rounded-xl"
                                >
                                    <Download size={14} />
                                    Download Template
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Placement settings */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Grade Level</label>
                                    <select 
                                        value={selectedGradeId} 
                                        onChange={(e) => {
                                            setSelectedGradeId(e.target.value);
                                            setSelectedClassroomId('');
                                        }}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                    >
                                        <option value="">-- Select Grade --</option>
                                        {grades.map((g) => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-400 font-medium">All students in this batch will be placed under this Grade scale.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Initial Classroom Allocation (Optional)</label>
                                    <select 
                                        value={selectedClassroomId} 
                                        onChange={(e) => setSelectedClassroomId(e.target.value)}
                                        disabled={!selectedGradeId}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                                    >
                                        <option value="">Keep Unallocated (Admit only)</option>
                                        {classrooms
                                            .filter(c => String(c.grade_id) === String(selectedGradeId))
                                            .map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}{c.section}</option>
                                            ))
                                        }
                                    </select>
                                    <p className="text-[10px] text-slate-400 font-medium">If empty, students are admitted to directory but classroom must be assigned later.</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-3xl border border-slate-100 p-6 space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <Table size={16} className="text-slate-400" />
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">File Contents Preview ({parsedData.length} Rows Found)</h3>
                                </div>
                                <div className="overflow-x-auto max-h-[300px] overflow-y-auto border border-slate-100 rounded-2xl">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-100 border-b border-slate-200 sticky top-0">
                                                <th className="px-4 py-3 font-bold text-slate-500">Row</th>
                                                <th className="px-4 py-3 font-bold text-slate-500">Admission No</th>
                                                <th className="px-4 py-3 font-bold text-slate-500">Student Name</th>
                                                <th className="px-4 py-3 font-bold text-slate-500">Gender</th>
                                                <th className="px-4 py-3 font-bold text-slate-500">Mother Tongue</th>
                                                <th className="px-4 py-3 font-bold text-slate-500">Guardian Name</th>
                                                <th className="px-4 py-3 font-bold text-slate-500">Guardian Relation</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {parsedData.slice(0, 10).map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 font-medium text-slate-600">
                                                    <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-800">{row['Admission No'] || row['admission_no'] || '--'}</td>
                                                    <td className="px-4 py-3">{row['First Name'] || row['first_name'] || '--'} {row['Last Name'] || row['last_name'] || ''}</td>
                                                    <td className="px-4 py-3 capitalize">{row['Gender'] || row['gender'] || 'male'}</td>
                                                    <td className="px-4 py-3">{row['Mother Tongue'] || row['mother_tongue'] || '--'}</td>
                                                    <td className="px-4 py-3">{row['Guardian First Name'] || row['guardian_first_name'] || '--'}</td>
                                                    <td className="px-4 py-3">{row['Guardian Relation'] || row['guardian_relation'] || '--'}</td>
                                                </tr>
                                            ))}
                                            {parsedData.length > 10 && (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-4 text-center text-slate-400 font-bold italic bg-slate-50/20">
                                                        ... and {parsedData.length - 10} more rows ...
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Preview validation and final import results */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            
                            {/* Validation Status Info */}
                            {!importing && importResults.length === 0 && (
                                <div className="space-y-4">
                                    {validationReport.length === 0 ? (
                                        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex gap-4 items-center">
                                            <CheckCircle2 size={32} className="text-emerald-500 flex-shrink-0" />
                                            <div>
                                                <h4 className="text-sm font-black text-emerald-800 uppercase tracking-widest">Structure Validation Passed!</h4>
                                                <p className="text-xs text-emerald-600 mt-0.5 font-medium">Ready to create {parsedData.length} records. User credentials will be automatically generated as "Student@123".</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl space-y-3">
                                            <div className="flex gap-4 items-start">
                                                <AlertCircle size={28} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="text-sm font-black text-amber-800 uppercase tracking-widest">Formatting warnings ({validationReport.length} Rows Affected)</h4>
                                                    <p className="text-xs text-amber-600 mt-0.5 font-medium">Please review these rows. If you choose to proceed, missing optional data will be set to system defaults.</p>
                                                </div>
                                            </div>

                                            <div className="border border-amber-200/50 bg-white rounded-2xl p-4 max-h-[200px] overflow-y-auto space-y-2">
                                                {validationReport.map((rpt, i) => (
                                                    <div key={i} className="text-xs flex gap-2 items-start font-medium text-slate-600">
                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-black text-[9px] uppercase tracking-wider">Row {rpt.index}</span>
                                                        <span className="text-amber-700">{rpt.errors.join(' · ')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6 border border-slate-100 bg-slate-50/50 rounded-[2rem] space-y-2 flex flex-col justify-center text-center items-center">
                                        <h3 className="text-base font-bold text-slate-800">You are about to import {parsedData.length} students</h3>
                                        <p className="text-xs text-slate-400 font-medium max-w-sm leading-relaxed">
                                            This action will generate login user ids and link guardian accounts automatically in the active Academic Year ({currentYear?.name || 'N/A'}).
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Import Progress Section */}
                            {(importing || importResults.length > 0) && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-900 text-white rounded-[2rem] space-y-4 shadow-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    {importing ? 'Processing Ingestion Queue...' : 'Ingestion Completed'}
                                                </h4>
                                                <h3 className="text-xl font-bold">
                                                    {importing ? `Imported ${progress.current} of ${progress.total}` : `Successfully Ingested ${progress.successes} Students`}
                                                </h3>
                                            </div>
                                            {importing && <Loader2 className="animate-spin text-primary" size={24} />}
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-primary h-full transition-all duration-300"
                                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-800 text-center">
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Processed</p>
                                                <p className="text-base font-black text-slate-200">{progress.current} / {progress.total}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Successes</p>
                                                <p className="text-base font-black text-emerald-400">{progress.successes}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">Failures</p>
                                                <p className="text-base font-black text-rose-400">{progress.failures}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Log Summary */}
                                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 space-y-3">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                                            <Table size={14} /> Audit Log
                                        </h4>
                                        <div className="max-h-[220px] overflow-y-auto space-y-2 border border-slate-100 bg-white rounded-2xl p-4">
                                            {importResults.map((res, i) => (
                                                <div key={i} className="text-xs flex items-center justify-between font-bold border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-slate-300">Row {res.row}</span>
                                                        <span className="text-slate-800">{res.name}</span>
                                                    </div>
                                                    <div>
                                                        {res.success ? (
                                                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5"><Check size={10} /> Created</span>
                                                        ) : (
                                                            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5" title={res.error}>
                                                                <AlertCircle size={10} /> {res.error?.includes('unique') || res.error?.includes('exists') ? 'Duplicate ID' : 'Error'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                        {step > 1 && !importing && progress.current === 0 && (
                            <button 
                                onClick={() => setStep((step - 1) as any)}
                                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                            >
                                Back
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {step === 2 && (
                            <button 
                                onClick={handleConfirmMapping}
                                className="btn-dark flex items-center gap-2 !px-6 !py-3 !text-xs"
                            >
                                Validate Records
                                <ArrowRight size={14} />
                            </button>
                        )}
                        {step === 3 && !importing && progress.current === 0 && (
                            <button 
                                onClick={handleStartImport}
                                className="btn-primary flex items-center gap-2 !px-6 !py-3 !text-xs shadow-lg shadow-primary/20"
                            >
                                <Play size={14} />
                                Start Import
                            </button>
                        )}
                        {progress.current > 0 && !importing && (
                            <button 
                                onClick={onClose}
                                className="btn-primary !px-6 !py-3 !text-xs shadow-lg shadow-primary/20"
                            >
                                Close Wizard
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
