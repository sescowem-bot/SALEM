"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveWebsiteDraftAction, type ActionState } from "../actions";
import type { FooterContent } from "@/lib/data/websiteContentTypes";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";

function SaveBar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60">
      {pending ? "Saving…" : "Save draft"}
    </button>
  );
}

const initial: ActionState = {};

export function FooterEditorForm({ content }: { content: FooterContent }) {
  const [state, formAction] = useActionState(saveWebsiteDraftAction, initial);
  const [form, setForm] = useState<FooterContent>(content);

  function set<K extends keyof FooterContent>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="pageKey" value="footer" />
      <input type="hidden" name="content" value={JSON.stringify(form)} />

      <div className="surface-card space-y-4 p-6">
        <label className="block text-sm font-medium text-navy-deep">
          Footer description
          <textarea rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Shown under the logo in the footer." className={fieldClass + " resize-y"} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Copyright text
          <input value={form.copyrightText ?? ""} onChange={(e) => set("copyrightText", e.target.value)} placeholder="Salem Medical Laboratories. All rights reserved." className={fieldClass} />
          <span className="mt-1 block text-xs text-muted-foreground">The current year is added automatically — don&apos;t include it here.</span>
        </label>
      </div>

      {state.error ? <p className="surface-card p-4 text-sm text-destructive">{state.error}</p> : null}
      <div className="flex items-center gap-3">
        <SaveBar />
        <span className="text-xs text-muted-foreground">Saving updates the draft only — use Publish above to go live.</span>
      </div>
    </form>
  );
}
