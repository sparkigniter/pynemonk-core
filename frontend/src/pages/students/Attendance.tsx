import { useState } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { ComboBox } from '../../components/ui/ComboBox';

const mockAttendance = [
    { id: '1', name: 'Emma Thompson', roll: '01', status: 'present' },
    { id: '2', name: 'Liam Neeson', roll: '02', status: 'absent' },
    { id: '3', name: 'Olivia Davis', roll: '03', status: 'late' },
    { id: '4', name: 'Noah Wilson', roll: '04', status: null as string | null },
    { id: '5', name: 'Ava Martinez', roll: '05', status: null as string | null },
];

const Attendance = () => {
    const [students, setStudents] = useState(mockAttendance);

    const markStatus = (id: string, status: string) => {
        setStudents(students.map(s => s.id === id ? { ...s, status } : s));
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'present': return 'bg-green-100 border-green-500 text-green-700';
            case 'absent': return 'bg-red-100 border-red-500 text-red-700';
            case 'late': return 'bg-amber-100 border-amber-500 text-amber-700';
            default: return 'bg-[var(--card-bg)] border-[var(--card-border)] text-slate-700 hover:bg-slate-50';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[var(--text-main)]">Mark Attendance</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">Record daily attendance for classes.</p>
            </div>

            <div className="bg-[var(--card-bg)] p-4 rounded-xl shadow-sm border border-[var(--card-border)] flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                    />
                </div>
                <div className="flex-1 w-full">
                    <ComboBox
                        label="Class / Grade"
                        value="Grade 10 - Section A"
                        onChange={() => {}}
                        options={[
                            { value: 'Grade 10 - Section A', label: 'Grade 10 - Section A' },
                            { value: 'Grade 10 - Section B', label: 'Grade 10 - Section B' },
                            { value: 'Grade 11 - Section A', label: 'Grade 11 - Section A' },
                        ]}
                    />
                </div>
                <button className="w-full sm:w-auto bg-primary hover:opacity-90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm h-[38px]">
                    Fetch Students
                </button>
            </div>

            <div className="bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--card-border)] overflow-hidden">
                <div className="p-4 border-b border-[var(--card-border)] bg-slate-50/50 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-800">Student List</h2>
                    <div className="text-sm text-[var(--text-muted)]">
                        Total: {students.length} |
                        Present: {students.filter((s: any) => s.status === 'present').length} |
                        Absent: {students.filter((s: any) => s.status === 'absent').length}
                    </div>
                </div>

                <div className="divide-y divide-slate-200">
                    {students.map((student: any) => (
                        <div key={student.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-[var(--text-muted)] font-bold text-sm">
                                    {student.roll}
                                </div>
                                <div>
                                    <h3 className="font-medium text-[var(--text-main)]">{student.name}</h3>
                                    <p className="text-xs text-[var(--text-muted)]">Roll No: {student.roll}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => markStatus(student.id, 'present')}
                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${student.status === 'present' ? getStatusColor('present') : 'bg-[var(--card-bg)] border-[var(--card-border)] text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <Check size={16} /> Present
                                </button>
                                <button
                                    onClick={() => markStatus(student.id, 'absent')}
                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${student.status === 'absent' ? getStatusColor('absent') : 'bg-[var(--card-bg)] border-[var(--card-border)] text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <X size={16} /> Absent
                                </button>
                                <button
                                    onClick={() => markStatus(student.id, 'late')}
                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${student.status === 'late' ? getStatusColor('late') : 'bg-[var(--card-bg)] border-[var(--card-border)] text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <Clock size={16} /> Late
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-[var(--card-border)] bg-slate-50 flex justify-end">
                    <button className="bg-primary hover:opacity-90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                        Save Attendance
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Attendance;