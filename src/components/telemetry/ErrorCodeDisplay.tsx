import React, { useMemo } from 'react';
import Card from '@/components/common/Card';
import { ErrorCode } from '@/types/telemetry';
import { calculateErrorCode } from '@/services/telemetryParser';
import { TelemetryPacket } from '@/types/telemetry';

interface ErrorCodeDisplayProps {
  packet: TelemetryPacket | null;
}

export const ErrorCodeDisplay: React.FC<ErrorCodeDisplayProps> = ({ packet }) => {
  const errorCode: ErrorCode | null = useMemo(() => {
    if (!packet) return null;
    return calculateErrorCode(packet);
  }, [packet]);

  if (!errorCode) {
    return (
      <Card title="Error Status" subtitle="No data">
        <div className="text-gray-400 text-center py-2">Waiting for telemetry...</div>
      </Card>
    );
  }

  const isNormal = errorCode.code === '0000';
  const isCritical = errorCode.code === '1111';
  const hasWarning = errorCode.code !== '0000' && !isCritical;

  const parachuteDigitFault = errorCode.parachuteActive;

  const getStatusColor = () => {
    if (isNormal) return 'text-aerospace-success';
    if (isCritical) return 'text-aerospace-danger';
    if (hasWarning) return 'text-aerospace-warning';
    return 'text-aerospace-accent';
  };

  const getBackgroundColor = () => {
    if (isNormal) return 'bg-aerospace-success/10 border-aerospace-success/30';
    if (isCritical) return 'bg-aerospace-danger/10 border-aerospace-danger/30 animate-pulse';
    if (hasWarning) return 'bg-aerospace-warning/10 border-aerospace-warning/30';
    return 'bg-aerospace-accent/10 border-aerospace-accent/30';
  };

  const digits = errorCode.code.split('');
  const labels = ['Descent', 'GPS', 'Separation', 'Parachute'];
  const statuses = [
    errorCode.descentRateFault,
    errorCode.gpsUnavailable,
    errorCode.separationFailure,
    errorCode.parachuteActive,
  ];

  const digitFaultClass = (i: number, isFault: boolean) => {
    if (!isFault) return 'bg-aerospace-success/20 border-aerospace-success/50 text-aerospace-success';

    // If it's critical, fault digits are red. If it's warning, they are yellow.
    if (isCritical) {
      return `bg-aerospace-danger/20 border-aerospace-danger/50 text-aerospace-danger ${i === 3 ? 'animate-pulse-fast' : ''}`;
    }

    // Digit 4 (parachute) should flash when active, even if not all digits are critical.
    const shouldFlash = i === 3 && parachuteDigitFault;
    return `bg-aerospace-warning/20 border-aerospace-warning/50 text-aerospace-warning ${shouldFlash ? 'animate-pulse-fast' : ''}`;
  };

  return (
    <Card title="Error Code System" subtitle={`Status: ${isNormal ? 'NORMAL' : isCritical ? 'CRITICAL' : 'WARNING'}`}>
      <div className={`rounded-lg border-2 p-4 mb-4 ${getBackgroundColor()}`}>
        <div
          className={`text-4xl font-mono font-bold text-center tracking-widest ${getStatusColor()} ${
            isCritical || parachuteDigitFault ? 'animate-pulse-fast' : ''
          }`}
        >
          {errorCode.code}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-xs">
        {digits.map((digit, i) => (
          <div
            key={i}
            className={`rounded p-2 text-center border ${digitFaultClass(i, statuses[i])}`}
          >
            <div className="font-bold text-base mb-1">{digit}</div>
            <div className="text-gray-400 text-xs">{labels[i]}</div>
            <div className="text-xs mt-1">{statuses[i] ? 'FAULT' : 'OK'}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-300 space-y-1">
        <p>
          <span className="text-aerospace-accent">Digit 1:</span> Descent Rate{' '}
          <span className={statuses[0] ? 'text-aerospace-danger' : 'text-aerospace-success'}>
            ({statuses[0] ? 'Outside Safe Range' : 'Safe 8-10 m/s'})
          </span>
        </p>
        <p>
          <span className="text-aerospace-accent">Digit 2:</span> GPS{' '}
          <span className={statuses[1] ? 'text-aerospace-danger' : 'text-aerospace-success'}>
            ({statuses[1] ? 'Unavailable' : 'Available'})
          </span>
        </p>
        <p>
          <span className="text-aerospace-accent">Digit 3:</span> Separation{' '}
          <span className={statuses[2] ? 'text-aerospace-danger' : 'text-aerospace-success'}>
            ({statuses[2] ? 'Failure' : 'Success'})
          </span>
        </p>
        <p>
          <span className="text-aerospace-accent">Digit 4:</span> Parachute{' '}
          <span className={statuses[3] ? 'text-aerospace-warning' : 'text-aerospace-success'}>
            ({statuses[3] ? 'Active' : 'Inactive'})
          </span>
        </p>
      </div>
    </Card>
  );
};

export default ErrorCodeDisplay;
