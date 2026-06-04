/**
 * Data Export Utilities - CSV and PNG export functions
 */

import { TelemetryPacket } from '@/types/telemetry';

/**
 * Export telemetry data as CSV
 */
export function exportTelemetryCSV(packets: TelemetryPacket[]): string {
  // Assignment-required minimal CSV export
  const headers = ['Timestamp', 'Altitude', 'Pressure', 'Temperature'];

  const rows = packets.map((packet) => [
    new Date(packet.timestamp).toISOString(),
    packet.altitude.toFixed(2),
    packet.pressure.toFixed(2),
    packet.temperature.toFixed(2),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Download CSV file
 */
export function downloadCSV(packets: TelemetryPacket[], filename: string = 'telemetry.csv'): void {
  const csv = exportTelemetryCSV(packets);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export chart as PNG using canvas
 */
export function exportChartPNG(canvasElement: HTMLCanvasElement, filename: string = 'chart.png'): void {
  const url = canvasElement.toDataURL('image/png');
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data as JSON
 */
export function exportTelemetryJSON(packets: TelemetryPacket[]): string {
  return JSON.stringify(packets, null, 2);
}

/**
 * Download JSON file
 */
export function downloadJSON(packets: TelemetryPacket[], filename: string = 'telemetry.json'): void {
  const json = exportTelemetryJSON(packets);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format timestamp for file naming
 */
export function formatTimestampForFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Generate standard filename with timestamp
 */
export function generateExportFilename(type: 'csv' | 'json' | 'png'): string {
  const timestamp = formatTimestampForFilename();
  const extensions = {
    csv: 'csv',
    json: 'json',
    png: 'png',
  };
  return `cansat-telemetry_${timestamp}.${extensions[type]}`;
}

/**
 * Export a chart rendered as inline SVG (e.g., Recharts) to PNG.
 * Works by serializing SVG -> drawing to an offscreen canvas.
 */
export async function exportSvgToPNG(svgElement: SVGSVGElement, filename: string): Promise<void> {
  const svgString = new XMLSerializer().serializeToString(svgElement);
  // Ensure proper namespace so the SVG renders in the browser.
  const normalizedSvg = svgString.includes('xmlns=')
    ? svgString
    : svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');

  const blob = new Blob([normalizedSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const rect = svgElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.ceil(rect.width * dpr));
  const height = Math.max(1, Math.ceil(rect.height * dpr));

  const img = new Image();
  img.decoding = 'async';

  const background = '#0a0e27'; // match aerospace theme

  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to create canvas context'));
        return;
      }

      // Background fill to avoid transparent PNG.
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (pngBlob) => {
          if (!pngBlob) {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to create PNG blob'));
            return;
          }

          const pngUrl = URL.createObjectURL(pngBlob);
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = filename;
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          URL.revokeObjectURL(pngUrl);
          URL.revokeObjectURL(url);
          resolve();
        },
        'image/png',
        1
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render SVG to PNG'));
    };

    img.src = url;
  });
}

