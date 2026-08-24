"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

/**
 * Troubleshooting §3 — "Save before submitting". Every result field/table
 * cell on this page is its own independent uncontrolled `<form>` with its
 * own Save button (see FieldRow/TableCell in ReportDetailClient.tsx) —
 * there was no shared state anywhere that knew whether the user had typed
 * something into one of those inputs without clicking ITS save button
 * before clicking "Submit for approval" in a completely different form.
 * That gap is what let stale data go out for approval silently.
 *
 * This context is that shared state: any field marks itself dirty the
 * moment its value changes, and clean again only once its own save action
 * actually succeeds. The approver-submission form reads the aggregate
 * dirty count and refuses to submit while it's non-zero — "prevent
 * submission" per the ticket, chosen over "auto-save everything first"
 * because silently firing N separate save requests before a submit click
 * would be a bigger, riskier behavior change for a lower-effort fix.
 */

interface DirtyFieldsContextValue {
  markDirty: (key: string) => void;
  markClean: (key: string) => void;
  dirtyCount: number;
}

const DirtyFieldsContext = createContext<DirtyFieldsContextValue | null>(null);

export function DirtyFieldsProvider({ children }: { children: ReactNode }) {
  const dirtyKeys = useRef<Set<string>>(new Set());
  const [dirtyCount, setDirtyCount] = useState(0);

  const markDirty = useCallback((key: string) => {
    if (!dirtyKeys.current.has(key)) {
      dirtyKeys.current.add(key);
      setDirtyCount(dirtyKeys.current.size);
    }
  }, []);

  const markClean = useCallback((key: string) => {
    if (dirtyKeys.current.has(key)) {
      dirtyKeys.current.delete(key);
      setDirtyCount(dirtyKeys.current.size);
    }
  }, []);

  return (
    <DirtyFieldsContext.Provider value={{ markDirty, markClean, dirtyCount }}>{children}</DirtyFieldsContext.Provider>
  );
}

/** Safe outside a provider too (returns no-ops + 0) so this can wrap read-only report views without extra plumbing. */
export function useDirtyFields(): DirtyFieldsContextValue {
  const ctx = useContext(DirtyFieldsContext);
  if (!ctx) return { markDirty: () => {}, markClean: () => {}, dirtyCount: 0 };
  return ctx;
}
