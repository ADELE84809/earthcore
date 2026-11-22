import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-5 pt-16">
      <div className="starfield absolute inset-0 opacity-40" aria-hidden />
      <div className="relative max-w-md text-center">
        <p className="eyebrow mb-4">404 · Off the grid</p>
        <h1 className="display text-[clamp(2.4rem,6vw,4rem)] text-text">This coordinate is empty.</h1>
        <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
          The page you requested does not exist. EarthCore still has a whole planet to show you.
        </p>
        <Link href="/explore" className="btn btn-primary mt-7 h-11 px-6 text-[13px]">
          Return to Earth
        </Link>
      </div>
    </div>
  );
}
