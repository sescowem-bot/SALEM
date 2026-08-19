/**
 * Hand-written types matching the Phase 2B Supabase schema.
 *
 * These were written by hand against the migrations in supabase/migrations/
 * because this environment has no network access to run the Supabase CLI's
 * `supabase gen types typescript`. Once a real project is linked, regenerate
 * with:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
 *
 * and diff against this file before replacing it.
 */

export type TestStructureType = "field_based" | "table_based";
export type FieldInputType = "numeric" | "text" | "select" | "positive_negative";
export type ReportStatus = "draft" | "reviewed" | "published" | "archived";
export type ReportTestStatus = "pending" | "completed" | "cancelled";
export type ResultFlag = "normal" | "high" | "low" | "critical" | "abnormal";
export type ReportVersionChangeType = "created" | "reviewed" | "published" | "amended" | "archived";
export type IntakeStatus = "new" | "contacted" | "scheduled" | "completed" | "cancelled";
export type Sex = "Male" | "Female";
export type StaffRoleDb =
  | "super_admin"
  | "admin"
  | "laboratory_staff"
  | "pathologist"
  | "phlebotomist"
  | "frontdesk";
export type AuditAction =
  | "PATIENT_REGISTERED"
  | "VISIT_CREATED"
  | "LAB_CODE_GENERATED"
  | "RESULT_CREATED"
  | "RESULT_UPDATED"
  | "RESULT_UPLOADED"
  | "RESULT_SUBMITTED_FOR_REVIEW"
  | "RESULT_RETURNED"
  | "RESULT_APPROVED"
  | "RESULT_PUBLISHED"
  | "RESULT_VERIFIED_ACCESS"
  | "BOOKING_CREATED"
  | "BOOKING_STATUS_UPDATED"
  | "HOME_COLLECTION_CREATED"
  | "HOME_COLLECTION_STATUS_UPDATED"
  | "HOME_COLLECTION_ASSIGNED";
export type HomeCollectionStatus = "pending" | "confirmed" | "assigned" | "in_progress" | "completed" | "cancelled";

// --- Table Types ---

export interface TestCategoriesRow {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}
export type TestCategoriesInsert = Partial<TestCategoriesRow> & {
  name: string;
};
export type TestCategoriesUpdate = Partial<TestCategoriesRow>;

export interface TestTemplatesRow {
  id: string;
  name: string;
  structure_type: TestStructureType;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export type TestTemplatesInsert = Partial<TestTemplatesRow> & {
  name: string;
  structure_type: TestStructureType;
};
export type TestTemplatesUpdate = Partial<TestTemplatesRow>;

export interface TemplateFieldsRow {
  id: string;
  template_id: string;
  field_key: string;
  label: string;
  input_type: FieldInputType;
  unit: string | null;
  options: string[] | null;
  sort_order: number;
  created_at: string;
}
export type TemplateFieldsInsert = Partial<TemplateFieldsRow> & {
  template_id: string;
  field_key: string;
  label: string;
  input_type: FieldInputType;
};
export type TemplateFieldsUpdate = Partial<TemplateFieldsRow>;

export interface TemplateTableColumnsRow {
  id: string;
  template_id: string;
  column_key: string;
  column_label: string;
  sort_order: number;
  created_at: string;
}
export type TemplateTableColumnsInsert = Partial<TemplateTableColumnsRow> & {
  template_id: string;
  column_key: string;
  column_label: string;
};
export type TemplateTableColumnsUpdate = Partial<TemplateTableColumnsRow>;

export interface TemplateTableRowsRow {
  id: string;
  template_id: string;
  row_key: string;
  row_label: string;
  sort_order: number;
  created_at: string;
}
export type TemplateTableRowsInsert = Partial<TemplateTableRowsRow> & {
  template_id: string;
  row_key: string;
  row_label: string;
};
export type TemplateTableRowsUpdate = Partial<TemplateTableRowsRow>;

export interface TestsRow {
  id: string;
  category_id: string;
  template_id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  public_description: string | null;
  preparation_info: string | null;
  price_ngn: number | null;
  show_price: boolean;
}
export type TestsInsert = Partial<TestsRow> & {
  category_id: string;
  template_id: string;
  name: string;
};
export type TestsUpdate = Partial<TestsRow>;

export interface SignatoriesRow {
  id: string;
  full_name: string;
  qualification: string | null;
  designation: string | null;
  signature_image_url: string | null;
  is_active: boolean;
  created_at: string;
}
export type SignatoriesInsert = Partial<SignatoriesRow> & {
  full_name: string;
};
export type SignatoriesUpdate = Partial<SignatoriesRow>;

export interface PatientsRow {
  id: string;
  full_name: string;
  sex: Sex | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}
export type PatientsInsert = Partial<PatientsRow> & {
  full_name: string;
};
export type PatientsUpdate = Partial<PatientsRow>;

export interface LabReportsRow {
  id: string;
  patient_id: string;
  lab_number: string;
  result_reference: string | null;
  access_code_hash: string | null;
  patient_name_snapshot: string;
  patient_sex_snapshot: Sex | null;
  patient_dob_snapshot: string | null;
  request: string | null;
  specimen: string | null;
  date_collected: string | null;
  date_reported: string | null;
  status: ReportStatus;
  report_comment: string | null;
  signatory_id: string | null;
  current_version_number: number;
  submitted_for_review: boolean;
  created_by: string | null;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  published_by: string | null;
  published_at: string | null;
  archived_by: string | null;
  archived_at: string | null;
  last_modified_by: string | null;
  last_modified_at: string;
}
export type LabReportsInsert = Partial<LabReportsRow> & {
  patient_id: string;
  lab_number: string;
  patient_name_snapshot: string;
};
export type LabReportsUpdate = Partial<LabReportsRow>;

export interface ReportTestsRow {
  id: string;
  lab_report_id: string;
  test_id: string;
  status: ReportTestStatus;
  comment: string | null;
  sort_order: number;
  created_at: string;
  pdf_storage_path: string | null;
}
export type ReportTestsInsert = Partial<ReportTestsRow> & {
  lab_report_id: string;
  test_id: string;
};
export type ReportTestsUpdate = Partial<ReportTestsRow>;

export interface ResultFieldValuesRow {
  id: string;
  report_test_id: string;
  template_field_id: string;
  value_text: string | null;
  value_numeric: number | null;
  unit: string | null;
  reference_range_display: string | null;
  flag: ResultFlag | null;
  created_at: string;
}
export type ResultFieldValuesInsert = Partial<ResultFieldValuesRow> & {
  report_test_id: string;
  template_field_id: string;
};
export type ResultFieldValuesUpdate = Partial<ResultFieldValuesRow>;

export interface ResultTableCellsRow {
  id: string;
  report_test_id: string;
  template_table_row_id: string;
  template_table_column_id: string;
  value: string | null;
  created_at: string;
}
export type ResultTableCellsInsert = Partial<ResultTableCellsRow> & {
  report_test_id: string;
  template_table_row_id: string;
  template_table_column_id: string;
};
export type ResultTableCellsUpdate = Partial<ResultTableCellsRow>;

export interface ReferenceRangesRow {
  id: string;
  test_id: string;
  template_field_id: string | null;
  sex: Sex | null;
  age_min_years: number | null;
  age_max_years: number | null;
  range_low: number | null;
  range_high: number | null;
  range_text: string | null;
  unit: string | null;
  created_at: string;
}
export type ReferenceRangesInsert = Partial<ReferenceRangesRow> & {
  test_id: string;
};
export type ReferenceRangesUpdate = Partial<ReferenceRangesRow>;

export interface ReportVersionsRow {
  id: string;
  lab_report_id: string;
  version_number: number;
  change_type: ReportVersionChangeType;
  snapshot: Record<string, unknown>;
  changed_by: string | null;
  changed_at: string;
}
export type ReportVersionsInsert = Partial<ReportVersionsRow> & {
  lab_report_id: string;
  version_number: number;
  change_type: ReportVersionChangeType;
  snapshot: Record<string, unknown>;
};
export type ReportVersionsUpdate = Partial<ReportVersionsRow>;

export interface AppointmentRequestsRow {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  location_type: "lab" | "home" | null;
  test_or_package: string | null;
  notes: string | null;
  status: IntakeStatus;
  created_at: string;
  booking_reference: string | null;
}
export type AppointmentRequestsInsert = Partial<AppointmentRequestsRow> & {
  full_name: string;
  phone: string;
};
export type AppointmentRequestsUpdate = Partial<AppointmentRequestsRow>;

export interface HomeCollectionRequestsRow {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  notes: string | null;
  status: HomeCollectionStatus;
  created_at: string;
  assigned_phlebotomist_id: string | null;
  booking_reference: string | null;
}
export type HomeCollectionRequestsInsert = Partial<HomeCollectionRequestsRow> & {
  full_name: string;
  phone: string;
};
export type HomeCollectionRequestsUpdate = Partial<HomeCollectionRequestsRow>;

export interface ContactSubmissionsRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  message: string;
  status: IntakeStatus;
  created_at: string;
}
export type ContactSubmissionsInsert = Partial<ContactSubmissionsRow> & {
  full_name: string;
  message: string;
};
export type ContactSubmissionsUpdate = Partial<ContactSubmissionsRow>;

export interface StaffProfilesRow {
  id: string;
  full_name: string;
  role: StaffRoleDb;
  qualification: string | null;
  designation: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export type StaffProfilesInsert = Partial<StaffProfilesRow> & {
  id: string;
  full_name: string;
  role: StaffRoleDb;
};
export type StaffProfilesUpdate = Partial<StaffProfilesRow>;

export interface AuditLogsRow {
  id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  actor_id: string | null;
  actor_role: StaffRoleDb | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
export type AuditLogsInsert = Partial<AuditLogsRow> & {
  action: AuditAction;
  entity_type: string;
};
export type AuditLogsUpdate = Partial<AuditLogsRow>;

export interface ResultAccessAttemptsRow {
  id: string;
  result_reference: string | null;
  ip_hash: string;
  succeeded: boolean;
  created_at: string;
}
export type ResultAccessAttemptsInsert = Partial<ResultAccessAttemptsRow> & {
  ip_hash: string;
  succeeded: boolean;
};
export type ResultAccessAttemptsUpdate = Partial<ResultAccessAttemptsRow>;

export interface PublicFormAttemptsRow {
  id: string;
  form_type: string;
  ip_hash: string;
  succeeded: boolean;
  created_at: string;
}
export type PublicFormAttemptsInsert = Partial<PublicFormAttemptsRow> & {
  form_type: string;
  ip_hash: string;
  succeeded: boolean;
};
export type PublicFormAttemptsUpdate = Partial<PublicFormAttemptsRow>;

export interface Database {
  public: {
    Tables: {
      test_categories: {
        Row: TestCategoriesRow;
        Insert: TestCategoriesInsert;
        Update: TestCategoriesUpdate;
      };
      test_templates: {
        Row: TestTemplatesRow;
        Insert: TestTemplatesInsert;
        Update: TestTemplatesUpdate;
      };
      template_fields: {
        Row: TemplateFieldsRow;
        Insert: TemplateFieldsInsert;
        Update: TemplateFieldsUpdate;
      };
      template_table_columns: {
        Row: TemplateTableColumnsRow;
        Insert: TemplateTableColumnsInsert;
        Update: TemplateTableColumnsUpdate;
      };
      template_table_rows: {
        Row: TemplateTableRowsRow;
        Insert: TemplateTableRowsInsert;
        Update: TemplateTableRowsUpdate;
      };
      tests: {
        Row: TestsRow;
        Insert: TestsInsert;
        Update: TestsUpdate;
      };
      signatories: {
        Row: SignatoriesRow;
        Insert: SignatoriesInsert;
        Update: SignatoriesUpdate;
      };
      patients: {
        Row: PatientsRow;
        Insert: PatientsInsert;
        Update: PatientsUpdate;
      };
      lab_reports: {
        Row: LabReportsRow;
        Insert: LabReportsInsert;
        Update: LabReportsUpdate;
      };
      report_tests: {
        Row: ReportTestsRow;
        Insert: ReportTestsInsert;
        Update: ReportTestsUpdate;
      };
      result_field_values: {
        Row: ResultFieldValuesRow;
        Insert: ResultFieldValuesInsert;
        Update: ResultFieldValuesUpdate;
      };
      result_table_cells: {
        Row: ResultTableCellsRow;
        Insert: ResultTableCellsInsert;
        Update: ResultTableCellsUpdate;
      };
      reference_ranges: {
        Row: ReferenceRangesRow;
        Insert: ReferenceRangesInsert;
        Update: ReferenceRangesUpdate;
      };
      report_versions: {
        Row: ReportVersionsRow;
        Insert: ReportVersionsInsert;
        Update: ReportVersionsUpdate;
      };
      appointment_requests: {
        Row: AppointmentRequestsRow;
        Insert: AppointmentRequestsInsert;
        Update: AppointmentRequestsUpdate;
      };
      home_collection_requests: {
        Row: HomeCollectionRequestsRow;
        Insert: HomeCollectionRequestsInsert;
        Update: HomeCollectionRequestsUpdate;
      };
      contact_submissions: {
        Row: ContactSubmissionsRow;
        Insert: ContactSubmissionsInsert;
        Update: ContactSubmissionsUpdate;
      };
      staff_profiles: {
        Row: StaffProfilesRow;
        Insert: StaffProfilesInsert;
        Update: StaffProfilesUpdate;
      };
      audit_logs: {
        Row: AuditLogsRow;
        Insert: AuditLogsInsert;
        Update: AuditLogsUpdate;
      };
      result_access_attempts: {
        Row: ResultAccessAttemptsRow;
        Insert: ResultAccessAttemptsInsert;
        Update: ResultAccessAttemptsUpdate;
      };
      public_form_attempts: {
        Row: PublicFormAttemptsRow;
        Insert: PublicFormAttemptsInsert;
        Update: PublicFormAttemptsUpdate;
      };
    };
  };
}
