"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ImagePlus, Trash2 } from "lucide-react";
import { uploadServiceImageAction, removeServiceImageAction, type ActionState } from "./actions";

const initial: ActionState = {};

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
    >
      <ImagePlus className="h-3.5 w-3.5 shrink-0" /> {pending ? "Uploading…" : "Upload image"}
    </button>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5 shrink-0" /> {pending ? "Removing…" : "Remove"}
    </button>
  );
}

export function ServiceImageUploader({ testId, currentImageUrl }: { testId: string; currentImageUrl: string | null }) {
  const [uploadState, uploadAction] = useActionState(uploadServiceImageAction, initial);
  const [removeState, removeAction] = useActionState(removeServiceImageAction, initial);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="surface-card p-6">
      <h2 className="text-sm font-semibold text-navy-deep">Media</h2>
      <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, or WebP, up to 5MB. Used as the hero image on the service&apos;s public page.</p>

      <div className="mt-4 flex flex-wrap items-start gap-5">
        <div className="flex h-32 w-48 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary">
          {preview ?? currentImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- storage-hosted preview, not a static asset next/image needs to optimize
            <img src={preview ?? currentImageUrl ?? ""} alt="Service" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">No image yet</span>
          )}
        </div>

        <div className="space-y-3">
          <form
            action={uploadAction}
            onSubmit={() => {
              const file = fileInputRef.current?.files?.[0];
              if (file) setPreview(URL.createObjectURL(file));
            }}
            className="space-y-2"
          >
            <input type="hidden" name="testId" value={testId} />
            <input
              ref={fileInputRef}
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className="block text-xs text-navy-deep file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy"
            />
            <UploadButton />
            {uploadState.error ? <p className="text-xs text-destructive">{uploadState.error}</p> : null}
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
