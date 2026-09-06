# Salem Media — Cloudinary setup (Phase 1–3)

Salem now supports Cloudinary as the preferred public-media provider for service marketing images and website/brand images. Existing Supabase Storage media remains compatible as a fallback, so this change does not require migrating existing assets before launch.

## Vercel environment variables

Add these **server-only** variables in Vercel → Project → Settings → Environment Variables:

```text
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Do **not** prefix the API secret with `NEXT_PUBLIC_` and never put it in browser code.

## Where to get them

Cloudinary Console → Dashboard gives you the Cloud name and API Key. The API Secret is also shown there; keep it private.

After adding the variables, redeploy the production deployment.

## What is stored in Cloudinary

- Service/investigation marketing images → `salem/services/<service-id>`
- Website/brand images → `salem/site/<slot>`
- Homepage hero → `salem/site/pageHero`

The database continues to use the existing image-path fields. New Cloudinary values are stored in a backward-compatible encoded form so existing Supabase-hosted images continue to render.

## Patient result PDFs

Do **not** move patient result PDFs to a public Cloudinary delivery URL. The existing private Supabase `lab-report-pdfs` bucket and server-controlled download flow remain the protected document path.

## Admin workflow after configuration

1. Admin → Services → open an investigation → Media → upload/replace the image.
2. Admin → Website → Homepage → upload the homepage hero image.
3. Admin → Settings → Brand media → manage logo, light logo, favicon, OG image and report letterhead.

If Cloudinary variables are missing, the existing Supabase public-media storage remains available as a safe fallback.
