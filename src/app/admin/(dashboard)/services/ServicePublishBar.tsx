"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Eye } from "lucide-react";
import { publishServiceAction, unpublishServiceAction, archiveServiceAction, type ActionState } from "./actions";
import { StatusBadge } from "@/components/salem/StatusBadge";
import type { Database } from "@/lib/supabase/database.types";

type ServiceStatus = Database["public"]["Tables"]["tests"]["Row"]["content_status"];

const initial: ActionState = {};

function ActionButton({ label, tone }: { label: string; tone: "primary" | "neutral" | "danger" }) {
  const { pending } = useFormStatus();
  const toneClass =
    tone === "primary"
      ? "bg-navy text-primary-foreground hover:opacity-90"
      : tone === "danger"
        ? "border border-destructive/30 text-destructive hover:bg-destructive/10"
        : "border border-border text-muted-foreground hover:bg-accent";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${toneClass}`}
    >
      {pending ? "Working…" : label}
    </button>
  );
}

export function ServicePublishBar({ testId, status }: { testId: string; status: ServiceStatus }) {
  const [publishState, publishAction] = useActionState(publishServiceAction, initial);
  const [unpublishState, unpublishAction] = useActionState(unpublishServiceAction, initial);
  const [archiveState, archiveAction] = useActionState(archiveServiceAction, initial);

  return (
    <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-navy-deep">Status:</span>
        <StatusBadge status={status} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/services/${testId}/preview`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-navy-deep hover:bg-accent"
        >
          <Eye className="h-3.5 w-3.5 shrink-0" /> Preview
        </Link>
        {status === "published" ? (
          <form action={unpublishAction}>
            <input type="hidden" name="testId" value={testId} />
            <ActionButton label="Unpublish" tone="neutral" />
            {unpublishState.error ? <p className="mt-1 text-xs text-destructive">{unpublishState.error}</p> : null}
          </form>
        ) : (
          <form action={publishAction}>
            <input type="hidden" name="testId" value={testId} />
            <ActionButton label="Publish" tone="primary" />
            {publishState.error ? <p className="mt-1 text-xs text-destructive">{publishState.error}</p> : null}
          </form>
        )}
        {status !== "archived" ? (
          <form action={archiveAction}>
            <input type="hidden" name="testId" value={testId} />
            <ActionButton label="Archive" tone="danger" />
            {archiveState.error ? <p className="mt-1 text-xs text-destructive">{archiveState.error}</p> : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}
