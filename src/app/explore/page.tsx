import { getExploreSnapshot } from "@/lib/data";
import { GlobeMount } from "@/components/globe/globe-mount";
import { PageShell } from "@/components/pages/section-page";
import { Panel } from "@/components/ui/primitives";
import { formatCoordinate } from "@/lib/geo";

export const revalidate = 300;
export default async function ExplorePage() {
 const data = await getExploreSnapshot();
 const layers = data.imagery;
 return <main className="min-h-screen px-4 pb-8 pt-24 sm:px-6 lg:px-8">
  <div className="mx-auto max-w-[1800px]">
   <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">EARTHCORE / MISSION CONTROL</p><h1 className="display mt-2 text-3xl text-text sm:text-4xl">Explore the living planet.</h1></div><p className="max-w-lg text-sm text-muted">Select a location or an observed event. Each layer carries its own source and time context.</p></div>
   <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_320px]">
    <Panel className="order-2 p-4 xl:order-1"><p className="eyebrow mb-4">INTELLIGENCE LAYERS</p>{["Weather · modeled", "Air quality · modeled", "Satellite imagery", `Natural events · ${data.events.length}`, `Earthquakes · ${data.earthquakes.length}`, "Data coverage"].map(x=><div key={x} className="mb-2 rounded-lg border border-line/60 bg-white/[0.02] px-3 py-3 text-[12px] text-muted">{x}</div>)}<p className="mt-5 text-[11px] leading-5 text-muted">Satellite availability is verified against NASA GIBS metadata. Event feeds are informational, not hazard alerts.</p></Panel>
    <div className="order-1 min-w-0 xl:order-2"><div className="relative h-[55vh] min-h-[420px] overflow-hidden rounded-2xl border border-line/60 bg-void"><GlobeMount imageryLayers={layers} imageryDate={new Date().toISOString().slice(0,10)} events={data.events} earthquakes={data.earthquakes} showEvents showEarthquakes interactive autoRotate/><div className="absolute bottom-4 left-4 rounded-full border border-line bg-void/80 px-3 py-2 text-[10px] text-muted backdrop-blur">{formatCoordinate(0,0)} · click globe to inspect coordinates</div></div><div className="mt-3 flex flex-wrap gap-2">{layers.slice(0,6).map(l=><span key={l.id} className="chip">{l.title}</span>)}</div></div>
    <Panel className="order-3 p-5"><p className="eyebrow">INTELLIGENCE PANEL</p><h2 className="display mt-3 text-2xl text-text">Choose a point on Earth</h2><p className="mt-3 text-sm leading-6 text-muted">The globe shows source-backed event and earthquake records. Select a place using Search to load weather, air quality and location context.</p><a href="/api/environment/coverage?latitude=26.9124&longitude=75.7873" className="mt-6 block rounded-xl border border-line/60 p-4 text-xs text-muted hover:border-cyan/50">Coverage example · Jaipur coordinates</a><div className="mt-6 space-y-3 text-xs text-muted"><p>Open events: <strong className="text-text">{data.eventsError ? "Unavailable" : data.events.length}</strong></p><p>Earthquakes in feed: <strong className="text-text">{data.earthquakesError ? "Unavailable" : data.earthquakes.length}</strong></p><p>Retrieved: <strong className="text-text">{new Date(data.retrievedAt).toISOString()}</strong></p></div></Panel>
   </div>
  </div>
 </main>
}
