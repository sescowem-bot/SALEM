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

export const serviceEditorSchema = z.object({
  testId: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Service name is required").max(200),
  categoryId: z.string().uuid("Choose a category"),
  templateId: z.string().uuid("Choose a result template"),
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
  orgDescription: z.string().trim().max(500).optional().or(z.literal("")),
  homepageTitle: z.string().trim().max(70).optional().or(z.literal("")),
  homepageDescription: z.string().trim().max(160).optional().or(z.literal("")),
  aboutTitle: z.string().trim().max(70).optional().or(z.literal("")),
  aboutDescription: z.string().trim().max(160).optional().or(z.literal("")),
  servicesTitle: z.string().trim().max(70).optional().or(z.literal("")),
  servicesDescription: z.string().trim().max(160).optional().or(z.literal("")),
  contactTitle: z.string().trim().max(70).optional().or(z.literal("")),
  contactDescription: z.string().trim().max(160).optional().or(z.literal("")),
});

export const verifyResultSchema = z.object({
  resultReference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^SML-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Enter a valid result reference (e.g. SML-XXXX-XXXX)"),
  accessCode: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit access code"),
});
