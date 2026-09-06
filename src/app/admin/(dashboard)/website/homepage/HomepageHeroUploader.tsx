"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { removeHomepageHeroAction, uploadHomepageHeroAction, type ActionState } from "../actions";

const initial: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft disabled:opacity-60">
      <UploadCloud className="h-3.5 w-3.5" /> {pending ? "Uploading…" : "Upload hero image"}
    </button>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60">
      <Trash2 className="h-3.5 w-3.5" /> {pending ? "Removing…" : "Remove"}
    </button>
  );
}

export function HomepageHeroUploader({ currentUrl, hasCurrent }: { currentUrl: string | null; hasCurrent: boolean }) {
  const [uploadState, uploadAction] = useActionState(uploadHomepageHeroAction, initial);
  const [removeState, removeAction] = useActionState(removeHomepageHeroAction, initial);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="surface-card p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-navy"><ImagePlus className="h-4 w-4" /></span>
        <div>
          <h2 className="text-sm font-semibold text-navy-deep">Homepage hero image</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Use a genuine Salem laboratory photograph where possible. JPEG, PNG or WebP up to 5MB. The image is stored through the configured media provider and published only with the homepage draft.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="relative aspect-[16/8] overflow-hidden rounded-2xl border border-border bg-secondary">
          {preview || currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview may be served by Cloudinary or Supabase.
            <img src={preview || currentUrl || ""} alt="Homepage hero preview" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-center text-xs text-muted-foreground">No custom hero image set. The website will use its built-in fallback image.</div>
          )}
        </div>

        <div className="space-y-3 lg:min-w-[250px]">
          <form action={uploadAction} onSubmit={() => { const file = inputRef.current?.files?.[0]; if (file) setPreview(URL.createObjectURL(file)); }} className="space-y-3">
            <input ref={inputRef} type="file" name="file" accept="image/jpeg,image/png,image/webp" required className="block w-full text-xs text-navy-deep file:mr-2 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-2 file:text-xs file:font-semibold file:text-navy" />
            <SubmitButton />
          </form>
          {hasCurrent ? <form action={removeAction}><RemoveButton /></form> : null}
          {uploadState.error ? <p className="text-xs text-destructive">{uploadState.error}</p> : null}
          {removeState.error ? <p className="text-xs text-destructive">{removeState.error}</p> : null}
        </div>
      </div>
    </div>
  );
}
