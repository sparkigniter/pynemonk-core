import React from 'react';
import {
    UserPlus, FileText, Calendar, DollarSign,
    BookOpen, Bell, Download, Mail
} from 'lucide-react';

const actions = [
    { label: 'Add Student', icon: UserPlus, gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', shadow: 'rgba(99, 102, 241, 0.3)' },
    { label: 'New Report', icon: FileText, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245, 158, 11, 0.3)' },
    { label: 'Schedule', icon: Calendar, gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)', shadow: 'rgba(14, 165, 233, 0.3)' },
    { label: 'Fee Entry', icon: DollarSign, gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16, 185, 129, 0.3)' },
    { label: 'Assign Course', icon: BookOpen, gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)', shadow: 'rgba(244, 63, 94, 0.3)' },
    { label: 'Send Notice', icon: Bell, gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', shadow: 'rgba(139, 92, 246, 0.3)' },
    { label: 'Export Data', icon: Download, gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)', shadow: 'rgba(20, 184, 166, 0.3)' },
    { label: 'Send Email', icon: Mail, gradient: 'linear-gradient(135deg, #f97316, #ea580c)', shadow: 'rgba(249, 115, 22, 0.3)' },
];

const QuickActions: React.FC = () => {
    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm animate-fade-in-up delay-300">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Quick Action Hub</h3>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">8 Shortcuts</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.label}
                            className="flex flex-col items-center gap-3 p-5 rounded-[2rem] bg-slate-50/50 border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:-rotate-3">
                                <Icon size={20} className="transition-colors duration-300" />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{action.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuickActions;
