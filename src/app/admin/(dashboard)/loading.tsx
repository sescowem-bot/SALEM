import { Loader2 } from "lucide-react";

/** Advanced 8 §7 fix — same gap as src/app/loading.tsx, for the admin area. */
export default function AdminLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-secondary">
      <Loader2 className="h-6 w-6 animate-spin text-navy" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
