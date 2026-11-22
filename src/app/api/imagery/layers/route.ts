import { getImageryLayers } from "@/lib/data/providers/gibs";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const layers = await getImageryLayers();
  return json(
    {
      layers,
      count: layers.length,
      note: "Availability resolved live from NASA GIBS DescribeDomains. Layers without verified availability are excluded.",
      retrievedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "public, max-age=900, stale-while-revalidate=1800" } },
  );
}
