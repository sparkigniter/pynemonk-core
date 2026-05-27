import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  Users,
  Baby,
  AlertCircle
} from 'lucide-react'
import { api } from './api'
import { Role } from './types'
import { TeacherDashboard } from './views/teacher/TeacherDashboard'
import { ParentDashboard } from './views/parent/ParentDashboard'

// --- Components ---

const Login = ({ onLogin }: { onLogin: (role: Role, token: string) => void }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (selectedRole: Role) => {
    setLoading(true)
    setError('')
    try {
      const response = await api.post('/auth/login', {
        email: email || (selectedRole === 'teacher' ? 'teacher1@demo.edu' : 'parent1@demo.edu'),
        password,
        grant_type: 'password',
        client_id: import.meta.env.VITE_CLIENT_ID,
        client_secret: import.meta.env.VITE_CLIENT_SECRET
      });
      if (response.data.success) {
        const token = response.data.data.access_token;
        localStorage.setItem('token', token);
        onLogin(selectedRole, token);
      }
    } catch (err: any) {
      console.error("[Login Error Details]", err);
      setError(err.response?.data?.message || err.message || 'Authentication error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col px-8 pb-12 min-h-screen bg-white" style={{ paddingTop: 'calc(var(--safe-top) + 2rem)' }}>
      <div className="flex-1 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 bg-brand-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-brand-600/40 mb-12"
        >
          <GraduationCap className="text-white w-12 h-12" />
        </motion.div>

        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Pynemonk</h1>
        <p className="text-slate-400 mb-12 text-lg font-medium leading-relaxed">The unified school experience.</p>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-50 text-rose-600 p-5 rounded-3xl mb-8 text-xs font-black flex items-center gap-3 border border-rose-100"
            >
              <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@school.edu"
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] p-5 text-sm font-bold focus:bg-white focus:border-brand-500 outline-none transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Security Key</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] p-5 text-sm font-bold focus:bg-white focus:border-brand-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-4 pt-6">
            <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Sign in as</p>
            <div className="grid grid-cols-2 gap-5">
              <button
                onClick={() => handleLogin('teacher')}
                disabled={loading}
                className="flex flex-col items-center gap-3 p-8 rounded-[2.5rem] bg-slate-50 border-2 border-transparent hover:border-brand-500 active:scale-95 transition-all group disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:text-brand-600 group-hover:shadow-md transition-all">
                  <Users className="w-6 h-6 text-slate-400 group-hover:text-brand-600" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-600">Teacher / Staff</span>
              </button>

              <button
                onClick={() => handleLogin('parent')}
                disabled={loading}
                className="flex flex-col items-center gap-3 p-8 rounded-[2.5rem] bg-slate-50 border-2 border-transparent hover:border-brand-500 active:scale-95 transition-all group disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:text-brand-600 group-hover:shadow-md transition-all">
                  <Baby className="w-6 h-6 text-slate-400 group-hover:text-brand-600" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-600">Parent / Guardian</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [role, setRole] = useState<Role | null>(localStorage.getItem('role') as Role)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  useEffect(() => {
    const savedTheme = localStorage.getItem('pynemonk-theme') || 'indigo';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setToken(null)
    setRole(null)
  }

  const handleLogin = (r: Role, t: string) => {
    localStorage.setItem('token', t)
    localStorage.setItem('role', r)
    setRole(r)
    setToken(t)
  }

  return (
    <div className="h-[100dvh] w-full bg-white md:bg-slate-900 flex items-center justify-center p-0 md:p-6 lg:p-10 overflow-hidden fixed inset-0">
      <div className="w-full h-full md:max-w-[420px] bg-white md:h-[880px] md:max-h-[900px] md:rounded-[4rem] shadow-2xl relative overflow-hidden md:border-[12px] md:border-slate-800 flex flex-col transition-all">
        <AnimatePresence mode="wait">
          {!token || !role ? (
            <motion.div key="login" className="flex-1 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Login onLogin={handleLogin} />
            </motion.div>
          ) : role === 'teacher' ? (
            <motion.div key="teacher" className="flex-1 flex flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TeacherDashboard onLogout={handleLogout} />
            </motion.div>
          ) : role === 'parent' ? (
            <motion.div key="parent" className="flex-1 flex flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ParentDashboard onLogout={handleLogout} />
            </motion.div>
          ) : (
            <motion.div key="fallback" className="flex-1 flex items-center justify-center p-10 text-center">
              <div>
                <p className="text-slate-400 text-sm font-bold mb-4">Account session error. Please log in again.</p>
                <button onClick={handleLogout} className="bg-brand-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase">Sign Out</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
