// frontend/src/components/common/Toast.tsx
import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
  if (!message) return null;

  const bgStyles =
    type === 'success'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
      : type === 'error'
      ? 'bg-rose-50 text-rose-800 border-rose-300'
      : 'bg-blue-50 text-blue-800 border-blue-300';

  const icon =
    type === 'success' ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
    ) : type === 'error' ? (
      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
    ) : (
      <Info className="w-4 h-4 text-blue-600 shrink-0" />
    );

  return (
    <div className={`flex items-start justify-between p-3.5 rounded-lg border text-xs font-medium shadow-sm transition-all ${bgStyles}`}>
      <div className="flex items-center space-x-2.5">
        {icon}
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="p-0.5 hover:opacity-70 transition-opacity ml-3">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
