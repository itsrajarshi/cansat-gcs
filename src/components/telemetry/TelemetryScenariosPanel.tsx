import React from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { SimulationScenarioKind } from '@/services/telemetrySimulator';
import { SCENARIO_CATALOG, getScenarioDefinition } from '@/services/scenarioCatalog';
import { calculateErrorCode } from '@/services/telemetryParser';
import { TelemetryPacket } from '@/types/telemetry';

interface TelemetryScenariosPanelProps {
  scenarioKind: SimulationScenarioKind;
  onScenarioChange: (kind: SimulationScenarioKind) => void;
  disabled: boolean;
  isReceiving: boolean;
  lastPacket: TelemetryPacket | null;
  onPreviewPacket?: () => void;
}

export const TelemetryScenariosPanel: React.FC<TelemetryScenariosPanelProps> = ({
  scenarioKind,
  onScenarioChange,
  disabled,
  isReceiving,
  lastPacket,
  onPreviewPacket,
}) => {
  const definition = getScenarioDefinition(scenarioKind);
  const liveCode = lastPacket ? calculateErrorCode(lastPacket).code : '----';

  return (
    <Card title="Telemetry Scenarios" subtitle="Mock-only scenario injection for testing">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex flex-col gap-2 min-w-[220px]">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Scenario</label>
          <select
            value={scenarioKind}
            onChange={(e) => onScenarioChange(e.target.value as SimulationScenarioKind)}
            disabled={disabled}
            className="px-3 py-2 bg-aerospace-dark border border-aerospace-secondary/30 rounded text-sm text-gray-200 disabled:opacity-50"
          >
            {SCENARIO_CATALOG.map((s) => (
              <option key={s.kind} value={s.kind}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[240px] space-y-1 text-sm">
          <p className="text-gray-200">{definition.description}</p>
          <p className="text-xs text-gray-400">
            Expected pattern:{' '}
            <span className="font-mono text-aerospace-accent">{definition.expectedCodeHint}</span>
          </p>
          <p className="text-xs text-gray-400">
            Live error code:{' '}
            <span className="font-mono text-aerospace-warning font-bold">{liveCode}</span>
            {isReceiving ? ' (updating)' : ' (stop & reset, then start to replay)'}
          </p>
        </div>

        {onPreviewPacket && !disabled && (
          <Button size="sm" variant="outline" onClick={onPreviewPacket} title="Inject one packet without starting the stream">
            Preview packet
          </Button>
        )}
      </div>
    </Card>
  );
};

export default TelemetryScenariosPanel;
