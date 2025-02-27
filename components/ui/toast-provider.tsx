'use client';

import { useEffect, useState } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastContextType {
  toast: (props: Omit<Toast, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextType>({
  toast: () => {},
});

export const useToast = () => React.useContext(ToastContext);

import React from 'react';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...props }]);
    
    // Auto remove toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      
      {/* Simple toast display */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-md border p-4 shadow-md transition-all ${
              toast.variant === 'destructive' 
                ? 'bg-destructive text-destructive-foreground' 
                : 'bg-background text-foreground'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{toast.title}</div>
                {toast.description && (
                  <div className="text-sm">{toast.description}</div>
                )}
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-sm opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}