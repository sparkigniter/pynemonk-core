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
        <div className="card p-6 animate-fade-in-up delay-300">
            <h3 className="text-base font-semibold text-slate-800 font-heading mb-4">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-3">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.label}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-all group"
                        >
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-translate-y-0.5"
                                style={{
                                    background: action.gradient,
                                    boxShadow: `0 4px 14px ${action.shadow}`
                                }}
                            >
                                <Icon size={18} className="text-white" />
                            </div>
                            <span className="text-xs font-medium text-slate-600 text-center leading-tight">{action.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuickActions;
