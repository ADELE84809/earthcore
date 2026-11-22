import Link from "next/link";
import { Logo } from "@/components/layout/logo";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/explore", label: "Mission Control" },
      { href: "/climate", label: "Climate" },
      { href: "/atmosphere", label: "Atmosphere" },
      { href: "/events", label: "Natural events" },
    ],
  },
  {
    title: "Intelligence",
    links: [
      { href: "/compare", label: "Compare locations" },
      { href: "/ecosystems", label: "Ecosystems" },
      { href: "/solutions", label: "Solutions Lab" },
      { href: "/location/jaipur@26.9124,75.7873", label: "City dashboards" },
    ],
  },
  {
    title: "Evidence",
    links: [
      { href: "/sources", label: "Data sources" },
      { href: "/sources#methodology", label: "Methodology" },
      { href: "/status", label: "System status" },
      { href: "/about", label: "About EarthCore" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-line bg-void">
      <div className="mx-auto max-w-[1560px] px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <Logo className="h-7 w-7" />
              <span className="text-[14px] font-medium tracking-[0.22em]">EARTHCORE</span>
            </div>
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
              One planet. Infinite intelligence. EarthCore connects real Earth observation, climate
              reanalysis, atmospheric models and natural-event records into a single interface.
            </p>
            <p className="mt-4 text-[11.5px] leading-relaxed text-muted/70">
              EarthCore combines observations, scientific models and official environmental
              datasets. Resolution and accuracy vary by provider and location.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="eyebrow mb-4">{column.title}</h2>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-muted transition-colors hover:text-text"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <p className="max-w-4xl text-[10.5px] leading-relaxed text-muted/60">
            Data: Open-Meteo (weather, air quality, geocoding, historical reanalysis) · NASA EONET
            (natural events) · USGS Earthquake Hazards Program (seismicity) · NASA GIBS (satellite
            imagery) · NASA GISTEMP (global temperature index). Provider data is used under the
            terms of the respective services. Use of these datasets does not imply endorsement by
            any agency. EarthCore is an informational platform, not an official warning or
            emergency service.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-muted/60">
              © {new Date().getFullYear()} EarthCore. Built for planetary literacy.
            </p>
            <p className="font-mono text-[10px] tracking-[0.18em] text-muted/50 uppercase">
              One planet · Infinite intelligence
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
