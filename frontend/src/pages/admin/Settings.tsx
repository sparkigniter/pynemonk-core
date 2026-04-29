import { useState, useEffect } from 'react';
import { User, Building2, Bell, Shield, Save, Palette, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import * as studentApi from '../../api/student.api';
import { useNotification } from '../../contexts/NotificationContext';

const tabs = [
    { id: 'profile', name: 'User Profile', icon: User },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'school', name: 'School Preferences', icon: Building2 },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState('profile');
    const { theme: activeTheme, setTheme, themes } = useTheme();
    const { notify } = useNotification();
    const [schoolSettings, setSchoolSettings] = useState({
        admission_number_format: 'ADM-{YEAR}-{SEQ}'
    });

    useEffect(() => {
        if (activeTab === 'school') {
            studentApi.getAdmissionSettings().then(res => {
                if (res) setSchoolSettings(res);
            });
        }
    }, [activeTab]);

    const handleSaveSchoolSettings = async () => {
        try {
            await studentApi.updateAdmissionSettings(schoolSettings);
            notify('success', 'Settings Saved', 'School numbering preferences updated.');
        } catch (err: any) {
            notify('error', 'Update Failed', err.message);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="text-2xl font-bold text-slate-900 font-heading">Settings</h1>
                <p className="text-sm text-slate-500 mt-1">Manage your account settings and preferences.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 animate-fade-in-up delay-100">
                {/* Sidebar Nav */}
                <div className="w-full md:w-64 shrink-0">
                    <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all whitespace-nowrap w-full text-left
                                        ${isActive ? 'text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                                    style={isActive
                                        ? { background: 'linear-gradient(135deg, var(--primary), var(--accent))', boxShadow: `0 4px 14px var(--ring)` }
                                        : {}}
                                >
                                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                    {tab.name}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 card min-h-[520px] flex flex-col overflow-hidden animate-fade-in-up delay-150 bg-white rounded-3xl border border-slate-100 shadow-xl">

                    {/* ── Appearance ── */}
                    {activeTab === 'appearance' && (
                        <div className="flex-1 p-6 space-y-8">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 font-heading border-b border-slate-100 pb-4 flex items-center gap-2">
                                    <Sparkles size={18} className="text-primary" />
                                    Choose Your Theme
                                </h2>
                                <p className="text-sm text-slate-500 mt-3">Select a color theme that matches your style.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTheme(t.id)}
                                        className={`p-5 rounded-2xl border-2 text-left transition-all ${t.id === activeTheme.id ? 'border-primary shadow-lg bg-primary/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                    >
                                        <div className="w-10 h-10 rounded-xl mb-4" style={{ background: `linear-gradient(135deg, ${t.preview[0]}, ${t.preview[1]})` }} />
                                        <p className="text-sm font-bold text-slate-900">{t.name}</p>
                                        <p className="text-xs text-slate-400">{t.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Profile ── */}
                    {activeTab === 'profile' && (
                        <div className="flex-1 p-6 space-y-6">
                            <h2 className="text-lg font-semibold text-slate-900 font-heading border-b border-slate-100 pb-4">Personal Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">First Name</label>
                                    <input type="text" defaultValue="Admin" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">Last Name</label>
                                    <input type="text" defaultValue="User" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none" />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700">Email Address</label>
                                    <input type="email" defaultValue="admin@eduerp.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── School Preferences ── */}
                    {activeTab === 'school' && (
                        <div className="flex-1 p-6 space-y-8">
                            <h2 className="text-lg font-semibold text-slate-900 font-heading border-b border-slate-100 pb-4">School Configuration</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Admissions & Numbering</h3>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-slate-700">Admission Number Format</label>
                                        <input 
                                            type="text" 
                                            value={schoolSettings.admission_number_format} 
                                            onChange={e => setSchoolSettings(p => ({ ...p, admission_number_format: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-4 focus:ring-primary/10" 
                                            placeholder="ADM-{YEAR}-{SEQ}"
                                        />
                                        <p className="text-[10px] text-slate-400 font-bold mt-2">Tokens: {`{YEAR}, {MONTH}, {SEQ}`}</p>
                                    </div>
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Live Preview</p>
                                        <p className="text-xl font-black text-slate-700 font-mono tracking-tight">
                                            {schoolSettings.admission_number_format
                                                .replace('{YEAR}', new Date().getFullYear().toString())
                                                .replace('{MONTH}', (new Date().getMonth()+1).toString().padStart(2, '0'))
                                                .replace('{SEQ}', '0001')}
                                        </p>
                                    </div>
                                </div>
                            </div>
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
                                <p className="text-sm text-slate-500">Check back soon for updates.</p>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex justify-end gap-3">
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