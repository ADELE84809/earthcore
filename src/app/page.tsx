import {
  getExploreSnapshot,
  getImageryLayers,
  getGlobalTemperature,
} from "@/lib/data";
import type { GlobalTemperatureBundle } from "@/lib/data/bundles";
import { Hero } from "@/components/home/hero";
import {
  Capabilities,
  ClimateSignal,
  FinalCta,
  LayerSection,
  Provenance,
  SolutionsTeaser,
} from "@/components/home/home-sections";

export const revalidate = 300;

export default async function HomePage() {
  const [snapshot, imagery, temperatureResult] = await Promise.all([
    getExploreSnapshot(),
    getImageryLayers().catch(() => []),
    getGlobalTemperature().catch(() => null),
  ]);

  const temperature = temperatureResult as GlobalTemperatureBundle | null;

  return (
    <>
      <Hero
        imagery={imagery}
        events={snapshot.events}
        earthquakes={snapshot.earthquakes}
        temperature={temperature}
        eventsError={snapshot.eventsError}
        earthquakesError={snapshot.earthquakesError}
        imageryError={snapshot.imageryError}
      />
      <Capabilities />
      <ClimateSignal bundle={temperature} />
      <LayerSection layers={imagery} />
      <Provenance />
      <SolutionsTeaser />
      <FinalCta />
    </>
  );
}
