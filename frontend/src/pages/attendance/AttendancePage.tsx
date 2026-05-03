import React, { useState, useEffect } from 'react';
import { 
    Users, Search, CheckCircle2, XCircle, 
    Clock, Save, Loader2, UserCheck
} from 'lucide-react';
import { getClassrooms } from '../../api/classroom.api';
import type { Classroom } from '../../api/classroom.api';
import { getAttendanceRoster, saveAttendance } from '../../api/attendance.api';
import { ComboBox } from '../../components/ui/ComboBox';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const AttendancePage: React.FC = () => {
    const { notify } = useNotification();
    const { can } = useAuth();
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
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
            if (res.data.length > 0) setSelectedClass(res.data[0].id);
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
                enrollment_id: s.enrollment_id,
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
        <div className="max-w-7xl mx-auto pb-32">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <UserCheck className="text-primary" />
                        Daily Attendance
                    </h1>
                    {isHistoryMode ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 mt-1">
                            <Clock size={12} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Past Records</span>
                        </div>
                    ) : (
                        <p className="text-slate-500 font-medium mt-1">Keep track of student attendance easily.</p>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {can('student.attendance:write') && (
                        <button 
                            onClick={markAllPresent}
                            className="px-5 py-2.5 rounded-2xl bg-primary/5 text-primary text-sm font-bold hover:bg-primary/10 transition-all flex items-center gap-2 border border-primary/10"
                        >
                            <CheckCircle2 size={16} />
                            Mark All Present
                        </button>
                    )}
                    <div className="h-10 w-px bg-slate-200 mx-2 hidden md:block" />
                    <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                        <input 
                            type="date" 
                            value={selectedDate}
                            max={today}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 px-3"
                        />
                    </div>
                </div>
            </div>

            {/* Selection & Filters */}
            <div className="bg-white rounded-[2.5rem] p-6 mb-8 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="w-full md:w-72">
                    <ComboBox
                        value={selectedClass}
                        onChange={val => setSelectedClass(val as number)}
                        placeholder="Select Class"
                        options={classrooms.map(c => ({ value: c.id, label: `${c.name} (${c.section})` }))}
                    />
                </div>

                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Search students by name or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                    />
                </div>

                <div className="flex items-center gap-6 px-4 py-2 bg-slate-50 rounded-2xl">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-emerald-500 uppercase">Present</p>
                        <p className="text-lg font-black text-slate-800">{stats.present}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="text-center">
                        <p className="text-[10px] font-black text-rose-500 uppercase">Absent</p>
                        <p className="text-lg font-black text-slate-800">{stats.absent}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="text-center">
                        <p className="text-[10px] font-black text-amber-500 uppercase">Late</p>
                        <p className="text-lg font-black text-slate-800">{stats.late}</p>
                    </div>
                </div>
            </div>

            {/* Student Roster Grid */}
            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredRoster.map((student) => (
                        <div 
                            key={student.student_id}
                            onClick={() => toggleStatus(student.student_id)}
                            className={`
                                group relative overflow-hidden rounded-[2rem] p-5 transition-all duration-300 transform 
                                ${(isHistoryMode || !can('student.attendance:write')) ? 'cursor-default' : 'cursor-pointer active:scale-95'}
                                border-2
                                ${student.status === 'present' ? 'bg-emerald-50/30 border-emerald-100 hover:border-emerald-300 shadow-emerald-100/20' : ''}
                                ${student.status === 'absent' ? 'bg-rose-50/30 border-rose-100 hover:border-rose-300 shadow-rose-100/20' : ''}
                                ${student.status === 'late' ? 'bg-amber-50/30 border-amber-100 hover:border-amber-300 shadow-amber-100/20' : ''}
                                shadow-lg
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg shadow-black/5
                                        ${student.status === 'present' ? 'bg-emerald-500' : ''}
                                        ${student.status === 'absent' ? 'bg-rose-500' : ''}
                                        ${student.status === 'late' ? 'bg-amber-500' : ''}
                                    `}>
                                        {student.first_name[0]}{student.last_name?.[0]}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center
                                        ${student.status === 'present' ? 'bg-emerald-500' : ''}
                                        ${student.status === 'absent' ? 'bg-rose-500' : ''}
                                        ${student.status === 'late' ? 'bg-amber-500' : ''}
                                    ">
                                        {student.status === 'present' && <CheckCircle2 size={12} className="text-white" />}
                                        {student.status === 'absent' && <XCircle size={12} className="text-white" />}
                                        {student.status === 'late' && <Clock size={12} className="text-white" />}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Roll #{student.roll_number || 'N/A'}</p>
                                    <h3 className="font-bold text-slate-800 truncate">{student.first_name} {student.last_name}</h3>
                                    <p className="text-xs text-slate-500 font-medium">{student.admission_no}</p>
                                </div>
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
                <div className="bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-slate-200">
                    <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700">No students found</h3>
                    <p className="text-slate-400">Try adjusting your search or select a different classroom.</p>
                </div>
            )}

            {/* Floating Action Bar */}
            {hasChanges && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-50 animate-bounce-in">
                    <div className="bg-slate-900 rounded-[2rem] p-4 shadow-2xl flex items-center justify-between gap-4 border border-white/10">
                        <div className="px-4">
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Unsaved Changes</p>
                            <p className="text-white font-black">{roster.length} Students ready</p>
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {saving ? 'Saving...' : 'Save Attendance'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendancePage;
