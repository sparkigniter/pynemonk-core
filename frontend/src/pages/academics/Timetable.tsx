import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    User,
    Trash2,
    AlertCircle,
    Plus,
    X,
    Check,
    Loader2
} from 'lucide-react';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { TimetableApi } from '../../api/timetable.api';
import type { TimetableEntry } from '../../api/timetable.api';
import { getClassrooms, createClassroom } from '../../api/classroom.api';
import type { Classroom } from '../../api/classroom.api';
import { getStaffList } from '../../api/staff.api';
import type { Staff } from '../../api/staff.api';
import { getSubjectList, createSubject, assignTeacher, getAssignments } from '../../api/subject.api';
import type { Subject, Assignment } from '../../api/subject.api';
import { getGrades, createGrade } from '../../api/grade.api';
import type { Grade } from '../../api/grade.api';
import { academicsApi } from '../../api/academics.api';

// ── Components ───────────────────────────────────────────────────────────────

// ── Components ───────────────────────────────────────────────────────────────

const DraggableResource = ({
    id,
    type,
    name,
    subtitle,
    color,
    icon: Icon
}: {
    id: string;
    type: 'subject' | 'teacher';
    name: string;
    subtitle?: string;
    color: string;
    icon: any;
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id,
        data: { type, name, resourceId: id.split('-').pop() }
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
            className={`
                flex items-center gap-3 p-3 rounded-2xl mb-2 cursor-grab active:cursor-grabbing transition-all border-2
                ${isDragging 
                    ? 'opacity-40 scale-95 border-dashed border-primary/30' 
                    : `${color} border-slate-100/50 shadow-sm hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5`}
            `}
        >
            <div className="bg-white/80 p-2 rounded-xl shadow-sm border border-slate-100 text-slate-600">
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold truncate leading-tight text-slate-800">{name}</p>
                {subtitle && <p className="text-[10px] font-black opacity-60 uppercase tracking-tighter truncate mt-0.5 text-slate-500">{subtitle}</p>}
            </div>
        </div>
    );
};

const DraggableEntry = ({ entry, onDelete }: { entry: TimetableEntry; onDelete: (id: number) => void }) => {
    const isDraft = entry.id! < 0;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `entry-${entry.id!}`,
        data: { type: 'entry', entry }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
        opacity: isDragging ? 0.6 : 1
    } : undefined;

    // Helper to get a stable color for a subject
    const getSubjectColor = (name: string) => {
        const colors = [
            'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 
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
            className={`
                h-full w-full rounded-2xl p-3 shadow-md flex flex-col justify-between overflow-hidden group/entry cursor-grab active:cursor-grabbing border-2 transition-all relative
                ${isDraft 
                    ? 'bg-white border-primary border-dashed text-primary shadow-primary/5 ring-4 ring-primary/5' 
                    : 'bg-white border-slate-100 hover:border-slate-200 shadow-slate-200/50'}
            `}
        >
            {/* Color Strip Indicator */}
            {!isDraft && <div className={`absolute top-0 left-0 bottom-0 w-1 ${subjectColor}`} />}

            <div className="relative">
                <p className={`text-[12px] font-extrabold truncate uppercase tracking-tight leading-tight mb-1 ${isDraft ? 'text-primary' : 'text-slate-900'}`}>
                    {entry.subject_name}
                </p>
                <div className="flex items-center gap-1.5 opacity-90">
                    <div className={`p-0.5 rounded-md ${isDraft ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                        <User className="w-3 h-3" />
                    </div>
                    <p className={`text-[10px] font-bold truncate ${isDraft ? 'text-primary/90' : 'text-slate-600'}`}>
                        {entry.teacher_name}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-2">
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${isDraft ? 'bg-primary/5 text-primary' : 'bg-slate-50 text-slate-400'}`}>
                    <Clock className="w-2.5 h-2.5" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">
                        {entry.start_time.slice(0, 5)}
                    </span>
                </div>
                <button
                    onPointerDown={(e) => { e.stopPropagation(); entry.id && onDelete(entry.id); }}
                    className={`p-1.5 transition-all rounded-xl ${isDraft ? 'text-primary/40 hover:text-rose-500 hover:bg-rose-50' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

const DroppableSlot = ({ id, children }: { id: string; children?: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={`
                p-2 border-r border-slate-100 relative group/cell min-h-[120px] transition-all duration-300
                ${isOver ? 'bg-primary/5 ring-4 ring-primary/20 ring-inset z-10' : 'hover:bg-slate-50/30'}
            `}
        >
            <div className="h-full w-full rounded-2xl transition-all">
                {children}
            </div>
            {!children && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-all duration-500 scale-90 group-hover/cell:scale-100 pointer-events-none">
                    <div className="bg-white/80 p-2 rounded-xl shadow-sm border border-slate-100">
                        <Plus className="w-4 h-4 text-primary" />
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
    const [activeResourceSchedule, setActiveResourceSchedule] = useState<TimetableEntry[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeDragItem, setActiveDragItem] = useState<{ id: string, type: string, name: string, entry?: TimetableEntry } | null>(null);

    // Modals
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [isClassroomModalOpen, setIsClassroomModalOpen] = useState(false);

    // New Entry Form
    const [newEntry, setNewEntry] = useState<Partial<TimetableEntry>>({
        day_of_week: 1,
        start_time: '08:00',
        end_time: '09:00',
    });

    // Quick Add Forms
    const [newSubject, setNewSubject] = useState({ name: '', code: '' });
    const [newGrade, setNewGrade] = useState({ name: '', slug: '' });
    const [newClassroom, setNewClassroom] = useState({ name: '', section: '' });

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    useEffect(() => { loadInitialData(); }, []);
    useEffect(() => { if (selectedGrade) loadClassrooms(selectedGrade); }, [selectedGrade]);
    useEffect(() => { if (selectedClassroom) loadTimetable(selectedClassroom); }, [selectedClassroom]);

    const loadInitialData = async () => {
        try {
            const [gradesData, staffData, yearsData] = await Promise.all([
                getGrades(),
                getStaffList({ limit: 100 }),
                academicsApi.getYears()
            ]);
            setGrades(gradesData);
            setStaff(staffData.data);
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
            const [timetableData, assignmentsData] = await Promise.all([
                TimetableApi.getByClassroom(classroomId),
                getAssignments({ classroom_id: classroomId })
            ]);
            setEntries(timetableData);
            setOriginalEntries(JSON.parse(JSON.stringify(timetableData)));
            setAssignments(assignmentsData);
            setIsDirty(false);
        } catch (err) { setError("Failed to load timetable"); }
    };

    const validateTimetable = (entriesToValidate: TimetableEntry[]) => {
        for (let i = 0; i < entriesToValidate.length; i++) {
            for (let j = i + 1; j < entriesToValidate.length; j++) {
                const e1 = entriesToValidate[i];
                const e2 = entriesToValidate[j];

                if (e1.day_of_week === e2.day_of_week) {
                    const start1 = e1.start_time;
                    const end1 = e1.end_time;
                    const start2 = e2.start_time;
                    const end2 = e2.end_time;

                    if ((start1 < end2 && end1 > start2)) {
                        return `Conflict: ${e1.subject_name} and ${e2.subject_name} overlap on ${DAYS.find(d => d.id === e1.day_of_week)?.fullName}`;
                    }
                }
            }
        }
        return null;
    };

    const handleCreateEntry = () => {
        if (!selectedClassroom || !newEntry.subject_id || !newEntry.teacher_id) return;

        const subject = subjects.find(c => c.id === newEntry.subject_id);
        const teacher = staff.find(s => s.id === newEntry.teacher_id);

        const entry: TimetableEntry = {
            ...newEntry,
            id: Math.random() * -1, // Temporary negative ID for draft
            classroom_id: selectedClassroom,
            subject_name: subject?.name || '',
            teacher_name: `${teacher?.first_name} ${teacher?.last_name}` || '',
        } as TimetableEntry;

        const updatedEntries = [...entries, entry];
        const validationError = validateTimetable(updatedEntries);
        if (validationError) {
            setError(validationError);
            return;
        }

        setEntries(updatedEntries);
        setIsDirty(true);
        setIsEntryModalOpen(false);
        setError(null);
    };

    const handleSaveChanges = async () => {
        if (!selectedClassroom || !activeYearId) return;
        setIsSaving(true);
        try {
            // 1. Identify and persist new assignments
            const currentAssignments = assignments;
            const newPotentialAssignments = entries.map(e => ({
                staff_id: e.teacher_id,
                subject_id: e.subject_id,
                classroom_id: selectedClassroom,
                academic_year_id: activeYearId
            }));

            // Filter out already existing assignments
            const assignmentsToCreate = newPotentialAssignments.filter(npa =>
                !currentAssignments.find(ca =>
                    ca.staff_id === npa.staff_id &&
                    ca.subject_id === npa.subject_id &&
                    ca.classroom_id === npa.classroom_id
                )
            ).filter((v, i, a) => a.findIndex(t => t.staff_id === v.staff_id && t.subject_id === v.subject_id) === i); // Unique

            if (assignmentsToCreate.length > 0) {
                await Promise.all(assignmentsToCreate.map(a => assignTeacher(a)));
            }

            // 2. Sync timetable entries
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

            loadTimetable(selectedClassroom);
            alert("Timetable and assignments saved successfully!");
        } catch (err: any) {
            setError(err.message || "Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm("Discard all unsaved changes?")) {
            setEntries(JSON.parse(JSON.stringify(originalEntries)));
            setIsDirty(false);
            setError(null);
        }
    };

    const handleQuickAddSubject = async () => {
        if (!newSubject.name || !selectedGrade) return;
        try {
            const res = await createSubject({ name: newSubject.name, code: newSubject.code || newSubject.name.slice(0, 3).toUpperCase(), grade_id: selectedGrade });
            setSubjects([...subjects, res]);
            setNewEntry({ ...newEntry, subject_id: res.id });
            setIsSubjectModalOpen(false);
            setNewSubject({ name: '', code: '' });
        } catch (err: any) { setError("Failed to add subject"); }
    };

    const handleQuickAddGrade = async () => {
        if (!newGrade.name) return;
        try {
            const res = await createGrade({ name: newGrade.name, slug: newGrade.slug || newGrade.name.toLowerCase().replace(/\s+/g, '-') });
            setGrades([...grades, res]);
            setSelectedGrade(res.id);
            setIsGradeModalOpen(false);
            setNewGrade({ name: '', slug: '' });
        } catch (err: any) { setError("Failed to add grade"); }
    };

    const handleQuickAddClassroom = async () => {
        if (!newClassroom.name || !selectedGrade) return;
        try {
            const res = await createClassroom({ name: newClassroom.name, section: newClassroom.section, grade_id: selectedGrade });
            setClassrooms([...classrooms, res]);
            setSelectedClassroom(res.id);
            setIsClassroomModalOpen(false);
            setNewClassroom({ name: '', section: '' });
        } catch (err: any) { setError("Failed to add classroom"); }
    };

    const handleDragStart = async (event: DragStartEvent) => {
        const { active } = event;
        const resourceType = active.data.current?.type;
        const resourceId = active.data.current?.resourceId;

        setActiveDragItem({
            id: active.id as string,
            type: resourceType,
            name: active.data.current?.name,
            entry: active.data.current?.entry
        });

        if (resourceType === 'teacher') {
            try {
                const fullSchedule = await Promise.all([1, 2, 3, 4, 5, 6].map(day =>
                    TimetableApi.getTeacherSchedule(Number(resourceId), day)
                ));
                setActiveResourceSchedule(fullSchedule.flat());
            } catch (err) { console.error(err); }
        } else if (resourceType === 'subject') {
            const assignment = assignments.find(a => a.subject_id === Number(resourceId));
            if (assignment) {
                try {
                    const fullSchedule = await Promise.all([1, 2, 3, 4, 5, 6].map(day =>
                        TimetableApi.getTeacherSchedule(assignment.staff_id, day)
                    ));
                    setActiveResourceSchedule(fullSchedule.flat());
                } catch (err) { console.error(err); }
            }
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragItem(null);
        setActiveResourceSchedule([]);
        const { active, over } = event;
        if (!over || !selectedClassroom) return;

        const [dayStr, timeStr] = (over.id as string).split('-');
        const day = parseInt(dayStr);
        const startTime = `${timeStr}:00`;

        if (active.data.current?.type === 'subject' || active.data.current?.type === 'teacher') {
            const resourceId = parseInt(active.data.current.resourceId);
            const endTime = `${(parseInt(timeStr.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;

            const payload: Partial<TimetableEntry> = {
                day_of_week: day,
                start_time: startTime,
                end_time: endTime,
            };

            // Check for GLOBAL conflicts (external)
            const globalConflict = activeResourceSchedule.find(s =>
                s.day_of_week === day &&
                ((s.start_time <= startTime && s.end_time > startTime) ||
                    (s.start_time < endTime && s.end_time >= endTime))
            );

            if (globalConflict) {
                setError(`Global Conflict: This teacher is already occupied in ${globalConflict.classroom_name} for ${globalConflict.subject_name} at this time.`);
                return;
            }

            // Check if there is a unique assignment for smart drop
            if (active.data.current.type === 'teacher') {
                const teacherAssignments = assignments.filter(a => a.staff_id === resourceId);
                if (teacherAssignments.length === 1) {
                    payload.teacher_id = resourceId;
                    payload.subject_id = teacherAssignments[0].subject_id;
                    const subject = subjects.find(s => s.id === payload.subject_id);
                    const teacher = staff.find(s => s.id === payload.teacher_id);
                    const entry: TimetableEntry = {
                        ...payload,
                        id: Math.random() * -1,
                        classroom_id: selectedClassroom,
                        subject_name: subject?.name || '',
                        teacher_name: `${teacher?.first_name} ${teacher?.last_name}` || '',
                    } as TimetableEntry;

                    const updatedEntries = [...entries, entry];
                    const validationError = validateTimetable(updatedEntries);
                    if (!validationError) {
                        setEntries(updatedEntries);
                        setIsDirty(true);
                        return;
                    }
                }
                payload.teacher_id = resourceId;
            } else if (active.data.current.type === 'subject') {
                const subjectAssignments = assignments.filter(a => a.subject_id === resourceId);
                if (subjectAssignments.length === 1) {
                    payload.subject_id = resourceId;
                    payload.teacher_id = subjectAssignments[0].staff_id;
                    const subject = subjects.find(s => s.id === payload.subject_id);
                    const teacher = staff.find(s => s.id === payload.teacher_id);
                    const entry: TimetableEntry = {
                        ...payload,
                        id: Math.random() * -1,
                        classroom_id: selectedClassroom,
                        subject_name: subject?.name || '',
                        teacher_name: `${teacher?.first_name} ${teacher?.last_name}` || '',
                    } as TimetableEntry;

                    const updatedEntries = [...entries, entry];
                    const validationError = validateTimetable(updatedEntries);
                    if (!validationError) {
                        setEntries(updatedEntries);
                        setIsDirty(true);
                        return;
                    }
                }
                payload.subject_id = resourceId;
            }

            setNewEntry(payload);
            setIsEntryModalOpen(true);
            return;
        }

        if (active.data.current?.type === 'entry') {
            const entry = active.data.current.entry;
            const entryId = entry.id;

            if (!entry || (entry.day_of_week === day && entry.start_time.startsWith(timeStr))) return;

            setError(null);
            const [h1, m1] = entry.start_time.split(':').map(Number);
            const [h2, m2] = entry.end_time.split(':').map(Number);
            const durationMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);

            const [nh, nm] = timeStr.split(':').map(Number);
            const endTotal = (nh * 60 + nm) + durationMinutes;
            const eh = Math.floor(endTotal / 60).toString().padStart(2, '0');
            const em = (endTotal % 60).toString().padStart(2, '0');

            const updatedEntry = {
                ...entry,
                day_of_week: day,
                start_time: startTime,
                end_time: `${eh}:${em}:00`
            };

            const updatedEntries = entries.map(e => e.id === entryId ? updatedEntry : e);
            const validationError = validateTimetable(updatedEntries);

            if (validationError) {
                setError(validationError);
                return;
            }

            setEntries(updatedEntries);
            setIsDirty(true);
        }
    };

    const handleDeleteEntry = (id: number) => {
        if (!confirm("Remove this entry from draft?")) return;
        setEntries(entries.filter(e => e.id !== id));
        setIsDirty(true);
    };

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans selection:bg-primary/10">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="max-w-[1600px] mx-auto">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary p-3 rounded-[1.25rem] shadow-xl shadow-primary/20">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Smart Scheduler</h1>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Academic Planning Engine</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white p-2.5 rounded-[1.5rem] shadow-sm border border-slate-200/60">
                            <div className="flex items-center gap-1 bg-slate-50 rounded-2xl pr-2 border border-slate-100">
                                <select
                                    className="bg-transparent border-none rounded-xl px-4 py-2.5 text-sm font-black text-slate-700 outline-none cursor-pointer"
                                    value={selectedGrade || ''}
                                    onChange={(e) => setSelectedGrade(Number(e.target.value))}
                                >
                                    <option value="">Select Grade</option>
                                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                                <button onClick={() => setIsGradeModalOpen(true)} className="text-primary hover:bg-white p-1.5 rounded-xl transition-all hover:shadow-sm">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-1 bg-slate-50 rounded-2xl pr-2 border border-slate-100">
                                <select
                                    className="bg-transparent border-none rounded-xl px-4 py-2.5 text-sm font-black text-slate-700 outline-none min-w-[140px] cursor-pointer"
                                    value={selectedClassroom || ''}
                                    onChange={(e) => setSelectedClassroom(Number(e.target.value))}
                                    disabled={!selectedGrade}
                                >
                                    <option value="">Classroom</option>
                                    {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                                </select>
                                <button
                                    onClick={() => setIsClassroomModalOpen(true)}
                                    disabled={!selectedGrade}
                                    className="text-primary hover:bg-white p-1.5 rounded-xl transition-all hover:shadow-sm disabled:opacity-30"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="h-8 w-px bg-slate-200 mx-1" />

                            <button
                                onClick={() => setIsEntryModalOpen(true)}
                                className="bg-primary text-white px-6 py-2.5 rounded-2xl text-sm font-black hover:opacity-90 flex items-center gap-2 transition-all shadow-lg shadow-primary/10 active:scale-95 disabled:opacity-50"
                                disabled={!selectedClassroom}
                            >
                                <Plus className="w-4 h-4" />
                                Manual Slot
                            </button>

                            {isDirty && (
                                <>
                                    <div className="h-8 w-px bg-slate-200 mx-1" />
                                    <button
                                        onClick={handleReset}
                                        className="text-slate-400 hover:text-rose-500 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={handleSaveChanges}
                                        disabled={isSaving}
                                        className="bg-emerald-500 text-white px-6 py-2.5 rounded-2xl text-sm font-black hover:bg-emerald-600 flex items-center gap-2 transition-all shadow-lg shadow-emerald-100 active:scale-95 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        Finalize & Sync
                                    </button>
                                </>
                            )}
                        </div>
                    </header>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Resource Sidebar */}
                        <aside className="lg:w-[320px] space-y-6">
                            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        Subjects
                                    </h2>
                                    <button onClick={() => setIsSubjectModalOpen(true)} className="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:text-primary transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                                    {subjects.map(subject => {
                                        const subjectAssignments = assignments.filter(a => a.subject_id === subject.id);
                                        const teachersText = subjectAssignments.map(a => a.teacher_name).join(', ');
                                        return (
                                            <DraggableResource
                                                key={`subject-${subject.id}`}
                                                id={`subject-${subject.id}`}
                                                type="subject"
                                                name={subject.name}
                                                subtitle={teachersText}
                                                color="bg-primary/5 text-primary hover:bg-primary/10"
                                                icon={Clock}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        Teachers
                                    </h2>
                                    <div className="p-1.5 bg-slate-50 rounded-lg text-slate-300">
                                        <User className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                                    {[...staff].sort((a, b) => {
                                        const aAssigned = assignments.some(as => as.staff_id === a.id);
                                        const bAssigned = assignments.some(as => as.staff_id === b.id);
                                        if (aAssigned && !bAssigned) return -1;
                                        if (!aAssigned && bAssigned) return 1;
                                        return 0;
                                    }).map(member => {
                                        const teacherAssignments = assignments.filter(as => as.staff_id === member.id);
                                        const subjectsText = teacherAssignments.map(as => as.subject_name).join(', ');
                                        const isAssigned = teacherAssignments.length > 0;
                                        return (
                                            <div key={`teacher-container-${member.id}`} className="relative group/teacher">
                                                <DraggableResource
                                                    id={`teacher-${member.id}`}
                                                    type="teacher"
                                                    name={`${member.first_name} ${member.last_name}`}
                                                    subtitle={subjectsText}
                                                    color={isAssigned ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}
                                                    icon={User}
                                                />
                                                {isAssigned && (
                                                    <div className="absolute top-1 right-2 px-1.5 py-0.5 bg-emerald-500 text-[8px] text-white font-black rounded-md uppercase tracking-tighter opacity-0 group-hover/teacher:opacity-100 transition-opacity">
                                                        Assigned
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-primary rounded-[2rem] p-6 text-white shadow-xl shadow-primary/10 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <h3 className="text-lg font-black leading-tight mb-2">Drag & Drop Planning</h3>
                                    <p className="text-xs text-white/80 font-bold leading-relaxed opacity-80">
                                        Drag any subject or teacher directly into the calendar to quickly create a new schedule entry.
                                    </p>
                                </div>
                                <div className="absolute -right-4 -bottom-4 bg-white/10 w-24 h-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            </div>
                        </aside>

                        {/* Calendar Main View */}
                        <main className="flex-1">
                            {error && (
                                <div className="mb-6 bg-white border-2 border-rose-100 rounded-[2rem] overflow-hidden shadow-xl shadow-rose-100/20 animate-in slide-in-from-top-4 duration-300">
                                    <div className="bg-rose-50/50 p-5 flex items-center gap-4">
                                        <div className="bg-rose-500 p-2.5 rounded-2xl shadow-lg shadow-rose-200">
                                            <AlertCircle className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-rose-900 text-sm leading-tight">{error}</p>
                                            <p className="text-rose-500 text-[10px] font-black mt-1 uppercase tracking-widest">Conflict Detected</p>
                                        </div>
                                        <button onClick={() => { setError(null); }} className="p-2 hover:bg-rose-100/50 rounded-xl transition-colors">
                                            <X className="w-5 h-5 text-rose-400" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!selectedClassroom ? (
                                <div className="bg-white rounded-[3rem] border border-slate-200/60 p-32 text-center shadow-sm">
                                    <div className="bg-primary/5 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 transform rotate-6 border border-primary/10">
                                        <Clock className="w-12 h-12 text-primary" />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Select Classroom</h2>
                                    <p className="text-slate-400 mt-3 font-bold text-sm uppercase tracking-widest">To load the interactive planning board</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-2xl shadow-primary/10 overflow-hidden">
                                    <div className="overflow-x-auto no-scrollbar">
                                        <div className="min-w-[1000px]">

                                            {/* Days Header */}
                                            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                                                <div className="p-6 border-r border-slate-100 font-bold text-slate-400 text-[10px] uppercase tracking-[0.25em] flex items-center justify-center">
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                {DAYS.map(day => (
                                                    <div key={day.id} className="p-6 border-r border-slate-100 text-center">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{day.name}</p>
                                                        <p className="font-black text-slate-900 text-sm tracking-tight">{day.fullName}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Grid Body */}
                                            <div className="relative">
                                                {TIME_SLOTS.map((time) => (
                                                    <div key={time} className="grid grid-cols-7 border-b border-slate-50 group min-h-[110px]">
                                                        <div className="p-4 border-r border-slate-100 text-slate-400 text-xs font-black flex flex-col items-center justify-center bg-slate-50/30 group-hover:bg-primary/5 transition-colors">
                                                            <span>{time}</span>
                                                            <div className="w-4 h-0.5 bg-slate-200 mt-2 rounded-full" />
                                                        </div>
                                                        {DAYS.map(day => (
                                                            <DroppableSlot key={`${day.id}-${time}`} id={`${day.id}-${time}`}>
                                                                {activeDragItem && (activeDragItem.type === 'teacher' || activeDragItem.type === 'subject') && (
                                                                    (() => {
                                                                        const conflict = activeResourceSchedule.find(s =>
                                                                            s.day_of_week === day.id &&
                                                                            s.start_time.startsWith(time.split(':')[0])
                                                                        );
                                                                        return conflict ? (
                                                                            <div className="absolute inset-0 bg-rose-500/10 flex flex-col items-center justify-center p-2 text-center pointer-events-none border-2 border-rose-200/50 border-dashed rounded-xl m-1">
                                                                                <AlertCircle className="w-4 h-4 text-rose-500 mb-1" />
                                                                                <p className="text-[8px] font-black text-rose-600 uppercase leading-none">Occupied in</p>
                                                                                <p className="text-[9px] font-black text-rose-800 truncate w-full">{conflict.classroom_name}</p>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="absolute inset-0 bg-emerald-500/5 flex items-center justify-center pointer-events-none border-2 border-emerald-200/30 border-dashed rounded-xl m-1">
                                                                                <Check className="w-4 h-4 text-emerald-400 opacity-40" />
                                                                            </div>
                                                                        );
                                                                    })()
                                                                )}
                                                                {entries
                                                                    .filter(e => e.day_of_week === day.id && e.start_time.startsWith(time.split(':')[0]))
                                                                    .map(entry => (
                                                                        <DraggableEntry key={entry.id} entry={entry} onDelete={handleDeleteEntry} />
                                                                    ))}
                                                            </DroppableSlot>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <DragOverlay dropAnimation={null}>
                                        {activeDragItem ? (
                                            <div className={`
                                                p-4 rounded-2xl shadow-2xl scale-105 rotate-2 border-2 transition-transform
                                                ${activeDragItem.type === 'subject' ? 'bg-primary/5 border-primary text-primary' :
                                                    activeDragItem.type === 'teacher' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' :
                                                        'bg-primary border-white text-white'}
                                            `}>
                                                <div className="flex items-center gap-3">
                                                    {activeDragItem.type === 'subject' ? <Clock className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                                    <div>
                                                        <p className="text-xs font-black uppercase tracking-tight">
                                                            {activeDragItem.type === 'entry' ? activeDragItem.entry?.subject_name : activeDragItem.name}
                                                        </p>
                                                        <p className="text-[10px] font-bold opacity-70">
                                                            {activeDragItem.type === 'entry' ? `Moving ${activeDragItem.entry?.teacher_name}` : `Placing ${activeDragItem.type}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}
                                    </DragOverlay>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </DndContext>

            {/* Entry Creation Modal */}
            {isEntryModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
                        <div className="p-10 flex items-center justify-between bg-primary text-white relative">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight uppercase">Schedule Slot</h2>
                                <p className="text-white/80 text-xs font-bold mt-1 opacity-80 uppercase tracking-widest">Session Configuration</p>
                            </div>
                            <button onClick={() => setIsEntryModalOpen(false)} className="hover:bg-white/20 p-3 rounded-2xl transition-all active:scale-90"><X className="w-6 h-6" /></button>
                            <div className="absolute top-0 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2" />
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Day of Week</label>
                                    <select
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all appearance-none"
                                        value={newEntry.day_of_week}
                                        onChange={(e) => setNewEntry({ ...newEntry, day_of_week: Number(e.target.value) })}
                                    >
                                        {DAYS.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-700 focus:border-primary focus:bg-white outline-none transition-all appearance-none"
                                            value={newEntry.subject_id}
                                            onChange={(e) => setNewEntry({ ...newEntry, subject_id: Number(e.target.value) })}
                                        >
                                            <option value="">Select</option>
                                            {subjects.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <button
                                            onClick={() => setIsSubjectModalOpen(true)}
                                            className="bg-primary/5 text-primary p-4 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                        >
                                            <Plus className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teacher</label>
                                <select
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all appearance-none"
                                    value={newEntry.teacher_id}
                                    onChange={(e) => setNewEntry({ ...newEntry, teacher_id: Number(e.target.value) })}
                                >
                                    <option value="">Assign Teacher</option>
                                    {staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                                    <input
                                        type="time"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-700 focus:border-primary focus:bg-white outline-none transition-all"
                                        value={newEntry.start_time}
                                        onChange={(e) => setNewEntry({ ...newEntry, start_time: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Time</label>
                                    <input
                                        type="time"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-700 focus:border-primary focus:bg-white outline-none transition-all"
                                        value={newEntry.end_time}
                                        onChange={(e) => setNewEntry({ ...newEntry, end_time: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-slate-50 flex items-center justify-end gap-6">
                            <button onClick={() => setIsEntryModalOpen(false)} className="text-sm font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">Cancel</button>
                            <button
                                onClick={handleCreateEntry}
                                className="bg-primary text-white px-10 py-4 rounded-[1.5rem] text-sm font-black shadow-2xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Commit to Calendar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-modals for Subject, Grade, Classroom remain similar but with updated styling */}
            {isSubjectModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-8 bg-primary text-white">
                            <h3 className="text-xl font-black uppercase tracking-tight">New Subject</h3>
                        </div>
                        <div className="p-8 space-y-4">
                            <input
                                placeholder="Subject Name (e.g. Physics)"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black focus:border-indigo-500 outline-none"
                                value={newSubject.name}
                                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                            />
                            <input
                                placeholder="Subject Code (e.g. PHY101)"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black focus:border-indigo-500 outline-none uppercase"
                                value={newSubject.code}
                                onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                            />
                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setIsSubjectModalOpen(false)} className="flex-1 py-4 text-sm font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                                <button
                                    onClick={handleQuickAddSubject}
                                    className="flex-1 bg-primary text-white py-4 rounded-2xl text-sm font-black shadow-xl shadow-primary/10"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Other Quick Add Modals (Grade, Classroom) - Minimal Updates to match */}
            {isGradeModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-8 bg-primary text-white">
                            <h3 className="text-xl font-black uppercase tracking-tight">New Grade</h3>
                        </div>
                        <div className="p-8 space-y-4">
                            <input
                                placeholder="Grade Name (e.g. Grade 10)"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-indigo-500"
                                value={newGrade.name}
                                onChange={(e) => setNewGrade({ ...newGrade, name: e.target.value })}
                            />
                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setIsGradeModalOpen(false)} className="flex-1 py-4 text-sm font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                                <button onClick={handleQuickAddGrade} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl text-sm font-black shadow-xl shadow-indigo-100">Create</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isClassroomModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-8 bg-primary text-white">
                            <h3 className="text-xl font-black uppercase tracking-tight">New Classroom</h3>
                        </div>
                        <div className="p-8 space-y-4">
                            <input
                                placeholder="Classroom Name (e.g. 10A)"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-indigo-500"
                                value={newClassroom.name}
                                onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
                            />
                            <input
                                placeholder="Section (e.g. A)"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-indigo-500 uppercase"
                                value={newClassroom.section}
                                onChange={(e) => setNewClassroom({ ...newClassroom, section: e.target.value })}
                            />
                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setIsClassroomModalOpen(false)} className="flex-1 py-4 text-sm font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                                <button onClick={handleQuickAddClassroom} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl text-sm font-black shadow-xl shadow-indigo-100">Create</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Timetable;
