import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  error:   <XCircle    className="h-4 w-4 text-rose-500" />,
  warning: <AlertCircle className="h-4 w-4 text-amber-500" />,
  info:    <Info        className="h-4 w-4 text-indigo-500" />,
};

const BORDER: Record<ToastType, string> = {
  success: 'border-l-emerald-500',
  error:   'border-l-rose-500',
  warning: 'border-l-amber-500',
  info:    'border-l-indigo-500',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, title, message }]);
    timers.current[id] = setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const success = useCallback((t: string, m?: string) => toast('success', t, m), [toast]);
  const error   = useCallback((t: string, m?: string) => toast('error',   t, m), [toast]);
  const warning = useCallback((t: string, m?: string) => toast('warning', t, m), [toast]);
  const info    = useCallback((t: string, m?: string) => toast('info',    t, m), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-[360px]
              bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
              border-l-4 ${BORDER[t.type]} rounded-xl p-3.5 shadow-lg
              ${t.exiting ? 'animate-toast-out' : 'animate-toast-in'}
            `}
          >
            <span className="shrink-0 mt-0.5">{ICONS[t.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{t.title}</p>
              {t.message && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors border-0 bg-transparent cursor-pointer p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
