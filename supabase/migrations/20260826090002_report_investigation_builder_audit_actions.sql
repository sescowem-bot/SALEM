-- Advanced 7 (Dynamic Lab Result & Report Builder) adds four new audited
-- actions: adding an investigation to a report, removing one, reordering
-- the investigations on a report, and creating a custom (ad hoc)
-- investigation. Kept in its own migration, separate from any statement
-- that uses the new values — same pattern as every prior audit_action
-- extension in this codebase (see e.g.
-- 20260819090002_audit_amended_action.sql).
alter type audit_action add value if not exists 'REPORT_TEST_ADDED';
alter type audit_action add value if not exists 'REPORT_TEST_REMOVED';
alter type audit_action add value if not exists 'REPORT_TEST_REORDERED';
alter type audit_action add value if not exists 'CUSTOM_TEST_CREATED';
