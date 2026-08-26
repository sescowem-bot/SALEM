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
export type ApprovalStatus = "pending" | "approved" | "rejected" | "returned";
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
  | "HOME_COLLECTION_ASSIGNED"
  | "RESULT_AMENDED"
  // Advanced 4 (Operations & Approval Workflow) — see
  // supabase/migrations/20260822090002_approval_workflow_audit_actions.sql
  | "APPROVAL_REQUEST_ASSIGNED"
  | "RESULT_REJECTED"
  // Advanced 1 (admin/CMS foundation) — see
  // supabase/migrations/20260821090001_admin_foundation_audit_actions.sql
  | "STAFF_CREATED"
  | "STAFF_UPDATED"
  | "STAFF_DEACTIVATED"
  | "STAFF_REACTIVATED"
  | "PATIENT_UPDATED"
  | "CONTACT_STATUS_UPDATED"
  // Advanced 2 (Services CMS) — see
  // supabase/migrations/20260821090002_services_cms.sql
  | "SERVICE_CREATED"
  | "SERVICE_UPDATED"
  | "SERVICE_PUBLISHED"
  | "SERVICE_UNPUBLISHED"
  | "SERVICE_ARCHIVED"
  // Advanced 3 (Website & Brand Content CMS) — see
  // supabase/migrations/20260821090003_website_cms.sql
  | "SITE_SETTINGS_UPDATED"
  | "WEBSITE_CONTENT_UPDATED"
  | "WEBSITE_CONTENT_PUBLISHED"
  | "WEBSITE_CONTENT_UNPUBLISHED"
  | "WEBSITE_MEDIA_UPLOADED"
  | "WEBSITE_MEDIA_REMOVED"
  // Advanced 5 (Professional Reporting, Letterhead, Signature & Final PDF)
  // — see supabase/migrations/20260823090002_report_documents_audit_actions.sql
  | "FINAL_PDF_GENERATED"
  | "SIGNATORY_CREATED"
  | "SIGNATORY_UPDATED"
  | "SIGNATURE_UPLOADED"
  // Advanced 6 (Notifications & Patient Result Delivery) — see
  // supabase/migrations/20260824090002_notifications_audit_actions.sql
  | "NOTIFICATION_CREATED"
  | "NOTIFICATION_SENT"
  | "NOTIFICATION_FAILED"
  | "PATIENT_RESULT_MADE_AVAILABLE"
  | "PATIENT_PDF_DOWNLOADED"
  // Troubleshooting follow-up — see
  // supabase/migrations/20260825090001_patient_access_code_reset_audit_action.sql
  | "PATIENT_ACCESS_CODE_RESET";
export type HomeCollectionStatus = "pending" | "confirmed" | "assigned" | "in_progress" | "completed" | "cancelled";
export type ServiceStatus = "draft" | "published" | "archived";
export type WebsitePageKey = "homepage" | "about" | "contact" | "footer" | "seo";
export type WebsiteContentStatus = "draft" | "published";

/**
 * Root-cause fix (build-stabilization pass):
 *
 * Every table below now carries a `Relationships` array, and the `public`
 * schema now carries `Views` / `Functions` / `Enums` / `CompositeTypes`
 * keys (all empty, since this schema has none of those yet). This is not
 * cosmetic — `@supabase/supabase-js` / `@supabase/postgrest-js` constrain
 * their generics with `GenericTable` (`Row` + `Insert` + `Update` +
 * `Relationships`) and `GenericSchema` (`Tables` + `Views` + `Functions`).
 * A hand-written `Database` type that doesn't structurally satisfy those
 * constraints causes `SupabaseClient<Database>` to fail to resolve the
 * per-table generics, and TypeScript silently collapses `.select()` /
 * `.insert()` / `.update()` results to `never` — exactly the
 * "Property '...' does not exist on type 'never'" errors seen in the
 * Vercel build. Nothing about the Row/Insert/Update shapes themselves
 * changed.
 *
 * `Relationships` entries are recorded on the table that owns the foreign
 * key column (the "many" side), matching the shape produced by
 * `supabase gen types typescript`. That's sufficient for both directions
 * of embedding — the query-builder's type resolution scans every table's
 * `Relationships` for a match against the current table, whichever side
 * you're selecting from.
 */

export interface Database {
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
            foreignKeyName: "template_fields_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "test_templates";
            referencedColumns: ["id"];
          },
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
            foreignKeyName: "template_table_columns_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "test_templates";
            referencedColumns: ["id"];
          },
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
            foreignKeyName: "template_table_rows_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "test_templates";
            referencedColumns: ["id"];
          },
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
          public_description: string | null;
          preparation_info: string | null;
          price_ngn: number | null;
          show_price: boolean;
          slug: string;
          full_description: string | null;
          requirements: string | null;
          turnaround_time: string | null;
          featured: boolean;
          cta_label: string | null;
          cta_destination: string | null;
          seo_title: string | null;
          seo_description: string | null;
          hero_image_path: string | null;
          content_status: ServiceStatus;
          published_at: string | null;
          published_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["tests"]["Row"]> & {
          category_id: string;
          template_id: string;
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["tests"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "tests_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "test_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tests_published_by_fkey";
            columns: ["published_by"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tests_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "test_templates";
            referencedColumns: ["id"];
          },
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
          staff_profile_id: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["signatories"]["Row"]> & {
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["signatories"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "signatories_staff_profile_id_fkey";
            columns: ["staff_profile_id"];
            isOneToOne: true;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
        ];
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
          assigned_approver_id: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["lab_reports"]["Row"]> & {
          patient_id: string;
          lab_number: string;
          patient_name_snapshot: string;
        };
        Update: Partial<Database["public"]["Tables"]["lab_reports"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "lab_reports_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lab_reports_signatory_id_fkey";
            columns: ["signatory_id"];
            isOneToOne: false;
            referencedRelation: "signatories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lab_reports_assigned_approver_id_fkey";
            columns: ["assigned_approver_id"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
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
            foreignKeyName: "report_tests_lab_report_id_fkey";
            columns: ["lab_report_id"];
            isOneToOne: false;
            referencedRelation: "lab_reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_tests_test_id_fkey";
            columns: ["test_id"];
            isOneToOne: false;
            referencedRelation: "tests";
            referencedColumns: ["id"];
          },
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
            foreignKeyName: "result_field_values_report_test_id_fkey";
            columns: ["report_test_id"];
            isOneToOne: false;
            referencedRelation: "report_tests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "result_field_values_template_field_id_fkey";
            columns: ["template_field_id"];
            isOneToOne: false;
            referencedRelation: "template_fields";
            referencedColumns: ["id"];
          },
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
            foreignKeyName: "result_table_cells_report_test_id_fkey";
            columns: ["report_test_id"];
            isOneToOne: false;
            referencedRelation: "report_tests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "result_table_cells_template_table_row_id_fkey";
            columns: ["template_table_row_id"];
            isOneToOne: false;
            referencedRelation: "template_table_rows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "result_table_cells_template_table_column_id_fkey";
            columns: ["template_table_column_id"];
            isOneToOne: false;
            referencedRelation: "template_table_columns";
            referencedColumns: ["id"];
          },
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
            foreignKeyName: "reference_ranges_test_id_fkey";
            columns: ["test_id"];
            isOneToOne: false;
            referencedRelation: "tests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reference_ranges_template_field_id_fkey";
            columns: ["template_field_id"];
            isOneToOne: false;
            referencedRelation: "template_fields";
            referencedColumns: ["id"];
          },
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
            foreignKeyName: "report_versions_lab_report_id_fkey";
            columns: ["lab_report_id"];
            isOneToOne: false;
            referencedRelation: "lab_reports";
            referencedColumns: ["id"];
          },
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
          booking_reference: string | null;
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
          status: HomeCollectionStatus;
          created_at: string;
          assigned_phlebotomist_id: string | null;
          booking_reference: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["home_collection_requests"]["Row"]> & {
          full_name: string;
          phone: string;
        };
        Update: Partial<Database["public"]["Tables"]["home_collection_requests"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "home_collection_requests_assigned_phlebotomist_id_fkey";
            columns: ["assigned_phlebotomist_id"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
        ];
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
      site_settings: {
        Row: {
          id: boolean;
          org_name: string | null;
          short_name: string | null;
          tagline: string | null;
          description: string | null;
          copyright_text: string | null;
          logo_path: string | null;
          logo_light_path: string | null;
          favicon_path: string | null;
          og_image_path: string | null;
          letterhead_path: string | null;
          patient_email_includes_access_code: boolean;
          email_primary: string | null;
          email_secondary: string | null;
          phone_primary: string | null;
          phone_secondary: string | null;
          whatsapp_number: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          hours_weekdays: string | null;
          hours_weekend: string | null;
          social_facebook: string | null;
          social_instagram: string | null;
          social_linkedin: string | null;
          social_twitter: string | null;
          social_youtube: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
        Relationships: [];
      };
      website_pages: {
        Row: {
          page_key: WebsitePageKey;
          draft_content: Record<string, unknown>;
          published_content: Record<string, unknown> | null;
          status: WebsiteContentStatus;
          updated_at: string;
          updated_by: string | null;
          published_at: string | null;
          published_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["website_pages"]["Row"]> & { page_key: WebsitePageKey };
        Update: Partial<Database["public"]["Tables"]["website_pages"]["Row"]>;
        Relationships: [];
      };
      public_form_attempts: {
        Row: {
          id: string;
          form_type: string;
          ip_hash: string;
          succeeded: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["public_form_attempts"]["Row"]> & {
          form_type: string;
          ip_hash: string;
          succeeded: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["public_form_attempts"]["Row"]>;
        Relationships: [];
      };
      approval_requests: {
        Row: {
          id: string;
          lab_report_id: string;
          requested_by: string | null;
          assigned_approver_id: string;
          status: ApprovalStatus;
          decision_comment: string | null;
          decided_by: string | null;
          decided_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["approval_requests"]["Row"]> & {
          lab_report_id: string;
          assigned_approver_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["approval_requests"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "approval_requests_lab_report_id_fkey";
            columns: ["lab_report_id"];
            isOneToOne: false;
            referencedRelation: "lab_reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "approval_requests_assigned_approver_id_fkey";
            columns: ["assigned_approver_id"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "approval_requests_requested_by_fkey";
            columns: ["requested_by"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "approval_requests_decided_by_fkey";
            columns: ["decided_by"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      report_final_documents: {
        Row: {
          id: string;
          lab_report_id: string;
          version_number: number;
          approval_request_id: string | null;
          signatory_id: string | null;
          storage_path: string;
          generated_by: string | null;
          generated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["report_final_documents"]["Row"]> & {
          lab_report_id: string;
          version_number: number;
          storage_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["report_final_documents"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "report_final_documents_lab_report_id_fkey";
            columns: ["lab_report_id"];
            isOneToOne: false;
            referencedRelation: "lab_reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_final_documents_approval_request_id_fkey";
            columns: ["approval_request_id"];
            isOneToOne: false;
            referencedRelation: "approval_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_final_documents_signatory_id_fkey";
            columns: ["signatory_id"];
            isOneToOne: false;
            referencedRelation: "signatories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_final_documents_generated_by_fkey";
            columns: ["generated_by"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          event_type:
            | "approval_requested"
            | "report_approved"
            | "report_rejected"
            | "report_returned"
            | "report_published"
            | "patient_result_available";
          recipient_type: "staff" | "patient";
          recipient_staff_id: string | null;
          recipient_patient_id: string | null;
          recipient_email: string | null;
          lab_report_id: string | null;
          subject: string;
          status: "pending" | "sent" | "failed";
          failure_reason: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
          sent_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          event_type: Database["public"]["Tables"]["notifications"]["Row"]["event_type"];
          recipient_type: Database["public"]["Tables"]["notifications"]["Row"]["recipient_type"];
          subject: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_staff_id_fkey";
            columns: ["recipient_staff_id"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_patient_id_fkey";
            columns: ["recipient_patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_lab_report_id_fkey";
            columns: ["lab_report_id"];
            isOneToOne: false;
            referencedRelation: "lab_reports";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      book_appointment_slot: {
        Args: {
          p_full_name: string;
          p_phone: string;
          p_email: string | null;
          p_test_or_package: string | null;
          p_preferred_date: string;
          p_preferred_time: string;
          p_location_type: string | null;
          p_notes: string | null;
          p_booking_reference: string;
          p_max_per_slot: number;
        };
        Returns: { id: string }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
