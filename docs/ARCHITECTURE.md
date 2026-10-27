# DHARA – Architecture

## 1. Overview

```
┌──────────────────────────── Browser (frontend/) ────────────────────────────┐
│                                                                             │
│  index.html + css ── main.js ──┬── interventions.js (panel, drag & drop)    │
│                                ├── data.js (fetch, refresh, search)         │
│                                ├── report.js (AI report modal)              │
│                                └── controller.js ── simulation.js (model)   │
│                                         │           aqi.js (AQI)            │
│                                         ├── ui.js  (metric cards, status)   │
│                                         └── map.js (MapLibre heatmap)       │
│                         api.js ──────────────── HTTP (JSON) ───────────┐    │
└────────────────────────────────────────────────────────────────────────┼────┘
                                                                         │
┌──────────────────────────── Node.js / Express (backend/) ──────────────┼────┐
│  routes/  →  services/                                                 ▼    │
│  /api/air-quality → airQualityService → openMeteo  ──(fails?)──► openWeather│
│                         (validate + 5-min cache)                            │
│  /api/geocode     → geocodeService → Nominatim                              │
│  /api/report      → geminiService  → Google Gemini   (rate-limited)         │
│  /api/health                                                                │
│  .env → config/env.js (all API keys stay on the server)                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Data flow

1. On load (and every 15 min), `data.js` calls `GET /api/air-quality` for the current location.
2. The backend tries **Open-Meteo** first. If it fails, times out, or returns out-of-range values, it tries **OpenWeatherMap**. Every attempt is returned in `attempts[]` so the frontend audit log shows the failover.
3. If both fail, the frontend keeps the last known (or default) values, shows **"System Offline (Using Fallback)"** and retries after 2 min.
4. Valid readings are cached per ~110 m grid cell for 5 minutes to save API quota.
5. Any slider change, marker drop/move/delete, or layer change calls `updateSim()`.

## 3. Simulation model (`frontend/js/simulation.js`)

For each strategy *s* with slider value *v* (0–100) and *n* markers placed on the map:

```
f = min( (v / 100) × n , 1.5 )          # combined intensity, capped
w = layer weight (0.5 default; 1.0 for strong PM reducers on PM layers;
                  1.2 for EV on CO/NO₂; 0.8 for strong reducers on AQI)

positive strategy:  PolRed += max_pol × f × w × 0.4
                    Co2Red += max_co2 × f × 0.5
negative strategy:  PolInc += max_pol × f × w × 0.4
                    Co2Inc += max_co2 × f

PolRed, Co2Red capped at 0.95

netFactorPol = (1 − PolRed) × (1 + PolInc)
netFactorCo2 = (1 − Co2Red) × (1 + Co2Inc)

projected pollutant = live value × netFactorPol
projected CO₂e      = 1000 × netFactorCo2
```

An intervention affects results **only if its slider is above 0 and at least one marker is on the map**.

### Local (spatial) effect

Each marker influences heatmap points within **500 m**, linearly decreasing with distance:

```
effect = (1 − distance / 500) × (v / 100) × 0.5
```

Reductions from all nearby positive markers are summed (max 0.9); stressors add increases.

## 4. AQI

US EPA-style breakpoints for PM2.5, PM10, CO and NO₂ (µg/m³). Each pollutant's sub-index is linearly interpolated; **overall AQI = the highest sub-index** (dominant pollutant).

## 5. Reliability & security

| Concern | How it is handled |
|---------|-------------------|
| API outage | Two-provider failover + offline fallback + auto-retry |
| Bad data | Range validation before data reaches the model |
| Slow APIs | Per-request timeouts (backend 8 s, frontend 20 s) |
| Exposed keys | Keys only in `backend/.env`, git-ignored |
| AI quota abuse | Per-IP rate limit on `/api/report` |
| Script injection | AI text and audit details rendered as plain text / escaped |
| Traceability | Audit log of fetches, failures, failover and fallback |
