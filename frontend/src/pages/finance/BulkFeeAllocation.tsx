import { useState, useEffect, useMemo } from 'react';
import { 
    Search, Layers, 
    CheckCircle2, Loader2,
    Settings, ArrowRight, UserCheck, CreditCard
} from 'lucide-react';
import { getGrades } from '../../api/grade.api';
import { getClassrooms } from '../../api/classroom.api';
import { getStudentList } from '../../api/student.api';
import { 
    getFeeStructures, 
    getGradeFeeTemplates, 
    saveGradeFeeTemplate,
    bulkAllocate 
} from '../../api/fee.api';
import { useNotification } from '../../contexts/NotificationContext';

export default function BulkFeeAllocation() {
    const { notify } = useNotification();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Data lists
    const [grades, setGrades] = useState<any[]>([]);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [structures, setStructures] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);

    // Selection state
    const [selectedGrade, setSelectedGrade] = useState<string>('');
    const [selectedClassroom, setSelectedClassroom] = useState<string>('');
    const [selectedStructure, setSelectedStructure] = useState<string>('');
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [gData, sData, tData] = await Promise.all([
                getGrades(),
                getFeeStructures(),
                getGradeFeeTemplates()
            ]);
            setGrades(gData.data);
            setStructures(sData);
            setTemplates(tData);
        } catch (err) {
            console.error(err);
            notify('error', 'Fetch Error', 'Failed to load configuration data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedGrade) {
            fetchClassrooms();
            // Auto-select structure from template if exists
            const template = templates.find(t => t.grade_id === parseInt(selectedGrade));
            if (template) {
                setSelectedStructure(template.fee_structure_id.toString());
            } else {
                setSelectedStructure('');
            }
        }
    }, [selectedGrade]);

    const fetchClassrooms = async () => {
        try {
            const data = await getClassrooms();
            setClassrooms(data.data.filter((c: any) => c.grade_id === parseInt(selectedGrade)));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (selectedClassroom) {
            fetchStudents();
        } else {
            setStudents([]);
            setSelectedStudents([]);
        }
    }, [selectedClassroom]);

    const fetchStudents = async () => {
        try {
            const res = await getStudentList({ classroom_id: parseInt(selectedClassroom), limit: 1000 });
            setStudents(res.data);
            setSelectedStudents(res.data.map((s: any) => s.id)); // Default select all
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleStudent = (id: number) => {
        setSelectedStudents(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedStudents.length === filteredStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map(s => s.id));
        }
    };

    const handleSaveTemplate = async () => {
        if (!selectedGrade || !selectedStructure) return;
        try {
            await saveGradeFeeTemplate({
                grade_id: parseInt(selectedGrade),
                fee_structure_id: parseInt(selectedStructure),
                academic_year_id: 1 // TODO: Get current AY
            });
            notify('success', 'Template Saved', 'This mapping will be suggested for future allocations in this grade.');
            const freshTemplates = await getGradeFeeTemplates();
            setTemplates(freshTemplates);
        } catch (err) {
            notify('error', 'Error', 'Failed to save template');
        }
    };

    const handleBulkAllocate = async () => {
        if (selectedStudents.length === 0 || !selectedStructure) {
            notify('error', 'Selection Required', 'Please select at least one student and a fee structure.');
            return;
        }

        try {
            setProcessing(true);
            const res = await bulkAllocate({
                student_ids: selectedStudents,
                fee_structure_id: parseInt(selectedStructure)
            });
            
            notify('success', 'Allocation Successful', `Successfully assigned fees to ${res.successful} students.`);
            if (res.failed > 0) {
                notify('warning', 'Partial Completion', `${res.failed} students could not be processed.`);
            }
            setStep(3);
        } catch (err: any) {
            notify('error', 'Bulk Allocation Failed', err.message);
        } finally {
            setProcessing(false);
        }
    };

    const filteredStudents = useMemo(() => {
        if (!students) return [];
        const search = searchTerm.toLowerCase().trim();
        if (!search) return students;

        return students.filter(s => {
            const firstName = (s.first_name || '').toLowerCase();
            const lastName = (s.last_name || '').toLowerCase();
            const fullName = `${firstName} ${lastName}`.toLowerCase();
            const admNo = (s.admission_no || '').toLowerCase();
            const fatherName = (s.father_name || s.father?.name || '').toLowerCase();
            
            return firstName.includes(search) || 
                   lastName.includes(search) || 
                   fullName.includes(search) || 
                   admNo.includes(search) || 
                   fatherName.includes(search);
        });
    }, [students, searchTerm]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initializing Allocation Engine...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-end px-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                        <CreditCard size={12} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Finance Workflow</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Bulk Fee Allocation</h1>
                    <p className="text-sm font-medium text-slate-400">Map fee structures to student groups with automated grade-level defaults.</p>
                </div>

                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${step === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
                            Step {s}
                        </div>
                    ))}
                </div>
            </div>

            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="premium-card p-10 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                <Layers size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Define Scope</h3>
                                <p className="text-xs text-slate-400 font-medium">Select the target grade and classroom for allocation.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Grade</label>
                                <select 
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                    value={selectedGrade}
                                    onChange={e => setSelectedGrade(e.target.value)}
                                >
                                    <option value="">Select Grade...</option>
                                    {grades.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specific Section</label>
                                <select 
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none disabled:opacity-50"
                                    value={selectedClassroom}
                                    onChange={e => setSelectedClassroom(e.target.value)}
                                    disabled={!selectedGrade}
                                >
                                    <option value="">Select Section...</option>
                                    {classrooms.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-10 space-y-8 bg-slate-900 text-white border-none shadow-2xl shadow-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                                <Settings size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black">Fee Mapping</h3>
                                <p className="text-xs text-white/50 font-medium">Assign the base fee structure for this group.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Fee Structure</label>
                                <select 
                                    className="w-full p-4 bg-white/10 border-2 border-transparent focus:border-primary focus:bg-white focus:text-slate-900 rounded-2xl text-sm font-bold transition-all outline-none"
                                    value={selectedStructure}
                                    onChange={e => setSelectedStructure(e.target.value)}
                                >
                                    <option value="">Choose Structure...</option>
                                    {structures.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.total_amount?.toLocaleString()})</option>
                                    ))}
                                </select>
                            </div>

                            {selectedGrade && selectedStructure && (
                                <button 
                                    onClick={handleSaveTemplate}
                                    className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    <CheckCircle2 size={14} />
                                    Set as Grade Default
                                </button>
                            )}

                            <button 
                                onClick={() => setStep(2)}
                                disabled={!selectedClassroom || !selectedStructure}
                                className="w-full py-5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                Continue to Review
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                        <div className="flex items-center gap-6">
                            <button onClick={() => setStep(1)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
                                <ArrowRight className="rotate-180" size={20} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Review Selection</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Assigning {structures.find(s => s.id === parseInt(selectedStructure))?.name} to {selectedStudents.length} students
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search by name, ID or father's name..."
                                    className="pl-12 pr-12 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:shadow-lg transition-all outline-none w-80"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button 
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors"
                                    >
                                        <ArrowRight className="rotate-180" size={14} />
                                    </button>
                                )}
                            </div>
                            <button 
                                onClick={handleBulkAllocate}
                                disabled={processing || selectedStudents.length === 0}
                                className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-3 disabled:opacity-50"
                            >
                                {processing ? <Loader2 className="animate-spin" size={16} /> : <UserCheck size={16} />}
                                Finalize & Allocate
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-8 py-5">
                                        <button 
                                            onClick={handleSelectAll}
                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                selectedStudents.length === filteredStudents.length ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white'
                                            }`}
                                        >
                                            {selectedStudents.length === filteredStudents.length && <CheckCircle2 size={14} />}
                                        </button>
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Identity</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission No.</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Add-ons</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="space-y-4">
                                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                                                    <Search size={32} />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching students found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {filteredStudents.map(student => (
                                    <tr key={student.id} className={`group hover:bg-slate-50/50 transition-colors ${selectedStudents.includes(student.id) ? 'bg-primary/5' : ''}`}>
                                        <td className="px-8 py-5">
                                            <button 
                                                onClick={() => handleToggleStudent(student.id)}
                                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                    selectedStudents.includes(student.id) ? 'bg-primary border-primary text-white' : 'border-slate-200 bg-white'
                                                }`}
                                            >
                                                {selectedStudents.includes(student.id) && <CheckCircle2 size={14} />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase group-hover:bg-primary group-hover:text-white transition-all">
                                                    {student.first_name[0]}{student.last_name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{student.first_name} {student.last_name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Class of 2026</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-mono font-bold text-slate-400">
                                            {student.admission_no}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Active</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-primary transition-colors">
                                                    <Settings size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="p-20 text-center space-y-8 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200">
                        <CheckCircle2 size={48} />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Mission Accomplished!</h2>
                        <p className="text-lg font-medium text-slate-400 max-w-xl mx-auto">
                            Bulk fee allocation has been finalized. Financial records and invoices have been synchronized across all selected students.
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-4 pt-6">
                        <button 
                            onClick={() => setStep(1)}
                            className="px-10 py-5 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                        >
                            Perform Another Allocation
                        </button>
                        <button 
                            onClick={() => window.location.href = '/accounting/ar'}
                            className="px-10 py-5 bg-white border border-slate-100 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                        >
                            View Invoices
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
