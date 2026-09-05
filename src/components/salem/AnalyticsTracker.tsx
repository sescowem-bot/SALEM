"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/results")) return;
    const ref = document.referrer;
    let source = "direct";
    try { if (ref) { const h = new URL(ref).hostname.toLowerCase(); source = h.includes("google.") ? "google" : h.includes("bing.") ? "bing" : h.includes("facebook.") || h.includes("instagram.") ? "social" : "referral"; } } catch {}
    const device = window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
    void fetch("/api/analytics/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: pathname, source, device }), keepalive: true }).catch(() => {});
  }, [pathname]);
  return null;
}
