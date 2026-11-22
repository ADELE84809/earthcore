"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Mounts children only once they approach the viewport (keeps heavy modules off the critical path). */
export function LazyMount({
  children,
  rootMargin = "400px",
  minHeight,
}: {
  children: ReactNode;
  rootMargin?: string;
  minHeight?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setMounted(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} style={minHeight ? { minHeight } : undefined}>
      {mounted ? children : null}
    </div>
  );
}
