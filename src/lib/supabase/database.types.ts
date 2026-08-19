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

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: never[];
};

type TestCategory = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

type TestTemplate = {
  id: string;
  name: string;
  structure_type: TestStructureType;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type TemplateField = {
  id: string;
  template_id: string;
  field_key: string;
  label: string;
  input_type: FieldInputType;
  unit: string | null;
  options: Json;
  sort_order: number;
  created_at: string;
};

type TemplateTableColumn = {
  id: string;
  template_id: string;
  column_key: string;
  column_label: string;
  sort_order: number;
  created_at: string;
};

type TemplateTableRow = {
  id: string;
  template_id: string;
  row_key: string;
  row_label: string;
  sort_order: number;
  created_at: string;
};

type Test = {
  id: string;
  category_id: string;
  template_id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  sort_order: number;
  updated_at: string;
  created_at: string;
  public_description: string | null;
  preparation_info: string | null;
  price_ngn: number | null;
  show_price: boolean;
};

type Signatory = {
  id: string;
  full_name: string;
  qualification: string | null;
  designation: string | null;
  signature_image_url: string | null;
  is_active: boolean;
  created_at: string;
};

type Patient = {
  id: string;
  full_name: string;
  sex: Sex | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

type LabReport = {
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
  submitted_for_review: boolean;
};

type ReportTest = {
  id: string;
  lab_report_id: string;
  test_id: string;
  status: ReportTestStatus;
  comment: string | null;
  sort_order: number;
  created_at: string;
  pdf_storage_path: string | null;
};

type ResultFieldValue = {
  id: string;
  report_test_id: string;
  template_field_id: string;
  value_text: string | null;
  value_numeric: number | null;
  unit: string | null;
  reference_range_display: string | null;
  flag: ResultFlag | null;
  created_at: string;
};

type ResultTableCell = {
  id: string;
  report_test_id: string;
  template_table_row_id: string;
  template_table_column_id: string;
  value: string | null;
  created_at: string;
};

type ReferenceRange = {
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
};

type ReportVersion = {
  id: string;
  lab_report_id: string;
  version_number: number;
  change_type: ReportVersionChangeType;
  snapshot: Json;
  changed_by: string | null;
  changed_at: string;
};

type AppointmentRequest = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  location_type: string | null;
  test_or_package: string | null;
  notes: string | null;
  status: IntakeStatus;
  created_at: string;
  booking_reference: string | null;
};

type HomeCollectionRequest = Omit<AppointmentRequest, "location_type" | "test_or_package"> & {
  address: string | null;
  status: HomeCollectionStatus;
  assigned_phlebotomist_id: string | null;
};

type ContactSubmission = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  message: string;
  status: IntakeStatus;
  created_at: string;
};

type StaffProfile = {
  id: string;
  full_name: string;
  role: StaffRoleDb;
  qualification: string | null;
  designation: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AuditLog = {
  id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  actor_id: string | null;
  actor_role: StaffRoleDb | null;
  metadata: Json;
  created_at: string;
};

type ResultAccessAttempt = {
  id: string;
  result_reference: string | null;
  ip_hash: string;
  succeeded: boolean;
  created_at: string;
};

type PublicFormAttempt = {
  id: string;
  form_type: string;
  ip_hash: string;
  succeeded: boolean;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      test_categories: Table<TestCategory>;
      test_templates: Table<TestTemplate>;
      template_fields: Table<TemplateField>;
      template_table_columns: Table<TemplateTableColumn>;
      template_table_rows: Table<TemplateTableRow>;
      tests: Table<Test>;
      signatories: Table<Signatory>;
      patients: Table<Patient>;
      lab_reports: Table<LabReport>;
      report_tests: Table<ReportTest>;
      result_field_values: Table<ResultFieldValue>;
      result_table_cells: Table<ResultTableCell>;
      reference_ranges: Table<ReferenceRange>;
      report_versions: Table<ReportVersion>;
      appointment_requests: Table<AppointmentRequest>;
      home_collection_requests: Table<HomeCollectionRequest>;
      contact_submissions: Table<ContactSubmission>;
      staff_profiles: Table<StaffProfile>;
      audit_logs: Table<AuditLog>;
      result_access_attempts: Table<ResultAccessAttempt>;
      public_form_attempts: Table<PublicFormAttempt>;
    };
  };
}
