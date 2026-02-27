import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full';
}

const sizes: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  xxl: 'max-w-6xl',
  full: 'max-w-7xl',
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop - cinematic dark glass effect */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/90 via-neutral-900/80 to-black/90 backdrop-blur-[6px] saturate-150"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={clsx('relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl w-full', sizes[size])}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-0">
          {children}
        </div>
      </div>
    </div>
  );
};
