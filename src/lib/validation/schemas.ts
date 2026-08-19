import { z } from "zod";

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

/**
 * Public verification form. Deliberately requires BOTH the opaque Result
 * Reference and the Access Code — neither alone is sufficient (Phase 2A/2B
 * three-tier identifier separation).
 */
export const verifyResultSchema = z.object({
  resultReference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^SML-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Enter a valid result reference (e.g. SML-XXXX-XXXX)"),
  accessCode: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit access code"),
});
