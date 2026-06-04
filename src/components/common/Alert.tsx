import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AlertProps {
  type: 'error' | 'warning' | 'success' | 'info';
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  dismissible = true,
  onDismiss,
}) => {
  const colors = {
    error: 'bg-red-900/20 border-red-500/50 text-red-100',
    warning: 'bg-yellow-900/20 border-yellow-500/50 text-yellow-100',
    success: 'bg-green-900/20 border-green-500/50 text-green-100',
    info: 'bg-blue-900/20 border-blue-500/50 text-blue-100',
  };

  const icons = {
    error: <AlertTriangle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  return (
    <div className={`border rounded-lg p-4 flex items-start gap-3 ${colors[type]}`}>
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        {title && <h3 className="font-semibold text-sm mb-1">{title}</h3>}
        <p className="text-sm">{message}</p>
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-lg leading-none opacity-50 hover:opacity-75"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
