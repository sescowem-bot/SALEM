-- New audit_action values for Department & Function Management. Kept in
-- its own migration/transaction, separate from anything that uses these
-- values, per the established pattern (see e.g. 20260822090002 and its
-- comment) — Postgres does not allow a new enum value to be used in the
-- same transaction that adds it.
alter type audit_action add value if not exists 'DEPARTMENT_CREATED';
alter type audit_action add value if not exists 'DEPARTMENT_UPDATED';
alter type audit_action add value if not exists 'DEPARTMENT_DEACTIVATED';
alter type audit_action add value if not exists 'DEPARTMENT_REACTIVATED';
alter type audit_action add value if not exists 'DEPARTMENT_FUNCTION_CREATED';
alter type audit_action add value if not exists 'DEPARTMENT_FUNCTION_UPDATED';
alter type audit_action add value if not exists 'DEPARTMENT_FUNCTION_REASSIGNED';
alter type audit_action add value if not exists 'DEPARTMENT_FUNCTION_DEACTIVATED';
alter type audit_action add value if not exists 'DEPARTMENT_FUNCTION_REACTIVATED';
