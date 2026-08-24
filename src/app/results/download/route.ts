import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyResultSchema } from "@/lib/validation/schemas";
import { downloadPatientFinalPdf } from "@/lib/data/verification";

const ERROR_MESSAGE = "We couldn't verify that reference and access code. Please try again from the results page.";

/**
 * POST-only, form-encoded (never query-string) — the reference + access
 * code never appear in a URL, so they never land in server logs, browser
 * history, or a Referer header. Re-verifies from scratch on every request;
 * a prior successful page view grants no standing access here.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = verifyResultSchema.safeParse({
    resultReference: formData.get("reference"),
    accessCode: formData.get("code"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: ERROR_MESSAGE }, { status: 400 });
  }

  const headerList = await headers();
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";

  const outcome = await downloadPatientFinalPdf({
    resultReference: parsed.data.resultReference,
    accessCode: parsed.data.accessCode,
    ipAddress,
  });

  if (!outcome.ok) {
    // Same deliberately-uniform messaging as the verify action — never
    // reveal which part of the pair was wrong, or why the PDF isn't
    // available yet.
    return NextResponse.json({ error: ERROR_MESSAGE }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(outcome.buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Salem-Laboratories-Report-${outcome.labNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
