import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    trend?: string;
    trendUp?: boolean;
    gradient: string;
    iconBg?: string;
    delay?: string;
    subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
    title, value, icon: Icon, trend, trendUp, gradient, delay = '', subtitle
}) => {
    // Extract a color from the gradient string for border/icon if possible, 
    // or use primary as fallback.
    const accentColor = gradient.includes('#10b981') ? 'emerald' : 
                        gradient.includes('#f59e0b') ? 'amber' :
                        gradient.includes('#f43f5e') ? 'rose' : 'primary';

    const bgColorMap: Record<string, string> = {
        emerald: 'bg-emerald-50',
        amber: 'bg-amber-50',
        rose: 'bg-rose-50',
        primary: 'bg-primary/5'
    };

    const textColorMap: Record<string, string> = {
        emerald: 'text-emerald-600',
        amber: 'text-amber-600',
        rose: 'text-rose-600',
        primary: 'text-primary'
    };

    return (
        <div className={`group bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 animate-fade-in-up ${delay}`}>
            <div className="flex items-start justify-between">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
                        <h4 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
                    </div>
                    
                    {trend && (
                        <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {trend.split(' ')[0]}
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                {trend.split(' ').slice(1).join(' ')}
                            </span>
                        </div>
                    )}
                </div>

                <div className={`w-14 h-14 rounded-2xl ${bgColorMap[accentColor]} ${textColorMap[accentColor]} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>
            
            {subtitle && (
                <div className="mt-6 pt-4 border-t border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
                </div>
            )}
        </div>
    );
};

export default StatsCard;