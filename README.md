# DHARA – Urban Air Quality & CO₂ Digital Twin

**DHARA** is a data-driven simulation tool for urban CO₂ emissions and air quality. It pulls **real-time pollutant data** for any location, shows it as a heatmap on a 3D city map, and lets you **drag interventions onto the map** (EV adoption, public transit, urban greening, carbon capture, etc.) to see how they would change pollution, AQI and CO₂e. A Gemini-powered **AI report** summarises health and policy implications of each scenario.

> Design Experience (DE) project – *Data-Driven Simulation of Urban CO₂ Emissions using Real-Time Intervention Modeling*

---
 
## Features

- **Live air-quality data** (PM2.5, PM10, CO, NO₂) with automatic **failover**: Open-Meteo → OpenWeatherMap → offline fallback
- **Location search** for any area (OpenStreetMap Nominatim)
- **3D map + pollution heatmap** (MapLibre GL, OpenFreeMap tiles)
- **8 interventions**: 7 positive (timber construction, green cement, retrofit policy, public transit, EV adoption, urban greening, industrial CCS) and 1 stressor (parali burning)
- **Multiple deployments**: drop the same intervention several times, drag markers, delete them
- **Metrics**: current vs projected level, overall AQI (US EPA breakpoints), net CO₂e change
- **AI environmental report** via Google Gemini
- **Audit log** of every fetch, failure, failover and fallback

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | HTML, CSS, vanilla JavaScript (ES modules), MapLibre GL JS |
| Backend  | Node.js 18+, Express |
| Data     | Open-Meteo Air Quality API, OpenWeatherMap Air Pollution API, Nominatim |
| AI       | Google Gemini (`gemini-2.5-flash-lite` by default) |

## Folder structure

```
dhara/
├── backend/                      # API server – holds all API keys
│   ├── .env.example              # template for environment variables
│   ├── .env                      # your real keys (git-ignored)
│   ├── package.json
│   └── src/
│       ├── server.js             # starts the server
│       ├── app.js                # Express app: middleware, routes, static frontend
│       ├── config/env.js         # reads and validates .env
│       ├── routes/               # HTTP endpoints
│       │   ├── airQuality.js     #   GET  /api/air-quality
│       │   ├── geocode.js        #   GET  /api/geocode
│       │   ├── report.js         #   POST /api/report
│       │   └── health.js         #   GET  /api/health
│       ├── services/             # business logic
│       │   ├── airQualityService.js   # failover + validation + caching
│       │   ├── geocodeService.js
│       │   ├── geminiService.js
│       │   └── providers/
│       │       ├── openMeteo.js       # primary source
│       │       └── openWeather.js     # fallback source
│       ├── middleware/           # error handling, rate limiting
│       └── utils/                # fetch with timeout, cache, validators
│
├── frontend/                     # static web app – no secrets
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── main.js               # entry point, event wiring
│       ├── config.js             # strategies, map settings, constants
│       ├── state.js              # shared app state
│       ├── api.js                # calls to the backend
│       ├── aqi.js                # AQI calculation
│       ├── simulation.js         # intervention model (pure functions)
│       ├── controller.js         # runs simulation → updates UI & map
│       ├── map.js                # map, 3D buildings, heatmap
│       ├── interventions.js      # panel, drag & drop, markers
│       ├── data.js               # live data fetch, refresh, location search
│       ├── report.js             # AI report modal
│       ├── audit.js              # audit log
│       └── ui.js                 # DOM rendering helpers
│
├── docs/ARCHITECTURE.md          # data flow and simulation model
├── .gitignore
├── .editorconfig
├── package.json                  # convenience scripts for the whole project
└── README.md
```

## Getting started

**Requirements:** Node.js 18 or newer.

```bash
# 1. Install backend dependencies
npm run setup

# 2. Add your API keys
#    (backend/.env already exists – or copy it from the example)
cp backend/.env.example backend/.env      # Windows: copy backend\.env.example backend\.env
#    then edit backend/.env and fill OPENWEATHER_API_KEY and GEMINI_API_KEY

# 3. Run
npm start
```

Open **http://localhost:4000** – the backend serves the frontend too.

`npm run setup` also installs the **MapLibre** map library, which the backend serves at `/vendor/maplibre-gl`. The map therefore doesn't depend on the unpkg CDN, which some networks block; unpkg is used only as a fallback.

Use `npm run dev` to auto-restart the server when you edit backend files.

### Running the frontend separately (optional)

If you host the frontend elsewhere (e.g. VS Code Live Server on port 5500):

1. In `backend/.env` set `SERVE_FRONTEND=false` and `CORS_ORIGIN=http://localhost:5500`
2. In `frontend/index.html`, before the `main.js` script tag, add:
   ```html
   <script>window.DHARA_API_BASE = 'http://localhost:4000';</script>
   ```

## Environment variables (`backend/.env`)

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `PORT` | no | `4000` | Server port |
| `CORS_ORIGIN` | no | `*` | Allowed frontend origin(s), comma-separated |
| `SERVE_FRONTEND` | no | `true` | Serve `/frontend` from the backend |
| `OPENWEATHER_API_KEY` | for fallback | – | OpenWeatherMap key (fallback data source) |
| `API_TIMEOUT_MS` | no | `8000` | Timeout per external API call |
| `AQ_CACHE_TTL_MS` | no | `300000` | Cache time for a location's reading (5 min) |
| `GEMINI_API_KEY` | for AI report | – | Google AI Studio key |
| `GEMINI_MODEL` | no | `gemini-2.5-flash-lite` | Gemini model name |
| `REPORT_RATE_LIMIT_PER_MIN` | no | `10` | AI report requests per IP per minute |
| `NOMINATIM_USER_AGENT` | no | `DHARA-DigitalTwin/1.0 …` | Identifies the app to Nominatim |

The app still works without keys: Open-Meteo needs none, and the AI report button just shows a "not configured" message.

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server status and which keys are configured |
| `GET` | `/api/air-quality?lat=18.625&lon=73.855` | Current PM2.5, PM10, CO, NO₂ with source and failover attempts |
| `GET` | `/api/geocode?q=Shivajinagar, Pune` | Place name → `{ lat, lon, label }` |
| `POST` | `/api/report` | Scenario → AI report text |

Example `/api/air-quality` response:

```json
{
  "source": "open_meteo",
  "sourceName": "Open-Meteo",
  "role": "primary",
  "location": { "lat": 18.625, "lon": 73.855 },
  "data": { "pm2_5": 41.2, "pm10": 63.8, "co": 512, "no2": 22.4, "observedAt": "2026-10-27T08:00" },
  "fetchedAt": "2026-10-27T08:12:31.004Z",
  "attempts": [{ "source": "open_meteo", "role": "primary", "status": "SUCCESS" }],
  "cached": false
}
```

## Security notes

- **API keys live only in `backend/.env`**, which is git-ignored. The browser never sees them.
- The earlier single-file version had a Gemini key written in the HTML. Anyone who opened that page could read it, so **that key should be deleted in Google AI Studio and replaced with a new one**.
- AI report requests are rate-limited per IP to protect the Gemini quota.
- AI output is shown as plain text (not HTML) to avoid script injection.

## Data sources & attribution

- Air quality: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0), [OpenWeatherMap](https://openweathermap.org/api/air-pollution)
- Geocoding: [Nominatim](https://nominatim.org/) – © OpenStreetMap contributors
- Map tiles: [OpenFreeMap](https://openfreemap.org/) – © OpenStreetMap contributors
- AI: [Google Gemini API](https://ai.google.dev/)

## Known limitations

- The CO₂e value is a **relative index** (baseline 1000), not a measured CO₂ concentration.
- Intervention effect sizes (`max_co2`, `max_pol` in `frontend/js/config.js`) are simplified assumptions.
- Hotspot locations around the selected point are synthetic, used to visualise spatial spread.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the data flow and simulation work.
