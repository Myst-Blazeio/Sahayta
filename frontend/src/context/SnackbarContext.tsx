import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

interface SnackbarContextType {
  showSnackbar: (message: string, type?: SnackbarType) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useSnackbar must be used within SnackbarProvider');
  return context;
};

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snackbar, setSnackbar] = useState<{ message: string; type: SnackbarType; id: number } | null>(null);

  const showSnackbar = useCallback((message: string, type: SnackbarType = 'info') => {
    const id = Date.now();
    setSnackbar({ message, type, id });
    setTimeout(() => {
      setSnackbar((current) => (current?.id === id ? null : current));
    }, 5000); // 5 sec duration
  }, []);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center pointer-events-none w-full max-w-sm px-4">
        <AnimatePresence>
          {snackbar && (
            <motion.div
              key={snackbar.id}
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="w-full pointer-events-auto overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 w-full">
                <div className="flex-shrink-0">{icons[snackbar.type]}</div>
                <div className="flex-1 w-0 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">{snackbar.message}</p>
                </div>
                <button 
                  onClick={() => setSnackbar(null)} 
                  className="flex-shrink-0 text-gray-400 hover:text-gray-500 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SnackbarContext.Provider>
  );
};
