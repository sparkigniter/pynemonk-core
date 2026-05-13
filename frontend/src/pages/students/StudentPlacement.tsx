import { useState, useEffect, useCallback } from 'react';
import {
    Users, Search, Loader2,
    ArrowRight, Building2, UserCheck,
    AlertCircle, GraduationCap, Clock,
    LayoutGrid, List as ListIcon,
    UserPlus
} from 'lucide-react';
import { getStudentList, enrollStudent } from '../../api/student.api';
import { getClassrooms } from '../../api/classroom.api';
import { getGrades } from '../../api/grade.api';
import type { Student } from '../../api/student.api';
import type { Classroom } from '../../api/classroom.api';
import type { Grade } from '../../api/grade.api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAcademics } from '../../contexts/AcademicsContext';

export default function StudentPlacement() {
    const { notify } = useNotification();
    const { currentYear } = useAcademics();

    // Data States
    const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);

    // UI States
    const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Get Grades
            const gradesRes = await getGrades();
            setGrades(gradesRes.data);
            if (gradesRes.data.length > 0 && !selectedGradeId) {
                setSelectedGradeId(gradesRes.data[0].id);
            }

            // 2. Get Unassigned Students (admitted but not yet placed in any classroom)
            const studentsRes = await getStudentList({
                unenrolled: true,
                search: searchQuery,
                grade_id: selectedGradeId || undefined,
                academic_year_id: currentYear?.id
            });
            setUnassignedStudents(studentsRes.data);

            // 3. Get Classrooms for assignment
            if (selectedGradeId) {
                const classroomsRes = await getClassrooms({ grade_id: selectedGradeId });
                setClassrooms(classroomsRes.data);
            }
        } catch (error) {
            notify('error', 'Fetch Error', 'Failed to synchronize placement data');
        } finally {
            setLoading(false);
        }
    }, [selectedGradeId, searchQuery, notify]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAssign = async (classroomId: number) => {
        if (!selectedStudentId || !currentYear) return;

        setProcessingId(selectedStudentId);
        try {
            await enrollStudent(selectedStudentId, {
                classroom_id: classroomId,
                academic_year_id: currentYear.id
            });

            notify('success', 'Student Placed', 'Classroom assignment synchronized successfully.');
            setUnassignedStudents(prev => prev.filter(s => s.id !== selectedStudentId));
            setSelectedStudentId(null);
        } catch (error: any) {
            notify('error', 'Placement Failed', error.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                            <GraduationCap size={28} />
                        </div>
                        <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight font-heading">
                            Student Placement
                        </h1>
                    </div>
                    <p className="text-[var(--text-muted)] font-medium tracking-tight flex items-center gap-2">
                        <Clock size={14} /> Bridge the gap between admission and active enrollment.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-[var(--card-bg)] p-2 rounded-2xl border border-[var(--card-border)] shadow-sm">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary/5 text-indigo-600 shadow-inner' : 'text-[var(--text-muted)] hover:text-slate-600'}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary/5 text-indigo-600 shadow-inner' : 'text-[var(--text-muted)] hover:text-slate-600'}`}
                    >
                        <ListIcon size={20} />
                    </button>
                </div>
            </div>

            {/* Placement Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-280px)]">

                {/* Left Panel: Waiting Room */}
                <div className="lg:col-span-4 bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] flex flex-col shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[var(--card-border)] bg-slate-50/50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                                <Users size={14} className="text-indigo-500" />
                                The Waiting Room
                            </h3>
                            <span className="bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-indigo-500/20">
                                {unassignedStudents.length} Pending
                            </span>
                        </div>

                        <div className="space-y-4">
                            <select
                                value={selectedGradeId || ''}
                                onChange={(e) => setSelectedGradeId(Number(e.target.value))}
                                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                            >
                                {grades.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search student..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                <Loader2 size={32} className="animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Scanning Registry...</p>
                            </div>
                        ) : unassignedStudents.length > 0 ? (
                            unassignedStudents.map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => setSelectedStudentId(student.id)}
                                    className={`w-full text-left group border p-4 rounded-2xl transition-all relative ${selectedStudentId === student.id
                                        ? 'bg-primary/5 border-indigo-200 shadow-lg shadow-theme/10 ring-2 ring-indigo-500/20'
                                        : 'bg-slate-50 border-[var(--card-border)] hover:bg-[var(--card-bg)] hover:shadow-xl hover:shadow-slate-200/50'
                                        } border-l-4 border-l-indigo-500`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center font-black text-indigo-500 shadow-sm overflow-hidden">
                                            {student.avatar_url ? (
                                                <img src={student.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                student.first_name[0]
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800 leading-tight">
                                                {student.first_name} {student.last_name}
                                            </h4>
                                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
                                                ID: {student.admission_no}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all ${selectedStudentId === student.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <ArrowRight size={20} className={selectedStudentId === student.id ? 'text-indigo-500' : 'text-slate-300'} />
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-300 text-center px-10">
                                <UserCheck size={48} className="mb-4 opacity-20" />
                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-tight">Empty Nest</p>
                                <p className="text-[10px] text-slate-300 mt-2">All students for this grade have been placed.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Target Classrooms */}
                <div className="lg:col-span-8 flex flex-col space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Building2 className="text-[var(--text-muted)]" size={20} />
                            <h3 className="text-sm font-black text-slate-800 tracking-tight">Available Classrooms</h3>
                        </div>
                        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--card-bg)] px-3 py-1.5 rounded-full border border-[var(--card-border)]">
                            {classrooms.length} Sections Found
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 custom-scrollbar">
                        {classrooms.map(classroom => (
                            <div key={classroom.id} className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)] p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)]">
                                        <Building2 size={24} />
                                    </div>
                                    <div className="text-right">
                                        <h4 className="text-xl font-black text-slate-800 leading-none">{classroom.name}</h4>
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Section {classroom.section}</p>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-[var(--text-muted)]">Current Load</span>
                                        <span className="font-black text-slate-800">{classroom.student_count || 0} / {classroom.capacity || 40}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-1000"
                                            style={{ width: `${((classroom.student_count || 0) / (classroom.capacity || 40)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-50">
                                    <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Teacher: {classroom.teacher_first_name || 'Unassigned'}</p>
                                    <button
                                        onClick={() => handleAssign(classroom.id)}
                                        disabled={!selectedStudentId || processingId !== null}
                                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/assign ${!selectedStudentId
                                            ? 'bg-slate-50 text-slate-300 border border-[var(--card-border)] cursor-not-allowed'
                                            : 'bg-primary text-white shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95'
                                            }`}
                                    >
                                        {processingId === selectedStudentId ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <>
                                                <UserPlus size={16} />
                                                Assign Here
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}

                        {classrooms.length === 0 && !loading && (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300">
                                <AlertCircle size={48} className="mb-4 opacity-20" />
                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-tight">No Sections Defined</p>
                                <p className="text-[10px] text-slate-300 mt-2">Create classrooms for this grade first.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
