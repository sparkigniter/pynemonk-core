import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    UserPlus, FileText, Calendar, DollarSign,
    BookOpen, Bell, ClipboardCheck,
    PenTool, History, Layout
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Action {
    label: string;
    icon: any;
    path: string;
    scope?: string;
    roles?: string[];
}

const QuickActions: React.FC = () => {
    const { user, can } = useAuth();
    const navigate = useNavigate();

    const allActions: Action[] = [
        // Admin Actions
        { label: 'Register Student', icon: UserPlus, path: '/students/register', scope: 'student:write', roles: ['admin', 'school_admin'] },
        { label: 'Hire Staff', icon: UserPlus, path: '/teachers/register', scope: 'staff:write', roles: ['admin', 'school_admin'] },
        { label: 'Fee Entry', icon: DollarSign, path: '/finance', scope: 'finance:write', roles: ['admin', 'school_admin'] },
        { label: 'School Notice', icon: Bell, path: '/settings', scope: 'announcement:write', roles: ['admin', 'school_admin'] },
        
        // Teacher Actions
        { label: 'Daily Attendance', icon: ClipboardCheck, path: '/attendance', scope: 'student.attendance:write', roles: ['teacher'] },
        { label: 'Give Homework', icon: BookOpen, path: '/homework/new', scope: 'assignment:write', roles: ['teacher'] },
        { label: 'Marks Entry', icon: PenTool, path: '/exams', scope: 'exam.marks:write', roles: ['teacher'] },
        { label: 'Class Diary', icon: FileText, path: '/teacher-diary', scope: 'teacher_note:write', roles: ['teacher'] },

        // Parent/Shared Actions
        { label: 'Exam Dates', icon: Calendar, path: '/exams', roles: ['parent', 'student', 'guardian'] },
        { label: 'My Progress', icon: Layout, path: '/dashboard', roles: ['parent', 'student', 'guardian'] },
        { label: 'School Calendar', icon: History, path: '/calendar' },
        { label: 'School Records', icon: FileText, path: '/reports', scope: 'staff.academic:read' },
    ];

    const filteredActions = allActions.filter(action => {
        // Role check
        if (action.roles && !action.roles.some(r => user?.roles.includes(r))) return false;
        // Scope check
        if (action.scope && !can(action.scope)) return false;
        return true;
    }).slice(0, 8); // Limit to 8 for grid layout

    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm animate-fade-in-up delay-300">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Fast Track Actions</h3>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">{filteredActions.length} Shortcuts</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {filteredActions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.label}
                            onClick={() => navigate(action.path)}
                            className="flex flex-col items-center gap-3 p-5 rounded-[2rem] bg-slate-50/50 border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:-rotate-3">
                                <Icon size={20} className="transition-colors duration-300" />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors text-center">{action.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuickActions;
