import { useState } from 'react';
import { User, Building2, Bell, Shield, Save, Palette, Check, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

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
                <div className="flex-1 card min-h-[520px] flex flex-col overflow-hidden animate-fade-in-up delay-150">

                    {/* ── Appearance / Theme Picker ── */}
                    {activeTab === 'appearance' && (
                        <div className="flex-1 p-6 space-y-8">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 font-heading border-b border-slate-100 pb-4 flex items-center gap-2">
                                    <Sparkles size={18} style={{ color: 'var(--primary)' }} />
                                    Choose Your Theme
                                </h2>
                                <p className="text-sm text-slate-500 mt-3">
                                    Select a color theme that matches your style. Changes are applied instantly across the entire app.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {themes.map((t) => {
                                    const isSelected = t.id === activeTheme.id;
                                    return (
                                        <button
                                            key={t.id}
                                            id={`theme-${t.id}`}
                                            onClick={() => setTheme(t.id)}
                                            className={`relative group p-5 rounded-2xl border-2 text-left transition-all hover-lift
                                                ${isSelected
                                                    ? 'border-transparent shadow-lg'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}
                                            style={isSelected ? {
                                                borderColor: t.preview[0],
                                                background: `linear-gradient(145deg, ${t.preview[0]}08, ${t.preview[1]}15)`,
                                                boxShadow: `0 6px 24px ${t.preview[0]}30`,
                                            } : {}}
                                        >
                                            {/* Check mark */}
                                            {isSelected && (
                                                <div
                                                    className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center animate-scale-in"
                                                    style={{ background: t.preview[0] }}
                                                >
                                                    <Check size={13} className="text-white" strokeWidth={3} />
                                                </div>
                                            )}

                                            {/* Color swatch */}
                                            <div className="flex gap-2 mb-4">
                                                <div
                                                    className="w-12 h-12 rounded-xl shadow-md"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${t.preview[0]}, ${t.preview[1]})`,
                                                        boxShadow: `0 4px 12px ${t.preview[0]}50`,
                                                    }}
                                                />
                                                {/* Mini sidebar preview */}
                                                <div className="flex gap-1">
                                                    {[0.9, 0.55, 0.35].map((op, i) => (
                                                        <div
                                                            key={i}
                                                            className="w-2 rounded-full"
                                                            style={{
                                                                height: `${30 + i * 6}px`,
                                                                alignSelf: 'flex-end',
                                                                background: t.preview[0],
                                                                opacity: op,
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <p className="text-sm font-bold text-slate-900">{t.name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>

                                            {/* Palette dots */}
                                            <div className="flex gap-1.5 mt-3">
                                                {[t.preview[0], t.preview[1], `${t.preview[0]}80`, `${t.preview[0]}40`].map((c, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-4 h-4 rounded-full"
                                                        style={{ background: c }}
                                                    />
                                                ))}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Current theme info banner */}
                            <div
                                className="flex items-center gap-4 p-4 rounded-2xl"
                                style={{
                                    background: `linear-gradient(135deg, ${activeTheme.preview[0]}12, ${activeTheme.preview[1]}18)`,
                                    border: `1px solid ${activeTheme.preview[0]}30`,
                                }}
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: `linear-gradient(135deg, ${activeTheme.preview[0]}, ${activeTheme.preview[1]})` }}
                                >
                                    <Palette size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        Active theme: <span style={{ color: activeTheme.preview[0] }}>{activeTheme.name}</span>
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {activeTheme.description} · Saved automatically
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Profile ── */}
                    {activeTab === 'profile' && (
                        <div className="flex-1 p-6 space-y-6">
                            <h2 className="text-lg font-semibold text-slate-900 font-heading border-b border-slate-100 pb-4">
                                Personal Information
                            </h2>

                            {/* Avatar section */}
                            <div className="flex items-center gap-5">
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg"
                                    style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                                >
                                    AD
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-800">Profile Photo</p>
                                    <p className="text-xs text-slate-400 mt-0.5">JPG, PNG or GIF. Max 2MB.</p>
                                    <button
                                        className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                                        style={{
                                            color: 'var(--primary)',
                                            background: 'var(--primary-50)',
                                        }}
                                    >
                                        Change Photo
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { label: 'First Name', value: 'Admin', type: 'text', span: false },
                                    { label: 'Last Name', value: 'User', type: 'text', span: false },
                                    { label: 'Email Address', value: 'admin@eduerp.com', type: 'email', span: true },
                                    { label: 'Phone Number', value: '+1 (555) 123-4567', type: 'tel', span: false },
                                    { label: 'Designation', value: 'Principal', type: 'text', span: false },
                                ].map(field => (
                                    <div key={field.label} className={`space-y-1.5 ${field.span ? 'md:col-span-2' : ''}`}>
                                        <label className="block text-sm font-medium text-slate-700">{field.label}</label>
                                        <input
                                            type={field.type}
                                            defaultValue={field.value}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none transition-all"
                                            onFocus={e => {
                                                e.currentTarget.style.boxShadow = `0 0 0 3px var(--ring)`;
                                                e.currentTarget.style.borderColor = 'var(--primary)';
                                            }}
                                            onBlur={e => {
                                                e.currentTarget.style.boxShadow = '';
                                                e.currentTarget.style.borderColor = '';
                                            }}
                                        />
                                    </div>
                                ))}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">Role</label>
                                    <input
                                        type="text"
                                        defaultValue="System Administrator"
                                        disabled
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── School Preferences ── */}
                    {activeTab === 'school' && (
                        <div className="flex-1 p-6 space-y-6">
                            <h2 className="text-lg font-semibold text-slate-900 font-heading border-b border-slate-100 pb-4">
                                School Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700">Institution Name</label>
                                    <input
                                        type="text"
                                        defaultValue="Springfield High School"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all"
                                        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 3px var(--ring)`; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                        onBlur={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">Academic Year</label>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all"
                                        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 3px var(--ring)`; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                        onBlur={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}
                                    >
                                        <option>2023 - 2024</option>
                                        <option selected>2024 - 2025</option>
                                        <option>2025 - 2026</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">Date Format</label>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all"
                                        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 3px var(--ring)`; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                        onBlur={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}
                                    >
                                        <option>MM/DD/YYYY</option>
                                        <option selected>DD/MM/YYYY</option>
                                        <option>YYYY-MM-DD</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700">School Address</label>
                                    <textarea
                                        rows={3}
                                        defaultValue={`123 Education Lane\nKnowledge City, ST 12345`}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all resize-none"
                                        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 3px var(--ring)`; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                        onBlur={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Notifications & Security placeholder ── */}
                    {['notifications', 'security'].includes(activeTab) && (
                        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-4">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                style={{ background: 'var(--primary-50)' }}
                            >
                                <Shield size={28} style={{ color: 'var(--primary)' }} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 font-heading">Module Under Construction</h3>
                                <p className="text-sm text-slate-500 mt-1 max-w-xs">
                                    This section is being updated. Please check back soon.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Footer actions */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex justify-end gap-3 rounded-b-2xl">
                        <button className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                            Cancel
                        </button>
                        <button
                            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 shadow-md"
                            style={{
                                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                boxShadow: `0 4px 14px var(--ring)`,
                            }}
                        >
                            <Save size={15} />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}