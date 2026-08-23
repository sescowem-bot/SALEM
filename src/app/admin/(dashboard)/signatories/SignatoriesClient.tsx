"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { UserPlus, X, PenLine, Trash2, Image as ImageIcon } from "lucide-react";
import { saveSignatoryAction, uploadSignatureAction, removeSignatureAction, type ActionState } from "./actions";
import type { Database } from "@/lib/supabase/database.types";

type Signatory = Database["public"]["Tables"]["signatories"]["Row"] & { signedImageUrl: string | null };
type StaffProfile = Database["public"]["Tables"]["staff_profiles"]["Row"];

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";

const initial: ActionState = {};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
    >
      {pending ? (pendingLabel ?? "Saving…") : label}
    </button>
  );
}

function SignatoryForm({
  signatory,
  staffDirectory,
  onDone,
}: {
  signatory?: Signatory;
  staffDirectory: StaffProfile[];
  onDone?: () => void;
}) {
  const [state, action] = useActionState(saveSignatoryAction, initial);

  return (
    <form action={action} className="surface-card space-y-4 p-5">
      {signatory ? <input type="hidden" name="signatoryId" value={signatory.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
          Full name
          <input name="fullName" required defaultValue={signatory?.full_name ?? ""} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Qualification
          <input name="qualification" placeholder="MBBS, FMCPath" defaultValue={signatory?.qualification ?? ""} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Designation
          <input name="designation" placeholder="Consultant Pathologist" defaultValue={signatory?.designation ?? ""} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Linked staff login
          <select name="staffProfileId" defaultValue={signatory?.staff_profile_id ?? ""} className={fieldClass}>
            <option value="">Not linked</option>
            {staffDirectory.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} — {s.role.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Status
          <select name="isActive" defaultValue={signatory?.is_active === false ? "false" : "true"} className={fieldClass}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="flex items-center gap-2">
        <SubmitButton label={signatory ? "Save changes" : "Add signatory"} />
        {onDone ? (
          <button type="button" onClick={onDone} className="text-xs font-semibold text-muted-foreground hover:text-navy">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function SignatureUploader({ signatory }: { signatory: Signatory }) {
  const [uploadState, uploadAction] = useActionState(uploadSignatureAction, initial);
  const [removeState, removeAction] = useActionState(removeSignatureAction, initial);

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-dashed border-border p-3">
      <div className="flex h-14 w-32 items-center justify-center rounded border border-border bg-secondary">
        {signatory.signedImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL, arbitrary source
          <img src={signatory.signedImageUrl} alt={`${signatory.full_name} signature`} className="h-full w-full object-contain" />
        ) : (
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <form action={uploadAction} className="flex items-center gap-2">
        <input type="hidden" name="signatoryId" value={signatory.id} />
        <input type="file" name="file" accept="image/png,image/jpeg,image/webp" required className="text-xs" />
        <SubmitButton label="Upload" pendingLabel="Uploading…" />
      </form>
      {signatory.signature_image_url ? (
        <form action={removeAction}>
          <input type="hidden" name="signatoryId" value={signatory.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        </form>
      ) : null}
      {uploadState.error ? <p className="w-full text-xs text-destructive">{uploadState.error}</p> : null}
      {removeState.error ? <p className="w-full text-xs text-destructive">{removeState.error}</p> : null}
    </div>
  );
}

export function SignatoriesClient({
  signatories,
  staffDirectory,
}: {
  signatories: Signatory[];
  staffDirectory: StaffProfile[];
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {showAdd ? (
        <SignatoryForm staffDirectory={staffDirectory} onDone={() => setShowAdd(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
        >
          <UserPlus className="h-4 w-4" /> Add signatory
        </button>
      )}

      <div className="space-y-4">
        {signatories.map((s) => (
          <div key={s.id} className="surface-card space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-navy-deep">{s.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {[s.qualification, s.designation].filter(Boolean).join(" · ") || "No title set"}
                  {!s.is_active ? " · Inactive" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-navy hover:border-cyan hover:bg-accent"
              >
                {editingId === s.id ? <X className="h-3.5 w-3.5" /> : <PenLine className="h-3.5 w-3.5" />}
                {editingId === s.id ? "Close" : "Edit"}
              </button>
            </div>

            {editingId === s.id ? (
              <SignatoryForm signatory={s} staffDirectory={staffDirectory} onDone={() => setEditingId(null)} />
            ) : null}

            <SignatureUploader signatory={s} />
          </div>
        ))}
        {signatories.length === 0 ? (
          <p className="surface-card p-6 text-sm text-muted-foreground">
            No signatories yet. Add one and link it to a staff login so their signature can be attached to reports they approve.
          </p>
        ) : null}
      </div>
    </div>
  );
}
