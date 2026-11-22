"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const EarthGlobe = dynamic(
  () => import("@/components/globe/earth-globe").then((mod) => mod.EarthGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="relative h-full w-full overflow-hidden">
        <div className="starfield absolute inset-0 opacity-60" aria-hidden />
        <div className="absolute inset-0 grid place-items-center">
          <div className="relative h-44 w-44 rounded-full border border-line/60">
            <div className="absolute inset-0 animate-spin rounded-full border border-cyan/30 border-t-transparent [animation-duration:3s]" />
            <span className="absolute inset-0 grid place-items-center eyebrow">Rendering Earth</span>
          </div>
        </div>
      </div>
    ),
  },
);

type GlobeProps = ComponentProps<typeof EarthGlobe>;

export function GlobeMount(props: GlobeProps) {
  return <EarthGlobe {...props} />;
}
