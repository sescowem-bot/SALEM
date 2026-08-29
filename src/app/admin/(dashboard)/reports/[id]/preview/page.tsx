import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireStaff, can } from "@/lib/auth/session";
import { getReportPreviewData, getLatestFinalDocument } from "@/lib/data/reportDocuments";
import { PreviewToolbar } from "./PreviewToolbar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Report Preview | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function ReportPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;

  if (!can(staff, "reports.view")) {
    return (
      <div className="mx-auto max-w-2xl p-10 text-sm text-muted-foreground">
        Your role ({staff.role}) does not have access to laboratory reports.
      </div>
    );
  }

  let data;
  let finalDoc;
  try {
    data = await getReportPreviewData(id, staff.role);
    finalDoc = await getLatestFinalDocument(id, staff.role);
  } catch {
    notFound();
  }

  const { org, report, tests, approval } = data;

  return (
    <>
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
        }
      `}</style>
      <div className="min-h-screen bg-secondary/40 print:bg-white">
      <div className="print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href={`/admin/reports/${id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to report
          </Link>
          <PreviewToolbar labReportId={id} hasFinalPdf={Boolean(finalDoc)} />
        </div>
      </div>

      <div className="mx-auto w-[210mm] min-h-[297mm] max-w-[calc(100vw-2rem)] bg-white p-[15mm] shadow-soft print:w-[210mm] print:min-h-[297mm] print:max-w-none print:p-[15mm] print:shadow-none">
        {org.letterheadDataUri ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URI, arbitrary source
          <img src={org.letterheadDataUri} alt={`${org.orgName} letterhead`} className="mb-5 block h-auto w-full object-contain" />
        ) : (
          <div className="mb-4 border-b-2 border-navy pb-3">
            <p className="text-xl font-bold text-navy-deep">{org.orgName}</p>
            {org.tagline ? <p className="text-xs text-muted-foreground">{org.tagline}</p> : null}
            <p className="mt-1 text-[0.7rem] text-muted-foreground">
              {org.addressLine1}
              {org.addressLine2 ? `, ${org.addressLine2}` : ""}
              {org.city || org.state ? `, ${[org.city, org.state].filter(Boolean).join(", ")}` : ""} · {org.phonePrimary} ·{" "}
              {org.emailPrimary}
            </p>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-sm font-bold uppercase tracking-wide text-navy-deep">
            {data.isFinal ? "Laboratory Report — Approved" : "Laboratory Report — Preview"}
          </h1>
          <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[0.65rem] font-semibold uppercase text-muted-foreground">
            {report.status.replace("_", " ")}
          </span>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border p-4 text-sm sm:grid-cols-3">
          {[
            ["Patient name", report.patientName],
            ["Sex", report.patientSex ?? "—"],
            ["Date of birth", report.patientDob ?? "—"],
            ["Lab number", report.labNumber],
            ["Report reference", report.resultReference ?? "Pending publication"],
            ["Document version", `v${report.versionNumber}`],
            ["Requested service(s)", tests.map((t) => t.testName).join(", ") || "—"],
            ["Specimen", report.specimen ?? "—"],
            ["Date collected", report.dateCollected ?? "—"],
            ["Date reported", report.dateReported ?? "—"],
            ["Clinical request", report.request ?? "—"],
            ["Generated", data.generatedAt],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="text-navy-deep">{value}</p>
            </div>
          ))}
        </div>

        {tests.map((t, i) => (
          <div key={i} className="mb-6 break-inside-avoid">
            <h2 className="mb-2 border-b border-navy-deep pb-1 text-sm font-bold text-navy-deep">{t.testName}</h2>
            {t.structureType === "field_based" ? (
              <table className="w-full border-collapse border border-border text-xs">
                <thead>
                  <tr className="bg-secondary text-left uppercase text-muted-foreground">
                    <th className="border border-border px-2 py-1.5">Parameter</th>
                    <th className="border border-border px-2 py-1.5">Result</th>
                    <th className="border border-border px-2 py-1.5">Unit</th>
                    <th className="border border-border px-2 py-1.5">Reference range</th>
                    <th className="border border-border px-2 py-1.5">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {t.fields.map((f, fi) => {
                    const abnormal = f.flag && f.flag !== "normal";
                    return (
                      <tr key={fi}>
                        <td className="border border-border px-2 py-1.5">{f.label}</td>
                        <td className={`border border-border px-2 py-1.5 ${abnormal ? "font-bold text-destructive" : ""}`}>{f.value || "—"}</td>
                        <td className="border border-border px-2 py-1.5">{f.unit ?? "—"}</td>
                        <td className="border border-border px-2 py-1.5">{f.referenceRange ?? "—"}</td>
                        <td className={`border border-border px-2 py-1.5 ${abnormal ? "font-bold text-destructive" : ""}`}>{f.flag ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full border-collapse border border-border text-xs">
                <thead>
                  <tr className="bg-secondary text-left uppercase text-muted-foreground">
                    <th className="border border-border px-2 py-1.5">Parameter</th>
                    {t.tableColumns.map((c) => (
                      <th key={c} className="border border-border px-2 py-1.5">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.tableRows.map((row, ri) => (
                    <tr key={ri}>
                      <td className="border border-border px-2 py-1.5 font-medium">{row.rowLabel}</td>
                      {t.tableColumns.map((c) => (
                        <td key={c} className="border border-border px-2 py-1.5">
                          {row.cells.find((cell) => cell.columnLabel === c)?.value || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {t.comment ? <p className="mt-1.5 text-xs italic text-muted-foreground">Comment: {t.comment}</p> : null}
          </div>
        ))}

        {report.reportComment ? (
          <div className="mb-6 rounded-lg bg-secondary/60 p-4">
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">Interpretation / comments</p>
            <p className="text-sm text-navy-deep">{report.reportComment}</p>
          </div>
        ) : null}

        <div className="mt-10 flex justify-start break-inside-avoid">
          {approval ? (
            <div>
              {approval.signatureDataUri ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URI
                <img src={approval.signatureDataUri} alt="Approver signature" className="mb-1 h-11 w-32 object-contain" />
              ) : null}
              <div className="w-52 border-t border-navy-deep pt-1.5">
                <p className="text-sm font-bold text-navy-deep">{approval.approverName}</p>
                {approval.approverDesignation || approval.approverQualification ? (
                  <p className="text-xs text-muted-foreground">
                    {[approval.approverQualification, approval.approverDesignation].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                  {approval.signatureDataUri ? "Signed" : "Electronically approved"} on {approval.decidedAt}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs italic text-muted-foreground">Pending authorized approval — not yet signed.</p>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
