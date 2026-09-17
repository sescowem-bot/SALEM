# Salem deployment/runtime repair — 17 Sep 2026

## What was repaired

1. **Public homepage resilience**
   - A temporary Supabase failure in the published service catalogue no longer crashes the entire homepage.
   - The homepage falls back to the built-in Salem service cards when the public catalogue cannot be read.
   - Site settings and CMS public reads already use safe static fallbacks.

2. **Public Services resilience**
   - Category and service catalogue reads now fail safely instead of throwing a server error.
   - The Services page can still render its professional UI when the database catalogue is temporarily unavailable.

3. **Homepage preview TypeScript shape**
   - Featured service mapping now supplies the complete `HomepageFeaturedService` shape.

4. **Report verification typing**
   - Joined report tests explicitly include `test_id`, matching the Supabase select used by verification.

5. **Storage typing**
   - The Node Buffer/ArrayBuffer mismatch in the report PDF upload path was corrected.

6. **Favicon**
   - Competing Next App Router favicon/icon routes were removed.
   - Static Salem favicon/icon assets are used instead.
   - Browser/Apple icon sizes and the manifest are present.

7. **Existing Salem corrections retained**
   - Footer legal links.
   - Service no-image professional fallback.
   - Contact-card text wrapping / duplicate email correction.
   - Report signature/footer work.
   - Age display on reports.
   - Result PDF attachment + numeric access-code email flow.
   - No SQL migration added.
   - No existing Supabase data is deleted or modified.

## Important deployment note

The local container cannot complete `npm ci` because one dependency archive is not available in the local npm cache and external package download timed out. Therefore this repair was checked at source level, but the final `npm run build` must still be executed by Vercel after push.

The previous Vercel TypeScript errors shown in the conversation were addressed in source.
