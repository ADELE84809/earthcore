import { NextResponse } from "next/server";
import { isValidCoordinate } from "@/lib/geo";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function json(data: unknown, init: ResponseInit = {}): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      ...(init.headers ?? {}),
    },
  });
}

export function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function handlerError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return errorResponse(error.status, error.code, error.message);
  }
  const message = error instanceof Error ? error.message : "Unexpected server error";
  console.error("[earthcore:api]", message);
  return errorResponse(502, "UPSTREAM_UNAVAILABLE", message);
}

export function requireCoordinate(url: URL): { latitude: number; longitude: number } {
  const latRaw = url.searchParams.get("lat") ?? url.searchParams.get("latitude");
  const lonRaw = url.searchParams.get("lon") ?? url.searchParams.get("longitude");
  if (latRaw === null || lonRaw === null) {
    throw new ApiError(400, "MISSING_COORDINATE", "Both lat and lon query parameters are required.");
  }
  const latitude = Number(latRaw);
  const longitude = Number(lonRaw);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !isValidCoordinate(latitude, longitude)) {
    throw new ApiError(
      400,
      "INVALID_COORDINATE",
      "lat must be between -90 and 90 and lon between -180 and 180.",
    );
  }
  return { latitude, longitude };
}

export function intParam(url: URL, key: string, fallback: number, min: number, max: number): number {
  const raw = url.searchParams.get(key);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}
