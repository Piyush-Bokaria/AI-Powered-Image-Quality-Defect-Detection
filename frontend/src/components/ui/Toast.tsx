import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

/* ── Types ───────────────────────────────────────────────────────── */
type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

/* ── Context ─────────────────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

/* ── Provider ────────────────────────────────────────────────────── */
let toastId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons: Record<ToastVariant, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />,
    error: <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
  };

  const borderColors: Record<ToastVariant, string> = {
    success: 'border-green-500/30',
    error: 'border-red-500/30',
    info: 'border-cyan-500/30',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'pointer-events-auto flex items-center gap-3 rounded-xl border bg-[#12121a]/90 backdrop-blur-xl px-4 py-3 shadow-2xl text-sm text-zinc-200',
                borderColors[t.variant]
              )}
            >
              {icons[t.variant]}
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
