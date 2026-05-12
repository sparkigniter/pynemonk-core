import {
    BarChart2, PieChart, TrendingUp, Download, Calendar
} from 'lucide-react';

export default function Reports() {
    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-heading tracking-tight">Analytics & Reports</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Generate comprehensive reports for attendance, finance, and academics.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-theme-primary text-white rounded-xl hover:bg-theme-primary/90 transition-colors shadow-sm font-medium text-sm">
                        <Download size={16} />
                        Export Data
                    </button>
                </div>
            </div>

            <div className="card p-8 flex flex-col items-center justify-center min-h-[500px] text-center bg-gradient-to-br from-slate-50 to-white">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-theme-primary/20 blur-xl rounded-full animate-pulse"></div>
                    <div className="w-20 h-20 bg-[var(--card-bg)] rounded-2xl shadow-xl flex items-center justify-center relative z-10 text-theme-primary rotate-3 hover:rotate-0 transition-transform">
                        <BarChart2 size={40} />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 font-heading mb-2">Advanced Reporting Studio</h3>
                <p className="text-[var(--text-muted)] max-w-md mb-8">Build custom reports, visualize data trends, and export insights. The analytics engine is currently being provisioned for your tenant.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                    <div className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-sm text-left">
                        <PieChart className="text-amber-500 mb-3" size={24} />
                        <h4 className="font-semibold text-slate-800 mb-1">Financial Health</h4>
                        <p className="text-xs text-[var(--text-muted)]">Revenue, expenses, and fee collection trends.</p>
                    </div>
                    <div className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-sm text-left">
                        <Calendar className="text-emerald-500 mb-3" size={24} />
                        <h4 className="font-semibold text-slate-800 mb-1">Attendance Stats</h4>
                        <p className="text-xs text-[var(--text-muted)]">Daily attendance rates and chroninc absenteeism.</p>
                    </div>
                    <div className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-sm text-left">
                        <TrendingUp className="text-blue-500 mb-3" size={24} />
                        <h4 className="font-semibold text-slate-800 mb-1">Academic Perform</h4>
                        <p className="text-xs text-[var(--text-muted)]">Exam scores, subject averages, and term results.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
