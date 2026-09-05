import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";

export type AnalyticsSummary = { totalViews: number; topPages: { path: string; views: number }[]; sources: { source: string; views: number }[]; daily: { day: string; views: number }[] };

export async function recordPageView(path: string, source: string, device: string) {
  const db = getServiceRoleClient() as any;
  await db.from("website_page_views").insert({ path: path.slice(0, 300), source: source.slice(0, 60), device: device.slice(0, 20) });
}
export async function getAnalyticsSummary(role: StaffRole, days = 30): Promise<AnalyticsSummary> {
  if (!hasPermission(role, "analytics.view")) throw new Error("Forbidden: analytics access required.");
  const db = getServiceRoleClient() as any;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await db.from("website_page_views").select("viewed_at,path,source").gte("viewed_at", since).limit(50000);
  if (error) throw error;
  const rows = (data ?? []) as { viewed_at: string; path: string; source: string }[];
  const pages = new Map<string, number>(); const sources = new Map<string, number>(); const daily = new Map<string, number>();
  for (const r of rows) { pages.set(r.path, (pages.get(r.path) ?? 0) + 1); sources.set(r.source, (sources.get(r.source) ?? 0) + 1); const d = r.viewed_at.slice(0,10); daily.set(d, (daily.get(d) ?? 0) + 1); }
  return { totalViews: rows.length, topPages: [...pages].map(([path,views])=>({path,views})).sort((a,b)=>b.views-a.views).slice(0,10), sources: [...sources].map(([source,views])=>({source,views})).sort((a,b)=>b.views-a.views), daily: [...daily].map(([day,views])=>({day,views})).sort((a,b)=>a.day.localeCompare(b.day)) };
}
