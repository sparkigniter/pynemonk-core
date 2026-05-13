import { useState, useEffect } from 'react';
import { User, Building2, Bell, Shield, Save, Palette, Sparkles, LayoutGrid, ListChecks, Info, Calendar } from 'lucide-react';
import LeaveTypeSettings from '../../components/admin/LeaveTypeSettings';
import { useTheme } from '../../contexts/ThemeContext';
import * as settingsApi from '../../api/settings.api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const tabs = [
    { id: 'profile', name: 'User Profile', icon: User },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'school', name: 'School Preferences', icon: Building2, permission: 'settings:write' },
    { id: 'leave', name: 'Leave & HR', icon: ListChecks, permission: 'staff.leave:read' },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState('profile');
    const { theme: activeTheme, setTheme, themes } = useTheme();
    const { notify } = useNotification();
    const { can } = useAuth();
    const [schoolSettings, setSchoolSettings] = useState<any>({
        admission_number_format: 'ADM-{YEAR}-{SEQ}',
        attendance_mode: 'DAILY'
    });

    useEffect(() => {
        if (activeTab === 'school') {
            settingsApi.getSettings().then(res => {
                if (res) setSchoolSettings(res);
            });
        }
    }, [activeTab]);

    const handleSaveSchoolSettings = async () => {
        try {
            await settingsApi.updateSettings({
                attendance_mode: schoolSettings.attendance_mode,
                admission_number_format: schoolSettings.admission_number_format
            });
            notify('success', 'Settings Saved', 'School configuration updated successfully.');
        } catch (err: any) {
            notify('error', 'Update Failed', err.message);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="text-2xl font-bold text-[var(--text-main)] font-heading">Settings</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">Manage your account settings and preferences.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 animate-fade-in-up delay-100">
                {/* Sidebar Nav */}
                <div className="w-full md:w-64 shrink-0">
                    <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0">
                        {tabs.filter(t => !t.permission || can(t.permission)).map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all whitespace-nowrap w-full text-left
                                        ${isActive ? 'text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-[var(--text-main)]'}`}
                                    style={isActive
                                        ? { background: 'linear-gradient(135deg, var(--primary), var(--accent))', boxShadow: `0 4px 14px var(--ring)` }
                                        : {}}
                                >
                                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                                    {tab.name}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 card min-h-[520px] flex flex-col overflow-hidden animate-fade-in-up delay-150 bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] shadow-xl">

                    {/* ── Appearance ── */}
                    {activeTab === 'appearance' && (
                        <div className="flex-1 p-6 space-y-8">
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--text-main)] font-heading border-b border-[var(--card-border)] pb-4 flex items-center gap-2">
                                    <Sparkles size={18} className="text-primary" />
                                    Choose Your Theme
                                </h2>
                                <p className="text-sm text-[var(--text-muted)] mt-3">Select a color theme that matches your style.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTheme(t.id)}
                                        className={`p-5 rounded-2xl border-2 text-left transition-all ${t.id === activeTheme.id ? 'border-primary shadow-lg bg-primary/5' : 'border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--card-border)]'}`}
                                    >
                                        <div className="w-10 h-10 rounded-xl mb-4" style={{ background: `linear-gradient(135deg, ${t.preview[0]}, ${t.preview[1]})` }} />
                                        <p className="text-sm font-bold text-[var(--text-main)]">{t.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{t.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Profile ── */}
                    {activeTab === 'profile' && (
                        <div className="flex-1 p-6 space-y-6">
                            <h2 className="text-lg font-semibold text-[var(--text-main)] font-heading border-b border-[var(--card-border)] pb-4">Personal Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">First Name</label>
                                    <input type="text" defaultValue="Admin" className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-sm outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">Last Name</label>
                                    <input type="text" defaultValue="User" className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-sm outline-none" />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700">Email Address</label>
                                    <input type="email" defaultValue="admin@eduerp.com" className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-sm outline-none" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── School Preferences ── */}
                    {activeTab === 'school' && (
                        <div className="flex-1 p-6 space-y-10 overflow-y-auto">
                            <h2 className="text-lg font-semibold text-[var(--text-main)] font-heading border-b border-[var(--card-border)] pb-4">School Configuration</h2>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-[var(--text-main)]">Attendance Tracking Mode</h3>
                                        <p className="text-xs text-[var(--text-muted)] mt-1">Determine how attendance is recorded across your institution.</p>
                                    </div>
                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                                        <button
                                            onClick={() => setSchoolSettings((p: any) => ({ ...p, attendance_mode: 'DAILY' }))}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${schoolSettings.attendance_mode === 'DAILY' ? 'bg-[var(--card-bg)] text-primary shadow-sm' : 'text-[var(--text-muted)] hover:text-slate-600'}`}
                                        >
                                            Daily
                                        </button>
                                        <button
                                            onClick={() => setSchoolSettings((p: any) => ({ ...p, attendance_mode: 'PERIOD_WISE' }))}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${schoolSettings.attendance_mode === 'PERIOD_WISE' ? 'bg-[var(--card-bg)] text-primary shadow-sm' : 'text-[var(--text-muted)] hover:text-slate-600'}`}
                                        >
                                            Period-wise
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className={`p-6 rounded-[2rem] border-2 transition-all ${schoolSettings.attendance_mode === 'DAILY' ? 'border-primary/20 bg-primary/5' : 'border-slate-50 opacity-60'}`}>
                                        <div className="w-10 h-10 bg-[var(--card-bg)] rounded-2xl flex items-center justify-center shadow-sm mb-4"><ListChecks className="text-primary w-5 h-5" /></div>
                                        <h4 className="text-sm font-bold text-[var(--text-main)] mb-1">Daily Attendance (K-12)</h4>
                                        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">Attendance is taken once a day by the Class Teacher. Ideal for primary and secondary schools.</p>
                                    </div>
                                    <div className={`p-6 rounded-[2rem] border-2 transition-all ${schoolSettings.attendance_mode === 'PERIOD_WISE' ? 'border-primary/20 bg-primary/5' : 'border-slate-50 opacity-60'}`}>
                                        <div className="w-10 h-10 bg-[var(--card-bg)] rounded-2xl flex items-center justify-center shadow-sm mb-4"><LayoutGrid className="text-primary w-5 h-5" /></div>
                                        <h4 className="text-sm font-bold text-[var(--text-main)] mb-1">Period-wise (Colleges)</h4>
                                        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">Attendance is taken for every subject slot in the timetable. Ideal for colleges and universities.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-[var(--card-border)] pt-8">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Admissions & Numbering</h3>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-slate-700">Admission Number Format</label>
                                        <input
                                            type="text"
                                            value={schoolSettings.admission_number_format}
                                            onChange={e => setSchoolSettings((p: any) => ({ ...p, admission_number_format: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-sm font-mono focus:ring-4 focus:ring-primary/10"
                                            placeholder="ADM-{YEAR}-{SEQ}"
                                        />
                                    </div>
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-dashed border-[var(--card-border)] flex items-center justify-between">
                                        <div>
                                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Sample Format</p>
                                            <p className="text-lg font-black text-slate-700 font-mono tracking-tight">
                                                {schoolSettings.admission_number_format ? schoolSettings.admission_number_format
                                                    .replace('{YEAR}', new Date().getFullYear().toString())
                                                    .replace('{MONTH}', (new Date().getMonth() + 1).toString().padStart(2, '0'))
                                                    .replace('{SEQ}', '0001') : '---'}
                                            </p>
                                        </div>
                                        <Info size={16} className="text-slate-300" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Leave & HR ── */}
                    {activeTab === 'leave' && (
                        <div className="flex-1 p-6 space-y-10 overflow-y-auto">
                            <h2 className="text-lg font-semibold text-[var(--text-main)] font-heading border-b border-[var(--card-border)] pb-4 flex items-center gap-2">
                                <Calendar size={18} className="text-primary" />
                                Leave Categories
                            </h2>
                            <LeaveTypeSettings />
                        </div>
                    )}

                    {/* ── Modules Under Construction ── */}
                    {['notifications', 'security'].includes(activeTab) && (
                        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-4">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-50">
                                <Shield size={28} className="text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 font-heading">Under Construction</h3>
                                <p className="text-sm text-[var(--text-muted)]">Check back soon for updates.</p>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-[var(--card-border)] bg-slate-50/70 flex justify-end gap-3">
                        <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                        <button
                            onClick={activeTab === 'school' ? handleSaveSchoolSettings : undefined}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-lg active:scale-95"
                            style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                        >
                            <Save size={16} />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}