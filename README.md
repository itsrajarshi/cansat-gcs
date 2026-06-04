# CanSat Ground Control Software (GCS)

Professional aerospace-grade Single Page Ground Control Software for CanSat missions. Real-time telemetry monitoring, GPS tracking, mission control, and data visualization.

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![License](https://img.shields.io/badge/license-ISL--Academic-blue)
![React](https://img.shields.io/badge/react-18+-blue)
![TypeScript](https://img.shields.io/badge/typescript-5+-blue)

## ✨ Features

### Real-Time Telemetry

- Live telemetry packet reception and parsing
- Container and payload telemetry display
- Packet counting and loss detection
- Mission timer and elapsed time tracking

### Mission Critical Systems

- **4-Digit Error Code System**: Real-time fault detection
  - Descent Rate monitoring (safe 8-10 m/s)
  - GPS availability tracking
  - Payload separation status
  - Emergency parachute status
- Color-coded alerts (Green/Yellow/Red)
- Flashing critical alerts

### Data Visualization

- **Real-Time Charts**: Altitude, Temperature, Pressure, Voltage, Descent Rate
- **GPS Tracking**: Live marker with trajectory path
- **Orientation Indicator**: Roll, Pitch, Yaw visualization
- Smooth animations and auto-scrolling timelines

### Mission Control

- Manual payload separation command
- Emergency parachute deployment
- Redundant activation system
- Confirmation dialogs for safety
- Command execution logging

### Video Streaming

- Live camera feed integration
- Multi-camera device support
- Frame capture capability
- Fullscreen mode

### Data Management

- CSV export of telemetry data
- PNG graph export
- Mission data logging
- LocalStorage persistence

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Modern web browser with Web Serial API support

### Installation

```bash
# Clone repository
cd cansat-gcs

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will open at `http://localhost:3000`

## 📋 Project Structure

```
cansat-gcs/
├── src/
│   ├── components/
│   │   ├── common/           # Reusable UI components
│   │   ├── layout/           # Layout components
│   │   ├── telemetry/        # Telemetry displays
│   │   ├── charts/           # Chart components
│   │   ├── map/              # GPS map
│   │   ├── orientation/      # Attitude indicator
│   │   ├── mission/          # Mission control
│   │   └── video/            # Video stream
│   ├── pages/
│   │   └── Dashboard.tsx     # Main dashboard
│   ├── hooks/                # Custom React hooks
│   ├── services/
│   │   ├── telemetryParser.ts
│   │   ├── telemetrySimulator.ts
│   │   ├── dataExport.ts
│   │   └── webSerialService.ts
│   ├── store/
│   │   ├── telemetryStore.ts # Zustand store
│   │   └── missionStore.ts   # Mission state
│   ├── types/                # TypeScript definitions
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── index.css
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🔧 Configuration

### Telemetry Packet Format

Expected telemetry packet structure:

```
123,12:45:10,512.5,101325,28.4,4.1,17.3850,78.4867,510,9.2
```

Fields:

1. Packet ID (number)
2. Mission Time (HH:MM:SS)
3. Altitude (meters)
4. Pressure (Pa)
5. Temperature (°C)
6. Voltage (V)
7. GPS Latitude (decimal degrees)
8. GPS Longitude (decimal degrees)
9. GPS Altitude (meters)
10. Descent Rate (m/s)

### Constants Configuration

Edit `src/utils/constants.ts`:

```typescript
export const SAFE_DESCENT_RATE = { MIN: 8, MAX: 10 }; // m/s
export const CHART_SAMPLE_LIMIT = 500;
export const TELEMETRY_REFRESH_INTERVAL = 100; // ms
export const DEFAULT_LATITUDE = 28.5355; // New Delhi
export const DEFAULT_LONGITUDE = 77.391;
```

## 🛰️ Telemetry Reception

### Web Serial API (Recommended)

Connect via USB serial port from microcontroller:

```typescript
import { serialService } from "@/services/webSerialService";

await serialService.connect({ baudRate: 9600 });
serialService.onData((data) => {
  const parsed = parseTelemetry(data);
  if (parsed.success) {
    telemetryStore.addPacket(parsed.data);
  }
});
```

### WebSocket (Optional)

```typescript
const ws = new WebSocket("ws://localhost:8080");
ws.onmessage = (event) => {
  const parsed = parseTelemetry(event.data);
  if (parsed.success) {
    telemetryStore.addPacket(parsed.data);
  }
};
```

### Mock Telemetry (Testing)

```typescript
import { TelemetrySimulator } from "@/services/telemetrySimulator";

const simulator = new TelemetrySimulator({
  targetAltitude: 3000,
  missionDuration: 600,
  startLatitude: 28.5355,
  startLongitude: 77.391,
});

const packet = simulator.generatePacket();
telemetryStore.addPacket(packet);
```

## 📊 Error Code System

4-digit error code breakdown:

| Digit | Condition           | 0 = Safe/OK | 1 = Fault/Warning |
| ----- | ------------------- | ----------- | ----------------- |
| 1     | Descent Rate        | 8-10 m/s    | Outside range     |
| 2     | GPS Availability    | Available   | Unavailable       |
| 3     | Payload Separation  | Successful  | Failure           |
| 4     | Emergency Parachute | Inactive    | Active            |

**Examples:**

- `0000` - All systems normal
- `1000` - Descent rate fault
- `0100` - GPS unavailable
- `0010` - Separation failure
- `0001` - Parachute deployed
- `1111` - Critical failure

## 🎮 Mission Control

### Commands

1. **Payload Separation**: Manual separation trigger
2. **Parachute Deployment**: Deploy recovery parachute
3. **Emergency Parachute**: Backup emergency system

All commands require confirmation dialog for safety.

### Command Status

- `pending` - Awaiting execution
- `sent` - Command transmitted
- `executing` - Command in progress
- `completed` - Successfully executed
- `failed` - Command failed

## 📈 Data Export

### CSV Export

```typescript
import { downloadCSV, generateExportFilename } from "@/services/dataExport";

const packets = telemetryStore.getAllPackets();
downloadCSV(packets, generateExportFilename("csv"));
```

Output includes:

- Packet ID
- Mission Time
- Timestamp
- All telemetry fields

### PNG Graph Export

```typescript
const canvasElement = document.querySelector("canvas");
exportChartPNG(canvasElement, "altitude-chart.png");
```

## 🧪 Testing

### Test Scenarios

1. **Normal Mission**
   - Start telemetry
   - Monitor all parameters
   - Verify chart updates
   - Check GPS tracking

2. **GPS Failure**
   - Simulate GPS loss (0,0 coordinates)
   - Error code should show `0100`
   - System should handle gracefully

3. **Battery Drain**
   - Observe voltage decrease
   - Monitor system health percentage
   - Check warning thresholds

4. **Parachute Deployment**
   - Send parachute command
   - Verify error code updates to `0001`
   - Check descent rate spike

5. **Data Export**
   - Generate CSV file
   - Verify all data is present
   - Export PNG charts

## 🌐 Browser Support

| Browser | Version | Status            |
| ------- | ------- | ----------------- |
| Chrome  | 90+     | ✅ Full Support   |
| Edge    | 90+     | ✅ Full Support   |
| Firefox | 88+     | ✅ Full Support   |
| Safari  | 14+     | ✅ Full Support\* |

\*Safari: Web Serial API not supported; use websocket alternative

## 🛠️ Development

### Code Quality

```bash
# TypeScript strict mode enabled
# ESLint configured
# Pre-commit hooks recommended
```

### Architecture Principles

- **Component-Based**: Reusable UI components
- **Separation of Concerns**: Logic in services/stores
- **Type Safety**: Full TypeScript coverage
- **State Management**: Zustand for global state
- **Responsive Design**: Mobile-first approach

### File Naming Conventions

- Components: `PascalCase.tsx`
- Services: `camelCase.ts`
- Types: `types/domain.ts`
- Utilities: `utils/function.ts`

## 📦 Dependencies

### Core

- `react@18` - UI framework
- `typescript@5` - Type safety
- `zustand@4` - State management

### Visualization

- `recharts@2` - Real-time charts
- `leaflet@1.9` - GPS mapping
- `three@r155` - 3D rendering (optional)

### Styling

- `tailwindcss@3` - Utility-first CSS
- `lucide-react` - Icons

### Build

- `vite@5` - Fast build tool
- `@vitejs/plugin-react` - React support

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
VITE_API_URL=https://api.cansat.example.com
```

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

```bash
docker build -t cansat-gcs .
docker run -p 3000:3000 cansat-gcs
```

### GitHub Pages

```bash
# Build
npm run build

# Deploy to gh-pages
git add dist/
git commit -m "Deploy to GitHub Pages"
git push
```

## 📝 Environment Variables

Create `.env.local`:

```env
VITE_API_URL=http://localhost:8080
VITE_WEBSOCKET_URL=ws://localhost:8080
VITE_ENABLE_MOCK_DATA=true
VITE_LOG_LEVEL=debug
```

## 📚 Documentation

### Component Documentation

Each component includes:

- Props interface
- Usage examples
- Default values
- Edge cases

### Service Documentation

Services include:

- Function signatures
- Parameter descriptions
- Return types
- Error handling

### Type Definitions

All types exported from `src/types/`:

- `telemetry.ts` - Telemetry data types
- `mission.ts` - Mission state types
- `error.ts` - Error types

## 🐛 Troubleshooting

### Camera Not Working

- Check browser permissions
- Ensure HTTPS on deployment
- Check browser support

### Telemetry Not Received

- Verify serial port connection
- Check baud rate (default 9600)
- Verify packet format
- Check console for parsing errors

### Charts Not Updating

- Ensure telemetry is being received
- Check if store is connected
- Verify chart data structure
- Check browser console for errors

### GPS Map Not Loading

- Verify internet connection
- Check OpenStreetMap availability
- Ensure coordinates are valid
- Check browser console

## 📄 License

Academic use for ISL CanSat Project

## 👥 Contributors

- Aerospace Systems Engineering Team
- Ground Control Software Development Team
- ISL Internship Program

## 📞 Support

For issues, questions, or feedback:

- Create an issue on GitHub
- Contact ISL support
- Reference the documentation

## 🔄 Updates & Maintenance

Check for updates:

```bash
npm outdated
npm update
```

Keep dependencies secure:

```bash
npm audit
npm audit fix
```

---

**CanSat GCS v1.0.0** - Production Ready  
Built with ❤️ for aerospace mission operations
