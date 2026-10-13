import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface Toast { id: number; kind: 'success' | 'error'; text: string }
interface Ctx { success: (text: string) => void; error: (text: string) => void }
const ToastContext = createContext<Ctx>({ success: () => undefined, error: () => undefined });

// Success / error feedback after create, update and delete.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  const value = useMemo(() => ({ success: (t: string) => push('success', t), error: (t: string) => push('error', t) }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lift ${
              t.kind === 'success' ? 'bg-brand-700' : 'bg-red-600'
            }`}
          >
            <span aria-hidden>{t.kind === 'success' ? 'OK' : '!'}</span>
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
