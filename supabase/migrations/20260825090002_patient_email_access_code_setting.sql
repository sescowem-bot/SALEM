-- Follow-up to Advanced 6 — by default, the automatic "your result is
-- ready" patient email (lib/email/templates.ts
-- buildPatientResultAvailableTemplate) never includes the access code,
-- specifically to keep it on a separate channel from the Lab Reference
-- Number (see that file's module comment for the two-factor rationale).
--
-- The lab owner has decided, after being walked through that tradeoff,
-- that they want the option to include it anyway — this is a business
-- decision about their own patients' delivery experience, not something
-- to hardcode either way. This column is that choice, defaulting to the
-- safer "false" so nothing changes for an existing deployment that
-- upgrades without touching Settings.
alter table public.site_settings
  add column patient_email_includes_access_code boolean not null default false;

comment on column public.site_settings.patient_email_includes_access_code is
  'When true, the automatic patient_result_available notification email includes the plaintext access code alongside the Lab Reference Number. Off by default — see lib/email/templates.ts for the two-factor-separation rationale this overrides when turned on. Managed by a Super Admin via /admin/settings.';
