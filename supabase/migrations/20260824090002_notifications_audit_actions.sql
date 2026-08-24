-- Advanced 6 (Notifications & Patient Result Delivery) adds five new
-- actions. Same pattern as 20260822090002_approval_workflow_audit_actions.sql
-- and 20260823090002_report_documents_audit_actions.sql: enum values must
-- be added in their own migration, separate from any statement that uses
-- them in the same transaction.
--
-- PATIENT_RESULT_ACCESSED, requested by the ticket, is deliberately NOT
-- added here — the exact event it describes ("a patient successfully
-- verified their access code and viewed their result") is already logged
-- as RESULT_VERIFIED_ACCESS by lib/data/verification.ts
-- verifyPatientResult(), added in the Phase 2B access-code work. Adding a
-- second action for the same event would be the "second audit system"
-- this stage's instructions explicitly say not to build.
alter type audit_action add value if not exists 'NOTIFICATION_CREATED';
alter type audit_action add value if not exists 'NOTIFICATION_SENT';
alter type audit_action add value if not exists 'NOTIFICATION_FAILED';
alter type audit_action add value if not exists 'PATIENT_RESULT_MADE_AVAILABLE';
alter type audit_action add value if not exists 'PATIENT_PDF_DOWNLOADED';
