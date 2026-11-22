"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseCoordinateInput, formatCoordinate, encodeLocationSlug } from "@/lib/geo";

interface PlaceResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country?: string | null;
  admin1?: string | null;
  timezone?: string | null;
  population?: number | null;
}

interface Row {
  id: string;
  title: string;
  subtitle: string;
  kind: "place" | "section" | "coordinate" | "dataset";
  href?: string;
  place?: PlaceResult;
}

const SECTIONS: Row[] = [
  { id: "sec-explore", title: "Mission Control", subtitle: "Interactive globe and location intelligence", kind: "section", href: "/explore" },
  { id: "sec-climate", title: "Climate", subtitle: "Global anomaly index and local reanalysis", kind: "section", href: "/climate" },
  { id: "sec-atmosphere", title: "Atmosphere", subtitle: "Air quality, wind, cloud and pressure", kind: "section", href: "/atmosphere" },
  { id: "sec-events", title: "Natural events", subtitle: "EONET and USGS event explorer", kind: "section", href: "/events" },
  { id: "sec-compare", title: "Compare locations", subtitle: "Side-by-side environmental comparison", kind: "section", href: "/compare" },
  { id: "sec-solutions", title: "Solutions Lab", subtitle: "Urban shade scenario tool", kind: "section", href: "/solutions" },
  { id: "sec-sources", title: "Data sources", subtitle: "Providers, licensing and methodology", kind: "section", href: "/sources" },
  { id: "sec-status", title: "System status", subtitle: "Live provider connectivity", kind: "section", href: "/status" },
];

const DATASETS: Row[] = [
  { id: "ds-gistemp", title: "NASA GISTEMP v4", subtitle: "Global temperature anomaly, 1880–present", kind: "dataset", href: "/climate" },
  { id: "ds-gibs", title: "MODIS true colour", subtitle: "Daily satellite reflectance · NASA GIBS", kind: "dataset", href: "/explore?layer=MODIS_Terra_CorrectedReflectance_TrueColor" },
  { id: "ds-air", title: "CAMS air quality", subtitle: "PM2.5, PM10, O₃, NO₂, CO, SO₂", kind: "dataset", href: "/atmosphere" },
  { id: "ds-usgs", title: "USGS earthquake catalog", subtitle: "Near-real-time seismicity", kind: "dataset", href: "/events?tab=earthquakes" },
];

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function CommandSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebounced(query, 240);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActive(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debounced.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/locations/search?q=${encodeURIComponent(debounced)}`)
      .then((response) => (response.ok ? response.json() : { results: [] }))
      .then((data: { results?: PlaceResult[] }) => {
        if (!cancelled) setResults(data.results ?? []);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  const coordinate = useMemo(() => parseCoordinateInput(query), [query]);

  const rows = useMemo<Row[]>(() => {
    const list: Row[] = [];
    if (coordinate) {
      list.push({
        id: "coord",
        title: "Go to coordinates",
        subtitle: formatCoordinate(coordinate.latitude, coordinate.longitude),
        kind: "coordinate",
        href: `/location/${encodeLocationSlug("coordinates", coordinate.latitude, coordinate.longitude)}`,
      });
    }
    for (const place of results) {
      list.push({
        id: place.id,
        title: place.name,
        subtitle: [place.admin1, place.country].filter(Boolean).join(", ") || "—",
        kind: "place",
        place,
        href: `/location/${encodeLocationSlug(place.name, place.latitude, place.longitude)}`,
      });
    }
    const q = query.trim().toLowerCase();
    if (q.length >= 2) {
      for (const section of SECTIONS) {
        if (section.title.toLowerCase().includes(q) || section.subtitle.toLowerCase().includes(q)) {
          list.push(section);
        }
      }
      for (const dataset of DATASETS) {
        if (dataset.title.toLowerCase().includes(q) || dataset.subtitle.toLowerCase().includes(q)) {
          list.push(dataset);
        }
      }
    } else {
      list.push(...SECTIONS.slice(0, 5));
    }
    return list.slice(0, 12);
  }, [coordinate, results, query]);

  useEffect(() => {
    setActive(0);
  }, [rows.length, query]);

  const go = useCallback(
    (row: Row | undefined) => {
      if (!row) return;
      onClose();
      if (row.href) router.push(row.href);
    },
    [onClose, router],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((index) => Math.min(rows.length - 1, index + 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((index) => Math.max(0, index - 1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        go(rows[active]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, rows, active, go, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search EarthCore"
      className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh] sm:pt-[14vh]"
    >
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-void/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="glass relative w-full max-w-[620px] overflow-hidden rounded-2xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <svg viewBox="0 0 20 20" className="h-4 w-4 text-muted" fill="none" aria-hidden>
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search cities, coordinates, datasets…"
            aria-label="Search places, datasets and sections"
            autoComplete="off"
            spellCheck={false}
            className="h-14 flex-1 bg-transparent text-[15px] text-text outline-none placeholder:text-muted/60"
          />
          {loading ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-line border-t-cyan" aria-label="Searching" />
          ) : (
            <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[9px] text-muted sm:block">ESC</kbd>
          )}
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2" role="listbox" aria-label="Search results">
          {rows.length === 0 ? (
            <p className="px-3 py-8 text-center text-[12.5px] text-muted">
              No matches. Try a city name, a country, or a coordinate pair like{" "}
              <span className="font-mono text-text/80">26.91, 75.79</span>.
            </p>
          ) : (
            rows.map((row, index) => (
              <button
                key={row.id}
                type="button"
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => go(row)}
                className={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  index === active ? "bg-white/[0.06]" : "hover:bg-white/[0.035]"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] text-text">{row.title}</span>
                  <span className="block truncate text-[11px] text-muted">{row.subtitle}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[8.5px] tracking-[0.14em] uppercase ${
                    row.kind === "place"
                      ? "border-cyan/30 text-cyan/80"
                      : row.kind === "coordinate"
                        ? "border-amber/30 text-amber/80"
                        : row.kind === "dataset"
                          ? "border-violet/30 text-violet/80"
                          : "border-line text-muted"
                  }`}
                >
                  {row.kind}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-[10px] text-muted/70">
          <span className="flex items-center gap-1.5"><kbd className="rounded border border-line px-1 font-mono">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1.5"><kbd className="rounded border border-line px-1 font-mono">↵</kbd> open</span>
          <span className="ml-auto font-mono tracking-[0.12em] uppercase">Worldwide geocoding</span>
        </div>
      </div>
    </div>
  );
}

export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "/" && !event.metaKey && !event.ctrlKey) {
        const target = event.target as HTMLElement | null;
        if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-9 items-center gap-2 rounded-full border border-line bg-white/[0.02] px-3 text-[12px] text-muted transition-colors hover:border-line-strong hover:text-text"
        aria-label="Search places, datasets and sections"
      >
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden>
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[9px] text-muted/70 md:block">⌘K</kbd>
      </button>
      <CommandSearch open={open} onClose={() => setOpen(false)} />
    </>
  );
}
