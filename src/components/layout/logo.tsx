export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role="img"
      aria-label="EarthCore mark"
    >
      <title>EarthCore</title>
      <defs>
        <linearGradient id="ec-orb" x1="4" y1="26" x2="28" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#57E7F5" />
          <stop offset="0.55" stopColor="#4B8EFF" />
          <stop offset="1" stopColor="#8D8CF7" />
        </linearGradient>
        <radialGradient id="ec-core" cx="0.35" cy="0.3" r="0.75">
          <stop stopColor="#F5F9FF" />
          <stop offset="0.45" stopColor="#57E7F5" />
          <stop offset="1" stopColor="#0D1929" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="6.2" fill="url(#ec-core)" />
      <ellipse
        cx="16"
        cy="16"
        rx="13"
        ry="5.2"
        stroke="url(#ec-orb)"
        strokeWidth="1.1"
        transform="rotate(-28 16 16)"
        opacity="0.9"
      />
      <circle cx="27.2" cy="9.6" r="1.5" fill="#3BE0AE" />
      <circle cx="16" cy="16" r="13" stroke="rgba(180,210,255,0.22)" strokeWidth="0.75" />
    </svg>
  );
}
