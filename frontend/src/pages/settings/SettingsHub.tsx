import { useState, useEffect } from 'react';
import { 
    Shield, Save, 
    RotateCcw, Building, CreditCard, 
    Calendar, Loader2, User, Palette, ListChecks, MessageSquare
} from 'lucide-react';
import LeaveTypeSettings from '../../components/admin/LeaveTypeSettings';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { get, put } from '../../api/base.api';
import { useNotification } from '../../contexts/NotificationContext';
import FiscalYearSettings from './components/FiscalYearSettings';


const Sparkles = ({ size, className }: { size: number, className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="m12 3 1.912 4.913L18.826 9.826 13.913 11.739 12 16.652l-1.913-4.913L5.174 9.826l4.913-1.913L12 3z" />
        <path d="M5 3 5.3 3.7 6 4 5.3 4.3 5 5 4.7 4.3 4 4 4.7 3.7 5 3z" />
        <path d="M18 14 18.3 14.7 19 15 18.3 15.3 18 16 17.7 15.3 17 15 17.7 14.7 18 14z" />
    </svg>
);

export default function SettingsHub() {
    const { notify } = useNotification();
    const { user, can } = useAuth();
    const { theme, setTheme, themes } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await get<any>('/school/settings');
            setSettings(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await put('/school/settings', settings);
            notify('success', 'Configuration Updated', 'System preferences have been synchronized successfully.');
        } catch (err: any) {
            notify('error', 'Update Failed', err.message);
        } finally {
            setSaving(false);
        }
    };

    const updateValue = (key: string, value: string) => {
        setSettings({ ...settings, [key]: value });
    };

    const TABS = [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'appearance', label: 'Interface Style', icon: Palette },
        { id: 'general', label: 'Institutional Profile', icon: Building, permission: 'settings:write' },
        { id: 'academic', label: 'Academic Rules', icon: Calendar, permission: 'settings:write' },
        { id: 'finance', label: 'Financial Policy', icon: CreditCard, permission: 'settings:write' },
        { id: 'hr', label: 'HR Configuration', icon: ListChecks, permission: 'staff.leave:read' },
        { id: 'communication', label: 'Communication Hub', icon: MessageSquare, permission: 'settings:write' },
        { id: 'branding', label: 'Custom Branding', icon: Palette, permission: 'settings:write' },
        { id: 'security', label: 'Access Control', icon: Shield, permission: 'settings:write' },
    ];

    const visibleTabs = TABS.filter(t => !t.permission || can(t.permission));

    if (loading) return (
        <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            <Loader2 className="animate-spin mx-auto mb-4" size={32} />
            Initializing Config Engine...
        </div>
    );

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Control Center</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Master Configuration & Global Rules</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchSettings} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 hover:shadow-lg transition-all">
                        <RotateCcw size={20} />
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-3"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Sync Changes
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Navigation Sidebar */}
                <aside className="lg:col-span-3 space-y-2">
                    {visibleTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                                activeTab === tab.id 
                                ? 'bg-white border-slate-100 shadow-xl shadow-slate-200/50 text-slate-900 ring-1 ring-slate-100' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'
                            }`}>
                                <tab.icon size={18} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
                        </button>
                    ))}
                </aside>

                {/* Settings Panels */}
                <main className="lg:col-span-9 bg-white p-10 lg:p-14 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/20 relative overflow-hidden min-h-[600px]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    
                    {activeTab === 'profile' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">My Profile</h2>
                                <p className="text-xs font-medium text-slate-400">Manage your personal information and security credentials.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Identity</label>
                                    <input type="text" className="settings-input" defaultValue={user?.email} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <input type="email" className="settings-input" defaultValue={user?.email} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Architecture</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {user?.roles.map((r: string) => (
                                            <span key={r} className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest">{r.replace('_', ' ')}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Interface Style</h2>
                                <p className="text-xs font-medium text-slate-400">Choose a visual theme that complements your workflow.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTheme(t.id)}
                                        className={`p-6 rounded-[2.5rem] border-2 text-left transition-all ${t.id === theme.id ? 'border-slate-900 bg-slate-50' : 'border-slate-50 hover:border-slate-200'}`}
                                    >
                                        <div className="w-12 h-12 rounded-2xl mb-4" style={{ background: `linear-gradient(135deg, ${t.preview[0]}, ${t.preview[1]})` }} />
                                        <p className="text-sm font-black text-slate-900">{t.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{t.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'general' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Institutional Profile</h2>
                                <p className="text-xs font-medium text-slate-400">Configure your school's global identity and contact meta-data.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Name</label>
                                    <input 
                                        type="text" 
                                        className="settings-input"
                                        placeholder="Luvia Academy"
                                        value={settings.school_name || ''}
                                        onChange={e => updateValue('school_name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Support Email</label>
                                    <input 
                                        type="email" 
                                        className="settings-input"
                                        placeholder="contact@school.com"
                                        value={settings.school_email || ''}
                                        onChange={e => updateValue('school_email', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-full space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
                                    <textarea 
                                        className="settings-input h-32 resize-none"
                                        placeholder="123 Education Drive..."
                                        value={settings.school_address || ''}
                                        onChange={e => updateValue('school_address', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'academic' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Academic Intelligence</h2>
                                <p className="text-xs font-medium text-slate-400">Define how the system handles attendance, grading, and sessions.</p>
                            </div>
                            <div className="space-y-8">
                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Attendance Strategy</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'DAILY', label: 'Daily Check-in', desc: 'Once per day tracking' },
                                            { id: 'PERIOD_WISE', label: 'Period Wise', desc: 'Tracking every lecture' },
                                        ].map(mode => (
                                            <button
                                                key={mode.id}
                                                onClick={() => updateValue('attendance_mode', mode.id)}
                                                className={`p-6 rounded-2xl border text-left transition-all ${
                                                    settings.attendance_mode === mode.id 
                                                    ? 'bg-white border-primary shadow-lg shadow-primary/5 text-primary' 
                                                    : 'bg-white border-transparent text-slate-500 opacity-60'
                                                }`}
                                            >
                                                <p className="text-sm font-black mb-1">{mode.label}</p>
                                                <p className="text-[10px] font-bold opacity-60 uppercase tracking-tight">{mode.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Grade Scale</label>
                                        <select 
                                            className="settings-input appearance-none"
                                            value={settings.grade_scale || '10_POINT'}
                                            onChange={e => updateValue('grade_scale', e.target.value)}
                                        >
                                            <option value="10_POINT">10 Point Absolute</option>
                                            <option value="4_POINT">4 Point GPA</option>
                                            <option value="PERCENTAGE">Percentage Only</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Automatic Promotion</label>
                                        <select 
                                            className="settings-input appearance-none"
                                            value={settings.auto_promotion || 'DISABLED'}
                                            onChange={e => updateValue('auto_promotion', e.target.value)}
                                        >
                                            <option value="ENABLED">Enabled after Final Exam</option>
                                            <option value="DISABLED">Manual Review Required</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'branding' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Visual Identity</h2>
                                <p className="text-xs font-medium text-slate-400">Personalize the application's aesthetic to match your school colors.</p>
                            </div>
                            <div className="space-y-10">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Theme Color</label>
                                        <div className="flex items-center gap-4">
                                            <input 
                                                type="color" 
                                                className="w-16 h-16 rounded-2xl border-4 border-white shadow-xl cursor-pointer"
                                                value={settings.primary_color || '#4F46E5'}
                                                onChange={e => updateValue('primary_color', e.target.value)}
                                            />
                                            <div>
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{settings.primary_color || '#4F46E5'}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">HEX Code</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">App Icon Silhouette</label>
                                        <div className="flex gap-3">
                                            {['square', 'rounded', 'circle'].map(shape => (
                                                <button 
                                                    key={shape}
                                                    onClick={() => updateValue('logo_shape', shape)}
                                                    className={`w-12 h-12 flex items-center justify-center border-2 transition-all ${
                                                        settings.logo_shape === shape ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'
                                                    } ${shape === 'square' ? 'rounded-lg' : shape === 'rounded' ? 'rounded-2xl' : 'rounded-full'}`}
                                                >
                                                    <div className={`w-6 h-6 bg-slate-300 ${shape === 'square' ? 'rounded-sm' : shape === 'rounded' ? 'rounded-md' : 'rounded-full'}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-10 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
                                    <div className="flex items-center gap-6 relative z-10">
                                        <div 
                                            className="w-20 h-20 flex items-center justify-center text-white shadow-2xl"
                                            style={{ backgroundColor: settings.primary_color || '#4F46E5', borderRadius: settings.logo_shape === 'circle' ? '50%' : '1.5rem' }}
                                        >
                                            <Sparkles size={40} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Preview</p>
                                            <h3 className="text-2xl font-black tracking-tighter">Institution Dashboard</h3>
                                            <p className="text-slate-400 text-xs font-medium">This is how your branding elements will coalesce.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'finance' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Financial Engine</h2>
                                <p className="text-xs font-medium text-slate-400">Configure currency, tax handling, and billing nomenclature.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operating Currency</label>
                                    <select 
                                        className="settings-input appearance-none"
                                        value={settings.currency || 'USD'}
                                        onChange={e => updateValue('currency', e.target.value)}
                                    >
                                        <option value="USD">USD - US Dollar ($)</option>
                                        <option value="INR">INR - Indian Rupee (₹)</option>
                                        <option value="GBP">GBP - British Pound (£)</option>
                                        <option value="EUR">EUR - Euro (€)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Invoice Auto-Prefix</label>
                                    <input 
                                        type="text" 
                                        className="settings-input"
                                        placeholder="INV-2026-"
                                        value={settings.invoice_prefix || 'INV-'}
                                        onChange={e => updateValue('invoice_prefix', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Gateway</label>
                                    <select 
                                        className="settings-input appearance-none"
                                        value={settings.payment_gateway || 'MOCK_DEMO'}
                                        onChange={e => updateValue('payment_gateway', e.target.value)}
                                    >
                                        <option value="MOCK_DEMO">Mock/Demo Payment Portal</option>
                                        <option value="STRIPE">Stripe Connect</option>
                                        <option value="RAZORPAY">Razorpay Institutional</option>
                                        <option value="OFFLINE">Offline/Cash Only</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tax Identification No.</label>
                                    <input 
                                        type="text" 
                                        className="settings-input"
                                        placeholder="TAX-001122"
                                        value={settings.tax_id || ''}
                                        onChange={e => updateValue('tax_id', e.target.value)}
                                    />
                                </div>

                                {settings.payment_gateway === 'STRIPE' && (
                                    <div className="col-span-2 p-6 bg-slate-50 rounded-3xl border border-slate-100/80 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="col-span-2">
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Stripe Credentials Configuration</h4>
                                            <p className="text-[10px] font-medium text-slate-400 mt-1">Provide API credentials from your Stripe Dashboard to enable automated card payments.</p>
                                        </div>
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Stripe Publishable Key</label>
                                            <input 
                                                type="text" 
                                                className="settings-input bg-white border border-slate-100"
                                                placeholder="pk_test_..."
                                                value={settings.stripe_publishable_key || ''}
                                                onChange={e => updateValue('stripe_publishable_key', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Stripe Secret Key</label>
                                            <input 
                                                type="password" 
                                                className="settings-input bg-white border border-slate-100"
                                                placeholder="sk_test_••••••••••••••••••••"
                                                value={settings.stripe_secret_key || ''}
                                                onChange={e => updateValue('stripe_secret_key', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Stripe Webhook Secret Key</label>
                                            <input 
                                                type="password" 
                                                className="settings-input bg-white border border-slate-100"
                                                placeholder="whsec_••••••••••••••••••••"
                                                value={settings.stripe_webhook_secret || ''}
                                                onChange={e => updateValue('stripe_webhook_secret', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {settings.payment_gateway === 'RAZORPAY' && (
                                    <div className="col-span-2 p-6 bg-slate-50 rounded-3xl border border-slate-100/80 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="col-span-2">
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Razorpay Credentials Configuration</h4>
                                            <p className="text-[10px] font-medium text-slate-400 mt-1">Provide Key ID and Secret Key from your Razorpay Dashboard to enable UPI, Cards, and Netbanking.</p>
                                        </div>
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Razorpay Key ID</label>
                                            <input 
                                                type="text" 
                                                className="settings-input bg-white border border-slate-100"
                                                placeholder="rzp_test_..."
                                                value={settings.razorpay_key_id || ''}
                                                onChange={e => updateValue('razorpay_key_id', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Razorpay Key Secret</label>
                                            <input 
                                                type="password" 
                                                className="settings-input bg-white border border-slate-100"
                                                placeholder="••••••••••••••••••••••••"
                                                value={settings.razorpay_secret || ''}
                                                onChange={e => updateValue('razorpay_secret', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-2 col-span-2 pt-8 border-t border-slate-100">
                                    <FiscalYearSettings />
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'hr' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Human Resources</h2>
                                <p className="text-xs font-medium text-slate-400">Configure leave types, approval workflows, and staff categories.</p>
                            </div>
                            <LeaveTypeSettings />
                        </div>
                    )}
                    
                    {activeTab === 'communication' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Communication Hub</h2>
                                <p className="text-xs font-medium text-slate-400">Configure SMS and Email gateways for automated institutional alerts.</p>
                            </div>
                            
                            <div className="space-y-10">
                                {/* SMS Gateway */}
                                <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                                                <MessageSquare size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900">SMS Gateway (Twilio)</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent Alerts & Staff Reminders</p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${settings.sms_provider === 'twilio' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {settings.sms_provider === 'twilio' ? 'Active Gateway' : 'System Fallback'}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SMS Provider</label>
                                            <select 
                                                className="settings-input appearance-none"
                                                value={settings.sms_provider || 'mock'}
                                                onChange={e => updateValue('sms_provider', e.target.value)}
                                            >
                                                <option value="mock">System Console (Mock/Debug)</option>
                                                <option value="twilio">Twilio Institutional API</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sender ID / Phone</label>
                                            <input 
                                                type="text" 
                                                className="settings-input"
                                                placeholder="+1234567890"
                                                value={settings.sms_twilio_from || ''}
                                                onChange={e => updateValue('sms_twilio_from', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account SID</label>
                                            <input 
                                                type="text" 
                                                className="settings-input"
                                                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx"
                                                value={settings.sms_twilio_sid || ''}
                                                onChange={e => updateValue('sms_twilio_sid', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Auth Token</label>
                                            <input 
                                                type="password" 
                                                className="settings-input"
                                                placeholder="••••••••••••••••••••••••"
                                                value={settings.sms_twilio_token || ''}
                                                onChange={e => updateValue('sms_twilio_token', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Email Gateway */}
                                <div className="p-10 bg-white rounded-[3rem] border border-slate-100 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                                                <Save size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900">Email Gateway (SendGrid)</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Cards & Invoices</p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${settings.email_provider === 'sendgrid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {settings.email_provider === 'sendgrid' ? 'Active Gateway' : 'System Fallback'}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Provider</label>
                                            <select 
                                                className="settings-input appearance-none"
                                                value={settings.email_provider || 'mock'}
                                                onChange={e => updateValue('email_provider', e.target.value)}
                                            >
                                                <option value="mock">System Console (Mock/Debug)</option>
                                                <option value="sendgrid">SendGrid REST API</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verified Sender Email</label>
                                            <input 
                                                type="email" 
                                                className="settings-input"
                                                placeholder="notifications@luvia.edu"
                                                value={settings.email_from || ''}
                                                onChange={e => updateValue('email_from', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">From Name</label>
                                            <input 
                                                type="text" 
                                                className="settings-input"
                                                placeholder="Luvia Administration"
                                                value={settings.email_from_name || ''}
                                                onChange={e => updateValue('email_from_name', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SendGrid API Key</label>
                                            <input 
                                                type="password" 
                                                className="settings-input"
                                                placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
                                                value={settings.email_sendgrid_key || ''}
                                                onChange={e => updateValue('email_sendgrid_key', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <style>{`
                .settings-input {
                    width: 100%;
                    padding: 1rem 1.5rem;
                    background-color: #F8FAFC;
                    border: 1px solid transparent;
                    border-radius: 1.25rem;
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: #1E293B;
                    outline: none;
                    transition: all 0.3s;
                }
                .settings-input:focus {
                    background-color: white;
                    border-color: #F1F5F9;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
                }
            `}</style>
        </div>
    );
}

