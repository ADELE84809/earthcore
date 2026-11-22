import Link from "next/link";
import { GlobeMount } from "@/components/globe/globe-mount";
import type { ImageryLayer, NaturalEvent, Earthquake } from "@/lib/types";
import type { GlobalTemperatureBundle } from "@/lib/data/bundles";

export function Hero({ imagery, events, earthquakes, temperature, eventsError, earthquakesError, imageryError }: {
  imagery: ImageryLayer[]; events: NaturalEvent[]; earthquakes: Earthquake[]; temperature: GlobalTemperatureBundle | null; eventsError: string | null; earthquakesError: string | null; imageryError: string | null;
}) {
 const latest = imagery[0]?.availableDates.at(-1) ?? undefined;
 return <section className="planet-hero relative isolate min-h-[calc(100svh-64px)] overflow-hidden bg-[#02040A]">
  <div className="planet-stars" aria-hidden="true" />
  <div className="planet-globe" aria-label="Interactive Earth">
   <GlobeMount imageryLayers={imagery} imageryDate={latest} autoRotate initialView={{longitude:72,latitude:16,zoom:1.5}} showEvents={false} showEarthquakes={false} showGraticule ariaLabel="Interactive rotating Earth with current NASA MODIS imagery" />
  </div>
  <div className="planet-copy">
   <p className="planet-kicker"><i/> PLANETARY INTELLIGENCE <span>·</span> {imageryError ? "IMAGERY STATUS UNKNOWN" : `NASA GIBS · ${latest ?? "DATE UNAVAILABLE"}`}</p>
   <h1>THE PLANET<br/>IS CHANGING.<br/><span>SEE EVERYTHING.</span></h1>
   <p className="planet-description">Explore the forces shaping our world through environmental intelligence.</p>
   <div className="planet-actions"><Link href="/explore" className="planet-primary">Explore Earth <span>↗</span></Link><Link href="/sources" className="planet-secondary">Discover the data <span>→</span></Link></div>
  </div>
  <div className="planet-caption"><span>EARTH OBSERVATION</span><b>MODIS / TERRA</b><span>{latest ?? "—"} · TRUE COLOUR</span></div>
  <div className="planet-foot"><span>OPEN DATA · NO FABRICATED READINGS</span><span>NASA GIBS <i>·</i> EONET <i>·</i> USGS <i>·</i> GISTEMP</span><Link href="/explore">SCROLL TO EXPLORE ↓</Link></div>
  <div className="sr-only" aria-live="polite">{eventsError ? "Event feed unavailable" : `${events.length} open natural events`}; {earthquakesError ? "Earthquake feed unavailable" : `${earthquakes.length} earthquake records`}; {temperature ? "Global climate record available" : "Climate record unavailable"}</div>
 </section>;
}
