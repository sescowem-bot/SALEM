"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Star, ArrowUp, ArrowDown, Eye, Pencil } from "lucide-react";
import { StatusBadge } from "@/components/salem/StatusBadge";
import {
  toggleFeaturedAction,
  reorderServiceAction,
  publishServiceAction,
  unpublishServiceAction,
  archiveServiceAction,
  type ActionState,
} from "./actions";
import type { ServiceWithCategory } from "@/lib/data/testCatalog";

const initial: ActionState = {};

function InlineActionForm({
  action,
  hidden,
  children,
  className,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  hidden: Record<string, string>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initial);
  return (
    <form action={formAction} className={className}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" disabled={isPending} className="contents">
        {children}
      </button>
      {state.error ? <p className="mt-1 text-[0.65rem] text-destructive">{state.error}</p> : null}
    </form>
  );
}

function iconBtn(extra = "") {
  return `grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-navy disabled:opacity-50 ${extra}`;
}

export function ServicesTable({ services }: { services: ServiceWithCategory[] }) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "archived">("all");

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    services.forEach((s) => {
      if (s.category) map.set(s.category.id, s.category.name);
    });
    return Array.from(map.entries());
  }, [services]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (categoryFilter !== "all" && s.category_id !== categoryFilter) return false;
      if (statusFilter !== "all" && s.content_status !== statusFilter) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [services, query, categoryFilter, statusFilter]);

  if (services.length === 0) {
    return (
      <p className="surface-card p-6 text-sm text-muted-foreground">
        No services yet. Add one from the test catalogue to get started.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-3.5 text-sm text-navy-deep outline-none focus:border-cyan"
          />
        </span>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-navy-deep outline-none focus:border-cyan"
        >
          <option value="all">All categories</option>
          {categories.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-navy-deep outline-none focus:border-cyan"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} of {services.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">No services match this search/filter.</p>
      ) : (
        <div className="surface-card divide-y divide-border">
          {filtered.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <span className="flex min-w-0 items-center gap-3">
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-navy-deep">{s.name}</span>
                    <StatusBadge status={s.content_status} />
                    {s.featured ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-amber-700">
                        <Star className="h-2.5 w-2.5 fill-current" /> Featured
                      </span>
                    ) : null}
                    {!s.is_active ? (
                      <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-muted-foreground">
                        Inactive
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {s.category?.name ?? "Uncategorised"} · /services/{s.slug}
                  </span>
                </span>
              </span>

              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                <InlineActionForm action={reorderServiceAction} hidden={{ testId: s.id, direction: "up" }}>
                  <span className={iconBtn()} aria-label="Move up">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </span>
                </InlineActionForm>
                <InlineActionForm action={reorderServiceAction} hidden={{ testId: s.id, direction: "down" }}>
                  <span className={iconBtn()} aria-label="Move down">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </span>
                </InlineActionForm>
                <InlineActionForm action={toggleFeaturedAction} hidden={{ testId: s.id, featured: (!s.featured).toString() }}>
                  <span className={iconBtn(s.featured ? "border-amber-300 text-amber-600" : "")} aria-label="Toggle featured">
                    <Star className={`h-3.5 w-3.5 ${s.featured ? "fill-current" : ""}`} />
                  </span>
                </InlineActionForm>
                <Link href={`/admin/services/${s.id}/preview`} className={iconBtn()} aria-label="Preview">
                  <Eye className="h-3.5 w-3.5" />
                </Link>
                <Link href={`/admin/services/${s.id}`} className={iconBtn()} aria-label="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </Link>

                {s.content_status === "published" ? (
                  <InlineActionForm action={unpublishServiceAction} hidden={{ testId: s.id }}>
                    <span className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent">
                      Unpublish
                    </span>
                  </InlineActionForm>
                ) : (
                  <InlineActionForm action={publishServiceAction} hidden={{ testId: s.id }}>
                    <span className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
                      Publish
                    </span>
                  </InlineActionForm>
                )}
                {s.content_status !== "archived" ? (
                  <InlineActionForm action={archiveServiceAction} hidden={{ testId: s.id }}>
                    <span className="rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10">
                      Archive
                    </span>
                  </InlineActionForm>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
