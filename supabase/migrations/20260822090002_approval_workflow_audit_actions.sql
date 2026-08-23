-- Advanced 4 (Operations & Approval Workflow) adds two new sensitive
-- actions that don't map onto the existing RESULT_* values:
--   - assigning/re-assigning a specific approver at submission time
--   - a hard reject (distinct from RESULT_RETURNED, which sends a report
--     back into the editable draft state; a reject records the approver's
--     refusal on the approval_requests row without necessarily implying
--     the same "please fix and resend" workflow step)
-- Same pattern as 20260819090002 / 20260821090001: enum values must be
-- added in their own migration, separate from any statement that uses them
-- in the same transaction.
alter type audit_action add value if not exists 'APPROVAL_REQUEST_ASSIGNED';
alter type audit_action add value if not exists 'RESULT_REJECTED';
