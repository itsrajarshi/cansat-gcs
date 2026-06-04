/**
 * Mission Zustand Store - Mission state and commands
 */

import { create } from 'zustand';
import { MissionPhaseType, MissionCommand, MissionLog, SystemStatus, AlertState } from '@/types/mission';
import { MISSION_PHASES } from '@/utils/constants';

interface MissionState {
  // State
  isActive: boolean;
  isPaused: boolean;
  phase: MissionPhaseType;
  startTime: number;
  elapsedTime: number;

  // Mission data
  commands: MissionCommand[];
  logs: MissionLog[];
  alerts: AlertState[];
  systemStatus: SystemStatus;

  // Actions
  startMission: () => void;
  stopMission: () => void;
  pauseMission: () => void;
  resumeMission: () => void;
  setPhase: (phase: MissionPhaseType) => void;
  updateElapsedTime: (seconds: number) => void;
  addCommand: (command: MissionCommand) => void;
  updateCommandStatus: (commandId: string, status: MissionCommand['status']) => void;
  setCommandAcknowledged: (commandId: string, acknowledged: boolean) => void;
  setCommandError: (commandId: string, error: string | undefined) => void;
  addLog: (level: MissionLog['level'], message: string, details?: unknown) => void;
  addAlert: (alert: AlertState) => void;
  dismissAlert: (alertId: string) => void;
  clearAlerts: () => void;
  updateSystemStatus: (status: Partial<SystemStatus>) => void;
  getActiveCommands: () => MissionCommand[];
  getRecentLogs: (count: number) => MissionLog[];
  getUnreadAlerts: () => AlertState[];
}

const initialSystemStatus: SystemStatus = {
  connectionStatus: 'disconnected',
  lastHeartbeat: 0,
  signalStrength: 0,
  latency: 0,
  systemHealth: 100,
};

export const useMissionStore = create<MissionState>((set, get) => ({
  isActive: false,
  isPaused: false,
  phase: MISSION_PHASES.PRE_LAUNCH as MissionPhaseType,
  startTime: 0,
  elapsedTime: 0,
  commands: [],
  logs: [],
  alerts: [],
  systemStatus: initialSystemStatus,

  startMission: () => {
    set({
      isActive: true,
      isPaused: false,
      phase: MISSION_PHASES.LAUNCH as MissionPhaseType,
      startTime: Date.now(),
      elapsedTime: 0,
    });

    get().addLog('info', 'Mission started', { phase: MISSION_PHASES.LAUNCH });
  },

  stopMission: () => {
    set({
      isActive: false,
      isPaused: false,
      phase: MISSION_PHASES.POST_MISSION as MissionPhaseType,
    });

    get().addLog('info', 'Mission ended', {
      totalTime: get().elapsedTime,
      phase: MISSION_PHASES.POST_MISSION,
    });
  },

  pauseMission: () => {
    set({ isPaused: true });
    get().addLog('info', 'Mission paused');
  },

  resumeMission: () => {
    set({ isPaused: false });
    get().addLog('info', 'Mission resumed');
  },

  setPhase: (phase: MissionPhaseType) => {
    set({ phase });
    get().addLog('info', `Mission phase changed to ${phase}`);
  },

  updateElapsedTime: (seconds: number) => {
    set({ elapsedTime: seconds });
  },

  addCommand: (command: MissionCommand) => {
    set((state) => ({
      commands: [...state.commands, command],
    }));

    get().addLog('info', `Command issued: ${command.name}`, {
      commandId: command.id,
      type: command.type,
    });
  },

  updateCommandStatus: (commandId: string, status: MissionCommand['status']) => {
    set((state) => ({
      commands: state.commands.map((cmd) =>
        cmd.id === commandId ? { ...cmd, status } : cmd
      ),
    }));

    const command = get().commands.find((c) => c.id === commandId);
    if (command) {
      get().addLog(
        status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'info',
        `Command ${command.name}: ${status}`,
        { commandId }
      );
    }
  },

  setCommandAcknowledged: (commandId: string, acknowledged: boolean) => {
    set((state) => ({
      commands: state.commands.map((cmd) => (cmd.id === commandId ? { ...cmd, acknowledged } : cmd)),
    }));
  },

  setCommandError: (commandId: string, error: string | undefined) => {
    set((state) => ({
      commands: state.commands.map((cmd) => (cmd.id === commandId ? { ...cmd, error } : cmd)),
    }));
  },

  addLog: (level: MissionLog['level'], message: string, details?: unknown) => {
    set((state) => ({
      logs: [
        ...state.logs,
        {
          timestamp: Date.now(),
          level,
          message,
          details,
        },
      ].slice(-100), // Keep only last 100 logs
    }));
  },

  addAlert: (alert: AlertState) => {
    set((state) => ({
      alerts: [...state.alerts, alert],
    }));
  },

  dismissAlert: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, dismissed: true } : a
      ),
    }));
  },

  clearAlerts: () => {
    set({ alerts: [] });
  },

  updateSystemStatus: (status: Partial<SystemStatus>) => {
    set((state) => ({
      systemStatus: { ...state.systemStatus, ...status },
    }));
  },

  getActiveCommands: () => {
    return get().commands.filter(
      (cmd) => cmd.status === 'pending' || cmd.status === 'executing'
    );
  },

  getRecentLogs: (count: number) => {
    const logs = get().logs;
    return logs.slice(-count);
  },

  getUnreadAlerts: () => {
    return get().alerts.filter((a) => !a.dismissed);
  },
}));
