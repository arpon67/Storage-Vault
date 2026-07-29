import React from 'react';
import { useStorage } from '../context/StorageContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export function ToastContainer() {
  const { toasts } = useStorage();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        let Icon = Info;
        if (toast.type === 'success') Icon = CheckCircle2;
        if (toast.type === 'error') Icon = AlertCircle;

        return (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <Icon size={18} className="toast-icon" />
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
