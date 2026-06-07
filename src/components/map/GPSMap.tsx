import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Card from '@/components/common/Card';
import { useTelemetryStore } from '@/store/telemetryStore';
import { DEFAULT_LATITUDE, DEFAULT_LONGITUDE, MAP_AUTO_CENTER_ZOOM } from '@/utils/constants';
import { calculateBearing, calculateDistance, formatDistance, formatSpeed } from '@/utils/formatters';

const defaultIconUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300d9ff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>';

const redIconUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ff3333"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>';

function computeTrackStats(track: { latitude: number; longitude: number; timestamp: number }[]) {
  if (!track || track.length < 2) {
    return { distanceMeters: 0, speedMps: 0, headingDeg: 0 };
  }

  let distanceMeters = 0;
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1];
    const b = track[i];
    distanceMeters += calculateDistance(a.latitude, a.longitude, b.latitude, b.longitude);
  }

  const prev = track[track.length - 2];
  const curr = track[track.length - 1];
  const dt = Math.max(0.001, (curr.timestamp - prev.timestamp) / 1000);
  const dist = calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
  const speedMps = dist / dt;
  const headingDeg = calculateBearing(prev.latitude, prev.longitude, curr.latitude, curr.longitude);

  return { distanceMeters, speedMps, headingDeg };
}

export const GPSMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const payloadMarkerRef = useRef<L.Marker | null>(null);
  const pathRef = useRef<L.Polyline | null>(null);
  const payloadPathRef = useRef<L.Polyline | null>(null);
  const { gpsTrack, payloadGpsTrack, lastPacket } = useTelemetryStore();

  const containerStats = useMemo(() => computeTrackStats(gpsTrack), [gpsTrack]);
  const payloadStats = useMemo(() => computeTrackStats(payloadGpsTrack), [payloadGpsTrack]);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([DEFAULT_LATITUDE, DEFAULT_LONGITUDE], MAP_AUTO_CENTER_ZOOM);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        opacity: 0.7,
      }).addTo(map.current);
    }

    const containerIcon = L.icon({
      iconUrl: defaultIconUrl,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    const payloadIcon = L.icon({
      iconUrl: redIconUrl,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (lastPacket && gpsTrack.length > 0) {
      const currentPos: [number, number] = [lastPacket.gpsLatitude, lastPacket.gpsLongitude];

      if (markerRef.current) {
        markerRef.current.setLatLng(currentPos);
      } else {
        markerRef.current = L.marker(currentPos, { icon: containerIcon }).addTo(map.current);
        markerRef.current.bindPopup(`
          <div class="text-xs">
            <p><strong>Container</strong></p>
            <p><strong>Latitude:</strong> ${lastPacket.gpsLatitude.toFixed(6)}</p>
            <p><strong>Longitude:</strong> ${lastPacket.gpsLongitude.toFixed(6)}</p>
            <p><strong>Altitude:</strong> ${lastPacket.gpsAltitude.toFixed(2)} m</p>
            <p><strong>Packet:</strong> #${lastPacket.packetId}</p>
          </div>
        `);
      }

      const pathCoordinates = gpsTrack.map((p) => [p.latitude, p.longitude] as [number, number]);
      if (pathRef.current) {
        pathRef.current.setLatLngs(pathCoordinates);
      } else if (pathCoordinates.length > 1) {
        pathRef.current = L.polyline(pathCoordinates, {
          color: '#00d9ff',
          weight: 2,
          opacity: 0.7,
          dashArray: '5, 5',
        }).addTo(map.current);
      }

      map.current.setView(currentPos, MAP_AUTO_CENTER_ZOOM);
    }

    if (lastPacket && payloadGpsTrack.length > 0) {
      const payloadPos: [number, number] = [lastPacket.payloadGpsLatitude, lastPacket.payloadGpsLongitude];

      if (payloadMarkerRef.current) {
        payloadMarkerRef.current.setLatLng(payloadPos);
      } else {
        payloadMarkerRef.current = L.marker(payloadPos, { icon: payloadIcon }).addTo(map.current);
        payloadMarkerRef.current.bindPopup(`
          <div class="text-xs">
            <p><strong>Payload</strong></p>
            <p><strong>Latitude:</strong> ${lastPacket.payloadGpsLatitude.toFixed(6)}</p>
            <p><strong>Longitude:</strong> ${lastPacket.payloadGpsLongitude.toFixed(6)}</p>
            <p><strong>Altitude:</strong> ${lastPacket.payloadGpsAltitude.toFixed(2)} m</p>
            <p><strong>Packet:</strong> #${lastPacket.packetId}</p>
          </div>
        `);
      }

      const payloadPathCoordinates = payloadGpsTrack.map((p) => [p.latitude, p.longitude] as [number, number]);
      if (payloadPathRef.current) {
        payloadPathRef.current.setLatLngs(payloadPathCoordinates);
      } else if (payloadPathCoordinates.length > 1) {
        payloadPathRef.current = L.polyline(payloadPathCoordinates, {
          color: '#ff3333',
          weight: 2,
          opacity: 0.7,
          dashArray: '4, 6',
        }).addTo(map.current);
      }
    }
  }, [lastPacket, gpsTrack, payloadGpsTrack]);

  return (
    <Card title="GPS Tracking" subtitle="Container and payload position with trajectory history">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="text-sm text-gray-300 space-y-1">
          <div>
            <span className="text-cyan-400 font-semibold">Container</span>{' '}
            <span className="text-gray-400">Lat:</span>{' '}
            <span className="text-aerospace-accent font-mono font-bold">
              {lastPacket ? lastPacket.gpsLatitude.toFixed(6) : '---'}
            </span>{' '}
            <span className="text-gray-400">Lon:</span>{' '}
            <span className="text-aerospace-accent font-mono font-bold">
              {lastPacket ? lastPacket.gpsLongitude.toFixed(6) : '---'}
            </span>
          </div>
          <div>
            <span className="text-red-400 font-semibold">Payload</span>{' '}
            <span className="text-gray-400">Lat:</span>{' '}
            <span className="text-aerospace-accent font-mono font-bold">
              {lastPacket ? lastPacket.payloadGpsLatitude.toFixed(6) : '---'}
            </span>{' '}
            <span className="text-gray-400">Lon:</span>{' '}
            <span className="text-aerospace-accent font-mono font-bold">
              {lastPacket ? lastPacket.payloadGpsLongitude.toFixed(6) : '---'}
            </span>
          </div>
        </div>

        <div className="text-xs text-gray-400 flex gap-4 flex-wrap">
          <div>
            <span className="text-cyan-400">Container dist:</span>{' '}
            <span className="text-aerospace-accent font-mono font-bold">
              {formatDistance(containerStats.distanceMeters)}
            </span>
          </div>
          <div>
            <span className="text-red-400">Payload dist:</span>{' '}
            <span className="text-aerospace-accent font-mono font-bold">
              {formatDistance(payloadStats.distanceMeters)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Speed:</span>{' '}
            <span className="text-aerospace-accent font-mono font-bold">
              {formatSpeed(containerStats.speedMps)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Heading:</span>{' '}
            <span className="text-aerospace-accent font-mono font-bold">
              {containerStats.headingDeg.toFixed(0)}°
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-cyan-400" /> Container track
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-red-400" /> Payload track
        </span>
      </div>

      <div ref={mapContainer} className="w-full h-96 rounded-lg border border-aerospace-secondary/20 bg-aerospace-dark/50" />
    </Card>
  );
};

export default GPSMap;
