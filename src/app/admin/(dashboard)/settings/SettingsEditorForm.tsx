"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateSiteSettingsAction, type ActionState } from "../website/actions";
import type { Database } from "@/lib/supabase/database.types";

type SiteSettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="surface-card p-6">
      <h2 className="text-sm font-semibold text-navy-deep">{title}</h2>
      {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, name, defaultValue, placeholder, type = "text", full }: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  type?: string;
  full?: boolean;
}) {
  return (
    <label className={`block text-sm font-medium text-navy-deep ${full ? "sm:col-span-2" : ""}`}>
      {label}
      <input type={type} name={name} defaultValue={defaultValue} placeholder={placeholder} className={fieldClass} />
    </label>
  );
}

function SaveBar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save settings"}
    </button>
  );
}

const initial: ActionState = {};

export function SettingsEditorForm({ row }: { row: SiteSettingsRow }) {
  const [state, formAction] = useActionState(updateSiteSettingsAction, initial);

  return (
    <form action={formAction} className="space-y-5">
      <Section title="Brand" description="Organization identity used across the site.">
        <Field label="Organization name" name="orgName" defaultValue={row.org_name ?? ""} placeholder="Salem Medical Laboratories" />
        <Field label="Short name" name="shortName" defaultValue={row.short_name ?? ""} placeholder="Salem" />
        <Field label="Tagline" name="tagline" defaultValue={row.tagline ?? ""} full />
        <Field label="Description" name="description" defaultValue={row.description ?? ""} full />
      </Section>

      <Section title="Contact">
        <Field label="Primary email" name="emailPrimary" type="email" defaultValue={row.email_primary ?? ""} />
        <Field label="Secondary email" name="emailSecondary" type="email" defaultValue={row.email_secondary ?? ""} />
        <Field label="Primary phone" name="phonePrimary" defaultValue={row.phone_primary ?? ""} />
        <Field label="Secondary phone" name="phoneSecondary" defaultValue={row.phone_secondary ?? ""} />
        <Field label="WhatsApp number" name="whatsappNumber" defaultValue={row.whatsapp_number ?? ""} />
        <div />
        <Field label="Address line 1" name="addressLine1" defaultValue={row.address_line1 ?? ""} />
        <Field label="Address line 2" name="addressLine2" defaultValue={row.address_line2 ?? ""} />
        <Field label="City" name="city" defaultValue={row.city ?? ""} />
        <Field label="State" name="state" defaultValue={row.state ?? ""} />
        <Field label="Weekday hours" name="hoursWeekdays" defaultValue={row.hours_weekdays ?? ""} placeholder="Mon–Fri, 7am–6pm" />
        <Field label="Weekend hours" name="hoursWeekend" defaultValue={row.hours_weekend ?? ""} placeholder="Sat, 8am–2pm" />
      </Section>

      <Section title="Social">
        <Field label="Facebook" name="socialFacebook" defaultValue={row.social_facebook ?? ""} placeholder="https://facebook.com/..." />
        <Field label="Instagram" name="socialInstagram" defaultValue={row.social_instagram ?? ""} placeholder="https://instagram.com/..." />
        <Field label="LinkedIn" name="socialLinkedin" defaultValue={row.social_linkedin ?? ""} placeholder="https://linkedin.com/..." />
        <Field label="X / Twitter" name="socialTwitter" defaultValue={row.social_twitter ?? ""} placeholder="https://x.com/..." />
        <Field label="YouTube" name="socialYoutube" defaultValue={row.social_youtube ?? ""} placeholder="https://youtube.com/..." full />
      </Section>

      <Section title="General">
        <Field label="Copyright text" name="copyrightText" defaultValue={row.copyright_text ?? ""} placeholder="Salem Medical Laboratories. All rights reserved." full />
      </Section>

      <Section title="Patient delivery" description="Controls the automatic email sent when a report is published.">
        <label className="flex items-start gap-3 sm:col-span-2">
          <input
            type="checkbox"
            name="patientEmailIncludesAccessCode"
            value="true"
            defaultChecked={row.patient_email_includes_access_code}
            className="mt-0.5 h-4 w-4 rounded border-border text-navy focus:ring-cyan"
          />
          <span className="text-sm text-navy-deep">
            Include the one-time access code in the automatic &quot;result ready&quot; email
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Off by default: keeping the access code out of email keeps it on a separate delivery channel from the
              Lab Reference Number, so a compromised inbox alone can&apos;t unlock a result. Turning this on puts
              both in the same email. You can still send the code to an individual patient manually — by email or
              WhatsApp — from that report&apos;s page regardless of this setting.
            </span>
          </span>
        </label>
      </Section>

      {state.error ? <p className="surface-card p-4 text-sm text-destructive">{state.error}</p> : null}
      <div className="flex items-center gap-3">
        <SaveBar />
        <span className="text-xs text-muted-foreground">Saves immediately — this is live configuration, not draft content.</span>
      </div>
    </form>
  );
}
