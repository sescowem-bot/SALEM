-- Advanced 5 (Professional Reporting, Letterhead, Signature & Final PDF)
-- adds four new sensitive actions. Same pattern as
-- 20260822090002_approval_workflow_audit_actions.sql: enum values must be
-- added in their own migration, separate from any statement that uses them
-- in the same transaction.
alter type audit_action add value if not exists 'FINAL_PDF_GENERATED';
alter type audit_action add value if not exists 'SIGNATORY_CREATED';
alter type audit_action add value if not exists 'SIGNATORY_UPDATED';
alter type audit_action add value if not exists 'SIGNATURE_UPLOADED';
