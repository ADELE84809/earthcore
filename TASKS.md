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
- [ ] Network requests from this development sandbox are blocked; live provider access, values and imagery tiles were not verified here. Verify from deployed runtime.
- [ ] Mission Control's location selection is not yet wired to a complete location detail panel; search-to-coordinate route and interaction need end-to-end work.
- [ ] City comparisons are route scaffolding; synchronized comparison is not implemented.
- [ ] Ecosystem / forest products, bounded urban shade tool, deterministic explanations, persistence/auth, scheduled refresh and export/share-state remain planned.
- [ ] Browser automation suite, accessibility audit, provider integration tests and deployment verification remain outstanding.
- [ ] Vercel production deployment and requested domain availability are not verified.

## Next
1. Ensure deployment credentials/authorization, deploy, and test real external feeds and source timestamps.
2. Implement place-selection flow and location panel in Explore; make the command palette navigate to coordinate-specific location routes.
3. Add unit/integration/browser tests and responsive/accessibility checks.
4. Implement compare and climate/location chart expansion based on validated sources.
5. Only then build ecosystem indicators and the bounded scenario lab.
