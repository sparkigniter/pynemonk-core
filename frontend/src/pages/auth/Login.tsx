import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, School, ArrowRight, AlertCircle, Sparkles, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
    const navigate  = useNavigate();
    const location  = useLocation();
    const { login } = useAuth();

    const from = (location.state as any)?.from?.pathname ?? '/dashboard';

    const [schoolSlug, setSchoolSlug] = useState(location.state?.schoolSlug || '');
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error,    setError]    = useState('');
    const [loading,  setLoading]  = useState(false);
    const [tenants,  setTenants]  = useState<any[]>([]);
    const [step,     setStep]     = useState<'LOGIN' | 'SELECT_TENANT'>('LOGIN');

    useEffect(() => {
        if (location.state?.schoolSlug) {
            setSchoolSlug(location.state.schoolSlug);
        }
    }, [location.state?.schoolSlug]);

    const handleSubmit = async (e: React.FormEvent, selectedSlug?: string) => {
        if (e) e.preventDefault();
        
        const slugToUse = selectedSlug || schoolSlug || undefined;

        if (!email || !password) {
            setError('Please enter your email and password.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const result = await login(email, password, slugToUse);
            
            if ('status' in result && result.status === 'MULTIPLE_TENANTS') {
                setTenants(result.tenants);
                setStep('SELECT_TENANT');
            } else {
                navigate(from, { replace: true });
            }
        } catch (err: any) {
            setError(err?.message ?? 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTenant = (slug: string) => {
        handleSubmit(null as any, slug);
    };

    if (step === 'SELECT_TENANT') {
        return (
            <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, var(--page-bg-from) 0%, var(--page-bg-to) 100%)' }}>
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-md animate-fade-in-up">
                        <div className="mb-8 text-center">
                            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
                                style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
                                <Building2 size={32} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[var(--text-main)] font-heading">Choose your school</h2>
                            <p className="text-[var(--text-muted)] text-sm mt-1.5">Multiple schools are associated with your account.</p>
                        </div>

                        <div className="space-y-3">
                            {tenants.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => handleSelectTenant(t.slug)}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <School size={20} className="text-[var(--text-muted)] group-hover:text-primary" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-slate-800">{t.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">ID: {t.slug}</p>
                                    </div>
                                    <ArrowRight size={18} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-2 text-[10px] font-bold text-primary hover:opacity-80 underline"
                        >
                            Retry Now
                        </button>
                        <button
                            onClick={() => setStep('LOGIN')}
                            className="w-full mt-6 text-sm font-semibold text-[var(--text-muted)] hover:text-slate-800 transition-colors"
                        >
                            Back to login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, var(--page-bg-from) 0%, var(--page-bg-to) 100%)' }}>

            {/* ── Left panel — branding ─────────────────────────────── */}
            <div
                className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12 relative overflow-hidden"
                style={{ background: 'linear-gradient(145deg, var(--hero-from) 0%, var(--hero-via) 50%, var(--hero-to) 100%)' }}
            >
                {/* Decorative blobs */}
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, white, transparent)' }} />
                <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, white, transparent)' }} />
                <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full opacity-5"
                    style={{ background: 'white' }} />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--card-bg)]/20 backdrop-blur-sm flex items-center justify-center">
                        <School size={22} className="text-white" />
                    </div>
                    <span className="text-xl font-bold text-white font-heading tracking-wide">EduERP</span>
                </div>

                {/* Center copy */}
                <div className="relative z-10 space-y-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--card-bg)]/15 text-white/80 text-xs font-medium">
                            ✦ School Management Platform
                        </div>
                        <h1 className="text-4xl xl:text-5xl font-bold text-white font-heading leading-tight">
                            Everything your school<br />needs, in one place.
                        </h1>
                        <p className="text-white/60 text-lg leading-relaxed max-w-md">
                            Manage students, teachers, attendance, fees, and reports — all from a single, beautiful dashboard.
                        </p>
                    </div>

                    {/* Feature chips */}
                    <div className="flex flex-wrap gap-2">
                        {['Student Management', 'Attendance Tracking', 'Fee Collection', 'Reports & Analytics'].map(f => (
                            <span key={f} className="px-3 py-1.5 rounded-full bg-[var(--card-bg)]/10 text-white/75 text-sm backdrop-blur-sm border border-white/10">
                                {f}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Testimonial / stats strip */}
                <div className="relative z-10 grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
                    {[
                        { value: '1,248', label: 'Students enrolled' },
                        { value: '96.4%', label: 'Avg attendance' },
                        { value: '$45K',  label: 'Monthly collections' },
                    ].map(s => (
                        <div key={s.label}>
                            <p className="text-2xl font-bold text-white font-heading">{s.value}</p>
                            <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Right panel — login form ──────────────────────────── */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md animate-fade-in-up">

                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-2.5 mb-8">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-primary/20`}>
                            <School size={18} className="text-primary" />
                        </div>
                        <span className="text-lg font-bold text-slate-800 font-heading">EduERP</span>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-[var(--text-main)] font-heading">Welcome back</h2>
                        <p className="text-[var(--text-muted)] text-sm mt-1.5">Sign in to your EduERP account to continue.</p>
                    </div>

                    {/* Error banner */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 rounded-xl mb-6 animate-scale-in"
                            style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}>
                            <AlertCircle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-rose-700 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form id="login-form" onSubmit={handleSubmit} className="space-y-5" noValidate>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                                <input
                                    id="login-email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@eduerp.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--card-border)] text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    className="text-xs font-semibold transition-colors text-primary"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                                <input
                                    id="login-password"
                                    type={showPass ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-[var(--card-border)] text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <button
                                    type="button"
                                    id="toggle-password"
                                    onClick={() => setShowPass(p => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-primary transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                            style={{
                                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                boxShadow: '0 4px 20px var(--ring)',
                            }}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* ── Register CTA ─────────────────────── */}
                    <div className="mt-6 relative group">
                        <div
                            className="absolute inset-0 rounded-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', padding: '1px' }}
                        />
                        <Link
                            to="/register"
                            id="go-to-register"
                            className="relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group-hover:scale-[1.01]"
                            style={{ background: 'linear-gradient(135deg, #f8f5ff 0%, #eef2ff 100%)', border: '1.5px solid transparent', backgroundClip: 'padding-box' }}
                        >
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                                style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                            >
                                <Building2 size={20} className="text-white" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <p className="text-sm font-bold text-slate-800">Register Your School</p>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                        style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: 'white' }}>
                                        <Sparkles size={9} /> Free Trial
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] truncate">Set up your school in minutes. No credit card required.</p>
                            </div>

                            <ArrowRight size={18} className="text-[var(--text-muted)] group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
                        </Link>
                    </div>

                    {/* Demo hint */}
                    <div className="mt-4 flex items-center justify-center gap-1.5">
                        <span className="text-xs text-[var(--text-muted)]">Demo:</span>
                        <button
                            type="button"
                            id="use-demo-credentials"
                            onClick={() => { setEmail('admin@eduerp.com'); setPassword('admin1234'); }}
                            className="text-xs font-semibold transition-colors hover:underline"
                            style={{ color: 'var(--primary)' }}
                        >
                            admin@eduerp.com / admin1234
                        </button>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-[var(--text-muted)] mt-6">
                        © {new Date().getFullYear()} EduERP · All rights reserved
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
