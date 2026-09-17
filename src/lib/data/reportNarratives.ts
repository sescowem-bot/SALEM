export interface NarrativeSectionDefinition {
  key: string;
  label: string;
  placeholder: string;
}

export interface ReportNarrativePayload {
  version: 1;
  sections: Record<string, string>;
  legacyComment?: string;
}

const PREFIX = "__SALEM_NARRATIVE_V1__";
const DEFAULT_PLACEHOLDER = "Enter the approved narrative for this section…";

export const NARRATIVE_PRESETS: NarrativeSectionDefinition[] = [
  { key: "comment", label: "Comment", placeholder: "Add a concise laboratory comment…" },
  { key: "findings", label: "Findings", placeholder: "Record the relevant findings…" },
  { key: "interpretation", label: "Interpretation", placeholder: "Interpret the findings in laboratory context…" },
  { key: "conclusion", label: "Conclusion", placeholder: "State the laboratory conclusion…" },
  { key: "recommendations", label: "Recommendations", placeholder: "Add recommendations where appropriate…" },
];

function slug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "section";
}

export function normaliseNarrativeDefinitions(input: unknown): NarrativeSectionDefinition[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: NarrativeSectionDefinition[] = [];
  for (const item of input.slice(0, 12)) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const label = typeof raw.label === "string" ? raw.label.trim().slice(0, 120) : "";
    if (!label) continue;
    const base = slug(typeof raw.key === "string" ? raw.key : label);
    let key = base;
    let n = 2;
    while (seen.has(key)) key = `${base}-${n++}`;
    seen.add(key);
    const placeholder = typeof raw.placeholder === "string" && raw.placeholder.trim()
      ? raw.placeholder.trim().slice(0, 240)
      : DEFAULT_PLACEHOLDER;
    out.push({ key, label, placeholder });
  }
  return out;
}

export function parseTemplateNarrativeSections(description: string | null | undefined): NarrativeSectionDefinition[] {
  if (!description) return [];
  try {
    const parsed = JSON.parse(description) as { narrativeSections?: unknown };
    return normaliseNarrativeDefinitions(parsed?.narrativeSections);
  } catch {
    return [];
  }
}

export function parseReportNarrative(comment: string | null | undefined): { sections: Record<string, string>; legacyComment: string | null } {
  if (!comment || !comment.startsWith(PREFIX)) return { sections: {}, legacyComment: comment || null };
  try {
    const parsed = JSON.parse(comment.slice(PREFIX.length)) as Partial<ReportNarrativePayload>;
    const sections: Record<string, string> = {};
    if (parsed.sections && typeof parsed.sections === "object") {
      for (const [key, value] of Object.entries(parsed.sections)) {
        if (typeof value === "string" && value.trim()) sections[key] = value.trim();
      }
    }
    return { sections, legacyComment: typeof parsed.legacyComment === "string" && parsed.legacyComment.trim() ? parsed.legacyComment.trim() : null };
  } catch {
    return { sections: {}, legacyComment: comment };
  }
}

export function encodeReportNarrative(sections: Record<string, string>, legacyComment?: string | null): string | null {
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(sections)) {
    if (typeof value === "string" && value.trim()) clean[key] = value.trim().slice(0, 10000);
  }
  const legacy = legacyComment?.trim() || undefined;
  if (!Object.keys(clean).length && !legacy) return null;
  return PREFIX + JSON.stringify({ version: 1, sections: clean, ...(legacy ? { legacyComment: legacy } : {}) });
}
