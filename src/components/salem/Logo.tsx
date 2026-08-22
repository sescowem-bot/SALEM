export function SalemMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Salem Medical Laboratories mark"
    >
      <defs>
        <linearGradient id="salem-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.799 0.127 205.9)" />
          <stop offset="55%" stopColor="oklch(0.635 0.168 266.7)" />
          <stop offset="100%" stopColor="oklch(0.416 0.143 324.6)" />
        </linearGradient>
      </defs>
      <path
        d="M24 2.5 42 12.8v22.4L24 45.5 6 35.2V12.8Z"
        fill="oklch(0.277 0.122 265.7)"
        stroke="url(#salem-mark)"
        strokeWidth="1.6"
      />
      <path
        d="M24 12c4.6 5.4 7 9 7 12.2A7 7 0 0 1 17 24.2C17 21 19.4 17.4 24 12Z"
        fill="url(#salem-mark)"
      />
      <path
        d="M15 33.5h5.2l2.1-4.4 2.6 6.2 2.2-3.6H33"
        fill="none"
        stroke="oklch(0.94 0.035 205.9)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SalemLogo({ inverted = false, logoUrl }: { inverted?: boolean; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- storage-hosted brand asset, arbitrary aspect ratio
      <img src={logoUrl} alt="Salem Medical Laboratories" className="h-10 w-auto max-w-[220px] object-contain" />
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <SalemMark className="h-10 w-10 shrink-0" />
      <div className="min-w-0 leading-tight">
        <div
          className={`truncate text-[1.05rem] font-semibold tracking-tight ${
            inverted ? "text-primary-foreground" : "text-navy-deep"
          }`}
        >
          Salem <span className="text-gradient-accent">Medical</span>
        </div>
        <div
          className={`truncate text-[0.62rem] font-medium uppercase tracking-[0.22em] ${
            inverted ? "text-cyan-soft/70" : "text-muted-foreground"
          }`}
        >
          Laboratories
        </div>
      </div>
    </div>
  );
}
