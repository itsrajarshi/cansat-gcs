import React, { useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { AttitudeIndicator3D } from '@/threejs/AttitudeIndicator3D';

interface OrientationIndicatorProps {
  roll?: number; // degrees
  pitch?: number; // degrees
  yaw?: number; // degrees
}

export const OrientationIndicator: React.FC<OrientationIndicatorProps> = ({
  roll = 0,
  pitch = 0,
  yaw = 0,
}) => {
  const [viewMode, setViewMode] = useState<'threejs' | 'horizon'>('threejs');
  const [resetKey, setResetKey] = useState(0);

  // Draw artificial horizon (simple 2D representation) - fallback mode.
  const width = 300;
  const height = 300;
  const centerX = width / 2;
  const centerY = height / 2;

  const pitchOffset = (pitch / 90) * 50; // Max 50px offset

  return (
    <Card
      title="Orientation Visualization"
      subtitle={`Roll: ${roll.toFixed(1)}° | Pitch: ${pitch.toFixed(1)}° | Yaw: ${yaw.toFixed(1)}°`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2">
            <Button size="sm" variant={viewMode === 'threejs' ? 'secondary' : 'outline'} onClick={() => setViewMode('threejs')}>
              3D
            </Button>
            <Button size="sm" variant={viewMode === 'horizon' ? 'secondary' : 'outline'} onClick={() => setViewMode('horizon')}>
              Horizon
            </Button>
          </div>

          <Button size="sm" variant="outline" onClick={() => setResetKey((k) => k + 1)}>
            Reset Orientation
          </Button>
        </div>

        <div className="flex flex-col items-center gap-4">
          {viewMode === 'threejs' ? (
            <AttitudeIndicator3D roll={roll} pitch={pitch} yaw={yaw} resetKey={resetKey} />
          ) : (
            <svg
              width={width}
              height={height}
              className="border border-aerospace-secondary/20 rounded-full bg-aerospace-dark"
            >
              {/* Sky and ground */}
              <defs>
                <linearGradient id="horizon" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#1a5f7a', stopOpacity: 0.3 }} />
                  <stop offset="50%" style={{ stopColor: '#0a0e27' }} />
                  <stop offset="100%" style={{ stopColor: '#8b6914', stopOpacity: 0.3 }} />
                </linearGradient>
              </defs>

              {/* Background */}
              <rect width={width} height={height} fill="url(#horizon)" />

              {/* Horizon line */}
              <g transform={`translate(${centerX}, ${centerY}) rotate(${roll})`} style={{ transition: 'transform 0.3s ease-out' }}>
                <line x1={-centerX} y1={pitchOffset} x2={centerX} y2={pitchOffset} stroke="#00d9ff" strokeWidth="2" />
                <rect x={-centerX} y={pitchOffset} width={width} height={centerY - pitchOffset} fill="none" stroke="none" />
              </g>

              {/* Pitch lines */}
              <g transform={`translate(${centerX}, ${centerY}) rotate(${roll})`}>
                {[...Array(5)].map((_, i) => {
                  const offset = (i - 2) * 15;
                  return (
                    <g key={i}>
                      <line
                        x1={-20}
                        y1={offset + pitchOffset}
                        x2={20}
                        y2={offset + pitchOffset}
                        stroke="#6366f1"
                        strokeWidth="1"
                        opacity="0.5"
                      />
                      {offset !== 0 && (
                        <text x={-35} y={offset + pitchOffset + 3} fill="#6366f1" fontSize="10" opacity="0.7">
                          {Math.abs(offset)}°
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* Center cross */}
              <line x1={centerX - 15} y1={centerY} x2={centerX + 15} y2={centerY} stroke="#00ff88" strokeWidth="2" />
              <line x1={centerX} y1={centerY - 15} x2={centerX} y2={centerY + 15} stroke="#00ff88" strokeWidth="2" />
              <circle cx={centerX} cy={centerY} r="4" fill="#00ff88" />

              {/* Roll indicator */}
              <circle cx={centerX} cy={centerY} r={90} fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.3" />
              <text x={centerX - 10} y={25} fill="#00d9ff" fontSize="12" fontWeight="bold">
                {yaw.toFixed(0)}°
              </text>
            </svg>
          )}

          {/* Gauge displays */}
          <div className="grid grid-cols-3 gap-2 w-full">
            <div className="bg-aerospace-dark/50 border border-aerospace-secondary/20 rounded p-2 text-center">
              <div className="text-xs text-gray-400">ROLL</div>
              <div className="text-lg font-mono font-bold text-aerospace-accent">{roll.toFixed(1)}°</div>
            </div>
            <div className="bg-aerospace-dark/50 border border-aerospace-secondary/20 rounded p-2 text-center">
              <div className="text-xs text-gray-400">PITCH</div>
              <div className="text-lg font-mono font-bold text-aerospace-accent">{pitch.toFixed(1)}°</div>
            </div>
            <div className="bg-aerospace-dark/50 border border-aerospace-secondary/20 rounded p-2 text-center">
              <div className="text-xs text-gray-400">YAW</div>
              <div className="text-lg font-mono font-bold text-aerospace-accent">{yaw.toFixed(1)}°</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default OrientationIndicator;
