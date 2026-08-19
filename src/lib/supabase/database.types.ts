export type TestStructureType = "field_based" | "table_based";
export type FieldInputType = "numeric" | "text" | "select" | "positive_negative";
export type ReportStatus = "draft" | "reviewed" | "published" | "archived";
export type ReportTestStatus = "pending" | "completed" | "cancelled";
export type ResultFlag = "normal" | "high" | "low" | "critical" | "abnormal";
export type ReportVersionChangeType = "created" | "reviewed" | "published" | "amended" | "archived";
export type IntakeStatus = "new" | "contacted" | "scheduled" | "completed" | "cancelled";
export type Sex = "Male" | "Female";
export type StaffRoleDb = "super_admin" | "admin" | "laboratory_staff" | "pathologist" | "phlebotomist" | "frontdesk";
export type AuditAction = "PATIENT_REGISTERED" | "VISIT_CREATED" | "LAB_CODE_GENERATED" | "RESULT_CREATED" | "RESULT_UPDATED" | "RESULT_UPLOADED" | "RESULT_SUBMITTED_FOR_REVIEW" | "RESULT_RETURNED" | "RESULT_APPROVED" | "RESULT_PUBLISHED" | "RESULT_VERIFIED_ACCESS" | "BOOKING_CREATED" | "BOOKING_STATUS_UPDATED" | "HOME_COLLECTION_CREATED" | "HOME_COLLECTION_STATUS_UPDATED" | "HOME_COLLECTION_ASSIGNED";
export type HomeCollectionStatus = "pending" | "confirmed" | "assigned" | "in_progress" | "completed" | "cancelled";

export interface Database {
  public: {
    Tables: {
      test_categories: { Row: any; Insert: any; Update: any; };
      test_templates: { Row: any; Insert: any; Update: any; };
      template_fields: { Row: any; Insert: any; Update: any; };
      template_table_columns: { Row: any; Insert: any; Update: any; };
      template_table_rows: { Row: any; Insert: any; Update: any; };
      tests: { Row: any; Insert: any; Update: any; };
      signatories: { Row: any; Insert: any; Update: any; };
      patients: { Row: any; Insert: any; Update: any; };
      lab_reports: { Row: any; Insert: any; Update: any; };
      report_tests: { Row: any; Insert: any; Update: any; };
      result_field_values: { Row: any; Insert: any; Update: any; };
      result_table_cells: { Row: any; Insert: any; Update: any; };
      reference_ranges: { Row: any; Insert: any; Update: any; };
      report_versions: { Row: any; Insert: any; Update: any; };
      appointment_requests: { Row: any; Insert: any; Update: any; };
      home_collection_requests: { Row: any; Insert: any; Update: any; };
      contact_submissions: { Row: any; Insert: any; Update: any; };
      staff_profiles: { Row: any; Insert: any; Update: any; };
      audit_logs: { Row: any; Insert: any; Update: any; };
      result_access_attempts: { Row: any; Insert: any; Update: any; };
      public_form_attempts: { Row: any; Insert: any; Update: any; };
    };
  };
}
