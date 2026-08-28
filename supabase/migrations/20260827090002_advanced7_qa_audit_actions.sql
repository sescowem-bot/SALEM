-- New audited actions for the Advanced 7 QA pass — kept in its own
-- migration, separate from any statement that uses the new values, same
-- pattern as every prior audit_action extension in this codebase (see e.g.
-- 20260826090002_report_investigation_builder_audit_actions.sql).
alter type audit_action add value if not exists 'APPOINTMENT_RESCHEDULED';
alter type audit_action add value if not exists 'HOME_COLLECTION_PAYMENT_UPDATED';
