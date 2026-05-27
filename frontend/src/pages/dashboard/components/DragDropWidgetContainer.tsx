import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Settings2, RotateCcw, Sparkles } from 'lucide-react';
import WidgetSelector, { ROLE_WIDGETS } from './WidgetSelector';

// Imports of widgets
import {
    StatsGridWidget,
    FeeSummaryWidget,
    CurriculumCoverageWidget,
    AcademicPerformanceWidget,
    AttendanceTrendsWidget,
    NoticeBoardWidget,
    StaffLeavesWidget,
    SystemHealthWidget,
    AdmissionsWidget,
    ActivityStreamWidget,
    StaffLeavesAdminWidget,
    TimelineWidget,
    UrgentTasksWidget,
    SyllabusCoverageWidget,
    AssignedCoursesWidget,
    UpcomingExamsWidget
} from './DashboardWidgets';

interface DragDropWidgetContainerProps {
    role: string;
    userId: string;
    data: any;
}

// Map widget IDs to custom Tailwind col-spans
const WIDGET_SPANS: Record<string, string> = {
    // Admin
    stats_cards: 'col-span-full',
    system_health: 'col-span-full md:col-span-2 xl:col-span-1',
    attendance_trends: 'col-span-full xl:col-span-2',
    admissions: 'col-span-full md:col-span-2 xl:col-span-1',
    academic_performance: 'col-span-full md:col-span-2 xl:col-span-1',
    activity_stream: 'col-span-full md:col-span-2 xl:col-span-1',
    staff_leaves: 'col-span-full md:col-span-2 xl:col-span-1',
    
    // Principal
    fee_summary: 'col-span-full xl:col-span-2',
    curriculum_coverage: 'col-span-full md:col-span-2 xl:col-span-1',
    notice_board: 'col-span-full md:col-span-2 xl:col-span-1',
    
    // Teacher
    timeline: 'col-span-full xl:col-span-2',
    urgent_tasks: 'col-span-full md:col-span-2 xl:col-span-1',
    syllabus_progress: 'col-span-full md:col-span-2 xl:col-span-1',
    assigned_courses: 'col-span-full md:col-span-2 xl:col-span-1',
    upcoming_exams: 'col-span-full md:col-span-2 xl:col-span-1'
};

const DragDropWidgetContainer: React.FC<DragDropWidgetContainerProps> = ({ role, userId, data }) => {
    const defaultWidgets = ROLE_WIDGETS[role.toLowerCase()]?.map(w => w.id) || [];
    const storageKey = `eduerp_dashboard_layout_${userId}_${role}`;
    
    const [widgetsOrder, setWidgetsOrder] = useState<string[]>([]);
    const [visibleWidgets, setVisibleWidgets] = useState<string[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    // Initialize layout from LocalStorage or use defaults
    useEffect(() => {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setWidgetsOrder(parsed.order || defaultWidgets);
                setVisibleWidgets(parsed.visible || defaultWidgets);
            } catch {
                setWidgetsOrder(defaultWidgets);
                setVisibleWidgets(defaultWidgets);
            }
        } else {
            setWidgetsOrder(defaultWidgets);
            setVisibleWidgets(defaultWidgets);
        }
    }, [role, userId]);

    // Save layout to LocalStorage
    const saveLayout = (order: string[], visible: string[]) => {
        localStorage.setItem(storageKey, JSON.stringify({ order, visible }));
    };

    // Sensor configs for DragEnd detection
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Ensure clicking interactive inputs doesn't trigger drag
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setWidgetsOrder((items) => {
            const oldIndex = items.indexOf(active.id as string);
            const newIndex = items.indexOf(over.id as string);
            const newOrder = arrayMove(items, oldIndex, newIndex);
            saveLayout(newOrder, visibleWidgets);
            return newOrder;
        });
    };

    const toggleWidgetVisibility = (id: string) => {
        setVisibleWidgets((prev) => {
            const updated = prev.includes(id) 
                ? prev.filter(w => w !== id) 
                : [...prev, id];
            saveLayout(widgetsOrder, updated);
            return updated;
        });
    };

    const resetLayout = () => {
        setWidgetsOrder(defaultWidgets);
        setVisibleWidgets(defaultWidgets);
        saveLayout(defaultWidgets, defaultWidgets);
    };

    // Map Widget ID to actual rendering Component
    const renderWidget = (id: string) => {
        switch (id) {
            // Admin
            case 'stats_cards':
                return <StatsGridWidget data={data} role={role} />;
            case 'system_health':
                return <SystemHealthWidget data={data} />;
            case 'attendance_trends':
                return <AttendanceTrendsWidget data={data} />;
            case 'admissions':
                return <AdmissionsWidget data={data} />;
            case 'academic_performance':
                return <AcademicPerformanceWidget data={data} />;
            case 'activity_stream':
                return <ActivityStreamWidget data={data} />;
            case 'staff_leaves':
                return role === 'principal' 
                    ? <StaffLeavesWidget data={data} />
                    : <StaffLeavesAdminWidget data={data} />;
            
            // Principal
            case 'fee_summary':
                return <FeeSummaryWidget data={data} />;
            case 'curriculum_coverage':
                return <CurriculumCoverageWidget data={data} />;
            case 'notice_board':
                return <NoticeBoardWidget data={data} />;
            
            // Teacher
            case 'timeline':
                return <TimelineWidget data={data} />;
            case 'urgent_tasks':
                return <UrgentTasksWidget data={data} />;
            case 'syllabus_progress':
                return <SyllabusCoverageWidget data={data} />;
            case 'assigned_courses':
                return <AssignedCoursesWidget data={data} />;
            case 'upcoming_exams':
                return <UpcomingExamsWidget data={data} />;
                
            default:
                return null;
        }
    };

    // Sortable Wrapper Item Component
    const SortableWidget: React.FC<{ id: string }> = ({ id }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging
        } = useSortable({ id });

        const style: React.CSSProperties = {
            transform: CSS.Transform.toString(transform),
            transition,
            zIndex: isDragging ? 50 : undefined,
            opacity: isDragging ? 0.4 : undefined
        };

        const colSpan = WIDGET_SPANS[id] || 'col-span-full md:col-span-1';

        // Stats grid usually takes col-span-full and isn't draggable to maintain aesthetic hierarchy, 
        // but we keep it sortable without a visible handle to keep order consistency.
        const isStatsGrid = id === 'stats_cards';

        return (
            <div 
                ref={setNodeRef} 
                style={style} 
                className={`${colSpan} group/widget relative transition-shadow duration-300 ${isEditMode ? 'rounded-[2rem] outline-2 outline-dashed outline-slate-200 outline-offset-4 bg-slate-50/20' : ''}`}
            >
                {/* Edit Controls Overlay */}
                {isEditMode && (
                    <div className="absolute top-4 right-4 z-20 flex gap-2 animate-in fade-in duration-300">
                        {/* Drag Handle */}
                        {!isStatsGrid && (
                            <div 
                                {...attributes} 
                                {...listeners}
                                className="p-2 bg-white/95 border border-slate-100 hover:bg-slate-50 rounded-xl cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 shadow-sm flex items-center justify-center transition-all"
                                title="Drag to reorder"
                            >
                                <GripVertical size={14} />
                            </div>
                        )}
                        {/* Delete Button */}
                        <button 
                            onClick={() => toggleWidgetVisibility(id)}
                            className="p-2 bg-white/95 border border-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl shadow-sm flex items-center justify-center transition-all"
                            title="Remove widget"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Render Component */}
                <div className={`h-full ${isDragging ? 'shadow-2xl border-primary/20 scale-[1.01]' : ''}`}>
                    {renderWidget(id)}
                </div>
            </div>
        );
    };

    // Filter order so we only render enabled/visible widgets
    const visibleItems = widgetsOrder.filter(id => visibleWidgets.includes(id));

    return (
        <div className="space-y-8 w-full">
            {/* ── Control Header Panel ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 text-primary rounded-2xl">
                        <Sparkles size={16} />
                    </div>
                    <div>
                        <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Configure Cockpit Workspace</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {isEditMode ? 'Edit Mode Active — Rearrange or remove widgets' : 'Dashboard Workspace optimized for operational speed'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {isEditMode && (
                        <button 
                            onClick={resetLayout}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-sm"
                        >
                            <RotateCcw size={12} /> Reset Layout
                        </button>
                    )}
                    <button 
                        onClick={() => setIsLibraryOpen(true)}
                        className="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all"
                    >
                        + Add Widget
                    </button>
                    <button 
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-md ${isEditMode ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-900 text-white shadow-slate-900/10 hover:bg-slate-800'}`}
                    >
                        <Settings2 size={12} /> {isEditMode ? 'Save Layout' : 'Customize Dashboard'}
                    </button>
                </div>
            </div>

            {/* ── Sortable Grid Area ── */}
            <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext 
                    items={visibleItems}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {visibleItems.map((id) => (
                            <SortableWidget key={id} id={id} />
                        ))}
                        {visibleItems.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50 space-y-4">
                                <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                                    <Settings2 size={28} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Empty Cockpit</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Add elements from the Widget Library to construct your cockpit.</p>
                                </div>
                                <button 
                                    onClick={() => setIsLibraryOpen(true)}
                                    className="px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/25 active:scale-95 transition-all"
                                >
                                    Open Widget Library
                                </button>
                            </div>
                        )}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Widget Selection Drawer */}
            <WidgetSelector 
                role={role}
                visibleWidgets={visibleWidgets}
                toggleWidget={toggleWidgetVisibility}
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
            />
        </div>
    );
};

export default DragDropWidgetContainer;
