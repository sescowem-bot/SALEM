"use server";

import { headers } from "next/headers";
import { verifyResultSchema } from "@/lib/validation/schemas";
import { verifyPatientResult, type PublishedResultDto } from "@/lib/data/verification";

export interface VerifyState {
  error?: string;
  result?: PublishedResultDto;
}

const RATE_LIMIT_MESSAGE = "Too many attempts. Please wait a few minutes and try again.";
const NOT_FOUND_MESSAGE = "We couldn't find a report matching those details. Check the reference and code, or contact the laboratory.";

export async function verifyResultAction(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const parsed = verifyResultSchema.safeParse({
    resultReference: formData.get("reference"),
    accessCode: formData.get("code"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid reference and access code." };
  }

  const headerList = await headers();
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";

  const outcome = await verifyPatientResult({
    resultReference: parsed.data.resultReference,
    accessCode: parsed.data.accessCode,
    ipAddress,
  });

  if (!outcome.ok) {
    if (outcome.reason === "rate_limited") return { error: RATE_LIMIT_MESSAGE };
    // Deliberately identical messaging for not_found / invalid_code / not_published
    // — do not reveal which part of the pair was wrong, or whether a report
    // exists but isn't published yet.
    return { error: NOT_FOUND_MESSAGE };
  }

  return { result: outcome.result };
}
