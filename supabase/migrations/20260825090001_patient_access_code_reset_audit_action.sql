-- Support for resetting a published report's patient access code (the
-- plaintext is never stored — see generateAccessCode() in
-- lib/data/security.ts — so a lost code cannot be "looked up", only
-- reissued). Same pattern as every prior audit-action addition: its own
-- migration, separate from any statement that uses it in the same
-- transaction.
alter type audit_action add value if not exists 'PATIENT_ACCESS_CODE_RESET';
