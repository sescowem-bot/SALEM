# Salem Services + Home Collection Upgrade

## Included

- Expanded diagnostic catalogue from the supplied Salem service/test list.
- Top-level `service_type` classification: laboratory, ultrasound, cardiac, screening, home collection, other.
- New catalogue departments for Haematology, Chemical Pathology, Microbiology, Serology/Immunology, Hormonal/Endocrinology, Fertility/Obstetrics, Parasitology, Tumour Markers, Other/Specialised Tests, Ultrasound/Scanning and ECG/Cardiac Services.
- Public services directory filters by offering type and department.
- Admin service editor can now choose the offering type for future services.
- Existing `tests` catalogue remains the single source of truth; no duplicate `services` table was introduced.
- Home collection now captures required address plus optional landmark and browser-provided map coordinates/link.
- Admin home-collection requests show the map location when supplied.
- Manual home-collection payment workflow: no payment gateway or card data is added.
- Admin Settings now controls whether payment is required and stores Salem's business bank/payment instructions.
- Customer confirmation displays payment instructions after a home-collection request is submitted.
- Assignment/dispatch status is blocked until payment is verified as `paid` or `waived` when the setting requires payment.
- General `/book` home visits now collect the same address/map information.

## SQL migration

Apply this migration to the same Supabase project used by Salem:

`supabase/migrations/20260909090001_services_home_collection_upgrade.sql`

It must be applied **before** using the new catalogue/admin fields in production.

## Important: payment account details

The migration intentionally does **not** contain Salem's bank name, account name or account number. Those are business details that should be entered by an authorised Salem administrator under:

**Admin → Settings → Home collection payment**

The website will not invent or hard-code those values.

## Map behaviour

The home-collection form keeps the full written address mandatory. The customer may also allow browser location access. If granted, the site stores latitude/longitude and a Google Maps coordinate link. Location sharing is optional; the written address is the operational source of truth.

The Contact page's existing map remains CMS-controlled. A real verified Salem map embed/directions URL should be entered under the Contact website editor rather than using a placeholder.

## No payment integration

No Paystack, Flutterwave or other payment gateway was introduced. Payment is deliberately manual and staff-controlled for now.

Recommended operational rule:

1. Customer submits home-collection request.
2. Customer receives reference + payment instructions.
3. Salem verifies the transfer/payment.
4. Staff marks payment `paid` (or `waived` where authorised).
5. Only then can the request be confirmed/assigned for dispatch.

## Catalogue content

The supplied list has repeated items such as CRP, AMH, β-hCG, FSH/LH/prolactin/progesterone/oestradiol/testosterone, Semen Analysis and Pelvic Scan. The migration avoids creating a separate duplicate record for the same name. Staff can later refine the primary department/category or add richer service relationships without creating duplicate public pages.

Newly catalogued entries intentionally do not receive invented prices, preparation rules, turnaround times or clinical claims. Those fields remain editable in the Services CMS and should be completed/approved by Salem before publishing richer service content.

## Verification performed in this delivery

- All changed TypeScript/TSX files were syntax-transpiled successfully with the TypeScript compiler.
- A full `tsc --noEmit` / production Next.js build could not be completed in this isolated workspace because the interrupted dependency installation left `node_modules` without the required type-package contents. The original `package.json` and `package-lock.json` were not intentionally changed.
