# EarthCore release checklist

## Implemented in this branch
- [x] Next.js App Router foundation, EarthCore visual tokens, responsive navigation/footer and accessible shared UI primitives.
- [x] MapLibre GL globe with world geometry, globe projection, NASA GIBS tile support, event and earthquake layers, coordinate interactions, reduced-motion behavior and WebGL fallback.
- [x] Server-side provider adapters and registry for Open-Meteo forecast/air/geocoding/archive, NASA EONET, USGS, NASA GIBS metadata, and NASA GISTEMP.
- [x] Typed API routes for health, search, weather, air quality, events, earthquakes, climate, coverage, provider status, imagery layers/dates.
- [x] Homepage with real-feed-backed panels and honest unavailable states; Mission Control page; location, climate, atmosphere, events, ecosystems, compare, solutions, sources, status, about routes.
- [x] Registry-driven source and methodology disclosure; server process-local cache/health observations; coverage explicitly describes availability, not accuracy.
- [x] Verified local TypeScript check and optimized production build; rendered the homepage in headless Chromium and corrected MapLibre worker URL and container sizing.

## Incomplete / not to be represented as finished
- [ ] The development sandbox blocks outbound requests, but deployed API smoke tests returned real provider values. Rendered NASA GIBS raster tile pixels still need visual browser verification.
- [ ] Mission Control coordinate/event/earthquake selection and location routes are wired; automated browser tests of the full selection flow remain outstanding.
- [ ] City comparisons are route scaffolding; synchronized comparison is not implemented.
- [ ] Ecosystem / forest products, bounded urban shade tool, deterministic explanations, persistence/auth, scheduled refresh and export/share-state remain planned.
- [ ] Browser automation suite, accessibility audit, provider integration tests and deployment verification remain outstanding.
- [x] Final Vercel production deployment `dpl_G4H7efAYWTTbGWxdpWKJx34weUXg` is READY/PROMOTED; public alias `https://earthcore-indol.vercel.app` verified with homepage, Mission Control, location dashboard and API responses.
- [x] Production smoke tests confirmed actual Open-Meteo weather/air/climate, geocoding, NASA EONET, USGS feeds, NASA GIBS layer/date metadata, coverage and health routes. Raster tiles and mobile browser behavior still need a true browser/device pass.
- [x] Requested `earthcore.vercel.app` domain is unavailable: Vercel rejected assignment because it is already assigned to another project.

## Next
1. Add browser-level tests for globe selection, encoded and named location routes, layer controls, and mobile/accessibility behavior; visually verify NASA GIBS tile rendering.
2. Add provider integration tests for provenance, validity/retrieval timestamps, missing-data behavior and graceful failure states.
3. Implement synchronized city comparison and climate/location chart expansion using validated sources.
4. Implement compare and climate/location chart expansion based on validated sources.
5. Only then build ecosystem indicators and the bounded scenario lab.
