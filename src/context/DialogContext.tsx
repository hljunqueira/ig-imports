import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type DialogType = 'alert' | 'confirm' | 'success' | 'error' | 'warning';

interface DialogOptions {
  title?: string;
  message: string;
  type?: DialogType;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface DialogContextValue {
  alert: (message: string, title?: string) => Promise<void>;
  success: (message: string, title?: string) => Promise<void>;
  error: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, title?: string) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

interface DialogState extends DialogOptions {
  resolve: (value: boolean) => void;
  visible: boolean;
}

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const openDialog = useCallback((options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ ...options, resolve, visible: true });
    });
  }, []);

  const handleClose = (value: boolean) => {
    if (dialog) {
      dialog.resolve(value);
      setDialog(null);
    }
  };

  const ctx: DialogContextValue = {
    alert: (message, title) => openDialog({ message, title: title ?? 'Aviso', type: 'alert' }).then(() => {}),
    success: (message, title) => openDialog({ message, title: title ?? 'Sucesso', type: 'success' }).then(() => {}),
    error: (message, title) => openDialog({ message, title: title ?? 'Erro', type: 'error' }).then(() => {}),
    confirm: (message, title) => openDialog({ message, title: title ?? 'Confirmar', type: 'confirm' }),
  };

  const isConfirm = dialog?.type === 'confirm';

  const iconMap: Record<DialogType, string> = {
    alert: 'info',
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    confirm: 'help',
  };

  const colorMap: Record<DialogType, string> = {
    alert: 'text-blue-400',
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    confirm: 'text-gold',
  };

  const type = dialog?.type ?? 'alert';

  return (
    <DialogContext.Provider value={ctx}>
      {children}

      <AnimatePresence>
        {dialog && (
          <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => !isConfirm && handleClose(false)}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="relative w-full max-w-sm bg-[#1a1a1a] border border-white/10 shadow-2xl rounded-sm overflow-hidden"
            >
              {/* Top accent line */}
              <div className={`h-0.5 w-full ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'confirm' ? 'bg-primary' : 'bg-blue-500'}`} />

              <div className="p-6">
                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-3">
                  <span className={`material-symbols-outlined text-2xl ${colorMap[type]}`}>
                    {iconMap[type]}
                  </span>
                  <h4 className="font-display font-bold tracking-widest text-white text-sm uppercase">
                    {dialog.title}
                  </h4>
                </div>

                {/* Message */}
                <p className="text-gray-300 text-sm leading-relaxed pl-9">
                  {dialog.message}
                </p>

                {/* Buttons */}
                <div className={`mt-6 flex gap-3 justify-end`}>
                  {isConfirm && (
                    <button
                      onClick={() => handleClose(false)}
                      className="px-5 py-2 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/30 transition-all"
                    >
                      {dialog.cancelLabel ?? 'Cancelar'}
                    </button>
                  )}
                  <button
                    onClick={() => handleClose(true)}
                    className={`px-5 py-2 text-sm font-medium transition-all ${
                      type === 'error'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : type === 'success'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : type === 'confirm'
                        ? 'bg-primary hover:bg-[#c9a227] text-black'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {dialog.confirmLabel ?? (isConfirm ? 'Confirmar' : 'OK')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextValue => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
};
