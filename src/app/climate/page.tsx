import { getGlobalTemperature } from "@/lib/data";
import { PageShell, QuietPanel, TypeNote, PageLinks } from "@/components/pages/section-page";
import { LineChart, ChartFrame } from "@/components/charts/charts";

export const revalidate = 21600;
export default async function ClimatePage() {
 const bundle = await getGlobalTemperature().catch(()=>null);
 return <PageShell eyebrow="CLIMATE / HISTORICAL RECONSTRUCTION" title="Climate is the long signal." intro="Explore the NASA GISTEMP global land–ocean temperature index, a historical reconstruction of temperature anomalies—not a local forecast or a reading of today's weather.">
  <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
   <QuietPanel title="Global temperature anomaly"><p>Annual global mean surface temperature anomaly relative to the 1951–1980 baseline.</p><TypeNote type="historical reconstruction" source="NASA GISTEMP v4" href="https://data.giss.nasa.gov/gistemp/"/>
    {bundle ? <div className="mt-7"><ChartFrame title="Annual anomaly" subtitle={`Baseline ${bundle.baselineLabel} · °C`}><LineChart data={bundle.points.filter(p=>p.anomalyC!==null).map(p=>({label:String(p.year), value:p.anomalyC!}))} unit="°C" series={[{key:"value",label:"Anomaly",color:"#F07878"}]}/></ChartFrame><p className="mt-3 text-[11px] text-muted">Retrieved {bundle.retrievedAt}. Incomplete recent years may be absent. Source records can revise.</p></div> : <p className="mt-5 rounded-xl border border-line p-4 text-sm">NASA GISTEMP is temporarily unavailable. No substitute values are shown.</p>}
   </QuietPanel>
   <QuietPanel title="How to read this"><p>Positive anomalies indicate warmer conditions than the stated baseline; negative anomalies indicate cooler conditions. These global values do not describe the temperature at a particular city.</p><p className="mt-4">Weather describes short-term atmospheric conditions. Climate describes statistical patterns across longer periods.</p><p className="mt-4">A single hot or cold day is not, by itself, evidence for or against a long-term climate trend.</p><PageLinks/></QuietPanel>
  </div>
 </PageShell>
}
