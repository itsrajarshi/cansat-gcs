import React, { useMemo } from 'react';
import Card from '@/components/common/Card';
import { ErrorCode } from '@/types/telemetry';
import { calculateErrorCode, isDescendingPhase } from '@/services/telemetryParser';
import { TelemetryPacket } from '@/types/telemetry';
import { getScenarioDefinition } from '@/services/scenarioCatalog';
import type { SimulationScenarioKind } from '@/services/telemetrySimulator';

interface ErrorCodeDisplayProps {
  packet: TelemetryPacket | null;
  activeScenario?: SimulationScenarioKind | null;
}

export const ErrorCodeDisplay: React.FC<ErrorCodeDisplayProps> = ({ packet, activeScenario = null }) => {
  const errorCode: ErrorCode | null = useMemo(() => {
    if (!packet) return null;
    return calculateErrorCode(packet);
  }, [packet]);

  if (!errorCode || !packet) {
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

  const preSeparation =
    packet.payloadStatus === 'Attached' || packet.payloadStatus === 'Pending';
  const digitLabels = [
    isDescendingPhase(packet.descentRate) ? (statuses[0] ? 'FAULT' : 'OK') : 'N/A',
    statuses[1] ? 'FAULT' : 'OK',
    preSeparation ? 'N/A' : statuses[2] ? 'FAULT' : 'OK',
    statuses[3] ? 'ACTIVE' : 'OK',
  ];

  const digitFaultClass = (i: number, isFault: boolean, applicable: boolean) => {
    if (!applicable) {
      return 'bg-aerospace-dark/40 border-aerospace-secondary/30 text-gray-400';
    }
    if (!isFault) return 'bg-aerospace-success/20 border-aerospace-success/50 text-aerospace-success';

    if (isCritical) {
      return `bg-aerospace-danger/20 border-aerospace-danger/50 text-aerospace-danger ${i === 3 ? 'animate-pulse-fast' : ''}`;
    }

    const shouldFlash = i === 3 && parachuteDigitFault;
    return `bg-aerospace-warning/20 border-aerospace-warning/50 text-aerospace-warning ${shouldFlash ? 'animate-pulse-fast' : ''}`;
  };

  const digitApplicable = [
    isDescendingPhase(packet.descentRate),
    true,
    !preSeparation,
    true,
  ];

  const scenarioHint = activeScenario ? getScenarioDefinition(activeScenario).expectedCodeHint : null;

  return (
    <Card
      title="Error Code System"
      subtitle={`Status: ${isNormal ? 'NORMAL' : isCritical ? 'CRITICAL' : 'WARNING'}${
        activeScenario ? ` · ${getScenarioDefinition(activeScenario).label}` : ''
      }`}
    >
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
            className={`rounded p-2 text-center border ${digitFaultClass(i, statuses[i], digitApplicable[i])}`}
          >
            <div className="font-bold text-base mb-1">{digit}</div>
            <div className="text-gray-400 text-xs">{labels[i]}</div>
            <div className="text-xs mt-1">{digitLabels[i]}</div>
          </div>
        ))}
      </div>

      {scenarioHint && (
        <p className="mt-2 text-xs text-gray-400">
          Scenario target: <span className="font-mono text-aerospace-accent">{scenarioHint}</span>
        </p>
      )}

      <div className="mt-3 text-xs text-gray-300 space-y-1">
        <p>
          <span className="text-aerospace-accent">Digit 1:</span> Descent Rate{' '}
          <span className={statuses[0] ? 'text-aerospace-danger' : 'text-aerospace-success'}>
            ({digitApplicable[0] ? (statuses[0] ? 'Outside Safe Range' : 'Safe 8-10 m/s') : 'Not descending'})
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
            ({preSeparation ? 'Awaiting separation' : statuses[2] ? 'Failure' : 'Success'})
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
