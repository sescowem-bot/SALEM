"use client";

import { Printer, Download } from "lucide-react";

export function PreviewToolbar({ labReportId, hasFinalPdf, hasUploadedPdf }: { labReportId: string; hasFinalPdf: boolean; hasUploadedPdf: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-cyan hover:bg-accent"
      >
        <Printer className="h-3.5 w-3.5" /> Print
      </button>
      {hasUploadedPdf || hasFinalPdf ? (
        <a
          href={`/admin/reports/${labReportId}/download`}
          className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft"
        >
          <Download className="h-3.5 w-3.5" /> Download result PDF
        </a>
      ) : (
        <a
          href={`/admin/reports/${labReportId}/preview/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-cyan hover:bg-accent"
        >
          <Download className="h-3.5 w-3.5" /> Download preview PDF
        </a>
      )}
    </div>
  );
}
