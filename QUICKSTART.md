# CanSat GCS - Quick Start Guide

## 🚀 Start in 5 Minutes

### Step 1: Install Dependencies

```bash
cd cansat-gcs
npm install
```

### Step 2: Start Development Server

```bash
npm run dev
```

Browser opens automatically at `http://localhost:3000`

### Step 3: Begin Testing

1. **Click "Start Telemetry"** button in the control bar
2. **Watch live data** flow in all components:
   - Telemetry cards update every 500ms
   - Charts animate in real-time
   - GPS map shows live position
   - Error codes update dynamically

## 📋 File Locations Reference

| Feature           | Location                    | Main File                              |
| ----------------- | --------------------------- | -------------------------------------- |
| Telemetry Parsing | `src/services/`             | `telemetryParser.ts`                   |
| Data Simulator    | `src/services/`             | `telemetrySimulator.ts`                |
| State Management  | `src/store/`                | `telemetryStore.ts`, `missionStore.ts` |
| Telemetry Display | `src/components/telemetry/` | `TelemetryDisplay.tsx`                 |
| Charts            | `src/components/charts/`    | `Charts.tsx`                           |
| GPS Map           | `src/components/map/`       | `GPSMap.tsx`                           |
| Mission Control   | `src/components/mission/`   | `MissionControlPanel.tsx`              |
| Dashboard         | `src/pages/`                | `Dashboard.tsx`                        |

## 🔌 Integration Points

### For Web Serial API (Real Microcontroller Data)

Edit `src/pages/Dashboard.tsx`:

```typescript
import { serialService } from "@/services/webSerialService";

// Replace simulator with serial connection:
const handleStartTelemetry = async () => {
  await serialService.connect({ baudRate: 9600 });
  serialService.onData((data) => {
    const parsed = parseTelemetry(data);
    if (parsed.success) {
      telemetryStore.addPacket(parsed.data);
    }
  });
};
```

### For WebSocket (Server Connection)

```typescript
const ws = new WebSocket("ws://your-server:8080");
ws.onmessage = (event) => {
  const parsed = parseTelemetry(event.data);
  if (parsed.success) {
    telemetryStore.addPacket(parsed.data);
  }
};
```

## 📊 Key Functions

### Parse Telemetry

```typescript
import { parseTelemetry } from "@/services/telemetryParser";

const packet = "123,12:45:10,512.5,101325,28.4,4.1,17.3850,78.4867,510,9.2";
const result = parseTelemetry(packet);
if (result.success) {
  console.log(result.data); // TelemetryPacket object
}
```

### Access Store Data

```typescript
import { useTelemetryStore } from '@/store/telemetryStore';

const MyComponent = () => {
  const { packets, lastPacket, stats } = useTelemetryStore();

  return (
    <div>
      <p>Total packets: {packets.length}</p>
      <p>Max altitude: {stats.maxAltitude}m</p>
    </div>
  );
};
```

### Export Data

```typescript
import { downloadCSV, generateExportFilename } from "@/services/dataExport";

const handleExport = () => {
  const packets = telemetryStore.getAllPackets();
  downloadCSV(packets, generateExportFilename("csv"));
};
```

## 🎮 Mission Control Commands

All commands require confirmation:

1. **Separation** → Deploys payload
2. **Parachute** → Deploys recovery parachute
3. **Emergency** → Emergency backup system

Commands are logged in mission store with timestamps and status.

## 📈 Chart Types Available

- ✅ Altitude (meters)
- ✅ Temperature (°C)
- ✅ Pressure (Pa)
- ✅ Voltage (V)
- ✅ Descent Rate (m/s)

All charts:

- Auto-update every 500ms
- Keep last 500 samples
- Support zoom (recharts feature)
- Export to PNG

## 🗺️ GPS Features

- **Live Marker**: Shows current position
- **Trajectory Path**: Dashed line showing mission path
- **Auto-Center**: Map centers on latest position
- **Popup Info**: Click marker for coordinates
- **OpenStreetMap**: Public map tiles

## 📹 Video Features

- **Multi-Camera**: Select from available devices
- **Stream Control**: Start/Stop buttons
- **Frame Capture**: Download screenshots
- **Fullscreen**: Immersive viewing
- **Resolution**: Auto-detects camera capabilities

## 🎨 Customization

### Change Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  'aerospace': {
    'accent': '#00d9ff',        // Cyan
    'success': '#00ff88',       // Green
    'warning': '#ffaa00',       // Orange
    'danger': '#ff3333',        // Red
  },
}
```

### Change Refresh Rate

Edit `src/utils/constants.ts`:

```typescript
export const TELEMETRY_REFRESH_INTERVAL = 100; // milliseconds
export const CHART_SAMPLE_LIMIT = 500;
```

### Change Map Location

Edit telemetry simulator in `src/pages/Dashboard.tsx`:

```typescript
const simulator = new TelemetrySimulator({
  startLatitude: 28.5355, // Change here
  startLongitude: 77.391, // Change here
  targetAltitude: 3000,
  missionDuration: 600,
});
```

## 🐛 Debugging

### Enable Debug Mode

```typescript
// In src/services/telemetryParser.ts
if (process.env.VITE_ENABLE_DEBUG) {
  console.log("Parsed packet:", data);
}
```

### Monitor Store

```typescript
import { useTelemetryStore } from "@/store/telemetryStore";

// In React DevTools, inspect:
const store = useTelemetryStore.getState();
console.log(store); // See all state
```

### Check Console

```
F12 → Console tab
Look for:
- Parsing errors
- Component errors
- API failures
```

## 📦 Build for Production

```bash
npm run build
# Creates optimized dist/ folder

npm run preview
# Test production build locally

# Deploy dist/ folder to web server
```

## ✅ Quality Checklist

Before deployment:

- [ ] Test with real telemetry data
- [ ] Verify all charts update
- [ ] Test mission commands
- [ ] Check error codes appear
- [ ] Test data export
- [ ] Test camera (if available)
- [ ] Check responsive design on mobile
- [ ] Verify performance (DevTools)

## 🆘 Troubleshooting

| Issue                   | Solution                                                      |
| ----------------------- | ------------------------------------------------------------- |
| Charts blank            | Check if telemetry receiving - click "Start Telemetry"        |
| Map not showing         | Check internet connection, verify coordinates valid           |
| Camera not working      | Check browser permissions, try HTTPS                          |
| Telemetry parsing fails | Verify packet format matches spec (10 comma-separated fields) |
| Export not working      | Check if data exists, try different browser                   |

## 📚 Next Steps

1. **Connect Real Hardware**: Use Web Serial API to connect microcontroller
2. **Backend Integration**: Replace simulator with real API
3. **Database**: Add backend storage for mission history
4. **Notifications**: Add push notifications for alerts
5. **Analytics**: Add telemetry analytics dashboard
6. **Mobile App**: Export to React Native

## 🎓 Learning Path

1. Start with `src/pages/Dashboard.tsx` to understand layout
2. Study `src/store/telemetryStore.ts` for state management
3. Review `src/services/telemetryParser.ts` for data processing
4. Explore individual components in `src/components/`
5. Check `README.md` for detailed documentation

## 💡 Pro Tips

- Use `npm run type-check` to catch TypeScript errors
- Use browser DevTools to inspect React component tree
- Use Redux DevTools extension with Zustand
- Set breakpoints in Chrome DevTools for debugging
- Use Network tab to monitor data flow
- Use Performance tab to profile bottlenecks

## 📞 Quick Links

- 📖 [Full Documentation](./README.md)
- 🚀 [Deployment Guide](./DEPLOYMENT.md)
- 🏗️ [Architecture Summary](./PROJECT_SUMMARY.md)
- 📋 [Environment Variables](./.env.example)

---

**You're all set!** 🎉

Start with `npm run dev` and explore the live dashboard.

For detailed documentation, see [README.md](./README.md)
