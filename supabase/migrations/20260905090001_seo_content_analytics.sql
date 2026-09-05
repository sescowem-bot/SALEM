-- Advanced SEO Ranking Engine: editorial content + privacy-conscious analytics.
create type seo_article_status as enum ('draft','published','archived');

create table if not exists public.seo_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  seo_title text,
  seo_description text,
  featured_image_url text,
  status seo_article_status not null default 'draft',
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null
);
create index if not exists seo_articles_status_published_idx on public.seo_articles(status, published_at desc);

create table if not exists public.website_page_views (
  id bigint generated always as identity primary key,
  viewed_at timestamptz not null default now(),
  path text not null,
  source text not null default 'direct',
  device text not null default 'desktop'
);
create index if not exists website_page_views_date_idx on public.website_page_views(viewed_at desc);
create index if not exists website_page_views_path_idx on public.website_page_views(path);

alter table public.seo_articles enable row level security;
alter table public.website_page_views enable row level security;

-- Public site never writes directly; server actions/service-role do.
-- No public SELECT on analytics or draft content.

-- Starter editorial topics. These are intentionally concise and should be
-- reviewed/expanded by the laboratory before publishing.
insert into public.seo_articles (title, slug, excerpt, content, seo_title, seo_description, status, published_at)
values
('What Is a Genotype Test and Why Is It Important?', 'what-is-a-genotype-test', 'A practical guide to genotype testing, why it matters and when people may need it.', 'A genotype test helps identify a person''s haemoglobin genotype. Genotype information is commonly considered alongside other health information and is especially relevant when planning a family or discussing inherited blood conditions with a qualified healthcare professional.\n\nAt Salem Medical Laboratories, patients can ask about genotype testing, sample requirements and result access before booking.\n\nThis information is general education and does not replace advice from a qualified healthcare professional.', 'Genotype Test in Lagos: What You Should Know | Salem Medical Laboratories', 'Learn what a genotype test checks, why genotype information matters and how to book testing with Salem Medical Laboratories in Lagos.', 'published', now()),
('Blood Group Test: What You Need to Know', 'blood-group-test', 'Understand blood group testing, what the result means and why accurate identification is important.', 'A blood group test identifies the ABO and Rh blood group of a person from a blood sample. Knowing your blood group can be useful in healthcare situations where blood compatibility matters.\n\nIf you need a blood group test in Lagos, Salem Medical Laboratories can provide information about the test, sample collection and booking process.\n\nAlways discuss medical decisions with an appropriate healthcare professional.', 'Blood Group Test in Lagos | Salem Medical Laboratories', 'Learn about blood group testing, ABO and Rh blood groups, and how to arrange a laboratory test in Lagos.', 'published', now()),
('Fasting Blood Sugar Test: Preparation and Purpose', 'fasting-blood-sugar-test', 'Learn what fasting blood sugar testing measures and how preparation can affect the test.', 'A fasting blood sugar test measures glucose in a blood sample after a specified period without food. Healthcare professionals may use glucose testing as part of assessment and monitoring.\n\nPreparation requirements can vary, so follow the instructions provided by your healthcare professional or laboratory. Do not change medication or fasting plans without appropriate medical advice.\n\nSalem Medical Laboratories can provide information about available testing and booking.', 'Fasting Blood Sugar Test in Lagos | Salem Medical Laboratories', 'Learn what a fasting blood sugar test checks, common preparation guidance and how to book testing in Lagos.', 'published', now()),
('PCV Blood Test: What the Test Measures', 'pcv-blood-test', 'A simple explanation of packed cell volume testing and why it may be included in blood investigations.', 'Packed cell volume (PCV), also called haematocrit, describes the proportion of blood made up of red blood cells. It is one of several measurements that may be used when assessing blood health.\n\nA PCV result should be interpreted together with the patient''s symptoms, history and other laboratory findings where appropriate.\n\nSalem Medical Laboratories provides PCV testing and can guide patients on booking and result access.', 'PCV Blood Test in Lagos | Packed Cell Volume | Salem Medical Laboratories', 'Understand packed cell volume (PCV), what it measures and how to arrange PCV testing with Salem Medical Laboratories.', 'published', now()),
('Widal Test: What It Is and How Results Are Used', 'widal-test', 'General information about Widal testing and why laboratory results should be interpreted carefully.', 'The Widal test is a serological test historically used in the assessment of enteric fever. Test interpretation can be affected by clinical context, timing and local disease patterns, so a laboratory result should not be treated as a diagnosis by itself.\n\nIf a clinician requests a Widal test, follow the laboratory instructions and discuss the result with a qualified healthcare professional.\n\nSalem Medical Laboratories can provide information about Widal testing, sample collection and booking.', 'Widal Test in Lagos | Salem Medical Laboratories', 'Learn what the Widal test is, how results are interpreted in context and how to arrange testing in Lagos.', 'published', now()),
('How to Prepare for a Laboratory Blood Test', 'how-to-prepare-for-a-blood-test', 'Simple preparation tips for common blood tests, including why laboratory instructions matter.', 'Preparation depends on the specific test. Some tests require fasting, while others do not. Your laboratory or healthcare professional should provide the exact instructions for your test.\n\nTell the healthcare professional about medicines, supplements or relevant conditions when asked. If you are unsure whether you should fast, do not guess—confirm the requirement before the sample is collected.\n\nFor home collection, make sure the agreed collection address and contact details are available to the collection team.', 'How to Prepare for a Blood Test | Salem Medical Laboratories', 'Practical guidance for preparing for laboratory blood tests, including fasting, medication questions and home sample collection.', 'published', now()),
('Home Sample Collection in Lagos: How It Works', 'home-sample-collection-lagos', 'See how laboratory home sample collection can make testing more convenient for patients in Lagos.', 'Home sample collection allows a laboratory collection team to visit an agreed location to collect a specimen when the service is available for the requested test and area.\n\nPatients should provide accurate contact and location information and follow any preparation instructions for the requested investigation.\n\nSalem Medical Laboratories offers home collection options subject to service availability. Contact the laboratory to confirm coverage, timing and the test required.', 'Home Sample Collection in Lagos | Salem Medical Laboratories', 'Learn how home laboratory sample collection works in Lagos, what to prepare and how to arrange a collection with Salem Medical Laboratories.', 'published', now()),
('Common Laboratory Tests for Routine Health Checks', 'common-laboratory-tests-health-check', 'An overview of common laboratory investigations people may encounter during routine health assessments.', 'Routine health assessments may involve different laboratory investigations depending on age, symptoms, medical history and the purpose of the check. Examples can include blood glucose testing, blood group and genotype testing and other investigations requested by a healthcare professional.\n\nThere is no single set of tests that is appropriate for everyone. A qualified healthcare professional can recommend investigations based on the individual situation.\n\nSalem Medical Laboratories can help patients understand available tests and the booking process.', 'Common Laboratory Tests for Health Checks | Salem Medical Laboratories', 'Explore common laboratory investigations used in health assessments and learn how to arrange testing with Salem Medical Laboratories.', 'published', now())
on conflict (slug) do nothing;

-- Fill only missing service SEO fields. Do not overwrite anything the lab has
-- already authored; unpublished/inactive services remain governed by the
-- existing content_status/is_active rules.
update public.tests
set
  seo_title = left(name || ' | Salem Medical Laboratories', 70),
  seo_description = left('Learn about ' || name || ', including test information, booking and result support from Salem Medical Laboratories.', 160)
where seo_title is null or trim(seo_title) = '';

-- Publish the technical SEO defaults only when the SEO CMS has never been
-- published. Existing authored SEO content is never overwritten.
update public.website_pages
set
  draft_content = jsonb_build_object(
    'defaultTitle', 'Salem Medical Laboratories | Medical Laboratory & Diagnostics',
    'defaultDescription', 'Salem Medical Laboratories provides medical laboratory testing, diagnostic investigations and home sample collection in Lagos and Ogun, Nigeria.',
    'robotsIndex', true,
    'orgDescription', 'Salem Medical Laboratories provides diagnostic laboratory testing with a focus on accurate results, quality assurance and patient care.',
    'homepageTitle', 'Salem Medical Laboratories | Medical Diagnostics in Lagos & Ogun',
    'homepageDescription', 'Medical laboratory testing and diagnostic services with accurate, timely results and home sample collection in Lagos and Ogun.',
    'aboutTitle', 'About Salem Medical Laboratories',
    'aboutDescription', 'Learn about Salem Medical Laboratories, our diagnostic services, quality approach and commitment to patient care in Nigeria.',
    'servicesTitle', 'Laboratory Services | Salem Medical Laboratories',
    'servicesDescription', 'Explore medical laboratory tests and diagnostic investigations available from Salem Medical Laboratories.',
    'contactTitle', 'Contact Salem Medical Laboratories',
    'contactDescription', 'Contact Salem Medical Laboratories for diagnostic test enquiries, bookings, home collection and result support.',
    'seoKeywords', 'medical laboratory Lagos, diagnostic laboratory Lagos, blood tests Lagos, genotype test Lagos, home sample collection Lagos',
    'organizationAreaServed', 'Lagos, Ogun, Nigeria'
  ),
  published_content = jsonb_build_object(
    'defaultTitle', 'Salem Medical Laboratories | Medical Laboratory & Diagnostics',
    'defaultDescription', 'Salem Medical Laboratories provides medical laboratory testing, diagnostic investigations and home sample collection in Lagos and Ogun, Nigeria.',
    'robotsIndex', true,
    'orgDescription', 'Salem Medical Laboratories provides diagnostic laboratory testing with a focus on accurate results, quality assurance and patient care.',
    'homepageTitle', 'Salem Medical Laboratories | Medical Diagnostics in Lagos & Ogun',
    'homepageDescription', 'Medical laboratory testing and diagnostic services with accurate, timely results and home sample collection in Lagos and Ogun.',
    'aboutTitle', 'About Salem Medical Laboratories',
    'aboutDescription', 'Learn about Salem Medical Laboratories, our diagnostic services, quality approach and commitment to patient care in Nigeria.',
    'servicesTitle', 'Laboratory Services | Salem Medical Laboratories',
    'servicesDescription', 'Explore medical laboratory tests and diagnostic investigations available from Salem Medical Laboratories.',
    'contactTitle', 'Contact Salem Medical Laboratories',
    'contactDescription', 'Contact Salem Medical Laboratories for diagnostic test enquiries, bookings, home collection and result support.',
    'seoKeywords', 'medical laboratory Lagos, diagnostic laboratory Lagos, blood tests Lagos, genotype test Lagos, home sample collection Lagos',
    'organizationAreaServed', 'Lagos, Ogun, Nigeria'
  ),
  status = 'published',
  published_at = now()
where page_key = 'seo' and published_content is null;
