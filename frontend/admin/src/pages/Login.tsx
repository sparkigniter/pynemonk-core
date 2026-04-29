import React, { useState } from 'react';
import { api } from '../api/base.api';
import { ShieldCheck, Lock, Mail, ChevronRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', {
                email,
                password,
                client_id: 'frontend_client',
                client_secret: 'frontend_secret',
                grant_type: 'password'
            });

            const data = res.data.data ?? res.data;
            
            // Save session (same format as main app)
            const session = {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: Date.now() + (data.expires_in * 1000),
                user: {
                    email: email,
                    // Minimal user object for the layout
                }
            };
            localStorage.setItem('eduerp_session', JSON.stringify(session));
            
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials or access denied');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md">
                <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-indigo-500/20 rotate-3 group hover:rotate-0 transition-transform">
                        <ShieldCheck size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">System Control Plane</h1>
                    <p className="text-slate-400 mt-2">Pynemonk Platform Administration</p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-500 delay-200">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-medium flex items-center gap-3 animate-shake">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                    placeholder="admin@pynemonk.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <RefreshCw className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Authenticate
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-500 text-xs mt-10 font-medium">
                    Protected by Pynemonk Security Layer
                </p>
            </div>
        </div>
    );
};

export default Login;
