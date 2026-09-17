# Salem Medical Laboratories — Final Complete Upgrade

## Database / SQL

**No new SQL migration is required for this final code upgrade.**

This package does not add a new `.sql` migration and does not require the Salem team to run another SQL script for the changes in this package. The `supabase/migrations/` files already present in the repository are the project's existing/historical migrations; they are included as part of the source tree and are not a new instruction to run them again.

The new narrative-template feature is deliberately implemented using the existing `test_templates.description` and `report_tests.comment` fields, so no new database column is needed.

## Main completed areas

- Patient-facing report identity uses Age rather than Date of Birth.
- Lab Reference + numeric access code remain the patient authentication pair.
- Publish and resend workflows can include the current access code in the patient result email.
- Patient result email attaches the current official final document.
- Admin report page has a direct **Resend result email** action; it securely reissues the access code before sending so an unrecoverable old code is never reused.
- Official uploaded final reports remain separate from structured result templates and are delivered unchanged when the uploaded source is already a PDF.
- PNG/JPEG official uploads are converted into a PDF container without adding a second laboratory signature.
- Approved signatory information is resolved from the authorized signatory configuration.
- Admin HTML preview and generated PDF now resolve the same approved signatory.
- Result templates support parameters/tables plus optional narrative sections such as Comment, Findings, Interpretation, Conclusion, Recommendations and custom sections.
- Staff can complete those narrative sections during result entry; they render as labelled narrative blocks on the report.
- Existing plain report/test comments remain supported.
- Existing report workflow, versioning, approval and patient access architecture is preserved.
- Favicon, app icon, Apple icon and PWA manifest use the Salem icon set; obsolete Next starter icon references were removed.
- Patient-facing email templates exclude internal lab number/document version and do not include result values in the email body.
