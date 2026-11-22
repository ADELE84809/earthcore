import { NextRequest } from "next/server";
import { getImageryLayers } from "@/lib/data/providers/gibs";
import { errorResponse, json } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Available acquisition dates for one layer, newest last. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get("layer") ?? "MODIS_Terra_CorrectedReflectance_TrueColor";
  const layers = await getImageryLayers();
  const layer = layers.find((entry) => entry.id === id);
  if (!layer) {
    return errorResponse(404, "LAYER_NOT_FOUND", `No verified imagery layer named ${id}.`);
  }
  return json({
    layer: layer.id,
    title: layer.title,
    cadence: layer.cadence,
    temporalCoverage: layer.temporalCoverage,
    availableDates: layer.availableDates,
    latest: layer.availableDates.at(-1) ?? null,
    note: "Dates come from the imagery service's own availability domain.",
  });
}
