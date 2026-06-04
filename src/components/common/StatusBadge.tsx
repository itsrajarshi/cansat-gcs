import React from 'react';
import { Circle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  label?: string;
  animated?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  animated = true,
}) => {
  const statusColors = {
    connected: 'bg-aerospace-success text-black',
    disconnected: 'bg-gray-700 text-gray-200',
    connecting: 'bg-aerospace-warning text-black',
    error: 'bg-aerospace-danger text-white',
  };

  const statusLabels = {
    connected: 'Connected',
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
    error: 'Error',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
      <Circle
        className={`w-2 h-2 fill-current ${
          animated && (status === 'connected' || status === 'connecting')
            ? 'animate-pulse'
            : ''
        }`}
      />
      <span>{label || statusLabels[status]}</span>
    </div>
  );
};

export default StatusBadge;
