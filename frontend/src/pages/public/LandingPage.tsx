import { motion, useScroll, useMotionValueEvent, useTransform } from 'framer-motion';
import {
    ArrowRight, GraduationCap, BarChart3, Play, Menu, X,
    ShieldCheck, Database, CreditCard, Smartphone, FileCheck,
    Activity, Users, BookOpen, Calculator, Briefcase, Bell
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Custom Smooth Scroll Hook for Better UX
const useSmoothScroll = () => {
    return (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const offset = 80; // Account for fixed header
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };
};

const Nav = () => {
    const navigate = useNavigate();
    const handleSmoothScroll = useSmoothScroll();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 30);
    });

    const navItems = [
        { name: 'Intelligence', id: 'intelligence' },
        { name: 'Compliance', id: 'compliance' },
        { name: 'Financials', id: 'financials' },
        { name: 'Ecosystem', id: 'ecosystem' }
    ];

    return (
        <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${scrolled
            ? 'bg-slate-900/80 backdrop-blur-md border-b border-slate-800 py-4'
            : 'bg-transparent py-6'
            }`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-300">
                        <GraduationCap size={22} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white font-outfit">LUVIA</span>
                </div>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-8">
                    {navItems.map((item) => (
                        <a
                            key={item.id}
                            href={`#${item.id}`}
                            onClick={(e) => handleSmoothScroll(e, item.id)}
                            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors tracking-wide"
                        >
                            {item.name}
                        </a>
                    ))}
                </div>

                <div className="hidden lg:flex items-center gap-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-xs font-semibold text-slate-300 hover:text-white transition-colors px-4 py-2"
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => navigate('/register')}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98]"
                    >
                        Book a Demo
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="lg:hidden p-2 text-slate-400 hover:text-white"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 w-full bg-slate-900 border-b border-slate-800 p-6 flex flex-col gap-4 lg:hidden shadow-xl"
                >
                    {navItems.map((item) => (
                        <a
                            key={item.id}
                            href={`#${item.id}`}
                            onClick={(e) => { setMobileMenuOpen(false); handleSmoothScroll(e, item.id); }}
                            className="text-lg font-medium text-slate-300 py-2 hover:text-white"
                        >
                            {item.name}
                        </a>
                    ))}
                    <div className="h-px bg-slate-800 my-2" />
                    <button onClick={() => navigate('/login')} className="w-full py-3 bg-slate-800 text-slate-300 rounded-xl font-medium text-sm">Sign In</button>
                    <button onClick={() => navigate('/register')} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium text-sm">Get Started</button>
                </motion.div>
            )}
        </nav>
    );
};

const FeatureCard = ({ icon: Icon, title, desc, features, color }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="p-8 lg:p-10 rounded-3xl bg-slate-900 border border-slate-800/60 shadow-xl relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300"
    >
        <div className={`w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-6`}>
            <Icon size={22} className={color} />
        </div>
        <h3 className="text-xl font-bold text-white mb-3 font-outfit tracking-tight">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">{desc}</p>

        <ul className="space-y-3 border-t border-slate-800/80 pt-6">
            {features.map((f: string, i: number) => (
                <li key={i} className="flex items-center gap-3 text-xs text-slate-400">
                    <div className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} />
                    {f}
                </li>
            ))}
        </ul>
    </motion.div>
);

const SectionHeader = ({ tag, title, desc }: any) => (
    <div className="max-w-3xl mx-auto text-center space-y-4 mb-16 px-6">
        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-900/50">
            {tag}
        </span>
        <h2 className="text-3xl lg:text-5xl font-bold tracking-tight font-outfit text-white leading-tight">
            {title}
        </h2>
        <p className="text-slate-400 text-base lg:text-lg font-normal max-w-2xl mx-auto">{desc}</p>
    </div>
);

export default function LandingPage() {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const y1 = useTransform(scrollYProgress, [0, 1], [0, 300]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -300]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-600 selection:text-white antialiased">
            {/* Inject clean Google Font import natively */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
                .font-outfit { font-family: 'Outfit', sans-serif; }
                body { font-family: 'Plus Jakarta Sans', sans-serif; }
            `}</style>

            <Nav />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-36 overflow-hidden border-b border-slate-900">
                <motion.div style={{ y: y1 }} className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
                <motion.div style={{ y: y2 }} className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                        <div className="lg:col-span-6 space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2.5 px-3 py-1 bg-slate-900 rounded-full border border-slate-800 shadow-sm"
                            >
                                <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-xs font-medium text-indigo-300">Next-Gen Institutional Operating System</span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="text-4xl lg:text-6xl font-bold tracking-tight font-outfit text-white leading-[1.1]"
                            >
                                Empowering the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-200">Future of Education.</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-base lg:text-lg text-slate-400 leading-relaxed max-w-xl"
                            >
                                Luvia unifies complex academic workflows, financial governance, and regulatory compliance into a high-performance institutional hub.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-col sm:flex-row items-center gap-4 pt-2"
                            >
                                <button
                                    onClick={() => navigate('/register')}
                                    className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 group active:scale-[0.98]"
                                >
                                    Launch Your Institution
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                                    <Play size={14} fill="currentColor" className="text-slate-400" />
                                    Explore Ecosystem
                                </button>
                            </motion.div>

                            {/* Trust Metrics */}
                            <div className="flex items-center gap-8 pt-6 border-t border-slate-900">
                                <div className="space-y-0.5">
                                    <p className="text-2xl font-bold text-white font-outfit">200+</p>
                                    <p className="text-xs text-slate-400">Global Partners</p>
                                </div>
                                <div className="w-px h-8 bg-slate-800" />
                                <div className="space-y-0.5">
                                    <p className="text-2xl font-bold text-white font-outfit">99.9%</p>
                                    <p className="text-xs text-slate-400">Compliance Rate</p>
                                </div>
                                <div className="w-px h-8 bg-slate-800" />
                                <div className="space-y-0.5">
                                    <p className="text-2xl font-bold text-white font-outfit">1M+</p>
                                    <p className="text-xs text-slate-400">Digital Identities</p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive UI Mockup Showcase */}
                        <div className="lg:col-span-6 relative">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8 }}
                                className="relative bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 shadow-2xl"
                            >
                                <div className="absolute inset-0 bg-indigo-600/5 blur-xl rounded-2xl pointer-events-none" />
                                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner aspect-[16/10] flex flex-col">
                                    {/* Mock Window Controls */}
                                    <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-900 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                                        </div>
                                        <div className="w-32 h-4 bg-slate-900 rounded-md" />
                                        <div className="w-4 h-4 rounded bg-slate-900" />
                                    </div>
                                    {/* Mock Dashboard Body Content */}
                                    <div className="p-4 flex-1 grid grid-cols-3 gap-3 bg-slate-950">
                                        <div className="col-span-2 bg-slate-900/40 rounded-lg border border-slate-900 p-4 space-y-3">
                                            <div className="h-4 bg-slate-800 rounded w-1/3" />
                                            <div className="h-24 bg-gradient-to-t from-indigo-950/20 to-indigo-900/20 rounded-lg border border-indigo-900/30 flex items-end p-2 justify-between">
                                                <div className="w-4 h-12 bg-indigo-600/40 rounded-sm" />
                                                <div className="w-4 h-16 bg-indigo-600/60 rounded-sm" />
                                                <div className="w-4 h-8 bg-indigo-600/30 rounded-sm" />
                                                <div className="w-4 h-20 bg-indigo-600 rounded-sm" />
                                            </div>
                                        </div>
                                        <div className="bg-slate-900/40 rounded-lg border border-slate-900 p-4 space-y-4">
                                            <div className="h-4 bg-slate-800 rounded w-2/3" />
                                            <div className="space-y-2">
                                                <div className="h-2 bg-slate-800 rounded" />
                                                <div className="h-2 bg-slate-800 rounded w-5/6" />
                                                <div className="h-2 bg-slate-800 rounded w-4/5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Metrics Overlay */}
                                <motion.div
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-6 -left-6 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg hidden xl:flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-900 flex items-center justify-center text-indigo-400">
                                        <Activity size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">System Health</p>
                                        <p className="text-sm font-bold text-white font-outfit">Optimal (100%)</p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Metrics Impact Section with Parallax */}
            <section className="py-24 lg:py-32 relative overflow-hidden bg-slate-950 border-b border-slate-900">
                <motion.div style={{ y: y1 }} className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />
                <motion.div style={{ y: y2 }} className="absolute top-1/2 left-10 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-900/50">Proven Impact</span>
                        <h2 className="text-3xl lg:text-5xl font-bold tracking-tight font-outfit text-white leading-tight">Transforming institutional outcomes.</h2>
                        <p className="text-slate-400 text-base lg:text-lg">Schools that transition to Luvia see immediate and measurable improvements across all operational sectors.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { metric: "40%", desc: "Reduction in administrative overhead and manual data entry" },
                            { metric: "3x", desc: "Faster fee collection cycles through automated smart invoicing" },
                            { metric: "100%", desc: "Compliance with regional government SATS and reporting standards" },
                            { metric: "+85%", desc: "Increase in parent engagement via the native mobile portal" }
                        ].map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.6 }}
                                className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-sm text-center hover:bg-slate-900 transition-colors shadow-lg relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
                                <h3 className="text-5xl font-black text-white font-outfit mb-4">{item.metric}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed relative z-10">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mobile Ecosystem Section */}
            <section id="ecosystem" className="py-20 lg:py-28 bg-slate-900/40 border-b border-slate-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-900/50">Unified Ecosystem</span>
                                <h2 className="text-3xl lg:text-4xl font-bold text-white font-outfit tracking-tight">Your Entire Institution inside their pockets.</h2>
                                <p className="text-sm lg:text-base text-slate-400 leading-relaxed">
                                    Luvia isn't just for operations teams and admins. We deliver high-performance native experiences designed intentionally for teachers, parents, and support staff.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-4 p-5 rounded-2xl bg-slate-900 border border-slate-800/80">
                                    <div className="w-10 h-10 bg-indigo-950 border border-indigo-900 rounded-xl flex items-center justify-center text-indigo-400">
                                        <Smartphone size={20} />
                                    </div>
                                    <h4 className="text-base font-semibold text-white font-outfit">Teacher Toolkit</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Empower educators with fast, click-saving mobile workflows for attendance logging, diary entries, and direct report-card compilation.
                                    </p>
                                </div>
                                <div className="space-y-4 p-5 rounded-2xl bg-slate-900 border border-slate-800/80">
                                    <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-300">
                                        <Users size={20} />
                                    </div>
                                    <h4 className="text-base font-semibold text-white font-outfit">Parent Portal</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Complete, frictionless communication transparency. Direct mobile fee options, digital marksheets, and secure push alerts.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 rounded-2xl border border-slate-800/80 p-8 flex items-center justify-center relative overflow-hidden min-h-[350px]">
                            <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full" />
                            {/* Structured Clean Mockup for High Professional Appeal */}
                            <div className="w-56 h-96 bg-slate-950 rounded-[2.5rem] border-[6px] border-slate-800 shadow-xl overflow-hidden p-4 flex flex-col gap-4 relative z-10">
                                <div className="w-16 h-3.5 bg-slate-800 rounded-full mx-auto mb-2" />
                                <div className="w-full h-8 bg-slate-900 rounded-lg flex items-center px-2 justify-between">
                                    <div className="w-16 h-2 bg-slate-700 rounded" />
                                    <div className="w-4 h-4 bg-indigo-600 rounded-full" />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-20 bg-slate-900 rounded-lg border border-slate-800 p-2 space-y-2">
                                        <div className="w-1/2 h-2 bg-slate-700 rounded" />
                                        <div className="w-5/6 h-1.5 bg-slate-800 rounded" />
                                        <div className="w-4/5 h-1.5 bg-slate-800 rounded" />
                                    </div>
                                    <div className="h-20 bg-slate-900 rounded-lg border border-slate-800 p-2 space-y-2">
                                        <div className="w-1/3 h-2 bg-slate-700 rounded" />
                                        <div className="w-4/5 h-1.5 bg-slate-800 rounded" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Intelligence Section */}
            <section id="intelligence" className="py-20 lg:py-28 max-w-7xl mx-auto px-6">
                <SectionHeader
                    tag="Institutional Intelligence"
                    title="The Unified Academic Engine"
                    desc="Manage student progression lifecycle stages through precise tracking metrics across all administrative layers."
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={BarChart3}
                        title="Academic Analytics"
                        desc="Move past simple grading workflows. Gain insight via multidimensional class progress tracking charts."
                        features={['Auto-Rank Calculation Engine', 'GPA Over Time Visualizations', 'Subject Mastery Indexing']}
                        color="text-indigo-400"
                    />
                    <FeatureCard
                        icon={Database}
                        title="Compliance Synchronizer"
                        desc="Maintained automation logic ensures clean, compliant synchronization out-of-the-box with regional regulatory databases."
                        features={['Native State Registry Exports', 'Audit Dossier Structuring', 'Automated Verification Checks']}
                        color="text-emerald-400"
                    />
                    <FeatureCard
                        icon={ShieldCheck}
                        title="Identity Management"
                        desc="Secure, verified credential layers assigned dynamically across all functional academic tiers."
                        features={['Secure Encrypted Profiles', 'Role-Based Authorization Layers', 'Hardware Attendance Interface']}
                        color="text-sky-400"
                    />
                </div>
            </section>

            {/* Financial Governance Section */}
            <section id="financials" className="py-20 lg:py-28 bg-slate-900/30 border-y border-slate-900">
                <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                    <div className="lg:w-1/2 space-y-8">
                        <div className="space-y-4">
                            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-900/50">Financial Governance</span>
                            <h2 className="text-3xl lg:text-4xl font-bold font-outfit tracking-tight text-white">Eliminate administrative leakages with complete ledger clarity.</h2>
                            <p className="text-sm lg:text-base text-slate-400 leading-relaxed">
                                Anchor every incoming balance, asset ledger entry, and institutional tuition transaction directly to a highly precise double-entry reconciliation ledger system.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { icon: CreditCard, t: "Automated Billing & Invoicing", d: "Instantly compile complex student invoices tailored by track, tier, and specific waivers." },
                                { icon: Smartphone, t: "Multi-Channel Gateways", d: "Secure integrated compliance checks over direct bank transfers, UPI paths, or credit processing." },
                                { icon: FileCheck, t: "Audit Ledger Precision", d: "Every ledger modification event builds explicit tracking records to ensure compliant fiscal closure." }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800/80 shadow-sm">
                                    <div className="w-10 h-10 bg-indigo-950 border border-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                                        <item.icon size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-white tracking-tight mb-1">{item.t}</h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">{item.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:w-1/2 w-full">
                        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-3xl p-8 lg:p-10 border border-indigo-900/40 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
                            <div className="space-y-6 relative z-10">
                                <div className="space-y-1">
                                    <p className="text-xs uppercase tracking-wider text-indigo-300 font-medium">Verified Efficiency Optimization</p>
                                    <p className="text-4xl font-bold font-outfit tracking-tight text-white">94% Acceleration</p>
                                </div>
                                <div className="h-px bg-slate-800" />
                                <p className="text-sm lg:text-base italic text-slate-300 font-normal leading-relaxed">
                                    "Transitioning our historical collection tracking routines onto Luvia dropped typical outstanding receivable windows down significantly within the first full validation quarter."
                                </p>
                                <div className="flex items-center gap-3 pt-2">
                                    <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center font-bold text-xs text-white">DS</div>
                                    <div>
                                        <p className="text-xs font-semibold text-white">David Sterling</p>
                                        <p className="text-[11px] text-indigo-300">Director of Fiscal Infrastructure — Global Systems Academies</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modular Features Grid Section */}
            <section id="compliance" className="py-20 lg:py-28 max-w-7xl mx-auto px-6">
                <SectionHeader
                    tag="Comprehensive Framework Capabilities"
                    title="Engineered modular tools configured natively."
                    desc="Deploy granular modules across separate institutional functional sectors. Zero extra tracking plugins required."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Academics Block */}
                    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800/80 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                            <div className="w-9 h-9 bg-indigo-950 border border-indigo-900 rounded-lg flex items-center justify-center text-indigo-400">
                                <BookOpen size={18} />
                            </div>
                            <h3 className="text-base font-bold text-white font-outfit">Academic Engine</h3>
                        </div>
                        <ul className="space-y-3">
                            {['Dynamic Matrix Scheduling', 'Integrated Session Planners', 'Fast Roll Logging', 'Report Card Automation', 'Course Catalog Mapping', 'Homework Workflows'].map((f, i) => (
                                <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-indigo-500" /> {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Accounting Block */}
                    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800/80 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                            <div className="w-9 h-9 bg-emerald-950 border border-emerald-900 rounded-lg flex items-center justify-center text-emerald-400">
                                <Calculator size={18} />
                            </div>
                            <h3 className="text-base font-bold text-white font-outfit">Accounting Core</h3>
                        </div>
                        <ul className="space-y-3">
                            {['Double-Entry Pipelines', 'Dynamic Allocation Rules', 'Salary Allocation Matrix', 'Balance Aggregation Views', 'Aging Tracker Dashboards', 'Bulk Invoice Runs'].map((f, i) => (
                                <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500" /> {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Operations / HR Block */}
                    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800/80 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                            <div className="w-9 h-9 bg-rose-950 border border-rose-900 rounded-lg flex items-center justify-center text-rose-400">
                                <Briefcase size={18} />
                            </div>
                            <h3 className="text-base font-bold text-white font-outfit">Operations & HR</h3>
                        </div>
                        <ul className="space-y-3">
                            {['Staff Onboarding Paths', 'Leave Approval Hierarchies', 'Access Tier Enforcement', 'Historical Audit Logging', 'E-Dossier Repositories', 'Role State Governance'].map((f, i) => (
                                <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-rose-500" /> {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Infrastructure Core */}
                    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800/80 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                            <div className="w-9 h-9 bg-sky-950 border border-sky-900 rounded-lg flex items-center justify-center text-sky-400">
                                <Bell size={18} />
                            </div>
                            <h3 className="text-base font-bold text-white font-outfit">Communications</h3>
                        </div>
                        <ul className="space-y-3">
                            {['Frictionless Notifications', 'Structured Circular Feeds', 'Automated Campaign Builders', 'Secure Webhook Triggers', 'API Endpoint Integrations', 'Alumni Event Paths'].map((f, i) => (
                                <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-sky-500" /> {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Pricing / Tiers Section */}
            <section className="py-20 lg:py-28 bg-slate-900/40 border-t border-slate-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-900/50">Deployment Plans</span>
                        <h2 className="text-3xl font-bold text-white font-outfit tracking-tight">Structured Institutional Tiers</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {[
                            { t: "Academy Track", p: "Standard", price: "₹8", priceDesc: "per student / mo", f: ["Caps at 500 Active Identities", "Core Performance Analytics", "Tuition Generation Pipelines", "Regional Integration Connectors"] },
                            { t: "Foundation Core", p: "Professional", price: "₹12", priceDesc: "per student / mo", f: ["Uncapped Active Identities", "Deep Ledger Tools", "Staff & Payroll Components", "Open Application Forms"], active: true },
                            { t: "University Frame", p: "Enterprise", price: "Custom", priceDesc: "annual contract", f: ["Dedicated Isolated Infrastructure", "Cross-Campus Network Controllers", "Dynamic API Webhooks", "Priority Response Vectors"] }
                        ].map((tier, i) => (
                            <div key={i} className={`p-8 rounded-2xl border flex flex-col justify-between transition-all ${tier.active
                                ? 'bg-slate-900 border-indigo-500 shadow-xl relative'
                                : 'bg-slate-950/40 border-slate-800 hover:bg-slate-900/60'
                                }`}>
                                {tier.active && <div className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white uppercase tracking-wider">Recommended</div>}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-white font-outfit">{tier.t}</h3>
                                        <p className="text-xs text-indigo-400 font-medium uppercase tracking-wide mt-0.5 mb-4">{tier.p}</p>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-bold text-white font-outfit">{tier.price}</span>
                                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{tier.priceDesc}</span>
                                        </div>
                                    </div>
                                    <ul className="space-y-3.5">
                                        {tier.f.map((feat, idx) => (
                                            <li key={idx} className="flex items-center gap-3 text-xs text-slate-300">
                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${tier.active ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button className={`w-full mt-8 py-2.5 rounded-xl text-xs font-semibold transition-all ${tier.active
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/10'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}>
                                    Select Tier
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Action Call Section */}
            <section className="py-20 lg:py-28 max-w-4xl mx-auto px-6 text-center space-y-8 relative">
                <div className="absolute inset-0 bg-indigo-600/5 blur-3xl rounded-full pointer-events-none" />
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/20">
                    <GraduationCap size={24} />
                </div>
                <h2 className="text-3xl lg:text-5xl font-bold text-white tracking-tight font-outfit">The modern operational hub is Luvia.</h2>
                <p className="text-slate-400 text-base max-w-xl mx-auto">Deploy a highly granular sandbox interface instance directly within your operational workflow context.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                    <button
                        onClick={() => navigate('/register')}
                        className="w-full sm:w-auto px-6 py-3 bg-white text-slate-950 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all shadow-md"
                    >
                        Book a Demo
                    </button>
                    <button className="w-full sm:w-auto px-6 py-3 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-800 hover:text-white transition-all">
                        Consult Deployment Engineer
                    </button>
                </div>
            </section>

            {/* Clean Enterprise Footer */}
            <footer className="bg-slate-950 border-t border-slate-900 py-16">
                <div className="max-w-7xl mx-auto px-6 space-y-12">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                        <div className="col-span-2 space-y-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
                                    <GraduationCap size={18} />
                                </div>
                                <span className="text-base font-bold tracking-tight text-white font-outfit">LUVIA</span>
                            </div>
                            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                                High-performance, low-overhead distributed operational architecture for modern educational systems.
                            </p>
                        </div>
                        {[
                            { t: "Platform", links: ["Intelligence", "Financials", "Ecosystem", "Core Infrastructure"] },
                            { t: "Governance", links: ["Compliance Metrics", "Security Auditing", "Data Policies", "Terms"] },
                            { t: "Resources", links: ["Documentation", "System API Status", "Developer Hub", "Engineering Support"] }
                        ].map((group, idx) => (
                            <div key={idx} className="space-y-3.5">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">{group.t}</h4>
                                <ul className="space-y-2 text-xs text-slate-400">
                                    {group.links.map((link, lIdx) => (
                                        <li key={lIdx} className="hover:text-indigo-400 cursor-pointer transition-colors">{link}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                        <p>© 2026 Luvia Systems Inc. All architecture configurations reserved.</p>
                        <div className="flex gap-6">
                            {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
                                <span key={social} className="hover:text-indigo-400 cursor-pointer transition-colors">{social}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}