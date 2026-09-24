import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-100">{title}</h2>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-6 text-slate-300">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
