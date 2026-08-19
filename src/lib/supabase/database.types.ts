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
  | "RESULT_AMENDED";

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      test_categories: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["test_categories"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["test_categories"]["Row"]>;
        Relationships: [];
      };
      test_templates: {
        Row: {
          id: string;
          name: string;
          structure_type: TestStructureType;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["test_templates"]["Row"]> & {
          name: string;
          structure_type: TestStructureType;
        };
        Update: Partial<Database["public"]["Tables"]["test_templates"]["Row"]>;
        Relationships: [];
      };
      template_fields: {
        Row: {
          id: string;
          template_id: string;
          field_key: string;
          label: string;
          input_type: FieldInputType;
          unit: string | null;
          options: string[] | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["template_fields"]["Row"]> & {
          template_id: string;
          field_key: string;
          label: string;
          input_type: FieldInputType;
        };
        Update: Partial<Database["public"]["Tables"]["template_fields"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "template_fields_template_id_fkey",
            columns: ["template_id"],
            referencedRelation: "test_templates",
            referencedColumns: ["id"],
          }
        ];
      };
      template_table_columns: {
        Row: {
          id: string;
          template_id: string;
          column_key: string;
          column_label: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["template_table_columns"]["Row"]> & {
          template_id: string;
          column_key: string;
          column_label: string;
        };
        Update: Partial<Database["public"]["Tables"]["template_table_columns"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "template_table_columns_template_id_fkey",
            columns: ["template_id"],
            referencedRelation: "test_templates",
            referencedColumns: ["id"],
          }
        ];
      };
      template_table_rows: {
        Row: {
          id: string;
          template_id: string;
          row_key: string;
          row_label: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["template_table_rows"]["Row"]> & {
          template_id: string;
          row_key: string;
          row_label: string;
        };
        Update: Partial<Database["public"]["Tables"]["template_table_rows"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "template_table_rows_template_id_fkey",
            columns: ["template_id"],
            referencedRelation: "test_templates",
            referencedColumns: ["id"],
          }
        ];
      };
      tests: {
        Row: {
          id: string;
          category_id: string;
          template_id: string;
          name: string;
          code: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tests"]["Row"]> & {
          category_id: string;
          template_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["tests"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "tests_category_id_fkey",
            columns: ["category_id"],
            referencedRelation: "test_categories",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "tests_template_id_fkey",
            columns: ["template_id"],
            referencedRelation: "test_templates",
            referencedColumns: ["id"],
          }
        ];
      };
      signatories: {
        Row: {
          id: string;
          full_name: string;
          qualification: string | null;
          designation: string | null;
          signature_image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["signatories"]["Row"]> & {
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["signatories"]["Row"]>;
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          full_name: string;
          sex: Sex | null;
          date_of_birth: string | null;
          phone: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["patients"]["Row"]> & {
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["patients"]["Row"]>;
        Relationships: [];
      };
      lab_reports: {
        Row: {
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
        };
        Insert: Partial<Database["public"]["Tables"]["lab_reports"]["Row"]> & {
          patient_id: string;
          lab_number: string;
          patient_name_snapshot: string;
        };
        Update: Partial<Database["public"]["Tables"]["lab_reports"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "lab_reports_patient_id_fkey",
            columns: ["patient_id"],
            referencedRelation: "patients",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "lab_reports_signatory_id_fkey",
            columns: ["signatory_id"],
            referencedRelation: "signatories",
            referencedColumns: ["id"],
          }
        ];
      };
      report_tests: {
        Row: {
          id: string;
          lab_report_id: string;
          test_id: string;
          status: ReportTestStatus;
          comment: string | null;
          sort_order: number;
          created_at: string;
          pdf_storage_path: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["report_tests"]["Row"]> & {
          lab_report_id: string;
          test_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["report_tests"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "report_tests_lab_report_id_fkey",
            columns: ["lab_report_id"],
            referencedRelation: "lab_reports",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "report_tests_test_id_fkey",
            columns: ["test_id"],
            referencedRelation: "tests",
            referencedColumns: ["id"],
          }
        ];
      };
      result_field_values: {
        Row: {
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
        Insert: Partial<Database["public"]["Tables"]["result_field_values"]["Row"]> & {
          report_test_id: string;
          template_field_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["result_field_values"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "result_field_values_report_test_id_fkey",
            columns: ["report_test_id"],
            referencedRelation: "report_tests",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "result_field_values_template_field_id_fkey",
            columns: ["template_field_id"],
            referencedRelation: "template_fields",
            referencedColumns: ["id"],
          }
        ];
      };
      result_table_cells: {
        Row: {
          id: string;
          report_test_id: string;
          template_table_row_id: string;
          template_table_column_id: string;
          value: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["result_table_cells"]["Row"]> & {
          report_test_id: string;
          template_table_row_id: string;
          template_table_column_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["result_table_cells"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "result_table_cells_report_test_id_fkey",
            columns: ["report_test_id"],
            referencedRelation: "report_tests",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "result_table_cells_template_table_row_id_fkey",
            columns: ["template_table_row_id"],
            referencedRelation: "template_table_rows",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "result_table_cells_template_table_column_id_fkey",
            columns: ["template_table_column_id"],
            referencedRelation: "template_table_columns",
            referencedColumns: ["id"],
          }
        ];
      };
      reference_ranges: {
        Row: {
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
        Insert: Partial<Database["public"]["Tables"]["reference_ranges"]["Row"]> & {
          test_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["reference_ranges"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "reference_ranges_test_id_fkey",
            columns: ["test_id"],
            referencedRelation: "tests",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "reference_ranges_template_field_id_fkey",
            columns: ["template_field_id"],
            referencedRelation: "template_fields",
            referencedColumns: ["id"],
          }
        ];
      };
      report_versions: {
        Row: {
          id: string;
          lab_report_id: string;
          version_number: number;
          change_type: ReportVersionChangeType;
          snapshot: Record<string, unknown>;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["report_versions"]["Row"]> & {
          lab_report_id: string;
          version_number: number;
          change_type: ReportVersionChangeType;
          snapshot: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["report_versions"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "report_versions_lab_report_id_fkey",
            columns: ["lab_report_id"],
            referencedRelation: "lab_reports",
            referencedColumns: ["id"],
          }
        ];
      };
      appointment_requests: {
        Row: {
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
        };
        Insert: Partial<Database["public"]["Tables"]["appointment_requests"]["Row"]> & {
          full_name: string;
          phone: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointment_requests"]["Row"]>;
        Relationships: [];
      };
      home_collection_requests: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string | null;
          address: string | null;
          preferred_date: string | null;
          preferred_time: string | null;
          notes: string | null;
          status: IntakeStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["home_collection_requests"]["Row"]> & {
          full_name: string;
          phone: string;
        };
        Update: Partial<Database["public"]["Tables"]["home_collection_requests"]["Row"]>;
        Relationships: [];
      };
      contact_submissions: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          email: string | null;
          message: string;
          status: IntakeStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["contact_submissions"]["Row"]> & {
          full_name: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["contact_submissions"]["Row"]>;
        Relationships: [];
      };
      staff_profiles: {
        Row: {
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
        Insert: Partial<Database["public"]["Tables"]["staff_profiles"]["Row"]> & {
          id: string;
          full_name: string;
          role: StaffRoleDb;
        };
        Update: Partial<Database["public"]["Tables"]["staff_profiles"]["Row"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          action: AuditAction;
          entity_type: string;
          entity_id: string | null;
          actor_id: string | null;
          actor_role: StaffRoleDb | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]> & {
          action: AuditAction;
          entity_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
        Relationships: [];
      };
      result_access_attempts: {
        Row: {
          id: string;
          result_reference: string | null;
          ip_hash: string;
          succeeded: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["result_access_attempts"]["Row"]> & {
          ip_hash: string;
          succeeded: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["result_access_attempts"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      test_structure_type: TestStructureType;
      field_input_type: FieldInputType;
      report_status: ReportStatus;
      report_test_status: ReportTestStatus;
      result_flag: ResultFlag;
      report_version_change_type: ReportVersionChangeType;
      intake_status: IntakeStatus;
      sex: Sex;
      staff_role: StaffRoleDb;
      audit_action: AuditAction;
    };
    CompositeTypes: Record<string, never>;
  };
}
