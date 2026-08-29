import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { slugify } from "@/lib/utils/slug";
import { logAudit } from "./audit";

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

  if (error) throw error;
  return data ?? [];
}

export async function listActiveTests(): Promise<Test[]> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("tests")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
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
  const query = supabase
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

// ---------------------------------------------------------------------------
// Services CMS (Advanced 2) — same `tests` table, additional CMS columns.
// See supabase/migrations/20260821090002_services_cms.sql for why this
// extends `tests` rather than introducing a parallel services table.
// ---------------------------------------------------------------------------

export interface ServiceWithCategory extends Test {
  category: TestCategory | null;
}

function requireCatalogueManage(actorRole: StaffRole) {
  if (!hasPermission(actorRole, "catalogue.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot manage the service catalogue.`);
  }
}

/** Full admin listing — every status, every category, for the /admin/services table. */
export async function listAllServicesForAdmin(actorRole: StaffRole): Promise<ServiceWithCategory[]> {
  requireCatalogueManage(actorRole);
  const supabase = getServiceRoleClient();

  const [{ data: tests, error: testsError }, { data: categories, error: catError }] = await Promise.all([
    supabase.from("tests").select("*").order("sort_order", { ascending: true }),
    supabase.from("test_categories").select("*"),
  ]);
  if (testsError) throw testsError;
  if (catError) throw catError;

  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));
  return (tests ?? []).map((t) => ({ ...t, category: categoryById.get(t.category_id) ?? null }));
}

/** All categories regardless of is_active — for the admin editor's category picker. */
export async function listAllTestCategoriesForAdmin(actorRole: StaffRole): Promise<TestCategory[]> {
  requireCatalogueManage(actorRole);
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from("test_categories").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Active result-entry templates — every service must be linked to one (see migration note). */
export async function listActiveTestTemplates(actorRole: StaffRole): Promise<TestTemplate[]> {
  requireCatalogueManage(actorRole);
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("test_templates")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getServiceById(testId: string, actorRole: StaffRole): Promise<ServiceWithCategory | null> {
  requireCatalogueManage(actorRole);
  const supabase = getServiceRoleClient();
  const { data: test, error } = await supabase.from("tests").select("*").eq("id", testId).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  const { data: category } = await supabase.from("test_categories").select("*").eq("id", test.category_id).single();
  return { ...test, category: category ?? null };
}

export async function isServiceSlugTaken(slug: string, excludeId: string | undefined, actorRole: StaffRole): Promise<boolean> {
  requireCatalogueManage(actorRole);
  const supabase = getServiceRoleClient();
  let query = supabase.from("tests").select("id", { count: "exact", head: true }).eq("slug", slug);
  if (excludeId) query = query.neq("id", excludeId);
  const { count, error } = await query;
  if (error) throw error;
  return (count ?? 0) > 0;
}

export interface ServiceEditableFields {
  name: string;
  categoryId: string;
  templateId: string;
  slug: string;
  publicDescription: string | null;
  fullDescription: string | null;
  preparationInfo: string | null;
  requirements: string | null;
  whatToAvoid: string | null;
  importantNotes: string | null;
  turnaroundTime: string | null;
  priceNgn: number | null;
  showPrice: boolean;
  featured: boolean;
  ctaLabel: string | null;
  ctaDestination: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isActive: boolean;
}

function toTestRow(input: ServiceEditableFields) {
  return {
    name: input.name,
    category_id: input.categoryId,
    template_id: input.templateId,
    slug: input.slug,
    public_description: input.publicDescription,
    full_description: input.fullDescription,
    preparation_info: input.preparationInfo,
    requirements: input.requirements,
    what_to_avoid: input.whatToAvoid,
    important_notes: input.importantNotes,
    turnaround_time: input.turnaroundTime,
    price_ngn: input.priceNgn,
    show_price: input.showPrice,
    featured: input.featured,
    cta_label: input.ctaLabel,
    cta_destination: input.ctaDestination,
    seo_title: input.seoTitle,
    seo_description: input.seoDescription,
    is_active: input.isActive,
  };
}

export async function createService(
  input: ServiceEditableFields,
  actorRole: StaffRole,
  actorId?: string
): Promise<Test> {
  requireCatalogueManage(actorRole);
  const supabase = getServiceRoleClient();

  const { data: maxSort } = await supabase
    .from("tests")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("tests")
    .insert({ ...toTestRow(input), sort_order: (maxSort?.sort_order ?? 0) + 1, content_status: "draft" })
    .select()
    .single();
  if (error) throw error;

  await logAudit({
    action: "SERVICE_CREATED",
    entityType: "tests",
    entityId: data.id,
    actorId,
    actorRole,
    metadata: { name: input.name, slug: input.slug },
  });

  return data;
}
// ---------------------------------------------------------------------------
// New-investigation template building — Advanced 7's "Create custom
// investigation" (lib/data/labReports.ts createCustomInvestigation()) lets a
// scientist define a brand-new field-based or table-based result structure
// inline while building a report. Admin creating a new test/investigation
// from the catalogue needs the exact same capability (parameters/result
// fields defined at creation time), so these two functions reuse that same
// test_templates/template_fields/template_table_* shape rather than
// introducing any second, parallel structure system.
// ---------------------------------------------------------------------------

export interface NewTemplateFieldInput {
  label: string;
  inputType: "numeric" | "text";
  unit?: string;
}

export interface NewTemplateStructureInput {
  name: string;
  structureType: "field_based" | "table_based";
  fields?: NewTemplateFieldInput[];
  columns?: string[];
  rows?: string[];
}

export async function createTemplateStructure(
  input: NewTemplateStructureInput,
  actorRole: StaffRole
): Promise<TestTemplate> {
  requireCatalogueManage(actorRole);
  const supabase = getServiceRoleClient();

  const fields = (input.fields ?? []).filter((f) => f.label.trim().length > 0);
  const columns = (input.columns ?? []).map((c) => c.trim()).filter(Boolean);
  const rows = (input.rows ?? []).map((r) => r.trim()).filter(Boolean);

  if (input.structureType === "field_based" && fields.length === 0) {
    throw new Error("Add at least one result parameter.");
  }
  if (input.structureType === "table_based" && (columns.length === 0 || rows.length === 0)) {
    throw new Error("A table-style investigation needs at least one column and one row.");
  }

  // test_templates.name is unique but is never shown to a patient (only the
  // investigation's own `name` on `tests` is) — if it collides with an
  // existing template name (e.g. the new test shares a name with a template
  // created some other way) disambiguate once with a short suffix rather
  // than failing the whole create.
  let template: TestTemplate | null = null;
  let attemptName = input.name.trim();
  for (let attempt = 0; attempt < 2 && !template; attempt++) {
    const { data, error } = await supabase
      .from("test_templates")
      .insert({ name: attemptName, structure_type: input.structureType, is_active: true })
      .select()
      .single();
    if (error) {
      if (error.code === "23505" && attempt === 0) {
        attemptName = `${input.name.trim()} (${randomUUID().slice(0, 8)})`;
        continue;
      }
      throw error;
    }
    template = data;
  }
  if (!template) throw new Error("Could not create the result template.");
  const createdTemplate = template;

  try {
    if (input.structureType === "field_based") {
      const fieldRows = fields.map((f, i) => ({
        template_id: createdTemplate.id,
        field_key: `${slugify(f.label) || "param"}-${i}`,
        label: f.label.trim(),
        input_type: f.inputType,
        unit: f.unit?.trim() || null,
        sort_order: i,
      }));
      const { error: fieldsError } = await supabase.from("template_fields").insert(fieldRows);
      if (fieldsError) throw fieldsError;
    } else {
      const columnRows = columns.map((label, i) => ({
        template_id: createdTemplate.id,
        column_key: `${slugify(label) || "col"}-${i}`,
        column_label: label,
        sort_order: i,
      }));
      const { error: colError } = await supabase.from("template_table_columns").insert(columnRows);
      if (colError) throw colError;

      const rowRows = rows.map((label, i) => ({
        template_id: createdTemplate.id,
        row_key: `${slugify(label) || "row"}-${i}`,
        row_label: label,
        sort_order: i,
      }));
      const { error: rowError } = await supabase.from("template_table_rows").insert(rowRows);
      if (rowError) throw rowError;
    }
  } catch (err) {
    // Roll back the orphaned, field-less template on a partial failure —
    // same pattern as createCustomInvestigation().
    await supabase.from("test_templates").delete().eq("id", createdTemplate.id);
    throw err;
  }

  return createdTemplate;
}

/**
 * "Add service" (= add test/investigation) with a brand-new result template
 * defined inline, instead of picking an existing one. Rolls back the
 * template if the service insert fails (e.g. a slug/name collision) so no
 * orphaned template is left behind.
 */
export async function createServiceWithNewTemplate(
  serviceInput: Omit<ServiceEditableFields, "templateId">,
  templateInput: NewTemplateStructureInput,
  actorRole: StaffRole,
  actorId?: string
): Promise<Test> {
  const template = await createTemplateStructure(templateInput, actorRole);
  try {
    return await createService({ ...serviceInput, templateId: template.id }, actorRole, actorId);
  } catch (err) {
    const supabase = getServiceRoleClient();
    await supabase.from("test_templates").delete().eq("id", template.id);
    throw err;
  }
}

export async function updateService(
  testId: string,
  input: ServiceEditableFields,
  actorRole: StaffRole,
  actorId?: string
): Promise<Test> {
  requireCatalogueManage(actorRole);
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase.from("tests").update(toTestRow(input)).eq("id", testId).select().single();
  if (error) throw error;

  await logAudit({
    action: "SERVICE_UPDATED",
    entityType: "tests",
    entityId: testId,
    actorId,
    actorRole,
    metadata: { name: input.name, slug: input.slug },
  });

  return data;
}

export async function publishService(testId: string, actorRole: StaffRole, actorId?: string): Promise<void> {
  requireCatalogueManage(actorRole);
  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from("tests")
    .update({ content_status: "published", published_at: new Date().toISOString(), published_by: actorId ?? null })
    .eq("id", testId);
  if (error) throw error;

  await logAudit({ action: "SERVICE_PUBLISHED", entityType: "tests", entityId: testId, actorId, actorRole });
}

export async function unpublishService(testId: string, actorRole: StaffRole, actorId?: string): Promise<void> {
  requireCatalogueManage(actorRole);
  const supabase = getServiceRoleClient();
  const { error } = await supabase.from("tests").update({ content_status: "draft" }).eq("id", testId);
  if (error) throw error;

  await logAudit({ action: "SERVICE_UNPUBLISHED", entityType: "tests", entityId: testId, actorId, actorRole });
}

export async function archiveService(testId: string, actorRole: StaffRole, actorId?: string): Promise<void> {
  requireCatalogueManage(actorRole);
  const supabase = getServiceRoleClient();
  const { error } = await supabase.from("tests").update({ content_status: "archived" }).eq("id", testId);
  if (error) throw error;

  await logAudit({ action: "SERVICE_ARCHIVED", entityType: "tests", entityId: testId, actorId, actorRole });
}

export async function setServiceFeatured(testId: string, featured: boolean, actorRole: StaffRole, actorId?: string): Promise<void> {
  requireCatalogueManage(actorRole);
  const supabase = getServiceRoleClient();
  const { error } = await supabase.from("tests").update({ featured }).eq("id", testId);
  if (error) throw error;

  await logAudit({
    action: "SERVICE_UPDATED",
    entityType: "tests",
    entityId: testId,
    actorId,
    actorRole,
    metadata: { featured },
  });
}

/**
 * Moves a service up or down within its category's sort order by swapping
 * sort_order with its nearest neighbour on that side. Reuses the sort_order
 * column that already existed for template/table ordering — no schema
 * change needed for reordering.
 */
export async function reorderService(
  testId: string,
  direction: "up" | "down",
  actorRole: StaffRole,
  actorId?: string
): Promise<void> {
  requireCatalogueManage(actorRole);
  const supabase = getServiceRoleClient();

  const { data: current, error: currentError } = await supabase.from("tests").select("*").eq("id", testId).single();
  if (currentError) throw currentError;

  const { data: siblings, error: siblingsError } = await supabase
    .from("tests")
    .select("id, sort_order")
    .eq("category_id", current.category_id)
    .order("sort_order", { ascending: true });
  if (siblingsError) throw siblingsError;

  const list = siblings ?? [];
  const index = list.findIndex((s) => s.id === testId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= list.length) return;

  const neighbour = list[swapIndex];
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("tests").update({ sort_order: neighbour.sort_order }).eq("id", testId),
    supabase.from("tests").update({ sort_order: current.sort_order }).eq("id", neighbour.id),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  await logAudit({
    action: "SERVICE_UPDATED",
    entityType: "tests",
    entityId: testId,
    actorId,
    actorRole,
    metadata: { reordered: direction },
  });
}

export { slugify };

// ---------------------------------------------------------------------------
// Public-facing reads — only ever published content, never draft/archived.
// ---------------------------------------------------------------------------

export async function listPublishedServices(): Promise<ServiceWithCategory[]> {
  const supabase = getServiceRoleClient();
  const [{ data: tests, error: testsError }, { data: categories, error: catError }] = await Promise.all([
    // Advanced 8 §4 fix: content_status governs the draft/published/archived
    // publishing lifecycle; is_active is the separate "temporarily
    // unavailable" toggle in the editor form (`isActive` checkbox). Both
    // are required for public visibility — a published-but-deactivated
    // test previously still showed up here and on /book.
    supabase.from("tests").select("*").eq("content_status", "published").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("test_categories").select("*").eq("is_active", true),
  ]);
  if (testsError) throw testsError;
  if (catError) throw catError;

  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));
  return (tests ?? []).map((t) => ({ ...t, category: categoryById.get(t.category_id) ?? null }));
}

export async function getPublishedServiceBySlug(slug: string): Promise<ServiceWithCategory | null> {
  const supabase = getServiceRoleClient();
  const { data: test, error } = await supabase
    .from("tests")
    .select("*")
    .eq("slug", slug)
    .eq("content_status", "published")
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  if (!test) return null;

  const { data: category } = await supabase.from("test_categories").select("*").eq("id", test.category_id).single();
  return { ...test, category: category ?? null };
}

export async function listRelatedPublishedServices(categoryId: string, excludeId: string, limit = 3): Promise<Test[]> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("tests")
    .select("*")
    .eq("category_id", categoryId)
    .eq("content_status", "published")
    .eq("is_active", true)
    .neq("id", excludeId)
    .order("sort_order", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/**
 * Admin preview: the same shape as getPublishedServiceBySlug but bypasses
 * the content_status filter (Part C/F — preview must show real draft
 * content without requiring publish first). Never call this for public
 * routes — only from an admin-authenticated page.
 */
export async function getServiceForPreview(testId: string, actorRole: StaffRole): Promise<ServiceWithCategory | null> {
  requireCatalogueManage(actorRole);
  return getServiceById(testId, actorRole);
}
