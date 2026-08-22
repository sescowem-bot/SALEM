-- Advanced 1 (Professional Admin/CMS Foundation) adds admin screens for
-- staff management, patient editing, and the contact-messages inbox. Each
-- of those calls logAudit() on write (same pattern as every other
-- sensitive action in lib/data/*), but audit_action had no values for
-- them yet. Add them the same way 20260819090002 added RESULT_AMENDED.
alter type audit_action add value if not exists 'STAFF_CREATED';
alter type audit_action add value if not exists 'STAFF_UPDATED';
alter type audit_action add value if not exists 'STAFF_DEACTIVATED';
alter type audit_action add value if not exists 'STAFF_REACTIVATED';
alter type audit_action add value if not exists 'PATIENT_UPDATED';
alter type audit_action add value if not exists 'CONTACT_STATUS_UPDATED';
