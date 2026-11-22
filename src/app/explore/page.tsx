import { getExploreSnapshot } from "@/lib/data";
import { MissionControl } from "@/components/globe/mission-control";
export const revalidate = 300;
export default async function ExplorePage() {
 const data = await getExploreSnapshot();
 return <main className="pt-16"><MissionControl imageryLayers={data.imagery} imageryDate={new Date().toISOString().slice(0,10)} events={data.events} earthquakes={data.earthquakes} eventsError={data.eventsError} earthquakesError={data.earthquakesError} retrievedAt={new Date(data.retrievedAt).toISOString()}/></main>;
}
