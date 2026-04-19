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
    return (
        <div
            className={`relative overflow-hidden rounded-2xl p-5 text-white hover-lift animate-fade-in-up ${delay}`}
            style={{ background: gradient, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
        >
            {/* Background decoration */}
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-20"
                style={{ background: 'rgba(255,255,255,0.3)' }} />
            <div className="absolute -right-2 -bottom-4 w-16 h-16 rounded-full opacity-10"
                style={{ background: 'rgba(255,255,255,0.5)' }} />

            <div className="relative z-10">
                {/* Icon + title */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-sm font-medium text-white/75">{title}</p>
                        {subtitle && <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>}
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                        <Icon size={21} className="text-white" />
                    </div>
                </div>

                {/* Value */}
                <p className="text-3xl font-bold text-white tracking-tight font-heading mb-3">{value}</p>

                {/* Trend */}
                {trend && (
                    <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
                        ${trendUp ? 'bg-white/20 text-white' : 'bg-white/20 text-white'}`}>
                        {trendUp
                            ? <TrendingUp size={11} />
                            : <TrendingDown size={11} />}
                        {trend}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsCard;