import { NextResponse } from "next/server";
import { requireStaff, can } from "@/lib/auth/session";
import { renderReportPreviewPdfBuffer } from "@/lib/data/reportDocuments";

/**
 * On-demand PDF for the Report Preview screen (Advanced 5 §1) — never
 * written to report_final_documents or storage; purely a same-request
 * render for a viewer who wants a PDF copy of a report that isn't final
 * yet. Once a report is approved, the preview page links to the stored
 * final PDF's signed URL instead (see getLatestFinalDocument), not this
 * route.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;

  if (!can(staff, "reports.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let buffer: Buffer;
  try {
    buffer = await renderReportPreviewPdfBuffer(id, staff.role);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not generate preview.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="report-preview-${id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
