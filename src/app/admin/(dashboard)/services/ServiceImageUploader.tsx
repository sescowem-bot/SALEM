"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { uploadServiceImageAction, removeServiceImageAction, type ActionState } from "./actions";

const initial: ActionState = {};

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60">
      <UploadCloud className="h-3.5 w-3.5 shrink-0" /> {pending ? "Uploading…" : "Upload image"}
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

export function ServiceImageUploader({ testId, currentImageUrl }: { testId: string; currentImageUrl: string | null }) {
  const [uploadState, uploadAction] = useActionState(uploadServiceImageAction, initial);
  const [removeState, removeAction] = useActionState(removeServiceImageAction, initial);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="surface-card overflow-hidden p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-navy"><ImagePlus className="h-4 w-4" /></span>
        <div>
          <h2 className="text-sm font-semibold text-navy-deep">Service image</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Shown on the service directory, homepage featured cards and service detail page. Use a genuine Salem image where possible.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-start">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-secondary">
          {preview || currentImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- marketing images may come from Cloudinary or legacy Supabase Storage.
            <img src={preview || currentImageUrl || ""} alt="Service preview" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-center text-xs text-muted-foreground"><div><ImagePlus className="mx-auto mb-2 h-7 w-7" /><span>No service image yet</span></div></div>
          )}
        </div>

        <div className="space-y-4">
          <form
            action={uploadAction}
            onSubmit={() => {
              const file = fileInputRef.current?.files?.[0];
              if (file) {
                setPreview(URL.createObjectURL(file));
                setFileName(file.name);
              }
            }}
            className="rounded-2xl border border-dashed border-border bg-secondary/60 p-5"
          >
            <input type="hidden" name="testId" value={testId} />
            <label className="block cursor-pointer rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-cyan hover:bg-background">
              <input ref={fileInputRef} type="file" name="file" accept="image/jpeg,image/png,image/webp" required className="sr-only" />
              <UploadCloud className="mx-auto h-6 w-6 text-purple" />
              <span className="mt-2 block text-sm font-semibold text-navy-deep">Choose service image</span>
              <span className="mt-1 block text-xs text-muted-foreground">JPEG, PNG or WebP · maximum 5MB</span>
              {fileName ? <span className="mt-2 block truncate text-xs font-medium text-purple">{fileName}</span> : null}
            </label>
            <div className="mt-4 flex flex-wrap items-center gap-2"><UploadButton /><span className="text-[11px] text-muted-foreground">Cloudinary preferred when configured; legacy Supabase storage remains supported.</span></div>
            {uploadState.error ? <p className="mt-2 text-xs text-destructive">{uploadState.error}</p> : null}
          </form>

          {currentImageUrl ? (
            <form action={removeAction}>
              <input type="hidden" name="testId" value={testId} />
              <RemoveButton />
              {removeState.error ? <p className="mt-1 text-xs text-destructive">{removeState.error}</p> : null}
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
