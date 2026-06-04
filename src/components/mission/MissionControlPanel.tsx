import React, { useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { AlertCircle } from 'lucide-react';
import { useMissionStore } from '@/store/missionStore';

interface MissionControlProps {
  onSeparation?: () => void;
  onParachuteDeployment?: () => void;
  onRedundantActivation?: () => void;
}

export const MissionControlPanel: React.FC<MissionControlProps> = ({
  onSeparation,
  onParachuteDeployment,
  onRedundantActivation,
}) => {
  const mission = useMissionStore();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'separation' | 'parachute' | 'redundant_activation' | null;
  }>({
    isOpen: false,
    type: null,
  });
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!confirmDialog.type) return;

    const type = confirmDialog.type;
    setExecutingCommand(type);

    const commandId = `cmd-${type}-${Date.now()}`;
    const issuedAt = Date.now();

    mission.addCommand({
      id: commandId,
      type,
      name: commandLabels[type],
      description: commandDescriptions[type],
      timestamp: issuedAt,
      status: 'pending',
      acknowledged: false,
    });

    // Command lifecycle simulation: pending -> sent -> executing -> ACK -> completed/failed
    const sentAt = issuedAt + 200;
    const execAt = issuedAt + 650;
    const ackAt = issuedAt + 900;
    const finalizeAt = issuedAt + 1350;

    setTimeout(() => {
      mission.updateCommandStatus(commandId, 'sent');
      mission.addLog('info', `${commandLabels[type]} Command Sent`, { commandId });
    }, Math.max(0, sentAt - Date.now()));

    setTimeout(() => {
      mission.updateCommandStatus(commandId, 'executing');
      mission.addLog('info', `${commandLabels[type]} Execution Started`, { commandId });
    }, Math.max(0, execAt - Date.now()));

    setTimeout(() => {
      mission.setCommandAcknowledged(commandId, true);
      mission.addLog('success', 'ACK Received', { commandId });
    }, Math.max(0, ackAt - Date.now()));

    setTimeout(() => {
      const success = Math.random() > 0.12;
      if (success) {
        mission.updateCommandStatus(commandId, 'completed');
        mission.setCommandError(commandId, undefined);
        mission.addLog('success', `${commandLabels[type]} completed successfully`, { commandId });

        if (type === 'separation') onSeparation?.();
        if (type === 'parachute') onParachuteDeployment?.();
        if (type === 'redundant_activation') onRedundantActivation?.();
      } else {
        mission.updateCommandStatus(commandId, 'failed');
        mission.setCommandError(commandId, 'No ACK / Timeout');
        mission.addLog('error', `${commandLabels[type]} failed`, { commandId });
      }

      setExecutingCommand(null);
      setConfirmDialog({ isOpen: false, type: null });
    }, Math.max(0, finalizeAt - Date.now()));
  };

  const commandLabels = {
    separation: 'Manual Separation',
    parachute: 'Emergency Parachute Deployment',
    redundant_activation: 'Redundant Activation',
  };

  const commandDescriptions = {
    separation: 'Manually trigger payload separation',
    parachute: 'Deploy recovery parachute (emergency)',
    redundant_activation: 'Activate redundant system (backup)',
  };

  return (
    <Card title="Mission Control" subtitle="Critical Operations">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="border border-aerospace-secondary/20 rounded-lg p-3 bg-aerospace-dark/30">
          <div className="text-xs text-gray-400 mb-2">Separation Control</div>
          <Button
            size="sm"
            variant="warning"
            className="w-full"
            onClick={() => setConfirmDialog({ isOpen: true, type: 'separation' })}
            disabled={executingCommand === 'separation'}
            loading={executingCommand === 'separation'}
          >
              Manual Separation
          </Button>
          <p className="text-xs text-gray-500 mt-2">{commandDescriptions.separation}</p>
        </div>

        <div className="border border-aerospace-secondary/20 rounded-lg p-3 bg-aerospace-dark/30">
          <div className="text-xs text-gray-400 mb-2">Parachute Deployment</div>
          <Button
            size="sm"
              variant="danger"
            className="w-full"
            onClick={() => setConfirmDialog({ isOpen: true, type: 'parachute' })}
            disabled={executingCommand === 'parachute'}
            loading={executingCommand === 'parachute'}
          >
              <AlertCircle className="w-4 h-4" />
              Emergency Parachute
          </Button>
          <p className="text-xs text-gray-500 mt-2">{commandDescriptions.parachute}</p>
        </div>

        <div className="border border-aerospace-secondary/20 rounded-lg p-3 bg-aerospace-dark/30">
            <div className="text-xs text-gray-400 mb-2">Redundancy</div>
          <Button
            size="sm"
              variant="secondary"
            className="w-full"
              onClick={() => setConfirmDialog({ isOpen: true, type: 'redundant_activation' })}
              disabled={executingCommand === 'redundant_activation'}
              loading={executingCommand === 'redundant_activation'}
          >
              Redundant Activation
          </Button>
            <p className="text-xs text-gray-500 mt-2">{commandDescriptions.redundant_activation}</p>
        </div>
      </div>

      {/* Command History */}
      <div className="border-t border-aerospace-secondary/20 pt-3">
        <h4 className="text-xs font-semibold text-aerospace-accent mb-2">Recent Commands</h4>
        <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
          {mission.commands.length === 0 ? (
            <p className="text-gray-400">No commands yet</p>
          ) : (
            mission.commands.slice(-5).reverse().map((cmd) => (
              <div key={cmd.id} className="flex items-center justify-between gap-3 text-gray-300">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{cmd.name}</span>
                    {cmd.acknowledged && <span className="text-aerospace-accent font-mono text-[11px]">ACK</span>}
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono">
                    [
                    {new Date(cmd.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    ]
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono flex-shrink-0 ${
                    cmd.status === 'completed'
                      ? 'bg-aerospace-success/20 text-aerospace-success'
                      : cmd.status === 'failed'
                      ? 'bg-aerospace-danger/20 text-aerospace-danger'
                      : 'bg-aerospace-warning/20 text-aerospace-warning'
                  }`}
                >
                  {cmd.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Execution Logs */}
      <div className="border-t border-aerospace-secondary/20 pt-3 mt-3">
        <h4 className="text-xs font-semibold text-aerospace-accent mb-2">Execution Log</h4>
        <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
          {mission.logs.length === 0 ? (
            <p className="text-gray-400">No execution logs yet</p>
          ) : (
            mission.logs
              .slice(-12)
              .reverse()
              .map((log, idx) => (
                <div key={`${log.timestamp}-${idx}`} className="text-gray-300">
                  <span className="text-gray-500 font-mono">
                    [
                    {new Date(log.timestamp).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                    })}
                    ]
                  </span>{' '}
                  <span>{log.message}</span>
                </div>
              ))
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.type ? commandLabels[confirmDialog.type] : ''}
        message={
          confirmDialog.type
            ? `Are you sure you want to execute: ${commandDescriptions[confirmDialog.type]}?`
            : ''
        }
        isDangerous={confirmDialog.type === 'parachute'}
        confirmLabel="Execute"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, type: null })}
        loading={executingCommand === confirmDialog.type}
      />
    </Card>
  );
};

export default MissionControlPanel;
