import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    description?: string;
}

interface NotificationContextType {
    notify: (type: NotificationType, message: string, description?: string) => void;
    remove: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const remove = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const notify = useCallback((type: NotificationType, message: string, description?: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications(prev => [...prev, { id, type, message, description }]);
        
        // Auto remove after 5 seconds
        setTimeout(() => remove(id), 5000);
    }, [remove]);

    return (
        <NotificationContext.Provider value={{ notify, remove }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
                {notifications.map(n => (
                    <NotificationItem key={n.id} notification={n} onRemove={remove} />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

const ICON_MAP = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-rose-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-theme-primary" />,
};

const BG_MAP = {
    success: 'border-emerald-100 bg-white/95 shadow-emerald-500/10',
    error: 'border-rose-100 bg-white/95 shadow-rose-500/10',
    warning: 'border-amber-100 bg-white/95 shadow-amber-500/10',
    info: 'border-theme-primary/10 bg-white/95 shadow-theme-primary/10',
};

const NotificationItem: React.FC<{ notification: Notification; onRemove: (id: string) => void }> = ({ notification, onRemove }) => {
    return (
        <div 
            className={`
                pointer-events-auto flex items-start gap-4 p-5 rounded-[2rem] border shadow-2xl backdrop-blur-xl animate-fade-in-up 
                ${BG_MAP[notification.type]}
            `}
            role="alert"
        >
            <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                notification.type === 'success' ? 'bg-emerald-50' : 
                notification.type === 'error' ? 'bg-rose-50' : 
                notification.type === 'warning' ? 'bg-amber-50' : 
                'bg-theme-primary/5'}`}>
                {ICON_MAP[notification.type]}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
                <h4 className="text-sm font-black text-slate-800 tracking-tight">{notification.message}</h4>
                {notification.description && (
                    <p className="mt-1 text-[11px] font-medium text-slate-500 leading-relaxed">{notification.description}</p>
                )}
            </div>
            <button 
                onClick={() => onRemove(notification.id)}
                className="flex-shrink-0 p-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-300 hover:text-slate-600"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
