import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";

/**
 * The single source of truth for what an official Salem report document
 * looks like — rendered to an actual PDF by lib/data/reportDocuments.ts
 * (renderReportPdfBuffer, via @react-pdf/renderer's renderToBuffer) for
 * both the on-screen HTML preview (Report Preview, §1) and the stored
 * final document (§4). Kept framework-typed (react-pdf primitives, not
 * regular DOM/Tailwind) since it must render identically whether it ends
 * up as bytes on disk or streamed to the browser.
 */

// react-pdf ships its own font set (Helvetica etc.) that renders reliably
// without a network fetch at build/render time — deliberately not
// registering a custom Google Font here, since this runs server-side in a
// Vercel function with no guarantee of outbound font-fetch access.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: { paddingTop: 24, paddingBottom: 48, paddingHorizontal: 36, fontSize: 9.5, fontFamily: "Helvetica", color: "#1a2b4a" },
  // Keep the uploaded letterhead proportional and large enough to behave like
  // the A4 report header. Do not cap it at a tiny thumbnail height.
  letterheadImage: { position: "absolute", top: 0, left: 0, width: 595.28, height: 841.89, objectFit: "fill" },
  letterheadContent: { paddingTop: 175, paddingBottom: 105, paddingHorizontal: 36 },
  letterheadTextBlock: { borderBottomWidth: 2, borderBottomColor: "#0f2a52", paddingBottom: 8, marginBottom: 10 },
  orgName: { fontSize: 16, fontWeight: 700, color: "#0f2a52" },
  orgTagline: { fontSize: 8, color: "#5b6b85", marginTop: 2 },
  orgContact: { fontSize: 7.5, color: "#5b6b85", marginTop: 3 },
  reportTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  reportTitle: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  statusBadge: { fontSize: 8, fontWeight: 700, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3, textTransform: "uppercase" },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: "#d8dfeb", borderRadius: 3, marginBottom: 12 },
  infoCell: { width: "33.33%", paddingVertical: 5, paddingHorizontal: 8, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#d8dfeb" },
  infoLabel: { fontSize: 6.5, textTransform: "uppercase", color: "#8592a8", marginBottom: 1, letterSpacing: 0.3 },
  infoValue: { fontSize: 9, color: "#1a2b4a" },
  testBlock: { marginBottom: 12 },
  testTitle: { fontSize: 10, fontWeight: 700, color: "#0f2a52", marginBottom: 4, borderBottomWidth: 1, borderBottomColor: "#0f2a52", paddingBottom: 2 },
  table: { borderWidth: 1, borderColor: "#d8dfeb" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#eef2f9" },
  tableRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e5e9f2" },
  th: { fontSize: 7, fontWeight: 700, textTransform: "uppercase", color: "#5b6b85", padding: 4, letterSpacing: 0.3 },
  td: { fontSize: 8.5, padding: 4, color: "#1a2b4a" },
  colField: { width: "28%" },
  colValue: { width: "18%" },
  colUnit: { width: "14%" },
  colRange: { width: "26%" },
  colFlag: { width: "14%" },
  flagAbnormal: { color: "#b3261e", fontWeight: 700 },
  testComment: { fontSize: 8, color: "#5b6b85", marginTop: 3, fontStyle: "italic" },
  commentsBlock: { marginTop: 4, marginBottom: 12, padding: 8, backgroundColor: "#f7f9fc", borderRadius: 3 },
  commentsLabel: { fontSize: 7, textTransform: "uppercase", color: "#8592a8", marginBottom: 2, letterSpacing: 0.3 },
  signatureBlock: { marginTop: 18, flexDirection: "row", justifyContent: "space-between" },
  signatureColumn: { width: "48%" },
  signatureImage: { width: 130, height: 44, objectFit: "contain", marginBottom: 2 },
  signatureLine: { borderTopWidth: 1, borderTopColor: "#1a2b4a", paddingTop: 3, width: 180 },
  signatureName: { fontSize: 9, fontWeight: 700 },
  signatureDesignation: { fontSize: 8, color: "#5b6b85" },
  signatureTimestamp: { fontSize: 7, color: "#8592a8", marginTop: 2 },
  pendingNotice: { fontSize: 8, color: "#8592a8", fontStyle: "italic" },
  footer: { position: "absolute", bottom: 18, left: 36, right: 36, borderTopWidth: 1, borderTopColor: "#e5e9f2", paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 6.5, color: "#8592a8" },
});

export interface ReportPdfFieldValue {
  label: string;
  value: string;
  unit: string | null;
  referenceRange: string | null;
  flag: string | null;
}

export interface ReportPdfTableRow {
  rowLabel: string;
  cells: { columnLabel: string; value: string }[];
}

export interface ReportPdfTest {
  testName: string;
  comment: string | null;
  structureType: "field_based" | "table_based";
  fields: ReportPdfFieldValue[];
  tableColumns: string[];
  tableRows: ReportPdfTableRow[];
}

export interface ReportPdfApprovalInfo {
  approverName: string;
  approverDesignation: string | null;
  approverQualification: string | null;
  decidedAt: string;
  signatureDataUri: string | null;
  /**
   * True only when the approving staff member has an active signatories
   * row explicitly linked to them (signatories.staff_profile_id) — see
   * lib/data/signatories.ts resolveSignatoryForStaff. False means no
   * Super Admin has linked this approver to an authorized signatory yet;
   * the document must say so plainly rather than presenting their raw
   * account name as if it were a verified signatory (troubleshooting §8:
   * "clearly indicate that the final document cannot receive an
   * electronic signature yet, rather than silently attaching the wrong
   * signature").
   */
  isAuthorizedSignatory: boolean;
}

export interface ReportPdfInput {
  org: {
    orgName: string;
    tagline: string | null;
    addressLine1: string;
    addressLine2: string;
    city: string | null;
    state: string | null;
    emailPrimary: string;
    phonePrimary: string;
    letterheadDataUri: string | null;
  };
  report: {
    labNumber: string;
    resultReference: string | null;
    status: string;
    patientName: string;
    patientSex: string | null;
    patientDob: string | null;
    request: string | null;
    specimen: string | null;
    dateCollected: string | null;
    dateReported: string | null;
    reportComment: string | null;
    versionNumber: number;
  };
  tests: ReportPdfTest[];
  approval: ReportPdfApprovalInfo | null;
  generatedAt: string;
  isFinal: boolean;
}

function statusColor(status: string): { bg: string; fg: string } {
  if (status === "published") return { bg: "#e3f6ec", fg: "#0f7a4a" };
  if (status === "reviewed") return { bg: "#fdf3dd", fg: "#8a5a00" };
  if (status === "archived") return { bg: "#eef1f6", fg: "#5b6b85" };
  return { bg: "#eef1f6", fg: "#5b6b85" };
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

export function ReportPdfDocument({ data }: { data: ReportPdfInput }) {
  const { org, report, tests, approval, generatedAt, isFinal } = data;
  const badge = statusColor(report.status);
  const locationParts = [org.city, org.state].filter(Boolean).join(", ");

  return (
    <Document title={`${report.labNumber} — ${report.patientName}`}>
      <Page size="A4" style={org.letterheadDataUri ? { ...styles.page, padding: 0 } : styles.page}>
        {org.letterheadDataUri ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not a DOM <img>
          <Image src={org.letterheadDataUri} style={styles.letterheadImage} fixed />
        ) : (
          <View style={styles.letterheadTextBlock}>
            <Text style={styles.orgName}>{org.orgName}</Text>
            {org.tagline ? <Text style={styles.orgTagline}>{org.tagline}</Text> : null}
            <Text style={styles.orgContact}>
              {org.addressLine1}
              {org.addressLine2 ? `, ${org.addressLine2}` : ""}
              {locationParts ? `, ${locationParts}` : ""} · {org.phonePrimary} · {org.emailPrimary}
            </Text>
          </View>
        )}

        <View style={org.letterheadDataUri ? styles.letterheadContent : undefined}>
        <View style={styles.reportTitleRow}>
          <Text style={styles.reportTitle}>{isFinal ? "Laboratory Report" : "Laboratory Report — Internal Preview"}</Text>
          {/* Internal workflow status (draft/reviewed/published/archived) is
              staff-only context for the live preview. The final document —
              the one stored in report_final_documents and ultimately
              downloaded by patients — never surfaces workflow terminology;
              see the Advanced-6 troubleshooting notes in
              lib/data/reportDocuments.tsx. */}
          {!isFinal ? (
            <Text style={[styles.statusBadge, { backgroundColor: badge.bg, color: badge.fg }]}>
              {report.status.replace("_", " ")}
            </Text>
          ) : null}
        </View>

        <View style={styles.infoGrid}>
          <InfoCell label="Patient name" value={report.patientName} />
          <InfoCell label="Sex" value={report.patientSex ?? "—"} />
          <InfoCell label="Date of birth" value={report.patientDob ?? "—"} />
          <InfoCell label="Lab number" value={report.labNumber} />
          <InfoCell label="Report reference" value={report.resultReference ?? "Pending publication"} />
          <InfoCell label="Document version" value={`v${report.versionNumber}`} />
          <InfoCell label="Requested service(s)" value={tests.map((t) => t.testName).join(", ") || "—"} />
          <InfoCell label="Specimen" value={report.specimen ?? "—"} />
          <InfoCell label="Date collected" value={report.dateCollected ?? "—"} />
          <InfoCell label="Date reported" value={report.dateReported ?? "—"} />
          <InfoCell label="Clinical request" value={report.request ?? "—"} />
          <InfoCell label="Generated" value={generatedAt} />
        </View>

        {tests.map((t, i) => (
          <View key={`${t.testName}-${i}`} style={styles.testBlock} wrap={false}>
            <Text style={styles.testTitle}>{t.testName}</Text>

            {t.structureType === "field_based" ? (
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.th, styles.colField]}>Parameter</Text>
                  <Text style={[styles.th, styles.colValue]}>Result</Text>
                  <Text style={[styles.th, styles.colUnit]}>Unit</Text>
                  <Text style={[styles.th, styles.colRange]}>Reference range</Text>
                  <Text style={[styles.th, styles.colFlag]}>Flag</Text>
                </View>
                {t.fields.map((f, fi) => {
                  const abnormal = f.flag && f.flag !== "normal";
                  return (
                    <View key={fi} style={styles.tableRow}>
                      <Text style={[styles.td, styles.colField]}>{f.label}</Text>
                      <Text style={[styles.td, styles.colValue, abnormal ? styles.flagAbnormal : undefined]}>
                        {f.value || "—"}
                      </Text>
                      <Text style={[styles.td, styles.colUnit]}>{f.unit ?? "—"}</Text>
                      <Text style={[styles.td, styles.colRange]}>{f.referenceRange ?? "—"}</Text>
                      <Text style={[styles.td, styles.colFlag, abnormal ? styles.flagAbnormal : undefined]}>
                        {f.flag ?? "—"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.th, { width: "28%" }]}>Parameter</Text>
                  {t.tableColumns.map((c) => (
                    <Text key={c} style={[styles.th, { width: `${72 / Math.max(t.tableColumns.length, 1)}%` }]}>
                      {c}
                    </Text>
                  ))}
                </View>
                {t.tableRows.map((row, ri) => (
                  <View key={ri} style={styles.tableRow}>
                    <Text style={[styles.td, { width: "28%" }]}>{row.rowLabel}</Text>
                    {t.tableColumns.map((c) => (
                      <Text key={c} style={[styles.td, { width: `${72 / Math.max(t.tableColumns.length, 1)}%` }]}>
                        {row.cells.find((cell) => cell.columnLabel === c)?.value || "—"}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {t.comment ? <Text style={styles.testComment}>Comment: {t.comment}</Text> : null}
          </View>
        ))}

        {report.reportComment ? (
          <View style={styles.commentsBlock}>
            <Text style={styles.commentsLabel}>Interpretation / comments</Text>
            <Text style={styles.infoValue}>{report.reportComment}</Text>
          </View>
        ) : null}

        {!org.letterheadDataUri ? <View style={styles.signatureBlock} wrap={false}>
          <View style={styles.signatureColumn}>
            {approval && approval.isAuthorizedSignatory ? (
              <>
                {approval.signatureDataUri ? (
                  // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not a DOM <img>
                  <Image src={approval.signatureDataUri} style={styles.signatureImage} />
                ) : null}
                <View style={styles.signatureLine}>
                  <Text style={styles.signatureName}>{approval.approverName}</Text>
                  {approval.approverDesignation || approval.approverQualification ? (
                    <Text style={styles.signatureDesignation}>
                      {[approval.approverQualification, approval.approverDesignation].filter(Boolean).join(" · ")}
                    </Text>
                  ) : null}
                  <Text style={styles.signatureTimestamp}>
                    {approval.signatureDataUri ? "Signed" : "Electronically approved"} on {approval.decidedAt}
                  </Text>
                </View>
              </>
            ) : approval && !approval.isAuthorizedSignatory ? (
              <View>
                <Text style={styles.signatureTimestamp}>Approved on {approval.decidedAt}</Text>
                <Text style={styles.pendingNotice}>
                  Authorized signatory not yet linked for this approver — contact a Super Admin to complete signature setup.
                </Text>
              </View>
            ) : (
              <Text style={styles.pendingNotice}>Pending authorized approval — not yet signed.</Text>
            )}
          </View>
        </View> : null}

        </View>
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {org.orgName} · Lab {report.labNumber} · {isFinal ? "Official laboratory report" : "Internal preview — not a final document"}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
