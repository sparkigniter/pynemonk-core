import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    User,
    Trash2,
    Plus,
    X,
    Check,
    Loader2,
    Lock,
    Sparkles,
    Pin,
    ChevronRight
} from 'lucide-react';
import { ComboBox } from '../../components/ui/ComboBox';
import { useNotification } from '../../contexts/NotificationContext';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { TimetableApi } from '../../api/timetable.api';
import type { TimetableEntry } from '../../api/timetable.api';
import { getClassrooms } from '../../api/classroom.api';
import type { Classroom } from '../../api/classroom.api';
import { getSubjectList, getAssignments, assignTeacher } from '../../api/subject.api';
import { getStaffList } from '../../api/staff.api';
import type { Staff } from '../../api/staff.api';
import type { Subject, Assignment } from '../../api/subject.api';
import { getGrades } from '../../api/grade.api';
import type { Grade } from '../../api/grade.api';
import { academicsApi } from '../../api/academics.api';
import { useAuth } from '../../contexts/AuthContext';

// ── Components ───────────────────────────────────────────────────────────────

const DraggableResource = ({
    id,
    type,
    name,
    subtitle,
    color,
    icon: Icon,
    onClick,
    canWrite
}: {
    id: string;
    type: 'subject' | 'teacher';
    name: string;
    subtitle?: string;
    color: string;
    icon: any;
    onClick?: () => void;
    canWrite?: boolean;
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id,
        data: { type, name, resourceId: id.split('-').pop() },
        disabled: id.includes('suggestion') ? false : !canWrite
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={(e) => {
                if (onClick) {
                    e.stopPropagation();
                    onClick();
                }
            }}
            className={`
                flex items-center gap-3 p-3 rounded-2xl mb-2 cursor-grab active:cursor-grabbing transition-all border border-[var(--card-border)] touch-none
                ${isDragging
                    ? 'opacity-40 scale-95 border-dashed border-primary/30'
                    : `bg-[var(--card-bg)] shadow-sm hover:shadow-md hover:border-[var(--card-border)] hover:-translate-y-0.5`}
            `}
        >
            <div className={`p-2 rounded-xl text-slate-600 ${color.includes('emerald') ? 'bg-emerald-50 text-emerald-600' : color.includes('amber') ? 'bg-amber-50 text-amber-600' : 'bg-primary/5 text-primary'}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate leading-tight text-slate-800">{name}</p>
                {subtitle && <p className="text-[9px] font-bold opacity-60 uppercase tracking-tight truncate mt-0.5 text-[var(--text-muted)]">{subtitle}</p>}
            </div>
        </div>
    );
};

const DraggableEntry = ({
    entry,
    onDelete,
    onToggleSticky,
    onClick,
    canWrite
}: {
    entry: TimetableEntry;
    onDelete: (id: number) => void;
    onToggleSticky: (id: number, current: boolean) => void;
    onClick: (entry: TimetableEntry) => void;
    canWrite?: boolean;
}) => {
    const isDraft = entry.id! < 0;
    const isSticky = (entry as any).is_sticky;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `entry-${entry.id!}`,
        data: { type: 'entry', entry },
        disabled: !canWrite
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
        opacity: isDragging ? 0.6 : 1
    } : undefined;

    const getSubjectColor = (name: string) => {
        const colors = [
            'bg-primary', 'bg-emerald-500', 'bg-amber-500',
            'bg-rose-500', 'bg-sky-500', 'bg-violet-500',
            'bg-fuchsia-500', 'bg-teal-500', 'bg-orange-500'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const subjectColor = getSubjectColor(entry.subject_name || 'Subject');

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onClick(entry)}
            className={`
                h-full w-full rounded-xl p-3 flex flex-col justify-between overflow-hidden group/entry cursor-grab active:cursor-grabbing border transition-all relative touch-none
                ${isDraft
                    ? 'bg-[var(--card-bg)] border-primary border-dashed text-primary ring-4 ring-primary/5'
                    : 'bg-[var(--card-bg)] border-[var(--card-border)] hover:border-[var(--card-border)] shadow-sm'}
            `}
        >
            {!isDraft && <div className={`absolute top-0 left-0 bottom-0 w-1 ${subjectColor}`} />}

            <div className="relative">
                <div className="flex items-start justify-between mb-1">
                    <p className={`text-[11px] font-bold truncate uppercase tracking-tight leading-tight ${isDraft ? 'text-primary' : 'text-[var(--text-main)]'}`}>
                        {entry.subject_name}
                    </p>
                    {!isDraft && canWrite && (
                        <button
                            onPointerDown={(e) => { e.stopPropagation(); onToggleSticky(entry.id!, !!isSticky); }}
                            className={`p-1 rounded-md transition-all ${isSticky ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-[var(--text-muted)] hover:bg-slate-50'}`}
                            title={isSticky ? "Unpin this period" : "Pin this period"}
                        >
                            {isSticky ? <Pin size={10} className="fill-current" /> : <Pin size={10} />}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1.5 opacity-90">
                    <div className={`p-0.5 rounded-md ${isDraft ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-[var(--text-muted)]'}`}>
                        <User className="w-3 h-3" />
                    </div>
                    <p className={`text-[9px] font-bold truncate ${isDraft ? 'text-primary/90' : 'text-[var(--text-muted)]'}`}>
                        {entry.teacher_name}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-2">
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${isDraft ? 'bg-primary/5 text-primary' : 'bg-slate-50 text-[var(--text-muted)]'}`}>
                    <Clock className="w-2.5 h-2.5" />
                    <span className="text-[9px] font-bold uppercase tracking-tight">
                        {entry.start_time.slice(0, 5)}
                    </span>
                </div>
                {canWrite && (
                    <button
                        onPointerDown={(e) => { e.stopPropagation(); entry.id && onDelete(entry.id); }}
                        className={`p-1.5 transition-all rounded-lg ${isDraft ? 'text-primary/40 hover:text-rose-500 hover:bg-rose-50' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                )}
            </div>

            {isSticky && (
                <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center pointer-events-none opacity-5">
                    <Lock size={16} className="text-amber-600" />
                </div>
            )}
        </div>
    );
};

const DroppableSlot = ({ 
    id, 
    children, 
    isConflict, 
    isHighlighted, 
    isSelected,
    onClick 
}: { 
    id: string; 
    children?: React.ReactNode; 
    isConflict?: boolean; 
    isHighlighted?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
}) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={`
                p-1.5 border-r border-[var(--card-border)] relative group/cell min-h-[110px] transition-all duration-300 cursor-pointer
                ${isOver ? (isConflict ? 'bg-rose-50 ring-2 ring-rose-200 ring-inset z-10' : 'bg-primary/5 ring-2 ring-primary/20 ring-inset z-10') : 'hover:bg-slate-50/50'}
                ${isHighlighted ? 'bg-amber-50/50 ring-1 ring-amber-100 ring-inset' : ''}
                ${isSelected ? 'bg-primary/5 ring-2 ring-primary/10 ring-inset z-10' : ''}
                ${isConflict && !isOver ? 'bg-rose-50/30' : ''}
            `}
        >
            <div className="h-full w-full rounded-xl transition-all">
                {children}
            </div>
            {!children && !id.startsWith('break-') && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-all duration-500 scale-90 group-hover/cell:scale-100 pointer-events-none">
                    <div className="bg-[var(--card-bg)] p-1.5 rounded-lg shadow-sm border border-[var(--card-border)]">
                        {isConflict ? <X className="w-3.5 h-3.5 text-rose-500" /> : <Plus className="w-3.5 h-3.5 text-primary" />}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Main Page ────────────────────────────────────────────────────────────────

const DAYS = [
    { id: 1, name: 'Mon', fullName: 'Monday' },
    { id: 2, name: 'Tue', fullName: 'Tuesday' },
    { id: 3, name: 'Wed', fullName: 'Wednesday' },
    { id: 4, name: 'Thu', fullName: 'Thursday' },
    { id: 5, name: 'Fri', fullName: 'Friday' },
    { id: 6, name: 'Sat', fullName: 'Saturday' },
];

const TIME_SLOTS = Array.from({ length: 9 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
});

const Timetable: React.FC = () => {
    const { notify } = useNotification();
    const { can } = useAuth();
    const canWrite = can('timetable:write');
    const [grades, setGrades] = useState<Grade[]>([]);
    const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [selectedClassroom, setSelectedClassroom] = useState<number | null>(null);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [activeYearId, setActiveYearId] = useState<number | null>(null);
    const [entries, setEntries] = useState<TimetableEntry[]>([]);
    const [originalEntries, setOriginalEntries] = useState<TimetableEntry[]>([]);
    const [breaks, setBreaks] = useState<{ id: number, name: string, start_time: string, end_time: string }[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<{ day: number, time: string } | null>(null);
    const [globalSchedule, setGlobalSchedule] = useState<any[]>([]);
    const [highlightedTeacherId, setHighlightedTeacherId] = useState<number | null>(null);
    const [dragConflict, setDragConflict] = useState<string | null>(null);
    const [activeDragItem, setActiveDragItem] = useState<any>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => { loadInitialData(); }, []);
    useEffect(() => { if (selectedGrade) loadClassrooms(selectedGrade); }, [selectedGrade]);
    useEffect(() => { if (selectedClassroom) loadTimetable(selectedClassroom); }, [selectedClassroom]);

    const loadInitialData = async () => {
        try {
            const [gradeRes, staffData, yearsData, breaksData] = await Promise.all([
                getGrades(),
                getStaffList({ limit: 100 }),
                academicsApi.getYears(),
                TimetableApi.getBreaks()
            ]);
            setGrades(gradeRes.data);
            setStaff(staffData.data);
            setBreaks(breaksData);
            if (yearsData && yearsData.length > 0) {
                const activeYear = yearsData.find((y: any) => y.is_current) || yearsData[0];
                setActiveYearId(activeYear.id);
            }
        } catch (err) { console.error(err); }
    };

    const loadClassrooms = async (gradeId: number) => {
        const [classroomsData, subjectsData] = await Promise.all([
            getClassrooms({ grade_id: gradeId }),
            getSubjectList({ grade_id: gradeId })
        ]);
        setClassrooms(classroomsData.data);
        setSubjects(subjectsData.data);
    };

    const loadTimetable = async (classroomId: number) => {
        try {
            const [timetableData, assignmentsData, globalData] = await Promise.all([
                TimetableApi.getByClassroom(classroomId),
                getAssignments({ classroom_id: classroomId }),
                TimetableApi.getGlobalSchedule()
            ]);
            setEntries(timetableData);
            setOriginalEntries(JSON.parse(JSON.stringify(timetableData)));
            setAssignments(assignmentsData);
            setGlobalSchedule(globalData);
            setIsDirty(false);
        } catch (err) { notify('error', 'Load Failed', 'Failed to load timetable'); }
    };

    const handleDeleteEntry = (id: number) => {
        setEntries(prev => prev.filter(e => e.id !== id));
        setIsDirty(true);
    };

    const handleSaveChanges = async () => {
        if (!selectedClassroom || !activeYearId) return;
        setIsSaving(true);
        try {
            const toCreate = entries.filter(e => e.id! < 0);
            const toUpdate = entries.filter(e => e.id! > 0 && JSON.stringify(e) !== JSON.stringify(originalEntries.find(oe => oe.id === e.id)));
            const toDeleteIds = originalEntries.filter(oe => !entries.find(e => e.id === oe.id)).map(oe => oe.id!);

            await Promise.all([
                ...toCreate.map(e => {
                    const { id, subject_name, teacher_name, ...payload } = e as any;
                    return TimetableApi.create(payload);
                }),
                ...toUpdate.map(e => {
                    const { id, subject_name, teacher_name, ...payload } = e as any;
                    return TimetableApi.update(id, payload);
                }),
                ...toDeleteIds.map(id => TimetableApi.delete(id))
            ]);

            await TimetableApi.finalize(selectedClassroom);
            loadTimetable(selectedClassroom);
            notify('success', 'Changes Saved & Finalized', 'Timetable is now saved and locked for future auto-generation.');
        } catch (err: any) {
            notify('error', 'Save Failed', err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAutoGenerate = async () => {
        if (!selectedClassroom) return;
        if (isDirty && !confirm("Unsaved changes will be discarded. Continue?")) return;

        setIsGenerating(true);
        try {
            const res = await TimetableApi.autoGenerate(selectedClassroom);
            if (res.success) {
                notify('success', 'Magic Complete', 'Timetable auto-generated while respecting breaks and sticky periods.');
                loadTimetable(selectedClassroom);
            }
        } catch (err: any) {
            notify('error', 'Generation Failed', err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleToggleSticky = async (id: number, current: boolean) => {
        if (id < 0) return;
        try {
            await TimetableApi.toggleSticky(id, !current);
            setEntries(prev => prev.map(e => e.id === id ? { ...e, is_sticky: !current } : e));
            setOriginalEntries(prev => prev.map(e => e.id === id ? { ...e, is_sticky: !current } : e));
        } catch (err: any) { notify('error', 'Update Failed', err.message); }
    };

    const handleCreateBreak = async (data: { name: string, start_time: string, end_time: string }) => {
        try {
            const res = await TimetableApi.createBreak(data);
            setBreaks([...breaks, res]);
            notify('success', 'Break Created', `${data.name} added to schedule.`);
        } catch (err: any) { notify('error', 'Failed', err.message); }
    };

    const handleDeleteBreak = async (id: number) => {
        try {
            await TimetableApi.deleteBreak(id);
            setBreaks(breaks.filter(b => b.id !== id));
            notify('success', 'Break Removed', 'Slot available.');
        } catch (err: any) { notify('error', 'Failed', err.message); }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragItem(event.active);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) { setDragConflict(null); return; }

        const overId = over.id as string;
        if (overId.startsWith('break-')) { setDragConflict(null); return; }

        const [overDay, overStartTime] = overId.split('-');
        const day = parseInt(overDay);
        let teacherIdToCheck: number | null = null;
        
        if (active.data.current?.type === 'subject') {
            const subjectId = active.id.toString().split('-')[1];
            const assignment = assignments.find(a => Number(a.subject_id) === Number(subjectId));
            teacherIdToCheck = assignment?.staff_id ? Number(assignment.staff_id) : null;
        } else if (active.data.current?.type === 'teacher') {
            teacherIdToCheck = Number(active.id.toString().split('-')[1]);
        }

        if (teacherIdToCheck) {
            const conflict = globalSchedule.find(entry => 
                Number(entry.teacher_id) === teacherIdToCheck && 
                Number(entry.day_of_week) === day && 
                entry.start_time.startsWith(overStartTime) &&
                Number(entry.classroom_id) !== Number(selectedClassroom)
            );
            setDragConflict(conflict ? overId : null);
        } else {
            setDragConflict(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setDragConflict(null);
        if (!over || !selectedClassroom) return;

        if (dragConflict) {
            notify('error', 'Scheduling Conflict', 'This teacher is already assigned to another class during this period.');
            return;
        }

        const targetId = over.id as string;
        let day: number, startTime: string;

        if (targetId.startsWith('entry-')) {
            const overEntry = entries.find(e => `entry-${e.id}` === targetId);
            if (!overEntry) return;
            day = overEntry.day_of_week;
            startTime = overEntry.start_time;
        } else {
            const parts = targetId.split('-');
            if (parts[0] === 'break') return;
            day = parseInt(parts[0]);
            startTime = `${parts[1]}:00`;
        }

        const endTime = `${(parseInt(startTime.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;

        // Handle moving/swapping existing entries
        if (active.data.current?.type === 'entry') {
            const activeEntry = active.data.current.entry;
            const existingAtTarget = entries.find(e => e.day_of_week === day && e.start_time === startTime && e.id !== activeEntry.id);

            if (existingAtTarget) {
                // Swap logic
                const updatedEntries = entries.map(e => {
                    if (e.id === activeEntry.id) return { ...e, day_of_week: day, start_time: startTime, end_time: endTime };
                    if (e.id === existingAtTarget.id) return { ...e, day_of_week: activeEntry.day_of_week, start_time: activeEntry.start_time, end_time: activeEntry.end_time };
                    return e;
                });
                setEntries(updatedEntries);
                setIsDirty(true);
            } else {
                // Simple move
                const updatedEntries = entries.map(e => 
                    e.id === activeEntry.id ? { ...e, day_of_week: day, start_time: startTime, end_time: endTime } : e
                );
                setEntries(updatedEntries);
                setIsDirty(true);
            }
        } 
        // Handle dropping new resources from sidebar
        else if (active.data.current?.type === 'subject') {
            const subjectId = parseInt(active.data.current.resourceId);
            const subjectName = active.data.current.name;
            
            // Find the teacher assigned to this subject in this classroom
            const assignment = assignments.find(a => a.subject_id === subjectId);
            
            const existingAtTarget = entries.find(e => e.day_of_week === day && e.start_time === startTime);
            
            const newEntry: TimetableEntry = {
                id: Math.random() * -1,
                classroom_id: selectedClassroom,
                subject_id: subjectId,
                subject_name: subjectName,
                teacher_id: assignment?.staff_id,
                teacher_name: assignment?.teacher_name || 'Unassigned',
                day_of_week: day,
                start_time: startTime,
                end_time: endTime,
            } as TimetableEntry;

            if (existingAtTarget) {
                // Replace logic
                setEntries(prev => prev.map(e => e.id === existingAtTarget.id ? newEntry : e));
            } else {
                // Add logic
                setEntries(prev => [...prev, newEntry]);
            }
            setIsDirty(true);
        }
        // Handle dropping teachers from sidebar
        else if (active.data.current?.type === 'teacher') {
            const staffId = parseInt(active.data.current.resourceId);
            const teacherName = active.data.current.name;

            const existingAtTarget = entries.find(e => e.day_of_week === day && e.start_time === startTime);

            if (existingAtTarget) {
                // Re-assign teacher logic
                setEntries(prev => prev.map(e => e.id === existingAtTarget.id ? { 
                    ...e, 
                    teacher_id: staffId, 
                    teacher_name: teacherName 
                } : e));
                setIsDirty(true);
            } else {
                // Dragging teacher to empty slot - find a subject they teach in this classroom or overall
                const teacherAssignment = assignments.find(a => Number(a.staff_id) === Number(staffId));
                if (teacherAssignment) {
                    const newEntry: TimetableEntry = {
                        id: Math.random() * -1,
                        classroom_id: selectedClassroom,
                        subject_id: teacherAssignment.subject_id,
                        subject_name: teacherAssignment.subject_name,
                        teacher_id: staffId,
                        teacher_name: teacherName,
                        day_of_week: day,
                        start_time: startTime,
                        end_time: endTime,
                    } as TimetableEntry;
                    setEntries(prev => [...prev, newEntry]);
                    setIsDirty(true);
                } else {
                    notify('warning', 'No Subject Linked', `${teacherName} is not assigned to any subject for this class yet. Assign a subject first.`);
                }
            }
        }
    };

    return (
        <div className="p-8 bg-slate-50/30 min-h-screen font-sans animate-in fade-in duration-500">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="max-w-[1600px] mx-auto">
                    <header className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-6">
                        <div className="flex items-center gap-6">
                            <div className="bg-surface-dark p-4 rounded-3xl shadow-xl shadow-theme/10">
                                <Calendar className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">Academic Timetable</h1>
                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Optimizing Institutional Resources
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 bg-[var(--card-bg)] p-3 rounded-[2rem] shadow-sm border border-[var(--card-border)]/60">
                            <div className="flex items-center gap-2 px-2">
                                <ComboBox value={selectedGrade} onChange={val => setSelectedGrade(val as number)} placeholder="Select Grade" options={grades.map(g => ({ value: g.id, label: g.name }))} />
                                <ChevronRight className="text-slate-200 w-4 h-4" />
                                <ComboBox value={selectedClassroom} onChange={val => setSelectedClassroom(val as number)} disabled={!selectedGrade} placeholder="Select Class" options={classrooms.map(c => ({ value: c.id, label: `${c.name}${c.section}` }))} />
                            </div>
                            
                            <div className="h-8 w-px bg-slate-100 mx-2 hidden md:block" />

                            <div className="flex items-center gap-2">
                                {canWrite && (
                                    <button onClick={() => setIsBreakModalOpen(true)} className="p-3 text-[var(--text-muted)] hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all" title="Break Settings">
                                        <Clock className="w-5 h-5" />
                                    </button>
                                )}

                                {canWrite && (
                                    <button onClick={handleAutoGenerate} disabled={!selectedClassroom || isGenerating} className="btn-primary !bg-amber-500 !shadow-amber-500/10 !border-amber-600/20">
                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        Auto-Optimize
                                    </button>
                                )}

                                {(() => {
                                    if (!canWrite) return null;
                                    const hasUnfinalized = entries.some(e => !(e as any).is_sticky);
                                    if (!isDirty && !hasUnfinalized) return null;
                                    
                                    return (
                                        <button 
                                            onClick={handleSaveChanges} 
                                            disabled={isSaving} 
                                            className="btn-primary animate-in zoom-in-95"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            {isDirty ? 'Commit Changes' : 'Finalize Schedule'}
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    </header>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {canWrite && (
                            <aside className="lg:w-[320px] space-y-6">
                                {selectedSlot && (
                                    <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)] shadow-xl p-6 animate-in slide-in-from-left duration-300 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />

                                        <div className="flex justify-between items-center mb-6 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-surface-dark p-2 rounded-xl text-white">
                                                    <Sparkles size={18} />
                                                </div>
                                                <div>
                                                    <h2 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">Slot Insights</h2>
                                                    <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                                                        {DAYS.find(d => d.id === selectedSlot.day)?.fullName} • {selectedSlot.time}
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={() => setSelectedSlot(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-rose-500 transition-all">
                                                <X size={18} />
                                            </button>
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Available Faculty</p>
                                                <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-tight border border-emerald-100">Collision Free</span>
                                            </div>
                                            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                {staff.filter(s => !globalSchedule.some(entry => 
                                                    Number(entry.teacher_id) === Number(s.id) && 
                                                    Number(entry.day_of_week) === selectedSlot.day && 
                                                    entry.start_time.startsWith(selectedSlot.time.split(':')[0]) &&
                                                    Number(entry.classroom_id) !== Number(selectedClassroom)
                                                )).map(s => (
                                                    <DraggableResource 
                                                        key={`suggestion-${s.id}`} 
                                                        id={`suggestion-${s.id}`} 
                                                        type="teacher" 
                                                        name={`${s.first_name} ${s.last_name}`} 
                                                        color="bg-emerald-500/5 text-emerald-600" 
                                                        icon={User} 
                                                        onClick={() => setHighlightedTeacherId(s.id)}
                                                        canWrite={canWrite}
                                                    />
                                                ))}
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-[var(--card-border)]">
                                                <p className="text-[10px] font-medium text-[var(--text-muted)] leading-relaxed text-center italic">
                                                    Drag faculty into the grid to assign.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm p-6">
                                    <h2 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-6 px-1">Curriculum Matrix</h2>
                                    <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {subjects.map(s => {
                                            const assignment = assignments.find(a => Number(a.subject_id) === Number(s.id));
                                            return (
                                                <DraggableResource 
                                                    key={`subject-${s.id}`} 
                                                    id={`subject-${s.id}`} 
                                                    type="subject" 
                                                    name={s.name} 
                                                    subtitle={assignment ? assignment.teacher_name : 'No Teacher'}
                                                    color="bg-primary/5 text-primary" 
                                                    icon={Clock} 
                                                    canWrite={canWrite}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm p-6">
                                    <h2 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-6 px-1">Faculty Roster</h2>
                                    <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {staff.map(s => {
                                            const teacherAssignments = assignments.filter(a => Number(a.staff_id) === Number(s.id));
                                            const subjectsList = teacherAssignments.map(a => a.subject_name).join(', ') || 'Unassigned';
                                            
                                            return (
                                                <DraggableResource 
                                                    key={`teacher-${s.id}`} 
                                                    id={`teacher-${s.id}`} 
                                                    type="teacher" 
                                                    name={`${s.first_name} ${s.last_name}`} 
                                                    subtitle={subjectsList}
                                                    color="bg-amber-500/5 text-amber-600" 
                                                    icon={User} 
                                                    canWrite={canWrite}
                                                    onClick={() => {
                                                        setHighlightedTeacherId(s.id);
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </aside>
                        )}

                        <main className={`flex-1 ${!canWrite ? 'max-w-7xl mx-auto w-full' : ''}`}>
                            {!selectedClassroom ? (
                                <div className="bg-[var(--card-bg)] rounded-[3rem] border border-[var(--card-border)]/60 p-32 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-8 border border-[var(--card-border)]">
                                        <Clock size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Select Classroom Configuration</h2>
                                    <p className="text-[var(--text-muted)] font-medium mt-2">Initialize a specific classroom to manage its weekly schedule.</p>
                                </div>
                            ) : (
                                <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)]/60 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <div className="min-w-[1000px]">
                                            <div className="grid grid-cols-7 border-b border-[var(--card-border)] bg-slate-50/30">
                                                <div className="p-5 border-r border-[var(--card-border)] flex items-center justify-center text-slate-300"><Clock size={16} /></div>
                                                {DAYS.map(day => <div key={day.id} className="p-5 border-r border-[var(--card-border)] text-center font-bold text-[var(--text-main)] text-[11px] uppercase tracking-widest">{day.name}</div>)}
                                            </div>

                                            <div className="relative">
                                                {TIME_SLOTS.map((time) => {
                                                    const breakInfo = breaks.find(b => b.start_time.startsWith(time.split(':')[0]));
                                                    return (
                                                        <div key={time} className={`grid grid-cols-7 border-b border-slate-50 min-h-[110px] ${breakInfo ? 'bg-slate-50/50' : ''}`}>
                                                            <div className="p-4 border-r border-[var(--card-border)] text-[var(--text-muted)] text-[10px] font-bold flex items-center justify-center"><span>{time}</span></div>
                                                            {DAYS.map(day => {
                                                                const slotId = `${day.id}-${time}`;
                                                                const isConflict = dragConflict === slotId;
                                                                
                                                                const isHighlighted = highlightedTeacherId ? !globalSchedule.some(entry => 
                                                                    Number(entry.teacher_id) === Number(highlightedTeacherId) && 
                                                                    Number(entry.day_of_week) === day.id && 
                                                                    entry.start_time.startsWith(time.split(':')[0])
                                                                ) : false;

                                                                return (
                                                                    <DroppableSlot 
                                                                        key={slotId} 
                                                                        id={breakInfo ? `break-${slotId}` : slotId}
                                                                        isConflict={isConflict}
                                                                        isHighlighted={isHighlighted && !breakInfo}
                                                                        isSelected={selectedSlot?.day === day.id && selectedSlot?.time === time}
                                                                        onClick={() => {
                                                                            if (!breakInfo && entries.filter(e => e.day_of_week === day.id && e.start_time.startsWith(time.split(':')[0])).length === 0) {
                                                                                setSelectedSlot({ day: day.id, time });
                                                                                setHighlightedTeacherId(null);
                                                                            } else {
                                                                                setSelectedSlot(null);
                                                                            }
                                                                        }}
                                                                    >
                                                                        {breakInfo ? (
                                                                            <div className="h-full w-full flex items-center justify-center opacity-40">
                                                                                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] bg-slate-100 px-2 py-1 rounded-md">{breakInfo.name}</span>
                                                                            </div>
                                                                        ) : (
                                                                            entries.filter(e => e.day_of_week === day.id && e.start_time.startsWith(time.split(':')[0])).map(entry => (
                                                                                <DraggableEntry 
                                                                                    key={entry.id} 
                                                                                    entry={entry} 
                                                                                    onDelete={handleDeleteEntry} 
                                                                                    onToggleSticky={handleToggleSticky}
                                                                                    onClick={setSelectedEntry}
                                                                                    canWrite={canWrite}
                                                                                />
                                                                            ))
                                                                        )}
                                                                    </DroppableSlot>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </DndContext>

            {/* Details Modal */}
            {selectedEntry && (
                <div className="fixed inset-0 bg-surface-dark/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[var(--card-bg)] rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-[var(--card-border)]">
                        <div className="p-8 bg-surface-dark text-white relative">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="bg-[var(--card-bg)]/10 p-2 rounded-xl">
                                    <Clock className="w-5 h-5 text-white/80" />
                                </div>
                                <h2 className="text-xl font-bold tracking-tight">Period Analysis</h2>
                            </div>
                            <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest opacity-80">
                                {DAYS.find(d => d.id === selectedEntry.day_of_week)?.fullName} • {selectedEntry.start_time.slice(0, 5)} - {selectedEntry.end_time.slice(0, 5)}
                            </p>
                            <button onClick={() => setSelectedEntry(null)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="flex items-start gap-5 p-5 bg-slate-50 rounded-2xl border border-[var(--card-border)]">
                                <div className="bg-primary/10 p-3.5 rounded-xl">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Subject Unit</p>
                                    <h3 className="text-lg font-bold text-[var(--text-main)]">{selectedEntry.subject_name}</h3>
                                </div>
                            </div>

                             <div className="flex items-start gap-5 p-5 bg-slate-50 rounded-2xl border border-[var(--card-border)]">
                                <div className="bg-amber-500/10 p-3.5 rounded-xl">
                                    <User className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Responsible Faculty</p>
                                    <ComboBox
                                        placeholder="Select Faculty..."
                                        value={selectedEntry.teacher_id?.toString() || ''}
                                        onChange={async (val) => {
                                            if (!val || !selectedClassroom) return;
                                            const staffId = parseInt(val.toString());
                                            const teacher = staff.find(s => s.id === staffId);
                                            if (!teacher) return;

                                            const updatedEntries = entries.map(e => 
                                                e.id === selectedEntry.id 
                                                ? { ...e, teacher_id: staffId, teacher_name: `${teacher.first_name} ${teacher.last_name}` } 
                                                : e
                                            );
                                            setEntries(updatedEntries);
                                            setSelectedEntry(prev => prev ? { 
                                                ...prev, 
                                                teacher_id: staffId, 
                                                teacher_name: `${teacher.first_name} ${teacher.last_name}` 
                                            } : null);
                                            setIsDirty(true);

                                            try {
                                                await assignTeacher({
                                                    staff_id: staffId,
                                                    classroom_id: selectedClassroom,
                                                    subject_id: selectedEntry.subject_id!,
                                                    academic_year_id: activeYearId!
                                                });
                                                notify('success', 'Assignment Updated', `Faculty linked successfully.`);
                                            } catch (err) { console.error(err); }
                                        }}
                                        options={staff.map(s => ({ value: s.id.toString(), label: `${s.first_name} ${s.last_name}` }))}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={() => { handleDeleteEntry(selectedEntry.id!); setSelectedEntry(null); }}
                                    className="btn-ghost !text-rose-500 hover:!bg-rose-50 flex-1 !py-3.5"
                                >
                                    <Trash2 size={16} />
                                    Purge Period
                                </button>
                                <button 
                                    onClick={() => setSelectedEntry(null)}
                                    className="btn-primary flex-1 !py-3.5"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DragOverlay>
                {activeDragItem ? (
                    <div className="opacity-90 scale-105 shadow-2xl">
                        <div className={`
                            flex items-center gap-3 p-4 rounded-2xl bg-[var(--card-bg)] border border-primary shadow-2xl min-w-[220px]
                        `}>
                            <div className="bg-primary/10 p-2 rounded-xl text-primary">
                                {activeDragItem.data.current?.type === 'subject' ? <Clock className="w-5 h-5" /> : <User className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">{activeDragItem.data.current?.name}</p>
                                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                    Allocating {activeDragItem.data.current?.type}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>

            {/* Modals */}
            {isBreakModalOpen && (
                <div className="fixed inset-0 modal-overlay backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[var(--card-bg)] rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden">
                        <div className="p-8 bg-surface-dark text-white flex justify-between items-center">
                            <h2 className="text-lg font-bold uppercase tracking-tight">Institutional Breaks</h2>
                            <button onClick={() => setIsBreakModalOpen(false)} className="text-white/40 hover:text-white transition-colors"><X /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                                {breaks.map(b => (
                                    <div key={b.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-[var(--card-border)]">
                                        <div>
                                            <p className="font-bold text-slate-800">{b.name}</p>
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}</p>
                                        </div>
                                        <button onClick={() => handleDeleteBreak(b.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                {breaks.length === 0 && <p className="text-center py-8 text-[var(--text-muted)] text-sm italic">No break intervals defined.</p>}
                            </div>
                            
                            <div className="p-6 bg-slate-50/50 border border-[var(--card-border)] rounded-[2rem] space-y-5">
                                <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Define New Interval</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight px-1">Label</label>
                                        <input id="break-name" placeholder="e.g. Lunch" className="input-field-modern !py-2.5 !text-xs" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight px-1">Start</label>
                                        <input id="break-start" type="time" className="input-field-modern !py-2.5 !text-xs" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight px-1">End</label>
                                        <input id="break-end" type="time" className="input-field-modern !py-2.5 !text-xs" />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        const n = (document.getElementById('break-name') as HTMLInputElement).value;
                                        const s = (document.getElementById('break-start') as HTMLInputElement).value;
                                        const e = (document.getElementById('break-end') as HTMLInputElement).value;
                                        if (n && s && e) handleCreateBreak({ name: n, start_time: s, end_time: e });
                                    }}
                                    className="btn-primary w-full !py-3.5"
                                >
                                    Register Interval
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Timetable;
