import { useState, useCallback, createContext, useContext } from 'react';

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; }

const ToastContext = createContext<{ show: (msg: string, type?: Toast['type']) => void }>({ show: () => {} });

export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const colors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-slate-800' };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 no-print">
        {toasts.map((t) => (
          <div key={t.id} className={`${colors[t.type]} text-white px-4 py-2.5 rounded-lg shadow-lg text-sm animate-fade-in`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}