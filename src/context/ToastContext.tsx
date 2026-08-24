import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  Mail,
  Sparkles,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    (item: Omit<ToastItem, 'id'>): void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { ...item, id };
    
    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // max 5 visible

    const duration = item.duration || 4000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const toastObj = useCallback(
    (item: Omit<ToastItem, 'id'>) => addToast(item),
    [addToast]
  ) as ToastContextType['toast'];

  toastObj.success = (title: string, message?: string) =>
    addToast({ type: 'success', title, message });

  toastObj.error = (title: string, message?: string) =>
    addToast({ type: 'error', title, message });

  toastObj.info = (title: string, message?: string) =>
    addToast({ type: 'info', title, message });

  toastObj.warning = (title: string, message?: string) =>
    addToast({ type: 'warning', title, message });

  return (
    <ToastContext.Provider value={{ toast: toastObj }}>
      {children}
      
      {/* Toast Notification Container Overlay */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 transform animate-in slide-in-from-bottom-5 fade-in ${
              t.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-100 shadow-emerald-950/40'
                : t.type === 'error'
                ? 'bg-slate-900/95 border-rose-500/40 text-rose-100 shadow-rose-950/40'
                : t.type === 'warning'
                ? 'bg-slate-900/95 border-amber-500/40 text-amber-100 shadow-amber-950/40'
                : 'bg-slate-900/95 border-purple-500/40 text-purple-100 shadow-purple-950/40'
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {t.type === 'info' && <Sparkles className="w-5 h-5 text-purple-400" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-bold tracking-tight text-white">{t.title}</h4>
              {t.message && (
                <p className="text-[11px] font-medium text-slate-300 mt-0.5 leading-relaxed break-words">
                  {t.message}
                </p>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800/60"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType['toast'] => {
  const context = useContext(ToastContext);
  if (!context) {
    // Return fallback no-op toast if hook is used outside ToastProvider
    const fallback = (() => {}) as unknown as ToastContextType['toast'];
    fallback.success = (t, m) => console.log('[Toast Success]', t, m);
    fallback.error = (t, m) => console.error('[Toast Error]', t, m);
    fallback.info = (t, m) => console.log('[Toast Info]', t, m);
    fallback.warning = (t, m) => console.warn('[Toast Warning]', t, m);
    return fallback;
  }
  return context.toast;
};
