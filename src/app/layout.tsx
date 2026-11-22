import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://earthcore-indol.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EarthCore — One Planet. Infinite Intelligence.",
    template: "%s · EarthCore",
  },
  description:
    "Explore real climate, weather, air-quality, natural-event and Earth-observation data through one living planetary interface. Every reading traced to its source.",
  applicationName: "EarthCore",
  keywords: [
    "EarthCore",
    "planetary intelligence",
    "climate data",
    "earth observation",
    "air quality",
    "natural events",
    "NASA GIBS",
    "Open-Meteo",
    "environmental data",
  ],
  authors: [{ name: "EarthCore" }],
  creator: "EarthCore",
  openGraph: {
    type: "website",
    siteName: "EarthCore",
    title: "EarthCore — The Earth, reimagined through data",
    description:
      "A planetary intelligence platform connecting real Earth observation, climate, atmospheric and natural-event data.",
    url: SITE_URL,
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: "EarthCore planetary intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EarthCore — The Earth, reimagined through data",
    description:
      "A planetary intelligence platform connecting real Earth observation, climate, atmospheric and natural-event data.",
    images: ["/og.svg"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#03060D",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-full bg-text px-4 py-2 text-sm font-medium text-void"
        >
          Skip to content
        </a>
        <SiteHeader />
        <div id="main">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
