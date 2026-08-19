-- Phase 4 hardening — recordAmendment() (the only path that mutates a
-- published/archived report) wrote a report_versions snapshot but never an
-- audit_logs entry, because audit_action had no value for it. Add one so
-- amendments to already-published reports show up in the audit trail like
-- every other sensitive action, not just in the version history.
alter type audit_action add value 'RESULT_AMENDED';
