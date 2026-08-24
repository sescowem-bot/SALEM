import "server-only";
import type { ResolvedSiteSettings } from "@/lib/data/siteSettings";
import { getAppUrl } from "./provider";

/**
 * Advanced 6 §2/§11 — professional branded templates, one per notification
 * event, built from the existing Website/Brand CMS (site_settings) rather
 * than any hardcoded business identity. Each returns both an HTML and a
 * plain-text body (some inboxes/providers require both).
 *
 * Content discipline per the ticket ("emails should contain only the
 * information appropriate for that recipient... do not expose sensitive
 * patient laboratory information unnecessarily"):
 *   - Staff templates (approval_requested / report_approved / report_rejected
 *     / report_returned) may name the patient and lab number — the
 *     recipient is already staff with legitimate access to that report —
 *     but never include actual result values.
 *   - The patient template (patient_result_available) never includes
 *     result values NOR the access code itself. The code is a distinct
 *     credential handed to the patient out-of-band (at collection, or by
 *     staff directly) specifically so that this email and the access code
 *     are never both compromised by the same channel — the email only
 *     confirms availability and links to /results, where the patient
 *     supplies the reference + code they already have.
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface NotificationReportContext {
  labReportId: string;
  labNumber: string;
  resultReference: string | null;
  patientName: string;
}

interface TemplateContext {
  report: NotificationReportContext;
  siteSettings: ResolvedSiteSettings;
  comment?: string | null;
}

function wrap(siteSettings: ResolvedSiteSettings, title: string, bodyHtml: string, bodyText: string): EmailTemplate {
  const appUrl = getAppUrl();
  const logo = siteSettings.logoUrl;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f6fb;font-family:Helvetica,Arial,sans-serif;color:#1a2b4a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fb;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#0f2a52;padding:24px 32px;">
                ${logo ? `<img src="${logo}" alt="${siteSettings.orgName}" height="32" style="display:block;" />` : `<span style="color:#ffffff;font-size:18px;font-weight:700;">${siteSettings.orgName}</span>`}
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:18px;color:#0f2a52;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f7f9fc;border-top:1px solid #e5e9f2;font-size:12px;color:#8592a8;">
                <p style="margin:0 0 4px;">${siteSettings.orgName} · ${siteSettings.addressLine1}${siteSettings.addressLine2 ? `, ${siteSettings.addressLine2}` : ""}</p>
                <p style="margin:0;">${siteSettings.phonePrimary} · ${siteSettings.emailPrimary}${appUrl ? ` · <a href="${appUrl}" style="color:#8592a8;">${appUrl.replace(/^https?:\/\//, "")}</a>` : ""}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${title}\n\n${bodyText}\n\n---\n${siteSettings.orgName}\n${siteSettings.addressLine1}${siteSettings.addressLine2 ? `, ${siteSettings.addressLine2}` : ""}\n${siteSettings.phonePrimary} · ${siteSettings.emailPrimary}${appUrl ? `\n${appUrl}` : ""}`;

  return { subject: title, html, text };
}

function reportLink(labReportId: string): string {
  const appUrl = getAppUrl();
  return `${appUrl}/admin/reports/${labReportId}`;
}

export function buildApprovalRequestedTemplate(ctx: TemplateContext): EmailTemplate {
  const { report, siteSettings } = ctx;
  const title = `Report ${report.labNumber} is awaiting your approval`;
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;">A laboratory report has been submitted and assigned to you for review.</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;"><strong>Patient:</strong> ${report.patientName}<br/><strong>Lab number:</strong> ${report.labNumber}</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">Please sign in to the staff area to approve, reject, or return it for correction.</p>
    <a href="${reportLink(report.labReportId)}" style="display:inline-block;background-color:#0f2a52;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:999px;font-size:13px;font-weight:600;">Review report</a>
  `;
  const bodyText = `A laboratory report has been submitted and assigned to you for review.\n\nPatient: ${report.patientName}\nLab number: ${report.labNumber}\n\nReview it here: ${reportLink(report.labReportId)}`;
  return wrap(siteSettings, title, bodyHtml, bodyText);
}

export function buildReportApprovedTemplate(ctx: TemplateContext): EmailTemplate {
  const { report, siteSettings } = ctx;
  const title = `Report ${report.labNumber} has been approved`;
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;">Your submitted report has been approved and the official document generated.</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;"><strong>Patient:</strong> ${report.patientName}<br/><strong>Lab number:</strong> ${report.labNumber}</p>
    <a href="${reportLink(report.labReportId)}" style="display:inline-block;background-color:#0f2a52;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:999px;font-size:13px;font-weight:600;">Open report</a>
  `;
  const bodyText = `Your submitted report has been approved and the official document generated.\n\nPatient: ${report.patientName}\nLab number: ${report.labNumber}\n\nOpen it here: ${reportLink(report.labReportId)}`;
  return wrap(siteSettings, title, bodyHtml, bodyText);
}

export function buildReportRejectedTemplate(ctx: TemplateContext): EmailTemplate {
  const { report, siteSettings, comment } = ctx;
  const title = `Report ${report.labNumber} was rejected`;
  const reasonHtml = comment ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;"><strong>Reason:</strong> ${comment}</p>` : "";
  const reasonText = comment ? `\nReason: ${comment}` : "";
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;">Your submitted report was reviewed and rejected.</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;"><strong>Patient:</strong> ${report.patientName}<br/><strong>Lab number:</strong> ${report.labNumber}</p>
    ${reasonHtml}
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">It remains in your workspace as a draft — revise and resubmit when ready.</p>
    <a href="${reportLink(report.labReportId)}" style="display:inline-block;background-color:#0f2a52;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:999px;font-size:13px;font-weight:600;">Open report</a>
  `;
  const bodyText = `Your submitted report was reviewed and rejected.\n\nPatient: ${report.patientName}\nLab number: ${report.labNumber}${reasonText}\n\nIt remains in your workspace as a draft — revise and resubmit when ready.\n\nOpen it here: ${reportLink(report.labReportId)}`;
  return wrap(siteSettings, title, bodyHtml, bodyText);
}

export function buildReportReturnedTemplate(ctx: TemplateContext): EmailTemplate {
  const { report, siteSettings, comment } = ctx;
  const title = `Report ${report.labNumber} was returned for correction`;
  const reasonHtml = comment ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;"><strong>Requested correction:</strong> ${comment}</p>` : "";
  const reasonText = comment ? `\nRequested correction: ${comment}` : "";
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;">Your submitted report was sent back for correction.</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;"><strong>Patient:</strong> ${report.patientName}<br/><strong>Lab number:</strong> ${report.labNumber}</p>
    ${reasonHtml}
    <a href="${reportLink(report.labReportId)}" style="display:inline-block;background-color:#0f2a52;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:999px;font-size:13px;font-weight:600;">Open report</a>
  `;
  const bodyText = `Your submitted report was sent back for correction.\n\nPatient: ${report.patientName}\nLab number: ${report.labNumber}${reasonText}\n\nOpen it here: ${reportLink(report.labReportId)}`;
  return wrap(siteSettings, title, bodyHtml, bodyText);
}

export function buildPatientResultAvailableTemplate(ctx: TemplateContext): EmailTemplate {
  const { report, siteSettings } = ctx;
  const appUrl = getAppUrl();
  const title = `Your ${siteSettings.orgName} result is ready`;
  const resultsLink = `${appUrl}/results`;
  // Deliberately no result values and no access code in this email — see
  // the module comment above.
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;">Dear ${report.patientName},</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;">Your laboratory result is now available for secure viewing and download.</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;"><strong>Lab reference:</strong> ${report.resultReference ?? report.labNumber}</p>
    <a href="${resultsLink}" style="display:inline-block;background-color:#0f2a52;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:999px;font-size:13px;font-weight:600;">View my result</a>
    <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#5b6b85;">Enter your lab reference above together with the one-time access code provided to you to view and download your report.</p>
  `;
  const bodyText = `Dear ${report.patientName},\n\nYour laboratory result is now available for secure viewing and download.\n\nLab reference: ${report.resultReference ?? report.labNumber}\n\nVisit ${resultsLink} and enter your lab reference together with the one-time access code provided to you.`;
  return wrap(siteSettings, title, bodyHtml, bodyText);
}
