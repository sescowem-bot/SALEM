import { NextResponse } from "next/server";
import { requireStaff, can } from "@/lib/auth/session";
import { getFinalDocumentForDownload } from "@/lib/data/reportDocuments";
import { downloadReportPdfBytes } from "@/lib/data/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;

  if (!can(staff, "reports.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const doc = await getFinalDocumentForDownload(id, staff.role);
  if (!doc) {
    return NextResponse.json({ error: "No final document is available for this report yet." }, { status: 404 });
  }

  const buffer = await downloadReportPdfBytes(doc.storagePath);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Salem-Laboratories-Report-${doc.labNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
