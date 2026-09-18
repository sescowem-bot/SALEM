# Salem Phase 1 & Phase 2 Deployment Notes

This build restructures the laboratory report workflow and adds a standalone uploaded-result workflow.

## What changed

- Upload Existing Result is now independent of an existing report/test.
- Staff can select an existing patient or register a new patient during upload.
- Staff can enter the investigation/result type, lab number, specimen, dates, request and report comment.
- A finished PDF is stored privately as a versioned source document.
- Uploaded reports enter the same draft -> approval -> published -> archived lifecycle.
- Patient result delivery uses the same result reference + access code flow.
- Uploaded PDFs are attached to the patient email instead of generating an empty report PDF.
- Published uploaded results can be retrieved through the protected `/results/download` route.
- Published reports can be archived with a required reason.
- Published reports can be reopened for correction through the existing audited workflow.
- A corrected uploaded report must have a new source PDF for its new version before approval.
- Report navigation now separates Report Management, New Report, Upload Existing Result and Approval Queue.
- The old report/test-dependent Upload Result page has been removed from the workflow.

## SQL required

Run the migration below in Supabase before deploying the application:

`supabase/migrations/20260918210001_standalone_uploaded_results.sql`

It creates `public.report_uploaded_documents` and adds `lab_reports.source_investigation_name`.

The migration is safe to run once. Do not manually recreate these objects if the migration has already been applied.

## Storage

The uploaded result uses the existing private `lab-report-pdfs` bucket. No new storage bucket is required.

## Environment variables

Keep the existing project environment variables. No new environment variable is introduced by this phase.

## Recommended deployment order

1. Apply the Supabase migration.
2. Confirm the migration completes without errors.
3. Deploy the complete application source in this archive.
4. Run `npm ci` on the deployment platform.
5. Run `npm run build`.
6. Deploy only after the build succeeds.

## Important operational rule

An uploaded report is not emailed immediately when the file is selected. It remains private until an authorized reviewer approves it and an authorized publisher publishes it. At publication, the system generates the result reference/access code and sends the patient email with the uploaded PDF attached.

This preserves the report approval controls while allowing externally completed laboratory reports to enter Salem without first creating a catalogue investigation.
