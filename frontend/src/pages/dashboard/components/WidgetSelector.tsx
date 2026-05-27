import React from 'react';
import { X, Layout, Plus, Check } from 'lucide-react';

interface WidgetInfo {
    id: string;
    title: string;
    description: string;
}

interface WidgetSelectorProps {
    role: string;
    visibleWidgets: string[];
    toggleWidget: (id: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

export const ROLE_WIDGETS: Record<string, WidgetInfo[]> = {
    admin: [
        { id: 'stats_cards', title: 'Operational KPI Grid', description: 'Real-time counts of active students, payroll staff, courses, and attendance rates.' },
        { id: 'system_health', title: 'Operational Completeness', description: 'System health highlights including unallocated fee schedules and missing timetable slots.' },
        { id: 'attendance_trends', title: 'Attendance Trends', description: 'Interactive bar chart showing campus attendance dynamics over the last week/month.' },
        { id: 'admissions', title: 'Recent Admissions', description: 'Track recent student admissions registered across the grades in the past 30 days.' },
        { id: 'academic_performance', title: 'Grade Performance Index', description: 'GPA average indices categorized by grades and overall institutional averages.' },
        { id: 'activity_stream', title: 'Unified Campus Feed', description: 'System-wide activity stream tracking enrollment logs, hiring logs, and exam events.' },
        { id: 'staff_leaves', title: 'Faculty Leaves Tracker', description: 'Lists teachers and staff currently on approved leave for operational capacity overview.' }
    ],
    principal: [
        { id: 'stats_cards', title: 'Strategic KPI Cards', description: 'Displays high-level school-wide pass rates, daily attendance rate, and fee collections efficiency.' },
        { id: 'fee_summary', title: 'Financial Collections Gauge', description: 'Circular efficiency gauge, targets, collected revenues, outstanding amounts, and payment defaults.' },
        { id: 'curriculum_coverage', title: 'Curriculum Syllabus Progress', description: 'Progress tracking lines detailing total completed vs. planned lessons across classrooms.' },
        { id: 'academic_performance', title: 'Grade GPA Distribution', description: 'Institutional report card charting overall GPA index progress for classroom cohorts.' },
        { id: 'attendance_trends', title: 'Global Attendance Trends', description: 'Long-term campus attendance rates line graphs representing operational continuity.' },
        { id: 'notice_board', title: 'Campus Announcement Board', description: 'Central notices and announcements bulletin for campus communication tracking.' },
        { id: 'staff_leaves', title: 'Pending Leaves Review', description: 'Actionable approval widget to process staff and teacher leave requests directly from dashboard.' }
    ],
    teacher: [
        { id: 'timeline', title: "Today's Timetable Schedule", description: 'Active chronological slots of daily classes with simple triggers to mark student attendance.' },
        { id: 'urgent_tasks', title: 'Academic Action Items', description: 'Lists exams missing mark entry with quick resolve keys and completion status progress bars.' },
        { id: 'stats_cards', title: 'Personal Cohort Metrics', description: 'Your class counts, handled students, active homeworks sent, and subject coverage KPIs.' },
        { id: 'syllabus_progress', title: 'Class Syllabus Progress', description: 'Completion percentage metrics representing lesson plans covering your active classrooms.' },
        { id: 'assigned_courses', title: 'Assigned Class Cohorts', description: 'Grid layout of classroom sections assigned to you for curriculum execution.' },
        { id: 'upcoming_exams', title: 'Exam Deadlines Calendar', description: 'Visual lists detailing scheduled upcoming exams and testing milestones for your courses.' }
    ]
};

const WidgetSelector: React.FC<WidgetSelectorProps> = ({ role, visibleWidgets, toggleWidget, isOpen, onClose }) => {
    if (!isOpen) return null;

    const widgets = ROLE_WIDGETS[role.toLowerCase()] || [];

    return (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-all duration-300"
                onClick={onClose}
            />

            {/* Drawer Content */}
            <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10 border-l border-slate-100 animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/5 text-primary rounded-xl">
                            <Layout size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-800">Widget Library</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configure Cockpit Elements</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Widgets List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {widgets.map((widget) => {
                        const isVisible = visibleWidgets.includes(widget.id);
                        return (
                            <div 
                                key={widget.id}
                                onClick={() => toggleWidget(widget.id)}
                                className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-4 items-start ${isVisible ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-slate-100/50'}`}
                            >
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${isVisible ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white border-slate-200 text-slate-400'}`}>
                                    {isVisible ? <Check size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={3} />}
                                </div>
                                <div className="space-y-1">
                                    <h4 className={`text-xs font-black tracking-tight ${isVisible ? 'text-primary' : 'text-slate-800'}`}>{widget.title}</h4>
                                    <p className="text-[11px] text-slate-500 leading-normal">{widget.description}</p>
                                </div>
                            </div>
                        );
                    })}
                    {widgets.length === 0 && (
                        <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-widest italic opacity-50">
                            No widgets configured for this role
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 shrink-0">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 transition-all"
                    >
                        Apply Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WidgetSelector;
