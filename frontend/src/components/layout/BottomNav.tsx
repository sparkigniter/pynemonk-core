import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, Calendar, Bell, Menu } from 'lucide-react';

const BottomNav = ({ onMenuClick }: { onMenuClick: () => void }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-slate-200 px-2 py-1 flex items-center justify-around pb-safe">
            <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-1 p-2 min-w-[64px] rounded-xl transition-all ${
                        isActive ? 'text-primary bg-primary/5' : 'text-slate-400'
                    }`
                }
            >
                <LayoutDashboard size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
            </NavLink>

            <NavLink
                to="/students"
                className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-1 p-2 min-w-[64px] rounded-xl transition-all ${
                        isActive ? 'text-primary bg-primary/5' : 'text-slate-400'
                    }`
                }
            >
                <GraduationCap size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Students</span>
            </NavLink>

            <NavLink
                to="/timetable"
                className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-1 p-2 min-w-[64px] rounded-xl transition-all ${
                        isActive ? 'text-primary bg-primary/5' : 'text-slate-400'
                    }`
                }
            >
                <Calendar size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Schedule</span>
            </NavLink>

            <button
                id="mobile-notif-btn"
                className="flex flex-col items-center justify-center gap-1 p-2 min-w-[64px] rounded-xl transition-all text-slate-400"
                onClick={() => {
                   const btn = document.getElementById('notification-btn');
                   if (btn) btn.click();
                }}
            >
                <div className="relative">
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Inbox</span>
            </button>

            <button
                id="mobile-menu-trigger"
                onClick={onMenuClick}
                className="flex flex-col items-center justify-center gap-1 p-2 min-w-[64px] rounded-xl transition-all text-slate-400"
            >
                <Menu size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider">More</span>
            </button>
        </nav>
    );
};

export default BottomNav;
