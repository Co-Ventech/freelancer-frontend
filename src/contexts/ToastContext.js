import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    const toast = { id, type, message };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const value = useMemo(() => ({
    showSuccess: (msg) => push('success', msg),
    showError: (msg) => push('error', msg),
    showInfo: (msg) => push('info', msg)
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Simple Tailwind-based toast list */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              `max-w-sm px-4 py-3 rounded shadow text-white ` +
              (t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-800')
            }
            role="alert"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
 
