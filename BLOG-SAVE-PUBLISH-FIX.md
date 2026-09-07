# Salem Blog Save & Publish Fix

This production patch fixes the admin Health Blog editorial workflow.

## Fixed
- Save Article now gives immediate success/error feedback.
- New articles receive their database ID immediately after saving, so the editor stays open and featured-image upload becomes available.
- Save & Publish first saves the current editor contents, then publishes that exact version, preventing stale-content publication.
- Published articles no longer lose their `published_at` timestamp when edited and saved.
- Featured-image uploads update the form state so a later save cannot accidentally remove the uploaded image URL.
- Admin navigation now has a dedicated **Blog** entry.
- Public `/blog` and `/blog/[slug]` remain indexable, while the sitemap already includes published articles.

## Database
No new SQL migration is required for this patch. It uses the existing `public.seo_articles` table.
