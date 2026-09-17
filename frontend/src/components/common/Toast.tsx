import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error:   (title: string, message?: string) => void;
  info:    (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

const CONFIG: Record<ToastType, {
  icon: React.FC<{ className?: string }>;
  bar: string; bg: string; border: string; iconColor: string; title: string;
}> = {
  success: { icon: CheckCircle2, bar: 'bg-emerald-500', bg: 'bg-white', border: 'border-emerald-200', iconColor: 'text-emerald-500', title: 'text-emerald-900' },
  error:   { icon: XCircle,      bar: 'bg-red-500',     bg: 'bg-white', border: 'border-red-200',     iconColor: 'text-red-500',     title: 'text-red-900'     },
  info:    { icon: Info,          bar: 'bg-blue-500',    bg: 'bg-white', border: 'border-blue-200',    iconColor: 'text-blue-500',    title: 'text-blue-900'    },
  warning: { icon: AlertTriangle, bar: 'bg-amber-500',   bg: 'bg-white', border: 'border-amber-200',   iconColor: 'text-amber-500',   title: 'text-amber-900'   },
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const [exiting, setExiting] = React.useState(false);
  const cfg = CONFIG[toast.type];
  const Icon = cfg.icon;

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 320);
  }, [toast.id, onDismiss]);

  React.useEffect(() => {
    const t = setTimeout(dismiss, toast.duration ?? 4500);
    return () => clearTimeout(t);
  }, [dismiss, toast.duration]);

  return (
    <div
      className={`relative flex items-start gap-3 w-full max-w-sm rounded-2xl border overflow-hidden transition-all duration-320
        ${cfg.bg} ${cfg.border}
        ${exiting ? 'opacity-0 translate-x-10 scale-95' : 'opacity-100 translate-x-0 scale-100'}`}
      style={{ boxShadow: '0 8px 32px -8px rgba(15,23,42,0.22), 0 2px 8px rgba(15,23,42,0.10)' }}
      role="alert"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar} rounded-l-2xl`} />
      <div className="flex items-start gap-3 px-4 py-3.5 pl-5 flex-1 min-w-0">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold leading-snug ${cfg.title}`}>{toast.title}</p>
          {toast.message && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>}
        </div>
        <button onClick={dismiss} className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition mt-0.5" aria-label="Dismiss">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const addToast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = `toast-${++counter.current}`;
    setToasts(prev => [...prev, { ...opts, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const value: ToastContextValue = {
    toast: addToast,
    success: (title, message) => addToast({ type: 'success', title, message }),
    error:   (title, message) => addToast({ type: 'error',   title, message }),
    info:    (title, message) => addToast({ type: 'info',    title, message }),
    warning: (title, message) => addToast({ type: 'warning', title, message }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto w-full">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
