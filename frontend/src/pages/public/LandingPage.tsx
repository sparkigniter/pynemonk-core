import { motion } from 'framer-motion';
import { 
    ArrowRight, GraduationCap, 
    BarChart3, Play, Menu, X,
    ShieldCheck, Database,
    CreditCard, Smartphone,
    FileCheck, Activity, Award,
    Users
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Nav = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${
            scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 py-4 shadow-sm' : 'bg-transparent py-8'
        }`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 group-hover:scale-110 transition-transform">
                        <GraduationCap size={22} />
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-slate-900 font-outfit uppercase">LUVIA</span>
                </div>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-10">
                    {['Intelligence', 'Compliance', 'Financials', 'Ecosystem'].map((item) => (
                        <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest text-[10px]">
                            {item}
                        </a>
                    ))}
                </div>

                <div className="hidden lg:flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/login')}
                        className="text-sm font-black text-slate-900 hover:text-indigo-600 transition-all uppercase tracking-widest text-[10px] px-6"
                    >
                        Sign In
                    </button>
                    <button 
                        onClick={() => navigate('/register')}
                        className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"
                    >
                        Provision Sandbox
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button 
                    className="lg:hidden p-2 text-slate-900"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 w-full bg-white border-b border-slate-100 p-8 flex flex-col gap-6 lg:hidden shadow-2xl"
                >
                    {['Intelligence', 'Compliance', 'Financials', 'Ecosystem'].map((item) => (
                        <a key={item} href={`#${item.toLowerCase()}`} className="text-xl font-black text-slate-900">
                            {item}
                        </a>
                    ))}
                    <hr className="border-slate-50" />
                    <button onClick={() => navigate('/login')} className="w-full py-4 bg-slate-50 rounded-2xl font-black text-slate-900">Sign In</button>
                    <button onClick={() => navigate('/register')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black">Get Started</button>
                </motion.div>
            )}
        </nav>
    );
};

const FeatureCard = ({ icon: Icon, title, desc, features, color }: any) => (
    <motion.div 
        whileHover={{ y: -10 }}
        className="p-12 rounded-[4rem] bg-white border border-slate-50 shadow-2xl shadow-slate-200/20 group hover:border-indigo-100 transition-all relative overflow-hidden"
    >
        <div className={`w-20 h-20 rounded-[2rem] ${color} flex items-center justify-center mb-10 shadow-xl relative z-10 group-hover:scale-110 transition-transform`}>
            <Icon size={32} className="text-white" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-6 font-outfit tracking-tight leading-tight">{title}</h3>
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">{desc}</p>
        
        <ul className="space-y-4">
            {features.map((f: string, i: number) => (
                <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-600 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">
                    <CheckCircle2 size={14} className="text-indigo-600" />
                    {f}
                </li>
            ))}
        </ul>
        
        <div className={`absolute -bottom-10 -right-10 w-48 h-48 rounded-full opacity-5 blur-3xl transition-opacity group-hover:opacity-10 ${color}`} />
    </motion.div>
);

const SectionHeader = ({ tag, title, desc }: any) => (
    <div className="text-center max-w-4xl mx-auto space-y-6 mb-24 px-6">
        <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.5em] block"
        >
            {tag}
        </motion.span>
        <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-7xl font-black tracking-[-0.03em] font-outfit leading-[1.1]"
        >
            {title}
        </motion.h2>
        <p className="text-slate-500 text-lg lg:text-xl font-medium max-w-2xl mx-auto">{desc}</p>
    </div>
);

const CheckCircle2 = ({ size, className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#FAFBFF] text-slate-900 font-inter selection:bg-indigo-600 selection:text-white">
            <Nav />

            {/* Premium Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-60 lg:pb-56 overflow-hidden">
                <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-indigo-600/10 rounded-full blur-[180px] -mr-[500px] -mt-[500px]" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-400/5 rounded-full blur-[150px] -ml-[400px] -mb-[400px]" />
                
                <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-center">
                        <div className="lg:col-span-6 space-y-12">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center gap-3 px-6 py-2.5 bg-indigo-600/5 rounded-full border border-indigo-600/10 shadow-sm"
                            >
                                <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-600 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-700">Next-Gen Institutional OS</span>
                            </motion.div>
                            
                            <motion.h1 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="text-6xl lg:text-9xl font-black tracking-[-0.05em] leading-[0.9] font-outfit text-slate-950"
                            >
                                Empowering <br /> the <span className="text-indigo-600 relative inline-block">Future<span className="absolute bottom-4 left-0 w-full h-4 bg-indigo-600/10 -z-10" /></span> of Education.
                            </motion.h1>

                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-xl lg:text-2xl text-slate-500 font-medium leading-relaxed max-w-2xl"
                            >
                                Luvia unifies complex academic workflows, financial governance, and regulatory compliance into a single, high-velocity institutional dashboard.
                            </motion.p>

                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col sm:flex-row items-center gap-6 pt-4"
                            >
                                <button 
                                    onClick={() => navigate('/register')}
                                    className="w-full sm:w-auto px-12 py-6 bg-indigo-600 text-white rounded-[2.5rem] text-sm font-black uppercase tracking-widest hover:bg-slate-950 transition-all shadow-3xl shadow-indigo-200 flex items-center justify-center gap-4 group"
                                >
                                    Launch Your Institution
                                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                                <button className="w-full sm:w-auto px-12 py-6 bg-white border border-slate-100 text-slate-900 rounded-[2.5rem] text-sm font-black uppercase tracking-widest hover:shadow-2xl transition-all flex items-center justify-center gap-4">
                                    <Play size={18} fill="currentColor" />
                                    Explore Ecosystem
                                </button>
                            </motion.div>

                            <div className="flex items-center gap-12 pt-10">
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-slate-950 font-outfit">200+</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Partners</p>
                                </div>
                                <div className="w-px h-12 bg-slate-100" />
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-slate-950 font-outfit">99.9%</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SATS Compliance</p>
                                </div>
                                <div className="w-px h-12 bg-slate-100" />
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-slate-950 font-outfit">1M+</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Identities</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-6 relative perspective-1000">
                            <motion.div 
                                initial={{ opacity: 0, rotateY: 15, x: 50 }}
                                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                className="relative z-10"
                            >
                                <div className="absolute inset-0 bg-indigo-600/30 blur-[120px] rounded-full -z-10 transform scale-75 translate-x-20" />
                                <img 
                                    src="/pynemonk_hero_dashboard_1778685554850.png" 
                                    alt="Luvia Dashboard" 
                                    className="w-full h-auto rounded-[4rem] shadow-[0_60px_120px_-30px_rgba(79,70,229,0.2)] border-[12px] border-white ring-1 ring-slate-100"
                                />
                                
                                {/* Floating Insight Cards */}
                                <motion.div 
                                    animate={{ y: [0, -20, 0], rotate: [-2, 2, -2] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-12 -left-12 bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-3xl border border-indigo-50 hidden xl:block"
                                >
                                    <Activity className="text-indigo-600 mb-4" size={24} />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Health Metric</p>
                                    <p className="text-2xl font-black text-slate-950 font-outfit">Excellent</p>
                                </motion.div>

                                <motion.div 
                                    animate={{ y: [0, 20, 0], rotate: [2, -2, 2] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    className="absolute -bottom-12 -right-12 bg-slate-950 p-8 rounded-[2.5rem] shadow-3xl hidden xl:block text-white"
                                >
                                    <Award className="text-indigo-400 mb-4" size={24} />
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Academy Status</p>
                                    <p className="text-2xl font-black font-outfit">Institutional Gold</p>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mobile Ecosystem Section - NEW */}
            <section className="py-32 lg:py-60 bg-[#0F172A] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-indigo-600/10 rounded-full blur-[150px] -mr-[500px] -mt-[500px]" />
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                        <div className="order-2 lg:order-1">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                className="relative"
                            >
                                <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full scale-75" />
                                <img 
                                    src="/luvia_mobile_ecosystem_1778687785847.png" 
                                    alt="Mobile Ecosystem" 
                                    className="w-full h-auto relative z-10 transform -rotate-2"
                                />
                            </motion.div>
                        </div>
                        
                        <div className="order-1 lg:order-2 space-y-12">
                            <div className="space-y-6">
                                <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em]">Unified Ecosystem</span>
                                <h2 className="text-4xl lg:text-7xl font-black text-white font-outfit leading-[1.1] tracking-tight">Your Institution <br /> in their <span className="text-indigo-400">Pockets.</span></h2>
                                <p className="text-xl text-slate-400 font-medium leading-relaxed">
                                    Luvia isn't just for administrators. We provide dedicated, high-performance mobile applications for teachers and parents.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                                        <Smartphone size={28} />
                                    </div>
                                    <h4 className="text-xl font-black text-white font-outfit">Teacher Toolkit</h4>
                                    <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                        Empower educators with instant attendance, digital diaries, and mobile mark entry. Reduce administrative overhead by 40%.
                                    </p>
                                    <ul className="space-y-3">
                                        {['Instant Attendance', 'Assignment Dispatch', 'Classroom Insights'].map((f, i) => (
                                            <li key={i} className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                                <CheckCircle2 size={12} /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="space-y-6">
                                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-xl">
                                        <Users size={28} />
                                    </div>
                                    <h4 className="text-xl font-black text-white font-outfit">Parent Portal</h4>
                                    <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                        Give parents absolute transparency. Fees, performance records, and announcements delivered in real-time.
                                    </p>
                                    <ul className="space-y-3">
                                        {['Mobile Fee Payment', 'Digital Report Cards', 'Instant Alerts'].map((f, i) => (
                                            <li key={i} className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                                <CheckCircle2 size={12} /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Ecosystem Section */}
            <section id="intelligence" className="py-32 lg:py-60 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <SectionHeader 
                        tag="Institutional Intelligence"
                        title="The Complete Academic Ecosystem."
                        desc="From enrollment to graduation, Luvia manages the entire student lifecycle with data-driven precision."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <FeatureCard 
                            icon={BarChart3}
                            title="Academic Analytics"
                            desc="Move beyond grades. Track student potential with multidimensional growth analytics."
                            features={['Auto-Rank Calculation', 'GPA Trend Visualization', 'Subject Mastery Heatmaps']}
                            color="bg-indigo-600"
                        />
                        <FeatureCard 
                            icon={Database}
                            title="Government Sync"
                            desc="Automated compliance records that sync directly with state and federal requirements."
                            features={['Native SATS Integration', 'Export-Ready Dossiers', 'Compliance Checklists']}
                            color="bg-slate-950"
                        />
                        <FeatureCard 
                            icon={ShieldCheck}
                            title="Digital Identity"
                            desc="Secure, verifiable digital identity for every student and staff member."
                            features={['QR-Coded ID Cards', 'Biometric Gate Access', 'Verified Portfolios']}
                            color="bg-emerald-600"
                        />
                    </div>
                </div>
            </section>

            {/* Financial Governance Section */}
            <section id="financials" className="py-32 lg:py-56 bg-slate-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] -mr-48 -mt-48" />
                
                <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-24">
                    <div className="lg:w-1/2 space-y-10">
                        <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em]">Financial Governance</span>
                        <h2 className="text-5xl lg:text-7xl font-black font-outfit tracking-tight leading-[1.1]">Eliminate <br /> Revenue Leakage.</h2>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed">
                            A unified financial engine that links every transaction directly to your institutional ledger. Perfect transparency, zero guesswork.
                        </p>
                        
                        <div className="space-y-8">
                            {[
                                { icon: CreditCard, t: "Automated Fee Invoicing", d: "Generate student invoices automatically based on grade and category." },
                                { icon: Smartphone, t: "Instant Mobile Collections", d: "Accept payments via UPI, Card, or Bank Transfer with instant receipts." },
                                { icon: FileCheck, t: "Audit-Ready Ledger", d: "Every transaction is recorded with double-entry accounting precision." }
                            ].map((item, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-start gap-6 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm"
                                >
                                    <div className="w-12 h-12 bg-indigo-600/5 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <item.icon size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">{item.t}</h4>
                                        <p className="text-xs font-bold text-slate-400">{item.d}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="lg:w-1/2">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="bg-indigo-600 rounded-[4rem] p-16 text-white relative overflow-hidden shadow-3xl"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="relative z-10 space-y-12">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Revenue Velocity</p>
                                    <p className="text-6xl font-black font-outfit tracking-tighter text-white">94% <span className="text-2xl opacity-60 tracking-normal text-white">Faster</span></p>
                                </div>
                                <div className="h-px bg-white/20" />
                                <p className="text-lg font-medium text-indigo-100">"Since implementing Luvia's financial engine, our fee collection window reduced from 20 days to 48 hours."</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl" />
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-widest">David Sterling</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Finance Director, Global Academy</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Why Luvia Section */}
            <section className="py-32 lg:py-60 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
                        <div className="space-y-10">
                            <h2 className="text-4xl lg:text-6xl font-black font-outfit tracking-tight leading-[1.1]">Beyond Management. <br /> Intelligence.</h2>
                            <p className="text-xl text-slate-500 font-medium leading-relaxed">
                                Most platforms manage data. Luvia creates intelligence. We provide the insights you need to grow your institution's reputation and reach.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {[
                                { t: "Zero Config Compliance", d: "System rules adapt to your local government regulations automatically." },
                                { t: "Institutional Grade Security", d: "Bank-level encryption for every student and financial record." },
                                { t: "High-Density Dashboard", d: "See everything that matters in one glance. No deep menus." },
                                { t: "API-First Infrastructure", d: "Connect with Biometrics, LMS, and Tally with native webhooks." }
                            ].map((item, i) => (
                                <div key={i} className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100">
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">{item.t}</h4>
                                    <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-widest">{item.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section Placeholder */}
            <section id="pricing" className="py-32 lg:py-60 bg-[#0F172A] text-white relative overflow-hidden">
                <div className="absolute top-0 left-1/2 w-[1200px] h-[600px] bg-indigo-600/10 rounded-full blur-[180px] -translate-x-1/2 -mt-[300px]" />
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center space-y-12 mb-24">
                    <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em]">Investment Plans</span>
                    <h2 className="text-4xl lg:text-7xl font-black font-outfit tracking-tight">Institutional Tiers</h2>
                </div>

                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                    {[
                        { t: "Academy", p: "Standard", f: ["Up to 500 Students", "Academic Analytics", "Fee Collection", "SATS Integration"] },
                        { t: "Foundation", p: "Professional", f: ["Unlimited Students", "Advanced Financials", "Staff & Payroll", "Public Admissions"], active: true },
                        { t: "University", p: "Enterprise", f: ["Custom Infrastructure", "Multi-Campus Hub", "API Integration", "24/7 Support"] }
                    ].map((tier, i) => (
                        <div key={i} className={`p-12 rounded-[4rem] border transition-all ${tier.active ? 'bg-indigo-600 border-indigo-500 scale-105 shadow-3xl shadow-indigo-500/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                            <h3 className="text-2xl font-black mb-2 font-outfit">{tier.t}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-10">{tier.p}</p>
                            <ul className="space-y-6 mb-12">
                                {tier.f.map((f, i) => (
                                    <li key={i} className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                                        <CheckCircle2 size={16} className={tier.active ? 'text-white' : 'text-indigo-400'} />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button className={`w-full py-6 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${tier.active ? 'bg-white text-indigo-600 shadow-xl' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                Select Plan
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 lg:py-60 bg-white relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-6 text-center space-y-12 relative z-10">
                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl mb-12 rotate-12">
                        <GraduationCap size={40} />
                    </div>
                    <h2 className="text-4xl lg:text-7xl font-black text-slate-950 tracking-tight font-outfit">The future is <br /> <span className="text-indigo-600">Luvia.</span></h2>
                    <p className="text-slate-500 text-lg lg:text-2xl font-medium max-w-2xl mx-auto">Join the 200+ institutions currently redefining educational excellence.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button 
                            onClick={() => navigate('/register')}
                            className="px-12 py-6 bg-slate-950 text-white rounded-[2.5rem] text-sm font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-3xl shadow-indigo-100"
                        >
                            Provision Sandbox
                        </button>
                        <button className="px-12 py-6 bg-white border border-slate-100 text-slate-900 rounded-[2.5rem] text-sm font-black uppercase tracking-widest hover:shadow-2xl transition-all">
                            Talk to an Expert
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-32 bg-slate-50 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-24">
                        <div className="col-span-1 space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                    <GraduationCap size={20} />
                                </div>
                                <span className="text-2xl font-black tracking-tighter font-outfit text-slate-950 uppercase">LUVIA</span>
                            </div>
                            <p className="text-[11px] font-black text-slate-400 leading-loose uppercase tracking-widest">
                                The institutional operating system <br /> designed for the next generation.
                            </p>
                        </div>
                        
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-950 mb-10">Platform</h4>
                            <ul className="space-y-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <li className="hover:text-indigo-600 transition-colors cursor-pointer">Intelligence</li>
                                <li className="hover:text-indigo-600 transition-colors cursor-pointer">Financials</li>
                                <li className="hover:text-indigo-600 transition-colors cursor-pointer">Ecosystem</li>
                                <li className="hover:text-indigo-600 transition-colors cursor-pointer">Infrastructure</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-950 mb-10">Governance</h4>
                            <ul className="space-y-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <li className="hover:text-indigo-600 transition-colors cursor-pointer">Compliance</li>
                                <li className="hover:text-indigo-600 transition-colors cursor-pointer">Security</li>
                                <li className="hover:text-indigo-600 transition-colors cursor-pointer">Privacy</li>
                                <li className="hover:text-indigo-600 transition-colors cursor-pointer">Legal</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-950 mb-10">Connect</h4>
                            <ul className="space-y-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <li className="hover:text-indigo-600 transition-colors cursor-pointer">Institutions</li>
                                <li className="hover:text-indigo-600 transition-colors cursor-pointer">Documentation</li>
                                <li className="hover:text-indigo-600 transition-colors cursor-pointer">Global Hub</li>
                                <li className="hover:text-indigo-600 transition-colors cursor-pointer">Support</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="mt-32 pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">
                        <p>© 2026 Luvia Systems. All rights reserved.</p>
                        <div className="flex gap-10">
                            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Twitter</span>
                            <span className="hover:text-indigo-600 cursor-pointer transition-colors">LinkedIn</span>
                            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Github</span>
                        </div>
                    </div>
                </div>
            </footer>

            <style>{`
                @font-face {
                    font-family: 'Outfit';
                    src: url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
                }
                .font-outfit { font-family: 'Outfit', sans-serif; }
                .font-inter { font-family: 'Inter', sans-serif; }
                .perspective-1000 { perspective: 1000px; }
            `}</style>
        </div>
    );
}
