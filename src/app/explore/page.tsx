import { getExploreSnapshot } from "@/lib/data";
import { MissionControl } from "@/components/globe/mission-control";

export const revalidate = 300;
export default async function ExplorePage() {
 const data = await getExploreSnapshot();
 const layers = data.imagery;
 return <main className="min-h-screen px-4 pb-8 pt-24 sm:px-6 lg:px-8">
  <div className="mx-auto max-w-[1800px]">
   <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">EARTHCORE / MISSION CONTROL</p><h1 className="display mt-2 text-3xl text-text sm:text-4xl">Explore the living planet.</h1></div><p className="max-w-lg text-sm text-muted">Select a location or an observed event. Each layer carries its own source and time context.</p></div>
   <MissionControl
    imageryLayers={layers}
    imageryDate={new Date().toISOString().slice(0, 10)}
    events={data.events}
    earthquakes={data.earthquakes}
    eventsError={data.eventsError}
    earthquakesError={data.earthquakesError}
    retrievedAt={new Date(data.retrievedAt).toISOString()}
   />
  </div>
 </main>
}
