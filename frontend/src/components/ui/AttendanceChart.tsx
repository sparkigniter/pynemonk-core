import React from 'react';

// Simple inline SVG bar chart — no extra libraries needed
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const attendance = [94, 88, 96, 91, 97, 72];


interface AttendanceChartProps {
    data?: any[];
}

const AttendanceChart: React.FC<AttendanceChartProps> = ({ data = [] }) => {
    const max = 100;
    
    // Map backend data or use fallback
    const chartData = data.length > 0 
        ? data.map(d => ({ label: d.day, value: parseFloat(d.percentage) }))
        : days.map((day, i) => ({ label: day, value: attendance[i] }));

    const avgAttendance = Math.round(chartData.reduce((a, b) => a + b.value, 0) / (chartData.length || 1));

    return (
        <div className="animate-fade-in-up delay-200">
            {/* Chart */}
            <div className="flex items-end gap-6 h-56 px-2">
                {chartData.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3">
                        <div className="w-full flex gap-1.5 items-end h-40">
                            {/* Attendance bar */}
                            <div className="flex-1 rounded-2xl relative group cursor-pointer bg-primary/20 hover:bg-primary transition-all duration-300"
                                style={{ height: `${(item.value / max) * 160}px` }}>
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-10 shadow-xl shadow-slate-900/20">
                                    {item.value}% Presence
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Stats Summary */}
            <div className="mt-10 flex items-center justify-between border-t border-slate-50 pt-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black text-xs">
                        {avgAttendance}%
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Global Attendance</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weekly Average</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-xs">
                        94%
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Fee Efficiency</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collection Rate</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceChart;
