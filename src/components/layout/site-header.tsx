"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/layout/logo";
import { SearchTrigger } from "@/components/search/command-search";

const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/climate", label: "Climate" },
  { href: "/atmosphere", label: "Atmosphere" },
  { href: "/events", label: "Events" },
  { href: "/ecosystems", label: "Ecosystems" },
  { href: "/solutions", label: "Solutions" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "border-b border-line bg-void/75 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1560px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Link href="/" className="group flex items-center gap-3" aria-label="EarthCore home">
          <Logo className="h-7 w-7" />
          <span className="text-[15px] font-medium tracking-[0.22em] text-text">EARTHCORE</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-3 py-2 text-[13px] transition-colors ${
                  active ? "text-text" : "text-muted hover:text-text"
                }`}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-cyan/70 to-transparent" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <SearchTrigger />
          <Link
            href="/status"
            className="hidden items-center gap-2 rounded-full px-3 py-2 text-[12px] text-muted transition-colors hover:text-text sm:flex"
          >
            <span className="dot text-aurora" aria-hidden />
            <span className="hidden md:inline">Data status</span>
          </Link>
          <Link
            href="/explore"
            className="btn btn-ghost hidden h-9 px-4 text-[13px] md:inline-flex"
          >
            Enter EarthCore
            <span aria-hidden className="text-cyan">↗</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-text lg:hidden"
          >
            <span className="relative block h-3 w-4" aria-hidden>
              <span
                className={`absolute left-0 block h-px w-4 bg-current transition-transform ${open ? "top-1.5 rotate-45" : "top-0.5"}`}
              />
              <span
                className={`absolute left-0 top-2 block h-px w-4 bg-current transition-transform ${open ? "-rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`overflow-hidden border-line transition-[max-height,opacity] duration-300 lg:hidden ${
          open ? "max-h-[80vh] border-t opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav aria-label="Mobile" className="space-y-1 px-5 py-5">
          {NAV.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-baseline justify-between border-b border-line py-3 text-[22px] font-medium tracking-tight text-text"
            >
              <span>{item.label}</span>
              <span className="eyebrow">0{index + 1}</span>
            </Link>
          ))}
          <div className="flex items-center gap-3 pt-4">
            <Link href="/explore" className="btn btn-primary h-11 flex-1">
              Enter EarthCore
            </Link>
            <Link href="/status" className="btn btn-ghost h-11 px-4 text-[13px]">
              Status
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
