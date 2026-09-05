import { NextResponse } from "next/server";
import { recordPageView } from "@/lib/data/analytics";
export async function POST(req: Request) {
  try { const body = await req.json(); if (!body?.path || typeof body.path !== "string" || !body.path.startsWith("/")) return NextResponse.json({ ok: false }, { status: 400 }); await recordPageView(body.path, typeof body.source === "string" ? body.source : "direct", typeof body.device === "string" ? body.device : "desktop"); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ ok: false }, { status: 200 }); }
}
