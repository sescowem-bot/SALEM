import { Activity, Baby, Dna, Droplet, FlaskConical, HeartPulse, Microscope, ScanLine } from "lucide-react";

type Props = {
  category?: string | null;
  compact?: boolean;
};

function getCategoryIcon(category: string) {
  const value = category.toLowerCase();
  if (value.includes("haemat") || value.includes("blood")) return Droplet;
  if (value.includes("micro")) return Microscope;
  if (value.includes("horm") || value.includes("endocr")) return Activity;
  if (value.includes("fertility") || value.includes("obstetric")) return Baby;
  if (value.includes("ultrasound") || value.includes("scan")) return ScanLine;
  if (value.includes("ecg") || value.includes("cardiac")) return HeartPulse;
  if (value.includes("serology") || value.includes("immun")) return Dna;
  return FlaskConical;
}

export function ServiceImageFallback({ category, compact = false }: Props) {
  const label = category || "Laboratory service";
  const Icon = getCategoryIcon(label);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-navy-deep via-navy to-purple/80">
      <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border border-white/10" />
      <div className="absolute -bottom-20 -left-12 h-52 w-52 rounded-full border border-cyan/20" />
      <div
        className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:18px_18px]"
        aria-hidden="true"
      />
      <div className={`relative flex h-full flex-col justify-between text-white ${compact ? "p-5" : "p-6"}`}>
        <div className="flex items-center justify-between gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
            <Icon className="h-6 w-6 text-cyan-soft" />
          </span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-soft">
            Salem Diagnostics
          </span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-soft/80">{label}</p>
          <p className="mt-2 max-w-[15rem] text-xl font-semibold leading-tight">Professional diagnostic service</p>
        </div>
      </div>
    </div>
  );
}
