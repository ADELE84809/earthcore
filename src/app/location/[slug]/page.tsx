import { notFound } from "next/navigation";
import { decodeLocationSlug, formatCoordinate } from "@/lib/geo";
import { getLocationIntelligence } from "@/lib/data";
import { PageShell } from "@/components/pages/section-page";
import { MetricReadout, Panel, SourceNote, MeasurementTypeBadge } from "@/components/ui/primitives";

export const revalidate = 300;
export default async function LocationPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params; const loc=decodeLocationSlug(slug); if(!loc) notFound();
 const d=await getLocationIntelligence(loc.latitude,loc.longitude,{includeClimate:true});
 const current=d.weather?.current; const air=d.air?.current;
 return <PageShell eyebrow="LOCATION INTELLIGENCE / COORDINATE-RESOLVED" title={loc.name.replace(/\b\w/g,c=>c.toUpperCase())} intro={`${formatCoordinate(loc.latitude,loc.longitude)} · ${d.location.timezone}${d.location.elevationM!==null?` · ${d.location.elevationM} m elevation`:""}`}>
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
   <Panel><p className="eyebrow">AIR TEMPERATURE</p><p className="num mt-4 text-4xl text-text">{current?.temperatureC===null||current?.temperatureC===undefined?"—":`${current.temperatureC.toFixed(1)}°`}</p><p className="mt-2 text-xs text-muted">{current?.validAt??"Unavailable"} · °C</p>{d.weather&&<><MeasurementTypeBadge type={d.weather.meta.measurementType}/><SourceNote attribution={d.weather.meta.attribution} validAt={d.weather.meta.validAt} retrievedAt={d.weather.meta.retrievedAt} type={d.weather.meta.measurementType}/></>}</Panel>
   <Panel><p className="eyebrow">RELATIVE HUMIDITY</p><p className="num mt-4 text-4xl text-text">{current?.humidityPct===null||current?.humidityPct===undefined?"—":`${Math.round(current.humidityPct)}%`}</p><p className="mt-2 text-xs text-muted">{d.weather?.meta.validAt??"Unavailable"}</p></Panel>
   <Panel><p className="eyebrow">PM2.5 MODEL ESTIMATE</p><p className="num mt-4 text-4xl text-text">{air?.pm25===null||air?.pm25===undefined?"—":air.pm25.toFixed(1)}</p><p className="mt-2 text-xs text-muted">µg/m³ · regional model</p>{d.air&&<SourceNote attribution={d.air.meta.attribution} validAt={d.air.meta.validAt} retrievedAt={d.air.meta.retrievedAt} type={d.air.meta.measurementType}/>}</Panel>
   <Panel><p className="eyebrow">WIND</p><p className="num mt-4 text-4xl text-text">{current?.windSpeedKmh===null||current?.windSpeedKmh===undefined?"—":current.windSpeedKmh.toFixed(1)}</p><p className="mt-2 text-xs text-muted">km/h · model grid</p></Panel>
  </div>
  <div className="mt-5 grid gap-5 lg:grid-cols-2"><Panel><p className="eyebrow">DATA COVERAGE</p><h2 className="display mt-3 text-2xl text-text">What is available here</h2><p className="mt-2 text-xs text-muted">{d.coverageDefinition}</p><div className="mt-5 space-y-3">{d.coverage.map(x=><div key={x.label} className="flex items-start justify-between gap-3 border-b border-line/50 pb-3"><div><p className="text-sm text-text">{x.label}</p><p className="mt-1 text-xs text-muted">{x.detail}</p></div><span className="chip">{x.status}</span></div>)}</div></Panel><Panel><p className="eyebrow">PROVENANCE</p><h2 className="display mt-3 text-2xl text-text">Sources & validity</h2><div className="mt-5 space-y-4 text-xs text-muted">{d.weather&&<p>Weather · valid {d.weather.meta.validAt??"not supplied"} · retrieved {d.weather.meta.retrievedAt} · {d.weather.meta.spatialResolution??"resolution not stated"}</p>}{d.weatherError&&<p>Weather unavailable: {d.weatherError}</p>}{d.air&&<p>Air quality · valid {d.air.meta.validAt??"not supplied"} · retrieved {d.air.meta.retrievedAt} · {d.air.meta.spatialResolution??"resolution not stated"}</p>}{d.airError&&<p>Air quality unavailable: {d.airError}</p>}<p>Events within configured radius: {d.eventsError??d.eventsNearby.length}</p><p>Earthquake catalog records nearby: {d.earthquakesError??d.earthquakesNearby.length}</p></div></Panel></div>
 </PageShell>
}
