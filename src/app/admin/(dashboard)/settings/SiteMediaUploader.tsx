"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ImagePlus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { uploadSiteMediaAction, removeSiteMediaAction, type ActionState } from "../website/actions";
import type { SiteMediaSlot } from "@/lib/data/storage";

const initial: ActionState = {};

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60">
      <ImagePlus className="h-3.5 w-3.5 shrink-0" /> {pending ? "Uploading…" : "Upload"}
    </button>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50">
      <Trash2 className="h-3.5 w-3.5 shrink-0" /> {pending ? "Removing…" : "Remove"}
    </button>
  );
}

function MediaSlot({ slot, label, hint, currentUrl, square }: { slot: SiteMediaSlot; label: string; hint: string; currentUrl: string | null; square?: boolean }) {
  const [uploadState, uploadAction] = useActionState(uploadSiteMediaAction, initial);
  const [removeState, removeAction] = useActionState(removeSiteMediaAction, initial);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (uploadState.ok) {
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [uploadState.ok]);

  return (
    <div className="flex flex-wrap items-start gap-4 border-t border-border pt-4 first:border-0 first:pt-0">
      <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary ${square ? "h-20 w-20" : "h-16 w-32"}`}>
        {preview || currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary CMS-hosted image formats are supported.
          <img src={preview || currentUrl || ""} alt={label} className="h-full w-full object-contain p-2" />
        ) : (
          <span className="px-2 text-center text-[0.65rem] text-muted-foreground">None set</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy-deep">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <form action={uploadAction} onSubmit={() => { const file = fileInputRef.current?.files?.[0]; if (file) setPreview(URL.createObjectURL(file)); }} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="slot" value={slot} />
            <input ref={fileInputRef} type="file" name="file" accept="image/jpeg,image/png,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon" required className="block max-w-[220px] text-xs text-navy-deep file:mr-2 file:rounded-full file:border-0 file:bg-accent file:px-2.5 file:py-1 file:text-[0.65rem] file:font-semibold file:text-navy" />
            <UploadButton />
          </form>
          {currentUrl ? <form action={removeAction}><input type="hidden" name="slot" value={slot} /><RemoveButton /></form> : null}
        </div>
        {uploadState.ok ? <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Uploaded successfully. The new {label.toLowerCase()} is now saved.</p> : null}
        {uploadState.error ? <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive"><AlertCircle className="h-3.5 w-3.5" /> {uploadState.error}</p> : null}
        {removeState.ok ? <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Removed successfully.</p> : null}
        {removeState.error ? <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive"><AlertCircle className="h-3.5 w-3.5" /> {removeState.error}</p> : null}
      </div>
    </div>
  );
}

export function SiteMediaUploader({ logoUrl, logoLightUrl, faviconUrl, ogImageUrl, letterheadUrl }: { logoUrl: string | null; logoLightUrl: string | null; faviconUrl: string | null; ogImageUrl: string | null; letterheadUrl: string | null }) {
  return (
    <div className="surface-card p-6">
      <h2 className="text-sm font-semibold text-navy-deep">Brand media</h2>
      <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP, SVG, or ICO, up to 5MB. Files are stored in Cloudinary when configured.</p>
      <div className="mt-4 space-y-4">
        <MediaSlot slot="logo" label="Logo" hint="Shown in the header. Falls back to the default mark when not set." currentUrl={logoUrl} />
        <MediaSlot slot="logoLight" label="Light logo" hint="Optional — used on dark backgrounds like the footer if provided." currentUrl={logoLightUrl} />
        <MediaSlot slot="favicon" label="Favicon" hint="Shown in the browser tab. PNG/SVG/ICO are supported; upload your square Salem mark for the best result." currentUrl={faviconUrl} square />
        <MediaSlot slot="ogImage" label="Default social sharing image" hint="Used when pages are shared on social media, unless a page sets its own." currentUrl={ogImageUrl} />
        <MediaSlot slot="letterhead" label="Report letterhead" hint="Print-quality header used on generated report PDFs and previews. Falls back to Logo above when not set." currentUrl={letterheadUrl} />
      </div>
    </div>
  );
}
