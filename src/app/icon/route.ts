import { getSiteSettings } from "@/lib/data/siteSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    const imageUrl = settings?.faviconUrl || settings?.logoUrl;

    if (!imageUrl) {
      return new Response("Favicon is not configured.", { status: 404 });
    }

    // Redirect to the exact CMS asset. The no-store header prevents Vercel's
    // route response from becoming the stale favicon source.
    return Response.redirect(imageUrl, 307);
  } catch {
    return new Response("Favicon is unavailable.", { status: 404 });
  }
}
