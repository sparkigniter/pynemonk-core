import React from 'react';

// Simple inline SVG bar chart — no extra libraries needed
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const attendance = [94, 88, 96, 91, 97, 72];
const fees = [78, 65, 80, 70, 85, 60];

const AttendanceChart: React.FC = () => {
    const max = 100;

    return (
        <div className="card p-6 animate-fade-in-up delay-200">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-base font-semibold text-slate-800 font-heading">Weekly Attendance</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Last 6 school days</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
                        <span className="text-slate-500">Attendance %</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} />
                        <span className="text-slate-500">Fee Collection</span>
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div className="flex items-end gap-3 h-48">
                {days.map((day, i) => (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex gap-1 items-end" style={{ height: '160px' }}>
                            {/* Attendance bar */}
                            <div className="flex-1 rounded-t-lg relative group cursor-pointer"
                                style={{
                                    height: `${(attendance[i] / max) * 160}px`,
                                    background: 'linear-gradient(180deg, #8b5cf6, #6366f1)',
                                    transition: 'opacity 0.2s',
                                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)'
                                }}>
                                {/* Tooltip */}
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    {attendance[i]}%
                                </div>
                            </div>
                            {/* Fee bar */}
                            <div className="flex-1 rounded-t-lg relative group cursor-pointer"
                                style={{
                                    height: `${(fees[i] / max) * 160}px`,
                                    background: 'linear-gradient(180deg, #34d399, #10b981)',
                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                                }}>
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    {fees[i]}%
                                </div>
                            </div>
                        </div>
                        <span className="text-xs font-medium text-slate-400">{day}</span>
                    </div>
                ))}
            </div>

            {/* Average line label */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-xs text-slate-500">Avg Attendance</span>
                    <span className="text-xs font-bold text-indigo-600">
                        {Math.round(attendance.reduce((a, b) => a + b, 0) / attendance.length)}%
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-slate-500">Avg Collection</span>
                    <span className="text-xs font-bold text-emerald-600">
                        {Math.round(fees.reduce((a, b) => a + b, 0) / fees.length)}%
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AttendanceChart;
