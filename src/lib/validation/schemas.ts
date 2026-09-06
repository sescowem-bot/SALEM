import { z } from "zod";
import { APPOINTMENT_TIME_SLOTS, HOME_COLLECTION_TIME_SLOTS } from "@/lib/bookingConstants";

export const registerPatientSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(200),
  sex: z.enum(["Male", "Female"]).optional(),
  dateOfBirth: z.string().date().optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export const createVisitSchema = z.object({
  patientId: z.string().uuid(),
  labNumber: z.string().trim().min(1, "Lab number is required").max(50),
  request: z.string().trim().max(500).optional().or(z.literal("")),
  specimen: z.string().trim().max(200).optional().or(z.literal("")),
  dateCollected: z.string().date().optional().or(z.literal("")),
  testIds: z.array(z.string().uuid()).min(1, "Select at least one test"),
});

export const fieldResultSchema = z.object({
  reportTestId: z.string().uuid(),
  testId: z.string().uuid(),
  templateFieldId: z.string().uuid(),
  valueText: z.string().trim().max(500).optional().or(z.literal("")),
  valueNumeric: z.coerce.number().finite().optional(),
  flag: z.enum(["normal", "high", "low", "critical", "abnormal"]).optional().or(z.literal("")),
});

export const tableCellSchema = z.object({
  reportTestId: z.string().uuid(),
  templateTableRowId: z.string().uuid(),
  templateTableColumnId: z.string().uuid(),
  value: z.string().trim().max(200),
});

export const pdfUploadSchema = z.object({
  reportTestId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(255),
  contentType: z.literal("application/pdf"),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(15 * 1024 * 1024, "PDF must be 15MB or smaller"),
});

export const reportTransitionSchema = z.object({
  labReportId: z.string().uuid(),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
});

/** Advanced 4 — staff selecting a specific authorized approver at submission time. */
export const submitForApprovalSchema = z.object({
  labReportId: z.string().uuid(),
  approverId: z.string().uuid("Choose an approver"),
});

/** Advanced 4 — an approver actioning a specific approval_requests row (approve/reject/return). */
export const approvalDecisionSchema = z.object({
  requestId: z.string().uuid(),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
});

/**
 * Public appointment booking (Phase 5 §2). Test/service requested is a
 * free-text field (or a catalogue test id from the booking UI's
 * "Book this test" links) — never a fixed clinical enum, since exact
 * phrasing varies by what the patient brings.
 */
export const bookAppointmentSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(200),
  phone: z.string().trim().min(7, "A valid phone number is required").max(30),
  email: z.string().trim().email().optional().or(z.literal("")),
  testOrPackage: z.string().trim().max(300).optional().or(z.literal("")),
  preferredDate: z.string().date("Choose a valid date"),
  preferredTime: z.enum(APPOINTMENT_TIME_SLOTS, { message: "Choose a valid time slot" }),
  locationType: z.enum(["lab", "home"]),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const homeCollectionRequestSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(200),
  phone: z.string().trim().min(7, "A valid phone number is required").max(30),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().min(5, "Address is required so we can send a phlebotomist").max(500),
  testOrPackage: z.string().trim().max(300).optional().or(z.literal("")),
  preferredDate: z.string().date("Choose a valid date"),
  preferredTime: z.enum(HOME_COLLECTION_TIME_SLOTS, { message: "Choose a valid time window" }),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const contactMessageSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  message: z.string().trim().min(5, "Message is required").max(2000),
});

export const homeCollectionStatusSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "assigned", "in_progress", "completed", "cancelled"]),
});

export const assignPhlebotomistSchema = z.object({
  requestId: z.string().uuid(),
  phlebotomistId: z.string().uuid(),
});

export const appointmentStatusSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["new", "contacted", "scheduled", "completed", "cancelled"]),
});

/** Admin reschedule + internal notes on an appointment request (Advanced 7 QA §1/§2). */
export const appointmentRescheduleSchema = z.object({
  requestId: z.string().uuid(),
  rescheduledDate: z.string().date("Choose a valid date").optional().or(z.literal("")),
  rescheduledTime: z.string().trim().max(50).optional().or(z.literal("")),
  adminNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});

/** Admin-set home collection payment status (Advanced 7 QA §3). */
export const homeCollectionPaymentSchema = z.object({
  requestId: z.string().uuid(),
  paymentStatus: z.enum(["unpaid", "pending", "paid", "waived"]),
  paymentAmountNgn: z.string().trim().max(20).optional().or(z.literal("")),
  paymentNotes: z.string().trim().max(1000).optional().or(z.literal("")),
});
const STAFF_ROLE_VALUES = [
  "super_admin",
  "admin",
  "laboratory_staff",
  "pathologist",
  "phlebotomist",
  "frontdesk",
] as const;

export const createStaffSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().trim().min(2, "Full name is required").max(200),
  role: z.enum(STAFF_ROLE_VALUES),
  qualification: z.string().trim().max(200).optional().or(z.literal("")),
  designation: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

export const updateStaffSchema = z.object({
  staffId: z.string().uuid(),
  fullName: z.string().trim().min(2, "Full name is required").max(200),
  role: z.enum(STAFF_ROLE_VALUES),
  qualification: z.string().trim().max(200).optional().or(z.literal("")),
  designation: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

/** Advanced 5 — admin-managed signatory record (linking a staff login to a stored signature). */
export const signatorySchema = z.object({
  signatoryId: z.string().uuid().optional(),
  fullName: z.string().trim().min(2, "Full name is required").max(200),
  qualification: z.string().trim().max(200).optional().or(z.literal("")),
  designation: z.string().trim().max(200).optional().or(z.literal("")),
  staffProfileId: z.string().uuid().optional().or(z.literal("")),
  isActive: z.enum(["true", "false"]).default("true"),
});

export const staffStatusSchema = z.object({
  staffId: z.string().uuid(),
  active: z.enum(["true", "false"]),
});

export const updatePatientSchema = z.object({
  patientId: z.string().uuid(),
  fullName: z.string().trim().min(2, "Full name is required").max(200),
  sex: z.enum(["Male", "Female"]).optional().or(z.literal("")),
  dateOfBirth: z.string().date().optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export const contactStatusSchema = z.object({
  submissionId: z.string().uuid(),
  status: z.enum(["new", "contacted", "scheduled", "completed", "cancelled"]),
});

// ---------------------------------------------------------------------------
// Advanced 7 — Dynamic Lab Result & Report Builder
// ---------------------------------------------------------------------------

/** Adding an existing catalogue investigation to an already-created report. */
export const addExistingTestSchema = z.object({
  labReportId: z.string().uuid(),
  testId: z.string().uuid("Choose an investigation"),
});

export const removeReportTestSchema = z.object({
  labReportId: z.string().uuid(),
  reportTestId: z.string().uuid(),
});

export const reorderReportTestSchema = z.object({
  labReportId: z.string().uuid(),
  reportTestId: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

const customInvestigationFieldSchema = z.object({
  label: z.string().trim().min(1, "Every parameter needs a name").max(200),
  inputType: z.enum(["numeric", "text"]),
  unit: z.string().trim().max(50).optional().or(z.literal("")),
  referenceRange: z.string().trim().max(200).optional().or(z.literal("")),
});

/**
 * A custom investigation is either field_based (one or more named
 * parameters, each with its own unit/reference range/flag — reuses
 * test_templates + template_fields, same as a catalogue field-based test)
 * or table_based (columns × rows, same as e.g. Widal — reuses
 * template_table_columns + template_table_rows). Exactly one of
 * fields/(columns+rows) is meaningful depending on structureType; the
 * server action only reads the pair it needs.
 */
export const customInvestigationSchema = z.object({
  labReportId: z.string().uuid(),
  categoryId: z.string().uuid("Choose a category"),
  name: z.string().trim().min(2, "Investigation name is required").max(200),
  structureType: z.enum(["field_based", "table_based"]),
  comment: z.string().trim().max(500).optional().or(z.literal("")),
  fields: z.array(customInvestigationFieldSchema).max(30).optional().default([]),
  columns: z.array(z.string().trim().min(1).max(100)).max(20).optional().default([]),
  rows: z.array(z.string().trim().min(1).max(200)).max(50).optional().default([]),
});

/**
 * Result template for a service is either an existing test_templates row
 * (templateMode "existing", the only mode available when editing) or a
 * brand-new one defined inline (templateMode "new", create-only) — same
 * field/column/row shape as customInvestigationSchema above, reusing the
 * same "parameters/result fields" concept rather than a second schema for
 * a second structure system.
 */
export const serviceEditorSchema = z
  .object({
    testId: z.string().uuid().optional(),
    name: z.string().trim().min(2, "Service name is required").max(200),
    categoryId: z.string().uuid("Choose a category"),
    templateId: z.string().uuid().optional().or(z.literal("")),
    templateMode: z.enum(["existing", "new"]).default("existing"),
    newTemplateStructureType: z.enum(["field_based", "table_based"]).optional(),
    newTemplateFields: z.array(customInvestigationFieldSchema).max(30).optional().default([]),
    newTemplateColumns: z.array(z.string().trim().min(1).max(100)).max(20).optional().default([]),
    newTemplateRows: z.array(z.string().trim().min(1).max(200)).max(50).optional().default([]),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, "Slug is required")
      .max(200)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
    publicDescription: z.string().trim().max(500).optional().or(z.literal("")),
    fullDescription: z.string().trim().max(5000).optional().or(z.literal("")),
    preparationInfo: z.string().trim().max(2000).optional().or(z.literal("")),
    requirements: z.string().trim().max(2000).optional().or(z.literal("")),
    whatToAvoid: z.string().trim().max(2000).optional().or(z.literal("")),
    importantNotes: z.string().trim().max(2000).optional().or(z.literal("")),
    turnaroundTime: z.string().trim().max(200).optional().or(z.literal("")),
    priceNgn: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.coerce.number().nonnegative().optional()
    ),
    showPrice: z.enum(["true", "false"]).default("false"),
    featured: z.enum(["true", "false"]).default("false"),
    ctaLabel: z.string().trim().max(60).optional().or(z.literal("")),
    ctaDestination: z.string().trim().max(300).optional().or(z.literal("")),
    seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
    seoDescription: z.string().trim().max(160).optional().or(z.literal("")),
    isActive: z.enum(["true", "false"]).default("true"),
  })
  .superRefine((val, ctx) => {
    if (val.templateMode === "existing" && !val.templateId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Choose a result template", path: ["templateId"] });
    }
    if (val.templateMode === "new" && !val.newTemplateStructureType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a structure for the new result template",
        path: ["newTemplateStructureType"],
      });
    }
  });

export const siteSettingsSchema = z.object({
  orgName: z.string().trim().max(200).optional().or(z.literal("")),
  shortName: z.string().trim().max(60).optional().or(z.literal("")),
  tagline: z.string().trim().max(300).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  copyrightText: z.string().trim().max(200).optional().or(z.literal("")),
  emailPrimary: z.string().trim().email().optional().or(z.literal("")),
  emailSecondary: z.string().trim().email().optional().or(z.literal("")),
  phonePrimary: z.string().trim().max(30).optional().or(z.literal("")),
  phoneSecondary: z.string().trim().max(30).optional().or(z.literal("")),
  whatsappNumber: z.string().trim().max(30).optional().or(z.literal("")),
  addressLine1: z.string().trim().max(200).optional().or(z.literal("")),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  hoursWeekdays: z.string().trim().max(100).optional().or(z.literal("")),
  hoursWeekend: z.string().trim().max(100).optional().or(z.literal("")),
  socialFacebook: z.string().trim().url().optional().or(z.literal("")),
  socialInstagram: z.string().trim().url().optional().or(z.literal("")),
  socialLinkedin: z.string().trim().url().optional().or(z.literal("")),
  socialTwitter: z.string().trim().url().optional().or(z.literal("")),
  socialYoutube: z.string().trim().url().optional().or(z.literal("")),
  patientEmailIncludesAccessCode: z.enum(["true", "false"]).default("false"),
  bookingWindowDays: z.string().trim().max(4).optional().or(z.literal("")),
  bookingMinNoticeHours: z.string().trim().max(4).optional().or(z.literal("")),
});

const optionalUrlOrPath = z
  .string()
  .trim()
  .max(400)
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://"), {
    message: "Must be a relative path (starting with /) or a full URL",
  });

export const homepageContentSchema = z.object({
  heroEyebrow: z.string().trim().max(80).optional().or(z.literal("")),
  heroHeadline: z.string().trim().max(200).optional().or(z.literal("")),
  heroDescription: z.string().trim().max(500).optional().or(z.literal("")),
  heroCtaLabel: z.string().trim().max(60).optional().or(z.literal("")),
  heroCtaHref: optionalUrlOrPath,
  heroSecondaryCtaLabel: z.string().trim().max(60).optional().or(z.literal("")),
  heroSecondaryCtaHref: optionalUrlOrPath,
  heroTrustStatement: z.string().trim().max(200).optional().or(z.literal("")),
  aboutPreviewHeading: z.string().trim().max(150).optional().or(z.literal("")),
  aboutPreviewDescription: z.string().trim().max(500).optional().or(z.literal("")),
  aboutPreviewCtaLabel: z.string().trim().max(60).optional().or(z.literal("")),
  aboutPreviewCtaHref: optionalUrlOrPath,
  servicesHeading: z.string().trim().max(150).optional().or(z.literal("")),
  servicesDescription: z.string().trim().max(500).optional().or(z.literal("")),
  trustHeading: z.string().trim().max(150).optional().or(z.literal("")),
  trustDescription: z.string().trim().max(500).optional().or(z.literal("")),
  trustQualityStatement: z.string().trim().max(500).optional().or(z.literal("")),
  trustProfessionalStandards: z.string().trim().max(500).optional().or(z.literal("")),
  ctaHeading: z.string().trim().max(150).optional().or(z.literal("")),
  ctaDescription: z.string().trim().max(500).optional().or(z.literal("")),
  ctaLabel: z.string().trim().max(60).optional().or(z.literal("")),
  ctaHref: optionalUrlOrPath,
});

export const aboutContentSchema = z.object({
  pageTitle: z.string().trim().max(200).optional().or(z.literal("")),
  introduction: z.string().trim().max(500).optional().or(z.literal("")),
  whoWeAre: z.string().trim().max(3000).optional().or(z.literal("")),
  mission: z.string().trim().max(1000).optional().or(z.literal("")),
  vision: z.string().trim().max(1000).optional().or(z.literal("")),
  values: z.string().trim().max(1000).optional().or(z.literal("")),
  qualityStatement: z.string().trim().max(1500).optional().or(z.literal("")),
  professionalStandards: z.string().trim().max(1500).optional().or(z.literal("")),
  ctaLabel: z.string().trim().max(60).optional().or(z.literal("")),
  ctaHref: optionalUrlOrPath,
});

export const contactContentSchema = z.object({
  pageHeading: z.string().trim().max(200).optional().or(z.literal("")),
  introduction: z.string().trim().max(500).optional().or(z.literal("")),
  mapEmbedUrl: optionalUrlOrPath,
  ctaLabel: z.string().trim().max(60).optional().or(z.literal("")),
});

export const footerContentSchema = z.object({
  description: z.string().trim().max(500).optional().or(z.literal("")),
  copyrightText: z.string().trim().max(200).optional().or(z.literal("")),
});

export const seoContentSchema = z.object({
  defaultTitle: z.string().trim().max(70).optional().or(z.literal("")),
  defaultDescription: z.string().trim().max(160).optional().or(z.literal("")),
  robotsIndex: z.boolean().optional(),
  googleSiteVerification: z.string().trim().max(200).optional().or(z.literal("")),
  orgDescription: z.string().trim().max(500).optional().or(z.literal("")),
  homepageTitle: z.string().trim().max(70).optional().or(z.literal("")),
  homepageDescription: z.string().trim().max(160).optional().or(z.literal("")),
  aboutTitle: z.string().trim().max(70).optional().or(z.literal("")),
  aboutDescription: z.string().trim().max(160).optional().or(z.literal("")),
  servicesTitle: z.string().trim().max(70).optional().or(z.literal("")),
  servicesDescription: z.string().trim().max(160).optional().or(z.literal("")),
  contactTitle: z.string().trim().max(70).optional().or(z.literal("")),
  contactDescription: z.string().trim().max(160).optional().or(z.literal("")),
  googleAnalyticsId: z.string().trim().max(40).optional().or(z.literal("")),
  seoKeywords: z.string().trim().max(500).optional().or(z.literal("")),
  organizationAreaServed: z.string().trim().max(200).optional().or(z.literal("")),
});

export const verifyResultSchema = z.object({
  resultReference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^SML-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Enter a valid result reference (e.g. SML-XXXX-XXXX)"),
  accessCode: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit access code"),
});
