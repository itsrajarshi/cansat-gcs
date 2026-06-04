import React, { useEffect, useMemo, useRef, useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Camera, CameraOff, Maximize2 } from 'lucide-react';

export const VideoStream: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const selectedDevice = useMemo(
    () => devices.find((d) => d.deviceId === selectedDeviceId) ?? null,
    [devices, selectedDeviceId]
  );

  useEffect(() => {
    const getDevices = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((device) => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch {
        setError('Failed to enumerate devices');
      }
    };

    getDevices();
  }, []);

  useEffect(() => {
    if (!isStreaming) {
      setFps(0);
      return;
    }

    let raf = 0;
    let last = performance.now();
    let frames = 0;

    const loop = () => {
      frames += 1;
      const now = performance.now();
      const elapsed = now - last;

      if (elapsed >= 1000) {
        setFps((frames * 1000) / elapsed);
        frames = 0;
        last = now;
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isStreaming]);

  const startStream = async () => {
    try {
      setError(null);

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsStreaming(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access camera');
      setIsStreaming(false);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setFps(0);
  };

  const toggleFullscreen = () => {
    if (videoRef.current && videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);

      const link = document.createElement('a');
      link.href = canvasRef.current.toDataURL('image/png');
      link.download = `frame-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <Card title="Live Video Stream" subtitle="Camera Feed">
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded p-2 mb-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {/* Camera Selection */}
        <div className="flex gap-2 flex-col sm:flex-row">
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            disabled={isStreaming}
            className="px-3 py-2 bg-aerospace-dark border border-aerospace-secondary/30 rounded text-sm text-gray-200 flex-1 disabled:opacity-50"
          >
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.substring(0, 5)}`}
              </option>
            ))}
          </select>

          {!isStreaming ? (
            <Button
              size="sm"
              variant="success"
              onClick={startStream}
            >
              <Camera className="w-4 h-4" />
              Start Camera
            </Button>
          ) : (
            <Button
              size="sm"
              variant="danger"
              onClick={stopStream}
            >
              <CameraOff className="w-4 h-4" />
              Stop Camera
            </Button>
          )}
        </div>

        {/* Video Display */}
        <div className="bg-aerospace-dark rounded-lg border border-aerospace-secondary/20 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full aspect-video bg-black"
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Controls */}
        {isStreaming && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={toggleFullscreen}
              className="flex-1"
            >
              <Maximize2 className="w-4 h-4" />
              Fullscreen
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={captureFrame}
              className="flex-1"
            >
              <Camera className="w-4 h-4" />
              Capture
            </Button>
          </div>
        )}

        {/* Status */}
        <div className="text-xs text-gray-400 text-center">
          {isStreaming ? (
            <div>
              <p>Stream Active</p>
              <p className="mt-1">
                Camera:{' '}
                <span className="text-gray-200 font-medium">
                  {selectedDevice?.label ? selectedDevice.label : selectedDeviceId ? selectedDeviceId : 'Unknown'}
                </span>
              </p>
              <p className="mt-1">
                {videoRef.current
                  ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}px`
                  : 'Loading...'}
              </p>
              <p className="mt-1">FPS: {fps.toFixed(1)}</p>
            </div>
          ) : (
            <p>Camera disconnected</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default VideoStream;
