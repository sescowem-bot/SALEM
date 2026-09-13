"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveWebsiteDraftAction, type ActionState } from "../actions";
import type { ContactContent } from "@/lib/data/websiteContentTypes";

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

export function ContactEditorForm({ content }: { content: ContactContent }) {
  const [state, formAction] = useActionState(saveWebsiteDraftAction, initial);
  const [form, setForm] = useState<ContactContent>({
    ...content,
    mapEmbedUrl: content.mapEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d669.6880306253121!2d3.199342526819188!3d6.793342778949812!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103ba3437d06a7db%3A0x52049b00e6caf0fd!2sSalem%20Medical%20Laboratories!5e1!3m2!1sen!2sng!4v1788924262664!5m2!1sen!2sng",
    mapDirectionsUrl: content.mapDirectionsUrl || "https://maps.app.goo.gl/rY44gLDa4XGPDiWE7",
  });

  function set<K extends keyof ContactContent>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="pageKey" value="contact" />
      <input type="hidden" name="content" value={JSON.stringify(form)} />

      <div className="surface-card space-y-4 p-6">
        <label className="block text-sm font-medium text-navy-deep">
          Page heading
          <input value={form.pageHeading ?? ""} onChange={(e) => set("pageHeading", e.target.value)} placeholder="We're close by, and easy to reach." className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Introduction
          <textarea rows={2} value={form.introduction ?? ""} onChange={(e) => set("introduction", e.target.value)} placeholder="Call, message or walk in. A real person answers — no phone trees." className={fieldClass + " resize-y"} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Map embed URL
          <input value={form.mapEmbedUrl ?? ""} onChange={(e) => set("mapEmbedUrl", e.target.value)} placeholder="https://www.google.com/maps/embed?..." className={fieldClass} />
          <span className="mt-1 block text-xs text-muted-foreground">Verified Salem Medical Laboratories map. No Google Maps API key is required.</span>
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          &quot;Get directions&quot; link
          <input value={form.mapDirectionsUrl ?? ""} onChange={(e) => set("mapDirectionsUrl", e.target.value)} placeholder="https://maps.google.com/?q=..." className={fieldClass} />
          <span className="mt-1 block text-xs text-muted-foreground">Opens the verified Salem location in Google Maps so visitors can get directions from their current location.</span>
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          CTA label
          <input value={form.ctaLabel ?? ""} onChange={(e) => set("ctaLabel", e.target.value)} placeholder="Message us on WhatsApp" className={fieldClass} />
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
