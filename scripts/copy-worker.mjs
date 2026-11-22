import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

// MapLibre v6 loads its worker from a sibling module URL. Bundlers do not always
// rewrite that URL correctly, so EarthCore serves the worker explicitly.
const source = resolve("node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs");
const target = resolve("public/maplibre-gl-worker.mjs");
mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log("copied maplibre worker to public/");
