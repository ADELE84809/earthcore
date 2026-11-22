# EarthCore

**One Planet. Infinite Intelligence.**

EarthCore is a planetary environmental intelligence interface for exploring source-linked environmental data, satellite imagery, natural-event records and location context. It is built to expose the difference between observations, models, forecasts and historical reconstructions—not to disguise uncertainty with polished graphics.

> EarthCore combines observations, scientific models and official environmental datasets. Resolution and accuracy vary by provider and location. EarthCore is not an emergency service and is not endorsed by its data providers.

## Current release scope

The application includes a cinematic homepage, a MapLibre globe, a Mission Control route, location dashboards, historical global climate analysis, atmosphere/events/source/status views, and server-side provider adapters. Data can be unavailable when providers cannot be reached; unavailable values are not replaced by zeros or fabricated readings.

See [TASKS.md](TASKS.md) for what is implemented, incomplete, and the next release priorities. A page or visual shell is not evidence that an underlying capability is complete.

## Architecture

```mermaid
flowchart TD
  Providers[Documented public data providers] --> Adapters[Provider adapters]
  Adapters --> Validate[Validation and normalization]
  Validate --> Metadata[Units, measurement class, validity, attribution]
  Metadata --> Cache[Server-side bounded cache + process health ledger]
  Cache --> API[Next.js Route Handlers]
  API --> UI[App Router pages and components]
  UI --> Globe[MapLibre GL globe + GIBS tiles]
  UI --> Charts[Recharts visualizations]
  Registry[Provider registry] --> Sources[/sources and /status]
  Registry --> API
```

### Stack

- Next.js App Router, React, TypeScript, Tailwind CSS v4
- MapLibre GL JS globe projection; NASA GIBS WMTS raster layers
- Recharts, Zod, provider-specific validation/normalization
- Public keyless integrations where supported; no database requirement for public exploration

### Data integrations

| Provider | EarthCore use | Classification / limits |
|---|---|---|
| Open-Meteo Forecast | Current-model conditions, hourly and daily forecast | Modeled/forecast grid data; not station observations |
| Open-Meteo Air Quality | Pollutant estimates and supported AQI | Regional model estimates; not a regulatory monitor |
| Open-Meteo Geocoding | Worldwide place search | Ambiguous matches are presented as alternatives |
| Open-Meteo Archive | Historical weather/climate context | Reanalysis/model-backed; date range and baseline are disclosed |
| NASA EONET v3 | Curated natural-event records | Source records, not hazard warnings |
| USGS Earthquake feeds | Earthquake catalog features | Geological events, not climate indicators |
| NASA GIBS | Documented imagery layer metadata and map tiles | Satellite-derived raster; per-layer available dates and attribution |
| NASA GISTEMP v4 | Global land-ocean temperature anomaly history | Historical reconstruction, 1951–1980 baseline; not city-scale |
| Global Forest Watch / Copernicus CDS / marine | Registry entries only | Planned; no connected data is claimed |

Provider status is an instance-local runtime observation, not a continuous uptime promise. Serverless process memory is ephemeral. No scheduled task or persistent database is configured in this release.

## Local development

Requirements: Node.js 22+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

The checked-in project scripts copy MapLibre's module worker into `public/` before dev/build because its module-worker URL needs to be served explicitly by Next.js. The worker is a third-party runtime asset from the installed MapLibre package.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Current verification evidence and remaining test gaps are tracked in `TASKS.md`. The local environment's outbound HTTPS is restricted, so API requests were not validated from this workspace; verify provider connectivity after deployment.

## Internal API

All routes are server-side and validate query parameters. Core routes:

- `GET /api/health`
- `GET /api/locations/search?q=Jaipur`
- `GET /api/environment/weather?latitude=26.9124&longitude=75.7873`
- `GET /api/environment/air-quality?latitude=26.9124&longitude=75.7873`
- `GET /api/environment/events`
- `GET /api/environment/earthquakes`
- `GET /api/environment/climate?latitude=26.9124&longitude=75.7873`
- `GET /api/environment/coverage?latitude=26.9124&longitude=75.7873`
- `GET /api/providers/status`
- `GET /api/imagery/layers`, `GET /api/imagery/dates?layer=...`

See [src/app/api](src/app/api) for schemas, validation and route behavior. Every external dataset has a provider adapter and registry metadata in `src/lib/data/`.

## Scientific and operational limitations

- Weather and air-quality products are model output. Grid cells are not precise point observations.
- NASA EONET aggregates event notices; USGS reports catalog events. Neither is used as an emergency alert service.
- GIBS layer-date availability is metadata, not proof of cloud-free or useful pixels at a given coordinate.
- GISTEMP is a global anomaly series; it is not downscaled into invented city anomalies.
- Coverage summarizes returned categories and is not an accuracy/confidence percentage.
- Missing or failed provider responses remain unavailable, with errors where safe to expose.
- Provider terms, attribution and commercial-use limits must be checked before commercial operation.

## Deployment

The app is compatible with Vercel's Next.js runtime. Configure no secrets for the current public integrations. Deploy only through an authorized project/account, then verify the assigned URL, browser network requests, API timestamps, imagery availability, mobile layout and logs. Do not assume `earthcore.vercel.app` is available until Vercel confirms it.

## Original engineering

EarthCore-specific work includes the normalized domain models, provider registry and status metadata, location coverage logic, provider adapters, event and earthquake geographic preparation, source-aware interface patterns and globe integration. Next.js, MapLibre, Recharts and external datasets remain third-party infrastructure/data.
