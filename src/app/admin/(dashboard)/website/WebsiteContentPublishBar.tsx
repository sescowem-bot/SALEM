"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Eye } from "lucide-react";
import { publishWebsiteContentAction, unpublishWebsiteContentAction, type ActionState } from "./actions";
import { StatusBadge } from "@/components/salem/StatusBadge";
import type { WebsitePageKey } from "@/lib/supabase/database.types";

const initial: ActionState = {};

function ActionButton({ label, tone }: { label: string; tone: "primary" | "neutral" }) {
  const { pending } = useFormStatus();
  const toneClass =
    tone === "primary" ? "bg-navy text-primary-foreground hover:opacity-90" : "border border-border text-muted-foreground hover:bg-accent";
  return (
    <button type="submit" disabled={pending} className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${toneClass}`}>
      {pending ? "Working…" : label}
    </button>
  );
}

export function WebsiteContentPublishBar({
  pageKey,
  status,
  updatedAt,
  publishedAt,
}: {
  pageKey: WebsitePageKey;
  status: "draft" | "published";
  updatedAt: string;
  publishedAt: string | null;
}) {
  const [publishState, publishAction] = useActionState(publishWebsiteContentAction, initial);
  const [unpublishState, unpublishAction] = useActionState(unpublishWebsiteContentAction, initial);

  return (
    <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-navy-deep">Status:</span>
          <StatusBadge status={status} />
        </div>
        <span className="text-xs text-muted-foreground">
          Last edited {new Date(updatedAt).toLocaleString()}
          {publishedAt ? ` · published ${new Date(publishedAt).toLocaleString()}` : " · never published"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/website/preview/${pageKey}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-navy-deep hover:bg-accent"
        >
          <Eye className="h-3.5 w-3.5 shrink-0" /> Preview draft
        </Link>
        {status === "published" ? (
          <form action={unpublishAction}>
            <input type="hidden" name="pageKey" value={pageKey} />
            <ActionButton label="Unpublish" tone="neutral" />
            {unpublishState.error ? <p className="mt-1 text-xs text-destructive">{unpublishState.error}</p> : null}
          </form>
        ) : null}
        <form action={publishAction}>
          <input type="hidden" name="pageKey" value={pageKey} />
          <ActionButton label="Publish draft" tone="primary" />
          {publishState.error ? <p className="mt-1 text-xs text-destructive">{publishState.error}</p> : null}
        </form>
      </div>
    </div>
  );
}
