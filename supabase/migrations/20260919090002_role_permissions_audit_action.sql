-- Audit trail support for edits made on /admin/roles. Own migration,
-- separate from any statement that uses it in the same transaction — same
-- pattern as every prior audit_action addition.
alter type audit_action add value if not exists 'ROLE_PERMISSIONS_UPDATED';
