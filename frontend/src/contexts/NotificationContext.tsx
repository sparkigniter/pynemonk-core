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
    info: <Info className="w-5 h-5 text-blue-500" />,
};

const BG_MAP = {
    success: 'border-emerald-100 bg-white/90',
    error: 'border-rose-100 bg-white/90',
    warning: 'border-amber-100 bg-white/90',
    info: 'border-blue-100 bg-white/90',
};

const NotificationItem: React.FC<{ notification: Notification; onRemove: (id: string) => void }> = ({ notification, onRemove }) => {
    return (
        <div 
            className={`
                pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl shadow-slate-200/50 backdrop-blur-md animate-fade-in-up 
                ${BG_MAP[notification.type]}
            `}
            role="alert"
        >
            <div className="mt-0.5 flex-shrink-0">
                {ICON_MAP[notification.type]}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800">{notification.message}</h4>
                {notification.description && (
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{notification.description}</p>
                )}
            </div>
            <button 
                onClick={() => onRemove(notification.id)}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
