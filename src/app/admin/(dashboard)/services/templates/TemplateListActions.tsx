"use client";
import Link from "next/link";
import { Pencil, Power, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { deleteResultTemplateAction, toggleTemplateActiveAction, type TemplateActionState } from "./actions";
const initial: TemplateActionState = {};
export function TemplateListActions({ templateId, isActive, usageCount }: { templateId: string; isActive: boolean; usageCount: number }) {
  const [toggleState, toggleAction, togglePending] = useActionState(toggleTemplateActiveAction, initial);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteResultTemplateAction, initial);
  return <div className="flex flex-wrap items-center justify-start gap-1.5 md:justify-end">
    <Link href={`/admin/services/templates/${templateId}`} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-navy hover:border-cyan hover:bg-accent"><Pencil className="h-3 w-3" /> Edit</Link>
    <form action={toggleAction}><input type="hidden" name="templateId" value={templateId} /><input type="hidden" name="isActive" value={(!isActive).toString()} /><button disabled={togglePending} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-navy hover:bg-secondary"><Power className="h-3 w-3" /> {isActive ? "Deactivate" : "Activate"}</button></form>
    {usageCount === 0 ? <form action={deleteAction} onSubmit={(e) => { if (!window.confirm("Delete this template permanently?")) e.preventDefault(); }}><input type="hidden" name="templateId" value={templateId} /><button disabled={deletePending} className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /> Delete</button></form> : <span title="Reassign tests before deleting" className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground"><Trash2 className="h-3 w-3" /> In use</span>}
    {toggleState.error || deleteState.error ? <span className="basis-full text-xs text-destructive">{toggleState.error || deleteState.error}</span> : null}
  </div>;
}
