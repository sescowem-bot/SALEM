import { getSiteSettings } from "@/lib/data/siteSettings";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Browser-tab icon.
 *
 * The Salem brand logo is the source of truth for the favicon.  A previously
 * uploaded favicon must not override the current brand logo, because that can
 * leave the browser tab showing an old Salem mark.
 */
export async function GET() {
  try {
    const settings = await getSiteSettings();
    const imageUrl = settings?.logoUrl || settings?.faviconUrl;

    if (!imageUrl) {
      const file = await readFile(join(process.cwd(), "public", "salem-favicon.png"));
      return new Response(file, { status: 200, headers: { "Content-Type": "image/png", "Cache-Control": "no-store, max-age=0" } });
    }

    // Serve the current CMS asset through our own /icon endpoint instead of
    // redirecting to a cached external URL. This also prevents an old favicon
    // from being retained as the tab icon after the Salem logo is changed.
    const upstream = await fetch(imageUrl, {
      cache: "no-store",
      headers: { Accept: "image/avif,image/webp,image/png,image/svg+xml,image/x-icon,*/*" },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response("Favicon is unavailable.", {
        status: 404,
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    const contentType = upstream.headers.get("content-type") || "image/png";

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch {
    return new Response("Favicon is unavailable.", {
      status: 404,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
}
