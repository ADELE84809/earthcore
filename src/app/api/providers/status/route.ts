import { getStatusSnapshot } from "@/lib/data";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return json(getStatusSnapshot(), {
    headers: { "Cache-Control": "no-store" },
  });
}
