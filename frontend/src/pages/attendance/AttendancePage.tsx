import React, { useState, useEffect } from 'react';
import { 
    Users, Search, CheckCircle2, XCircle, 
    Clock, Save, Loader2, UserCheck,
    Calendar, ChevronRight, Sparkles
} from 'lucide-react';
import { getClassrooms } from '../../api/classroom.api';
import type { Classroom } from '../../api/classroom.api';
import { getAttendanceRoster, saveAttendance } from '../../api/attendance.api';
import { ComboBox } from '../../components/ui/ComboBox';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

import { useSearchParams } from 'react-router-dom';

const AttendancePage: React.FC = () => {
    const { notify } = useNotification();
    const { can } = useAuth();
    const [searchParams] = useSearchParams();
    const classIdFromUrl = searchParams.get('classId');
    
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [selectedClass, setSelectedClass] = useState<number | null>(
        classIdFromUrl ? parseInt(classIdFromUrl) : null
    );
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [roster, setRoster] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const isHistoryMode = selectedDate < today;

    useEffect(() => {
        fetchClassrooms();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchRoster();
        }
    }, [selectedClass, selectedDate]);

    const fetchClassrooms = async () => {
        try {
            const res = await getClassrooms({ limit: 100 });
            setClassrooms(res.data);
            if (res.data.length > 0 && !selectedClass) {
                setSelectedClass(res.data[0].id);
            }
        } catch (err) {
            console.error('Failed to load classrooms', err);
        }
    };

    const fetchRoster = async () => {
        if (!selectedClass) return;
        setLoading(true);
        try {
            const res = await getAttendanceRoster(selectedClass, selectedDate);
            // Default to present if no status yet
            const enrichedRoster = res.map((s: any) => ({
                ...s,
                status: s.attendance_status || 'present'
            }));
            setRoster(enrichedRoster);
            setHasChanges(false);
        } catch (err) {
            console.error('Failed to load roster', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = (studentId: number) => {
        if (isHistoryMode || !can('student.attendance:write')) return;
        setRoster(prev => prev.map(s => {
            if (s.student_id === studentId) {
                const statuses = ['present', 'absent', 'late'];
                const currentIndex = statuses.indexOf(s.status);
                const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                return { ...s, status: nextStatus };
            }
            return s;
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!selectedClass || isHistoryMode) return;
        setSaving(true);
        try {
            const records = roster.map(s => ({
                student_id: s.student_id,
                status: s.status
            }));
            await saveAttendance(selectedDate, selectedClass, records);
            notify('success', 'Attendance Saved', 'Presence records have been updated successfully.');
            setHasChanges(false);
        } catch (err: any) {
            notify('error', 'Save Failed', err.message);
        } finally {
            setSaving(false);
        }
    };

    const markAllPresent = () => {
        if (isHistoryMode) return;
        setRoster(prev => prev.map(s => ({ ...s, status: 'present' })));
        setHasChanges(true);
    };

    const filteredRoster = roster.filter(s => {
        const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
        const searchLower = search.toLowerCase();
        return fullName.includes(searchLower) || (s.admission_no || '').toLowerCase().includes(searchLower);
    });

    const stats = {
        present: roster.filter(s => s.status === 'present').length,
        absent: roster.filter(s => s.status === 'absent').length,
        late: roster.filter(s => s.status === 'late').length,
    };

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="bg-surface-dark p-4 rounded-3xl shadow-xl shadow-theme/10">
                        <UserCheck className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">Attendance Roster</h1>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isHistoryMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            {isHistoryMode ? 'Archived Ledger Logs' : 'Live Presence Tracking'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {can('student.attendance:write') && !isHistoryMode && (
                        <button 
                            onClick={markAllPresent}
                            className="btn-ghost flex items-center gap-2 !px-5 !py-3"
                        >
                            <CheckCircle2 size={18} />
                            Universal Presence
                        </button>
                    )}
                    <div className="h-8 w-px bg-slate-200 mx-2 hidden lg:block" />
                    <div className="flex items-center gap-3 bg-[var(--card-bg)] p-2 rounded-2xl border border-[var(--card-border)]/60 shadow-sm">
                        <Calendar size={16} className="text-[var(--text-muted)] ml-2" />
                        <input 
                            type="date" 
                            value={selectedDate}
                            max={today}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 pr-4 cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Selection & Insights */}
            <div className="flex flex-col xl:flex-row justify-between items-center gap-6 bg-[var(--card-bg)] p-3 rounded-[2.5rem] shadow-sm border border-[var(--card-border)]/60">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="w-full md:w-72">
                        <ComboBox
                            value={selectedClass}
                            onChange={val => setSelectedClass(val as number)}
                            placeholder="Select Classroom"
                            options={classrooms.map(c => ({ value: c.id, label: `${c.name} (${c.section})` }))}
                        />
                    </div>
                    <div className="relative flex-1 md:w-96 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                            type="text"
                            placeholder="Filter by student name, ID or roll number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-field-modern !pl-12 !py-3.5 !text-xs !bg-slate-50/50 !border-transparent focus:!bg-[var(--card-bg)] focus:!border-[var(--card-border)] w-full"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-8 px-8 py-3 bg-slate-50/50 rounded-3xl border border-[var(--card-border)]">
                    <div className="text-center group">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 group-hover:scale-110 transition-transform">Present</p>
                        <p className="text-xl font-bold text-[var(--text-main)] leading-none">{stats.present}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200/60" />
                    <div className="text-center group">
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1 group-hover:scale-110 transition-transform">Absent</p>
                        <p className="text-xl font-bold text-[var(--text-main)] leading-none">{stats.absent}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200/60" />
                    <div className="text-center group">
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 group-hover:scale-110 transition-transform">Late</p>
                        <p className="text-xl font-bold text-[var(--text-main)] leading-none">{stats.late}</p>
                    </div>
                </div>
            </div>

            {/* Student Roster Grid */}
            {loading ? (
                <div className="h-[40vh] flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                        <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                    </div>
                    <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">Compiling Roster...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {filteredRoster.map((student) => (
                        <div 
                            key={student.student_id}
                            onClick={() => toggleStatus(student.student_id)}
                            className={`
                                group relative overflow-hidden rounded-[2rem] p-5 transition-all duration-300 transform 
                                ${(isHistoryMode || !can('student.attendance:write')) ? 'cursor-default' : 'cursor-pointer active:scale-95'}
                                border-2
                                ${student.status === 'present' ? 'bg-[var(--card-bg)] border-emerald-100 hover:border-emerald-300 shadow-emerald-500/5' : ''}
                                ${student.status === 'absent' ? 'bg-[var(--card-bg)] border-rose-100 hover:border-rose-300 shadow-rose-500/5' : ''}
                                ${student.status === 'late' ? 'bg-[var(--card-bg)] border-amber-100 hover:border-amber-300 shadow-amber-500/5' : ''}
                                shadow-sm hover:shadow-md
                            `}
                        >
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="relative">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-lg transition-colors duration-500
                                        ${student.status === 'present' ? 'bg-emerald-500 shadow-emerald-500/20' : ''}
                                        ${student.status === 'absent' ? 'bg-rose-500 shadow-rose-500/20' : ''}
                                        ${student.status === 'late' ? 'bg-amber-500 shadow-amber-500/20' : ''}
                                    `}>
                                        {student.first_name[0]}{student.last_name?.[0]}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-xl border-2 border-white flex items-center justify-center transition-colors duration-500
                                        ${student.status === 'present' ? 'bg-emerald-500' : ''}
                                        ${student.status === 'absent' ? 'bg-rose-500' : ''}
                                        ${student.status === 'late' ? 'bg-amber-500' : ''}
                                    `}>
                                        {student.status === 'present' && <CheckCircle2 size={12} className="text-white" />}
                                        {student.status === 'absent' && <XCircle size={12} className="text-white" />}
                                        {student.status === 'late' && <Clock size={12} className="text-white" />}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-0.5 leading-none">#{student.roll_number || 'N/A'}</p>
                                    <h3 className="text-sm font-bold text-[var(--text-main)] truncate leading-tight">{student.first_name} {student.last_name}</h3>
                                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tight mt-1">{student.admission_no}</p>
                                </div>
                                
                                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-[var(--text-muted)] group-hover:translate-x-1 transition-all" />
                            </div>

                            {/* Status Background Accent */}
                            <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity
                                ${student.status === 'present' ? 'bg-emerald-500' : ''}
                                ${student.status === 'absent' ? 'bg-rose-500' : ''}
                                ${student.status === 'late' ? 'bg-amber-500' : ''}
                            `} />
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {roster.length > 0 && (
                <div className="mt-8 flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Showing <span className="text-slate-900">{filteredRoster.length}</span> students
                    </p>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredRoster.length === 0 && (
                <div className="py-32 flex flex-col items-center justify-center text-center px-8">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-8 border border-[var(--card-border)]">
                        <Users size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">Roster Empty</h3>
                    <p className="text-[var(--text-muted)] text-sm font-medium mt-2 max-w-sm">No students matched your current configuration or filters. Try adjusting your selection.</p>
                </div>
            )}

            {/* Floating Action Bar */}
            {hasChanges && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-surface-dark rounded-[2.5rem] p-4 shadow-2xl shadow-theme/40 flex items-center justify-between gap-6 border border-white/10 backdrop-blur-md">
                        <div className="flex items-center gap-4 pl-4">
                            <div className="p-3 bg-[var(--card-bg)]/10 rounded-2xl">
                                <Sparkles size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Staging Updates</p>
                                <p className="text-white font-bold text-sm">Attendance logs are ready to sync</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-[1.5rem] font-bold text-xs flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-primary/20"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {saving ? 'Synchronizing...' : 'Commit Attendance'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendancePage;
