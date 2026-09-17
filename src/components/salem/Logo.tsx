export function SalemMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    // The supplied Salem mark is the brand source of truth.
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/salem-brand-mark.png" alt="Salem Medical Laboratories mark" className={`${className} object-contain`} />
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
