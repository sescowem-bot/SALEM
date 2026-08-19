import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";

type TestCategory = Database["public"]["Tables"]["test_categories"]["Row"];
type TestTemplate = Database["public"]["Tables"]["test_templates"]["Row"];
type TemplateField = Database["public"]["Tables"]["template_fields"]["Row"];
type TemplateTableColumn = Database["public"]["Tables"]["template_table_columns"]["Row"];
type TemplateTableRow = Database["public"]["Tables"]["template_table_rows"]["Row"];
type Test = Database["public"]["Tables"]["tests"]["Row"];

export interface TestWithStructure extends Test {
  category: TestCategory;
  template: TestTemplate;
  fields: TemplateField[];
  tableColumns: TemplateTableColumn[];
  tableRows: TemplateTableRow[];
}

/**
 * Data-access layer for the test catalog (Phase 2A/2B "Test Catalog"
 * section). Route handlers / Server Components / Server Actions should call
 * these functions instead of importing the Supabase client directly, so
 * queries stay in one place.
 */

export async function listTestCategories(): Promise<TestCategory[]> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("test_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    if (error.code === "PGRST205") return [];
    throw error;
  }
  return data ?? [];
}

export async function listActiveTests(): Promise<Test[]> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("tests")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    if (error.code === "PGRST205") return [];
    throw error;
  }
  return data ?? [];
}

export async function listActiveTestsByCategory(categoryId: string): Promise<Test[]> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("tests")
    .select("*")
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Loads a test together with its category, template, and the template's
 * fields or table columns/rows — everything the Add New Result form needs
 * to render the right inputs for that test, with no hard-coded switch on
 * test name anywhere in the UI.
 */
export async function getTestWithStructure(testId: string): Promise<TestWithStructure | null> {
  const supabase = getServiceRoleClient();

  const { data: test, error: testError } = await supabase
    .from("tests")
    .select("*")
    .eq("id", testId)
    .single();

  if (testError) {
    if (testError.code === "PGRST116") return null; // no rows
    throw testError;
  }

  const [{ data: category, error: categoryError }, { data: template, error: templateError }] =
    await Promise.all([
      supabase.from("test_categories").select("*").eq("id", test.category_id).single(),
      supabase.from("test_templates").select("*").eq("id", test.template_id).single(),
    ]);

  if (categoryError) throw categoryError;
  if (templateError) throw templateError;

  if (template.structure_type === "field_based") {
    const { data: fields, error: fieldsError } = await supabase
      .from("template_fields")
      .select("*")
      .eq("template_id", template.id)
      .order("sort_order", { ascending: true });

    if (fieldsError) throw fieldsError;

    return { ...test, category, template, fields: fields ?? [], tableColumns: [], tableRows: [] };
  }

  const [{ data: tableColumns, error: colError }, { data: tableRows, error: rowError }] =
    await Promise.all([
      supabase
        .from("template_table_columns")
        .select("*")
        .eq("template_id", template.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("template_table_rows")
        .select("*")
        .eq("template_id", template.id)
        .order("sort_order", { ascending: true }),
    ]);

  if (colError) throw colError;
  if (rowError) throw rowError;

  return {
    ...test,
    category,
    template,
    fields: [],
    tableColumns: tableColumns ?? [],
    tableRows: tableRows ?? [],
  };
}

/**
 * Resolves the configured reference range(s) for a given test field, scoped
 * by patient sex where applicable. Returns the raw row(s) — callers are
 * responsible for snapshotting the resolved display text onto the result at
 * entry time (see lib/data/labReports.ts `setFieldResult`), never reading
 * this live from a saved report.
 */
export async function getReferenceRangesForField(testId: string, templateFieldId: string, sex?: Database["public"]["Tables"]["patients"]["Row"]["sex"]) {
  const supabase = getServiceRoleClient();
  let query = supabase
    .from("reference_ranges")
    .select("*")
    .eq("test_id", testId)
    .eq("template_field_id", templateFieldId);

  const { data, error } = await query;
  if (error) throw error;

  type ReferenceRangeRow = Database["public"]["Tables"]["reference_ranges"]["Row"];
  const rows: ReferenceRangeRow[] = data ?? [];
  // Prefer a sex-specific range over a generic one when both exist.
  const sexSpecific = sex ? rows.find((r) => r.sex === sex) : undefined;
  const generic = rows.find((r) => r.sex === null);
  return sexSpecific ?? generic ?? rows[0] ?? null;
}
