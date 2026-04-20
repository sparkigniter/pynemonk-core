import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { School, Check, ChevronRight, ChevronLeft, Sparkles, Star, Zap, Building2, ArrowRight } from 'lucide-react';
import * as tenantApi from '../api/tenant.api';
import type { Package } from '../api/tenant.api';

// ── Step tracker ──────────────────────────────────────────────────────────────
type Step = 'plan' | 'details' | 'owner-setup' | 'success';

// ── Package icon map ──────────────────────────────────────────────────────────
const PLAN_META: Record<string, { icon: React.FC<any>; gradient: string; badge?: string }> = {
    standard: { icon: Zap, gradient: 'from-blue-500 to-cyan-400' },
    premium: { icon: Star, gradient: 'from-violet-500 to-purple-400', badge: 'Most Popular' },
    enterprise: { icon: Sparkles, gradient: 'from-amber-500 to-orange-400' },
};

// ── Form state ────────────────────────────────────────────────────────────────
interface FormData {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
}

interface OwnerForm {
    admin_email: string;
    admin_password: string;
    admin_password_confirm: string;
}

const EMPTY_FORM: FormData = {
    name: '', email: '', phone: '', address: '', city: '', state: '', country: '',
};

const EMPTY_OWNER: OwnerForm = {
    admin_email: '', admin_password: '', admin_password_confirm: '',
};

export default function Register() {
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('plan');
    const [packages, setPackages] = useState<Package[]>([]);
    const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
    const [form, setForm] = useState<FormData>(EMPTY_FORM);
    const [ownerForm, setOwnerForm] = useState<OwnerForm>(EMPTY_OWNER);
    const [loading, setLoading] = useState(false);
    const [pkgLoading, setPkgLoading] = useState(true);
    const [error, setError] = useState('');
    const [tenant, setTenant] = useState<tenantApi.Tenant | null>(null);

    // Load packages on mount
    useEffect(() => {
        tenantApi.getPackages()
            .then(setPackages)
            .catch(() => setError('Failed to load packages. Please refresh.'))
            .finally(() => setPkgLoading(false));
    }, []);

    const handlePlanSelect = (pkg: Package) => {
        setSelectedPkg(pkg);
        setError('');
        setStep('details');
    };

    const handleBack = () => {
        setStep('plan');
        setError('');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOwnerForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    /** Step 1 submit: register school */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPkg) return;
        setError('');
        setLoading(true);
        try {
            const result = await tenantApi.registerTenant({
                name: form.name,
                email: form.email,
                phone: form.phone,
                address: form.address,
                city: form.city,
                state: form.state,
                country: form.country,
                package_id: selectedPkg.id,
            });
            setTenant(result);
            setStep('owner-setup');
        } catch (err: any) {
            setError(err?.message ?? 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /** Step 2 submit: create owner account */
    const handleOwnerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant) return;
        if (ownerForm.admin_password !== ownerForm.admin_password_confirm) {
            setError('Passwords do not match.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await tenantApi.setupOwner(tenant.id, {
                admin_email: ownerForm.admin_email,
                admin_password: ownerForm.admin_password,
            });
            setStep('success');
        } catch (err: any) {
            setError(err?.message ?? 'Account setup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>

            {/* Header */}
            <header className="px-8 py-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, var(--primary, #6366f1), var(--accent, #8b5cf6))' }}>
                    <School className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold text-lg tracking-wide">EduERP</span>
                <div className="ml-auto text-sm text-white/50">
                    Already registered? <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Sign in</Link>
                </div>
            </header>

            {/* Progress bar */}
            <div className="px-8 pb-2">
                <div className="max-w-3xl mx-auto flex items-center gap-2">
                    {([
                        { key: 'plan', label: 'Choose Plan' },
                        { key: 'details', label: 'School Details' },
                        { key: 'owner-setup', label: 'Admin Account' },
                    ] as { key: Step; label: string }[]).map(({ key, label }, i) => {
                        const isComplete = (
                            (key === 'plan' && ['details', 'owner-setup', 'success'].includes(step)) ||
                            (key === 'details' && ['owner-setup', 'success'].includes(step)) ||
                            (key === 'owner-setup' && step === 'success')
                        );
                        const isActive = step === key;
                        return (
                            <div key={key} className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${isComplete ? 'bg-indigo-500/30 text-indigo-300' :
                                    isActive ? 'bg-indigo-500 text-white' :
                                        'bg-white/10 text-white/30'
                                    }`}>
                                    {isComplete ? <Check className="w-3.5 h-3.5" /> : i + 1}
                                </div>
                                <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/40'}`}>{label}</span>
                                {i < 2 && <ChevronRight className="w-4 h-4 text-white/20" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <main className="flex-1 px-4 py-8 flex items-start justify-center">

                {/* ── Step 1: Package picker ── */}
                {step === 'plan' && (
                    <div className="w-full max-w-5xl">
                        <div className="text-center mb-10">
                            <h1 className="text-4xl font-extrabold text-white mb-3">Choose Your Plan</h1>
                            <p className="text-white/60 text-lg">Start with a 30-day free trial. No credit card required.</p>
                        </div>

                        {pkgLoading ? (
                            <div className="flex justify-center py-16">
                                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {packages.map(pkg => {
                                    const meta = PLAN_META[pkg.slug] ?? { icon: Zap, gradient: 'from-indigo-500 to-violet-500' };
                                    const Icon = meta.icon;
                                    return (
                                        <div
                                            key={pkg.id}
                                            className={`relative flex flex-col rounded-2xl border cursor-pointer transition-all duration-300 group hover:scale-105 hover:shadow-2xl ${pkg.slug === 'premium' ? 'border-violet-500/60 bg-white/[0.08] shadow-violet-500/20 shadow-xl' : 'border-white/10 bg-white/[0.05] hover:border-white/20'}`}
                                            onClick={() => handlePlanSelect(pkg)}
                                        >
                                            {meta.badge && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                    <span className="bg-gradient-to-r from-violet-500 to-purple-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow">{meta.badge}</span>
                                                </div>
                                            )}

                                            <div className="p-7 flex-1">
                                                {/* Icon */}
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                                                    <Icon className="w-6 h-6 text-white" />
                                                </div>

                                                {/* Name & price */}
                                                <h2 className="text-xl font-bold text-white mb-1">{pkg.name}</h2>
                                                <p className="text-white/50 text-sm mb-5">{pkg.description}</p>
                                                <div className="flex items-baseline gap-1 mb-6">
                                                    <span className="text-4xl font-extrabold text-white">${parseFloat(pkg.price_usd).toFixed(0)}</span>
                                                    <span className="text-white/50 text-sm">/month</span>
                                                </div>

                                                {/* Features */}
                                                <ul className="space-y-2.5">
                                                    {(pkg.features as string[]).map(f => (
                                                        <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                                                            <span className={`w-4 h-4 rounded-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center flex-shrink-0`}>
                                                                <Check className="w-2.5 h-2.5 text-white" />
                                                            </span>
                                                            {f}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="px-7 pb-7">
                                                <button className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r ${meta.gradient} text-white shadow-lg opacity-90 group-hover:opacity-100`}>
                                                    Get Started <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {error && <p className="text-red-400 text-center mt-6 text-sm">{error}</p>}
                    </div>
                )}

                {/* ── Step 2: School details form ── */}
                {step === 'details' && selectedPkg && (
                    <div className="w-full max-w-2xl">
                        {/* Selected plan badge */}
                        <div className="flex items-center gap-3 mb-8">
                            <button onClick={handleBack} className="text-white/40 hover:text-white transition-colors p-1">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 border border-white/10">
                                <span className="text-white/60 text-sm">Selected plan:</span>
                                <span className="text-white font-semibold text-sm">{selectedPkg.name}</span>
                                <span className="text-white/60 text-sm">· ${parseFloat(selectedPkg.price_usd).toFixed(0)}/mo</span>
                            </div>
                        </div>

                        <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Register Your School</h1>
                                    <p className="text-white/50 text-sm">Fill in your school details to get started</p>
                                </div>
                            </div>

                            <form id="register-form" onSubmit={handleSubmit} className="space-y-5">
                                {/* Required */}
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-1.5">School Name <span className="text-red-400">*</span></label>
                                    <input
                                        id="reg-name"
                                        name="name"
                                        type="text"
                                        required
                                        placeholder="Greenwood High School"
                                        value={form.name}
                                        onChange={handleChange}
                                        className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-1.5">Official Email <span className="text-red-400">*</span></label>
                                    <input
                                        id="reg-email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="admin@greenwood.edu"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-1.5">Phone Number</label>
                                    <input
                                        id="reg-phone"
                                        name="phone"
                                        type="tel"
                                        placeholder="+1 (555) 000-0000"
                                        value={form.phone}
                                        onChange={handleChange}
                                        className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-1.5">Address</label>
                                    <input
                                        id="reg-address"
                                        name="address"
                                        type="text"
                                        placeholder="123 School Lane"
                                        value={form.address}
                                        onChange={handleChange}
                                        className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">City</label>
                                        <input id="reg-city" name="city" type="text" placeholder="New York" value={form.city} onChange={handleChange}
                                            className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">State / Province</label>
                                        <input id="reg-state" name="state" type="text" placeholder="NY" value={form.state} onChange={handleChange}
                                            className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-1.5">Country</label>
                                    <input id="reg-country" name="country" type="text" placeholder="United States" value={form.country} onChange={handleChange}
                                        className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <button
                                    id="reg-submit"
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl font-semibold text-white text-sm bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-200 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Registering...</>
                                    ) : (
                                        <>Register School <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── Step 3: Owner account setup ── */}
                {step === 'owner-setup' && tenant && (
                    <div className="w-full max-w-md">
                        <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                                    <School className="w-7 h-7 text-white" />
                                </div>
                                <h1 className="text-xl font-bold text-white">Create Your Admin Account</h1>
                                <p className="text-white/50 text-sm mt-1">
                                    <span className="text-indigo-300 font-medium">{tenant.name}</span> is registered.
                                    Now set up your login credentials.
                                </p>
                                <p className="text-white/30 text-xs mt-2">
                                    This account can manage settings and billing.
                                    You'll assign school roles (Principal, Teachers) after login.
                                </p>
                            </div>

                            <form id="owner-setup-form" onSubmit={handleOwnerSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-1.5">Your Email <span className="text-red-400">*</span></label>
                                    <input
                                        id="owner-email"
                                        name="admin_email"
                                        type="email"
                                        required
                                        autoFocus
                                        placeholder="you@yourschool.com"
                                        value={ownerForm.admin_email}
                                        onChange={handleOwnerChange}
                                        className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-1.5">Password <span className="text-red-400">*</span></label>
                                    <input
                                        id="owner-password"
                                        name="admin_password"
                                        type="password"
                                        required
                                        minLength={8}
                                        placeholder="Min 8 characters"
                                        value={ownerForm.admin_password}
                                        onChange={handleOwnerChange}
                                        className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-1.5">Confirm Password <span className="text-red-400">*</span></label>
                                    <input
                                        id="owner-password-confirm"
                                        name="admin_password_confirm"
                                        type="password"
                                        required
                                        placeholder="Re-enter password"
                                        value={ownerForm.admin_password_confirm}
                                        onChange={handleOwnerChange}
                                        className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${ownerForm.admin_password_confirm && ownerForm.admin_password !== ownerForm.admin_password_confirm
                                            ? 'border-red-500/50' : 'border-white/15'
                                            }`}
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
                                )}

                                <button
                                    id="owner-submit"
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl font-semibold text-white text-sm bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-200 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading
                                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Setting up...</>
                                        : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── Step 4: Success ── */}
                {step === 'success' && tenant && (
                    <div className="w-full max-w-lg text-center">
                        <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-10 backdrop-blur-sm">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
                                <Check className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-extrabold text-white mb-3">You're all set! 🎉</h1>
                            <p className="text-white/60 mb-2">
                                <span className="text-white font-semibold">{tenant.name}</span> has been registered successfully.
                            </p>
                            <p className="text-white/40 text-sm mb-8">A confirmation will be sent to <span className="text-indigo-400">{tenant.email}</span></p>

                            <div className="bg-white/5 rounded-xl p-4 mb-8 text-left space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/50">Tenant ID</span>
                                    <span className="text-white font-mono text-xs">{tenant.uuid}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/50">Slug</span>
                                    <span className="text-white font-mono">{tenant.slug}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/50">Plan</span>
                                    <span className="text-white">{selectedPkg?.name}</span>
                                </div>
                            </div>

                            <button
                                id="reg-go-login"
                                onClick={() => navigate('/login')}
                                className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-200 shadow-lg"
                            >
                                Continue to Login
                            </button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
