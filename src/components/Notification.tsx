import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  message: string;
  type: NotificationType;
  isVisible: boolean;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000); // Auto-ukrywanie po 4s
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const bgColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  const icons = {
    success: <CheckCircle className="w-6 h-6 text-white" />,
    error: <AlertCircle className="w-6 h-6 text-white" />,
    info: <Info className="w-6 h-6 text-white" />,
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          className={`fixed top-6 left-1/2 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl ${bgColors[type]} min-w-[300px] max-w-md`}
        >
          <div className="shrink-0">{icons[type]}</div>
          <p className="flex-1 text-white font-bold text-sm">{message}</p>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
