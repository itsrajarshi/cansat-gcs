import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Card from '@/components/common/Card';
import { useTelemetryStore } from '@/store/telemetryStore';
import { DEFAULT_LATITUDE, DEFAULT_LONGITUDE, MAP_AUTO_CENTER_ZOOM } from '@/utils/constants';
import { calculateBearing, calculateDistance, formatDistance, formatSpeed } from '@/utils/formatters';

const defaultIconUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300d9ff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>';

const redIconUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ff3333"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>';

export const GPSMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const pathRef = useRef<L.Polyline | null>(null);
  const { gpsTrack, lastPacket } = useTelemetryStore();

  const computed = useMemo(() => {
    if (!gpsTrack || gpsTrack.length < 2) {
      return {
        distanceMeters: 0,
        speedMps: 0,
        headingDeg: 0,
      };
    }

    let distanceMeters = 0;
    for (let i = 1; i < gpsTrack.length; i++) {
      const a = gpsTrack[i - 1];
      const b = gpsTrack[i];
      distanceMeters += calculateDistance(a.latitude, a.longitude, b.latitude, b.longitude);
    }

    const prev = gpsTrack[gpsTrack.length - 2];
    const curr = gpsTrack[gpsTrack.length - 1];
    const dt = Math.max(0.001, (curr.timestamp - prev.timestamp) / 1000);
    const dist = calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    const speedMps = dist / dt;
    const headingDeg = calculateBearing(prev.latitude, prev.longitude, curr.latitude, curr.longitude);

    return { distanceMeters, speedMps, headingDeg };
  }, [gpsTrack]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([DEFAULT_LATITUDE, DEFAULT_LONGITUDE], MAP_AUTO_CENTER_ZOOM);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        opacity: 0.7,
      }).addTo(map.current);
    }

    // Update marker and path
    if (lastPacket && gpsTrack.length > 0) {
      const currentPos: [number, number] = [lastPacket.gpsLatitude, lastPacket.gpsLongitude];

      // Update marker
      if (markerRef.current) {
        markerRef.current.setLatLng(currentPos);
      } else {
        const icon = L.icon({
          iconUrl: defaultIconUrl,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        markerRef.current = L.marker(currentPos, { icon }).addTo(map.current!);
        markerRef.current.bindPopup(`
          <div class="text-xs">
            <p><strong>Latitude:</strong> ${lastPacket.gpsLatitude.toFixed(6)}</p>
            <p><strong>Longitude:</strong> ${lastPacket.gpsLongitude.toFixed(6)}</p>
            <p><strong>Altitude:</strong> ${lastPacket.gpsAltitude.toFixed(2)} m</p>
            <p><strong>Packet:</strong> #${lastPacket.packetId}</p>
          </div>
        `);
      }

      // Update path
      const pathCoordinates = gpsTrack.map((p) => [p.latitude, p.longitude] as [number, number]);

      if (pathRef.current) {
        pathRef.current.setLatLngs(pathCoordinates);
      } else if (pathCoordinates.length > 1) {
        pathRef.current = L.polyline(pathCoordinates, {
          color: '#00d9ff',
          weight: 2,
          opacity: 0.7,
          dashArray: '5, 5',
        }).addTo(map.current!);
      }

      // Center on current position
      map.current!.setView(currentPos, MAP_AUTO_CENTER_ZOOM);
    }

    return () => {
      // Cleanup on unmount
    };
  }, [lastPacket, gpsTrack]);

  return (
    <Card title="GPS Tracking" subtitle="Real-time position and trajectory">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="text-sm text-gray-300">
          <span className="text-gray-400">Lat:</span>{' '}
          <span className="text-aerospace-accent font-mono font-bold">
            {lastPacket ? lastPacket.gpsLatitude.toFixed(6) : '---'}
          </span>{' '}
          <span className="text-gray-400">Lon:</span>{' '}
          <span className="text-aerospace-accent font-mono font-bold">
            {lastPacket ? lastPacket.gpsLongitude.toFixed(6) : '---'}
          </span>
        </div>

        <div className="text-xs text-gray-400 flex gap-4 flex-wrap">
          <div>
            <span className="text-gray-400">Distance:</span>{' '}
            <span className="text-aerospace-accent font-mono font-bold">{formatDistance(computed.distanceMeters)}</span>
          </div>
          <div>
            <span className="text-gray-400">Speed:</span>{' '}
            <span className="text-aerospace-accent font-mono font-bold">{formatSpeed(computed.speedMps)}</span>
          </div>
          <div>
            <span className="text-gray-400">Heading:</span>{' '}
            <span className="text-aerospace-accent font-mono font-bold">{computed.headingDeg.toFixed(0)}°</span>
          </div>
        </div>
      </div>

      <div ref={mapContainer} className="w-full h-96 rounded-lg border border-aerospace-secondary/20 bg-aerospace-dark/50" />
    </Card>
  );
};

export default GPSMap;
