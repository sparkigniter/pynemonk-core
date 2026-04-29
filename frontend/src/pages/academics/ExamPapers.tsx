import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Calendar,
    MapPin,
    Plus,
    Trash2,
    Save,
    ArrowLeft,
    BookOpen,
    RotateCcw,
    ShieldAlert,
    X
} from 'lucide-react';
import { examApi } from '../../api/exam.api';
import { getSubjectList } from '../../api/subject.api';
import { TimetableApi } from '../../api/timetable.api';
import * as staffApi from '../../api/staff.api';
import { ComboBox } from '../../components/ui/ComboBox';
import { useNotification } from '../../contexts/NotificationContext';
import type { Exam } from '../../api/exam.api';
import type { Subject } from '../../api/subject.api';
import type { Staff } from '../../api/staff.api';

export default function ExamPapers() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notify } = useNotification();

    const [exam, setExam] = useState<Exam | null>(null);
    const [papers, setPapers] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [periods, setPeriods] = useState<{ period_number: number, start_time: string, end_time: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Wizard State
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [newPaper, setNewPaper] = useState<any>({
        subject_id: '',
        exam_date: '',
        start_time: '',
        end_time: '',
        room: '',
        max_marks: 100,
        passing_marks: 33,
        user_period: true,
        supervisor_id: ''
    });
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Rescheduling utility state
    const [shiftDays, setShiftDays] = useState<number>(0);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            const [details, subjectsData, periodsData, staffData] = await Promise.all([
                examApi.getExamDetails(parseInt(id)),
                getSubjectList(),
                TimetableApi.getPeriods(),
                staffApi.getStaffList({ limit: 100 }) // Fetch enough staff for supervisor selection
            ]);
            setExam(details);
            setPapers(details.papers || []);
            setSubjects(subjectsData.data);
            setPeriods(periodsData);
            setStaffList(staffData.data);
        } catch (err) {
            notify('error', 'Error', 'Failed to load exam paper configuration');
        } finally {
            setIsLoading(false);
        }
    };

    const isLocked = useMemo(() => {
        if (!exam) return false;
        return new Date(exam.start_date) <= new Date();
    }, [exam]);

    // const addPaper = () => {
    //     setPapers([
    //         ...papers,
    //         {
    //             subject_id: '',
    //             exam_date: exam?.start_date.split('T')[0] || '',
    //             start_time: '',
    //             end_time: '',
    //             room: '',
    //             max_marks: 100,
    //             passing_marks: 33,
    //             user_period: true,
    //             supervisor_id: ''
    //         }
    //     ]);
    // };

    // const updatePaper = (index: number, field: string, value: any) => {
    //     const next = [...papers];
    //     next[index] = { ...next[index], [field]: value };
    //     setPapers(next);
    // };

    const removePaper = async (index: number) => {
        const paper = papers[index];
        if (paper.id) {
            try {
                await examApi.deletePaper(parseInt(id!), paper.id);
                notify('success', 'Deleted', 'Paper removed from schedule.');
            } catch (err) {
                notify('error', 'Error', 'Failed to delete paper. It might have existing marks.');
                return;
            }
        }
        const next = [...papers];
        next.splice(index, 1);
        setPapers(next);
        if (!paper.id) notify('info', 'Removed', 'Draft paper removed.');
    };

    const handleBulkShift = () => {
        if (shiftDays === 0) return;
        const next = papers.map(p => {
            const date = new Date(p.exam_date);
            date.setDate(date.getDate() + shiftDays);
            return { ...p, exam_date: date.toISOString().split('T')[0] };
        });
        setPapers(next);
        notify('info', 'Bulk Rescheduling', `Shifted all papers by ${shiftDays} days.`);
        setShiftDays(0);
    };

    const handleSave = async () => {
        if (!id) return;
        setIsSaving(true);
        try {
            // Logic to sync papers (Update existing or Create new)
            await Promise.all(
                papers.map(p => {
                    // Strip UI-only fields and ensure IDs are integers
                    const payload = {
                        id: p.id ? parseInt(p.id.toString()) : undefined,
                        subject_id: parseInt(p.subject_id.toString()),
                        exam_date: p.exam_date,
                        start_time: p.start_time,
                        end_time: p.end_time,
                        room: p.room,
                        max_marks: parseInt(p.max_marks.toString()),
                        passing_marks: parseInt(p.passing_marks.toString()),
                        user_period: p.user_period,
                        supervisor_id: p.supervisor_id ? parseInt(p.supervisor_id.toString()) : null
                    };
                    return examApi.addPaper(parseInt(id), payload);
                })
            );
            notify('success', 'Updated', 'The exam date sheet has been successfully updated.');
            loadData();
        } catch (err: any) {
            console.error('Save failed:', err);
            notify('error', 'Update Failed', 'Make sure all required fields are filled correctly.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-theme-primary/20 border-t-theme-primary rounded-full animate-spin" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Assembling Date Sheet...</p>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-50 min-h-[calc(100vh-100px)] rounded-[3rem] border border-slate-200 shadow-2xl relative flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(`/exams/${id}/overview`)}
                        className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Exam Date Sheet</h1>
                            <span className="px-3 py-1 bg-theme-primary/10 text-theme-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                                {exam?.name}
                            </span>
                        </div>
                        <p className="text-slate-500 font-medium mt-1">Manage papers, venues, and supervisors for this assessment series.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isLocked && (
                        <div className="flex items-center gap-3 px-6 py-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[10px] font-black uppercase tracking-widest">
                            <ShieldAlert size={16} />
                            Exam In Progress - Locked
                        </div>
                    )}
                    <button
                        onClick={() => {
                            setNewPaper({
                                subject_id: '',
                                exam_date: exam?.start_date.split('T')[0] || '',
                                start_time: '',
                                end_time: '',
                                room: '',
                                max_marks: 100,
                                passing_marks: 33,
                                user_period: true,
                                supervisor_id: ''
                            });
                            setWizardStep(1);
                            setIsWizardOpen(true);
                        }}
                        disabled={isLocked}
                        className="flex items-center gap-3 px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-30"
                    >
                        <Plus size={18} />
                        Add New Paper
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLocked}
                        className="flex items-center gap-3 px-10 py-3.5 bg-theme-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-theme-primary/20 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {isSaving ? 'Saving...' : 'Finalize Schedule'}
                    </button>
                </div>
            </header>

            {/* Bulk Utilities */}
            {!isLocked && (
                <div className="flex items-center gap-6 mb-8 px-4 py-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 text-slate-400">
                        <RotateCcw size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Bulk Rescheduling</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1 max-w-sm">
                        <input
                            type="number"
                            placeholder="Days (e.g. 2 or -2)"
                            className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:bg-white transition-all"
                            value={shiftDays || ''}
                            onChange={(e) => setShiftDays(parseInt(e.target.value) || 0)}
                        />
                        <button
                            onClick={handleBulkShift}
                            disabled={shiftDays === 0}
                            className="px-6 py-3 bg-theme-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-20 shadow-lg shadow-theme-primary/10"
                        >
                            Shift Dates
                        </button>
                    </div>
                    <div className="h-8 w-px bg-slate-100 mx-4" />
                    <p className="text-[10px] font-bold text-slate-400 italic">Adjust entire exam timeline instantly (e.g. to postpone for holidays).</p>
                </div>
            )}

            {/* Papers List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-12 space-y-6">
                {papers.map((paper, idx) => {
                    const subject = subjects.find(s => s.id?.toString() === paper.subject_id?.toString());
                    const supervisor = staffList.find(s => s.id?.toString() === paper.supervisor_id?.toString());
                    const startTime = (paper.start_time || '').slice(0, 5);
                    const endTime = (paper.end_time || '').slice(0, 5);

                    return (
                        <div key={paper.id || `staged-${idx}`} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-slate-900 text-white rounded-[1.25rem] flex items-center justify-center font-black text-lg shadow-lg shadow-slate-900/10">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{subject?.name || 'New Paper'}</h3>
                                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                            {paper.exam_date || 'Date TBD'} • {startTime || '--:--'} - {endTime || '--:--'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={isLocked}
                                        onClick={() => removePaper(idx)}
                                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supervisor</p>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                                            {supervisor ? supervisor.first_name[0] : '?'}
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">{supervisor ? `${supervisor.first_name} ${supervisor.last_name}` : 'Not Assigned'}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Venue</p>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                        <MapPin size={16} className="text-slate-400" />
                                        <span className="text-xs font-bold text-slate-700">{paper.room || 'TBD'}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assessment</p>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                        <div className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-black">
                                            {paper.passing_marks}/{paper.max_marks}
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">Min. Passing</span>
                                    </div>
                                </div>
                                <div className="flex items-end justify-end">
                                    <button
                                        disabled={isLocked}
                                        onClick={() => {
                                            setNewPaper(paper);
                                            setEditingIndex(idx);
                                            setWizardStep(1);
                                            setIsWizardOpen(true);
                                        }}
                                        className="px-6 py-3 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 rounded-xl transition-all"
                                    >Edit Details</button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {papers.length === 0 && (
                    <div className="bg-white rounded-[3.5rem] border border-dashed border-slate-200 p-24 text-center">
                        <BookOpen size={40} className="text-slate-200 mx-auto mb-6" />
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Empty Date Sheet</h3>
                        <button
                            onClick={() => setIsWizardOpen(true)}
                            className="mt-8 px-10 py-4 bg-theme-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-theme-primary/20"
                        >Add First Paper</button>
                    </div>
                )}
            </div>

            {/* PAPER WIZARD MODAL */}
            {isWizardOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight uppercase">Add Paper Workflow</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                                    Step {wizardStep} of 3 • {wizardStep === 1 ? 'Curriculum' : wizardStep === 2 ? 'Logistics' : 'Metrics'}
                                </p>
                            </div>
                            <button onClick={() => setIsWizardOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-12 space-y-10">
                            {/* STEP 1: CURRICULUM */}
                            {wizardStep === 1 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <ComboBox
                                        label="Subject"
                                        placeholder="Select Subject"
                                        value={newPaper.subject_id?.toString() || ''}
                                        onChange={val => setNewPaper({ ...newPaper, subject_id: val })}
                                        options={subjects.map(s => ({ value: s.id?.toString() || '', label: `${s.name} (${s.code || 'N/A'})` }))}
                                    />
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center ml-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exam Date</label>
                                                <span className="text-[8px] font-bold text-indigo-500 uppercase">Within Window</span>
                                            </div>
                                            <div className="relative">
                                                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <input
                                                    type="date"
                                                    min={exam?.start_date.split('T')[0]}
                                                    max={exam?.end_date.split('T')[0]}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:bg-white transition-all shadow-inner"
                                                    value={newPaper.exam_date}
                                                    onChange={e => setNewPaper({ ...newPaper, exam_date: e.target.value })}
                                                />
                                            </div>
                                            <p className="text-[9px] text-slate-400 ml-2 italic">Scheduled: {exam?.start_date.split('T')[0]} to {exam?.end_date.split('T')[0]}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center ml-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timing Mode</label>
                                                <button
                                                    onClick={() => setNewPaper({ ...newPaper, user_period: !newPaper.user_period })}
                                                    className="text-[10px] font-black text-theme-primary uppercase tracking-widest hover:opacity-70 transition-all"
                                                >
                                                    {newPaper.user_period ? 'Switch to Manual' : 'Switch to Slots'}
                                                </button>
                                            </div>
                                            {newPaper.user_period ? (
                                                <ComboBox
                                                    placeholder="Select Slot"
                                                    value={periods.find(p => (p.start_time || '').slice(0, 5) === (newPaper.start_time || '').slice(0, 5))?.period_number?.toString() || ''}
                                                    onChange={val => {
                                                        const p = periods.find(per => per.period_number?.toString() === val);
                                                        if (p) setNewPaper({ ...newPaper, start_time: p.start_time, end_time: p.end_time });
                                                    }}
                                                    options={periods.map(p => ({
                                                        value: p.period_number?.toString() || '',
                                                        label: `Period ${p.period_number} (${(p.start_time || '').slice(0, 5)} - ${(p.end_time || '').slice(0, 5)})`
                                                    }))}
                                                />
                                            ) : (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        type="time"
                                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:bg-white transition-all shadow-inner text-sm"
                                                        value={newPaper.start_time ? newPaper.start_time.slice(0, 5) : ''}
                                                        onChange={e => setNewPaper({ ...newPaper, start_time: e.target.value })}
                                                    />
                                                    <input
                                                        type="time"
                                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:bg-white transition-all shadow-inner text-sm"
                                                        value={newPaper.end_time ? newPaper.end_time.slice(0, 5) : ''}
                                                        onChange={e => setNewPaper({ ...newPaper, end_time: e.target.value })}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: LOGISTICS */}
                            {wizardStep === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Venue / Exam Room</label>
                                        <div className="relative">
                                            <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="text"
                                                placeholder="e.g. Main Hall, Room 102"
                                                className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-slate-700 outline-none focus:bg-white transition-all"
                                                value={newPaper.room}
                                                onChange={e => setNewPaper({ ...newPaper, room: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <ComboBox
                                        label="Exam Supervisor"
                                        placeholder="Search for faculty member..."
                                        value={newPaper.supervisor_id?.toString() || ''}
                                        onChange={val => setNewPaper({ ...newPaper, supervisor_id: val })}
                                        options={staffList.map(s => ({ value: s.id?.toString() || '', label: `${s.first_name} ${s.last_name} (${s.designation || 'Staff'})` }))}
                                    />
                                </div>
                            )}

                            {/* STEP 3: METRICS */}
                            {wizardStep === 3 && (
                                <div className="space-y-8 animate-in zoom-in-95">
                                    <div className="grid grid-cols-2 gap-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Maximum Marks</label>
                                            <input
                                                type="number"
                                                className="w-full px-10 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-2xl text-slate-800 text-center outline-none focus:bg-white transition-all"
                                                value={newPaper.max_marks}
                                                onChange={e => setNewPaper({ ...newPaper, max_marks: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Passing Threshold</label>
                                            <input
                                                type="number"
                                                className="w-full px-10 py-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] font-black text-2xl text-emerald-600 text-center outline-none focus:bg-white transition-all"
                                                value={newPaper.passing_marks}
                                                onChange={e => setNewPaper({ ...newPaper, passing_marks: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs font-medium text-slate-400 text-center px-12">
                                        These values will be used as default for marks entry and result calculations for this specific paper.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                {wizardStep > 1 && (
                                    <button
                                        onClick={() => setWizardStep(wizardStep - 1)}
                                        className="flex-1 py-4 border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-all"
                                    >Previous Step</button>
                                )}
                                <button
                                    onClick={() => {
                                        if (wizardStep < 3) setWizardStep(wizardStep + 1);
                                        else {
                                            const persist = async () => {
                                                try {
                                                    setIsSaving(true);
                                                    const payload = {
                                                        id: editingIndex !== null ? papers[editingIndex].id : undefined,
                                                        subject_id: parseInt(newPaper.subject_id),
                                                        exam_date: newPaper.exam_date,
                                                        start_time: newPaper.start_time,
                                                        end_time: newPaper.end_time,
                                                        room: newPaper.room,
                                                        max_marks: parseInt(newPaper.max_marks),
                                                        passing_marks: parseInt(newPaper.passing_marks),
                                                        user_period: newPaper.user_period,
                                                        supervisor_id: newPaper.supervisor_id ? parseInt(newPaper.supervisor_id) : null
                                                    };
                                                    
                                                    await examApi.addPaper(parseInt(id!), payload);
                                                    notify('success', 'Success', 'Paper schedule has been persisted.');
                                                    setIsWizardOpen(false);
                                                    setEditingIndex(null);
                                                    loadData(); // Refresh list from server
                                                } catch (err) {
                                                    notify('error', 'Persistence Error', 'Failed to save paper schedule. Please check all fields.');
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            };
                                            persist();
                                        }
                                    }}
                                    disabled={!newPaper.subject_id || !newPaper.exam_date || !newPaper.start_time || isSaving}
                                    className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all disabled:opacity-20"
                                >
                                    {isSaving ? 'Persisting...' : wizardStep === 3 ? 'Finish & Save' : 'Continue Workflow'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
