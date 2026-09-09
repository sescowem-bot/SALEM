-- Salem Advanced Services + Home Collection Upgrade
-- 1) Classifies catalogue rows by offering type without creating a duplicate services table.
-- 2) Adds future-ready service metadata and bulk catalogue entries from the supplied client list.
-- 3) Adds home-collection map coordinates and payment instructions.
-- No payment gateway is introduced in this migration.

create type service_type as enum ('laboratory', 'ultrasound', 'cardiac', 'screening', 'home_collection', 'other');

alter table public.tests
  add column service_type service_type not null default 'laboratory';

create index tests_service_type_idx on public.tests(service_type);

comment on column public.tests.service_type is
  'Top-level public offering type. The existing category_id remains the medical department/category and result-entry relationship.';

-- New catalogue departments/categories. Existing categories are intentionally preserved.
insert into public.test_categories (name, sort_order, is_active) values
  ('Haematology', 10, true),
  ('Chemical Pathology', 20, true),
  ('Microbiology', 30, true),
  ('Serology / Immunology', 40, true),
  ('Hormonal / Endocrinology', 50, true),
  ('Fertility / Obstetrics', 60, true),
  ('Parasitology', 70, true),
  ('Tumour Markers', 80, true),
  ('Other / Specialised Tests', 90, true),
  ('Ultrasound / Scanning', 100, true),
  ('ECG / Cardiac Services', 110, true)
on conflict (name) do update set is_active = excluded.is_active;

-- A generic field-based structure is used only as a safe fallback for newly catalogued items.
-- Staff can replace it later with a proper investigation-specific result template from the admin builder.
insert into public.test_templates (name, structure_type, description, is_active)
values ('General Diagnostic Result', 'field_based', 'Generic fallback result structure for newly catalogued services. Replace with a specific template where required.', true)
on conflict (name) do nothing;

insert into public.template_fields (template_id, field_key, label, input_type, unit, sort_order)
select id, 'result', 'Result / Findings', 'text', null, 1
from public.test_templates
where name = 'General Diagnostic Result'
on conflict (template_id, field_key) do nothing;

-- Supplied client catalogue. Duplicate names already present are retained and enriched.
-- New rows start published so the catalogue is immediately useful; clinical content fields remain blank
-- until Salem supplies/approves exact preparation, turnaround, pricing and descriptions.
with catalogue(name, category, service_type, code, sort_order) as (
  values
  ('Full Blood Count (FBC)','Haematology','laboratory','FBC',1),('Packed Cell Volume (PCV)','Haematology','laboratory','PCV',2),('Haemoglobin (Hb)','Haematology','laboratory','HB',3),('ESR','Haematology','laboratory','ESR',4),('Reticulocyte Count','Haematology','laboratory','RETIC',5),('Platelet Count','Haematology','laboratory','PLT',6),('Sickling Test','Haematology','laboratory','SICKLING',7),('Blood Grouping','Haematology','laboratory','BG',8),('Genotype','Haematology','laboratory','GENOTYPE',9),('Coombs Test','Haematology','laboratory','COOMBS',10),('G6PD','Haematology','laboratory','G6PD',11),('Bleeding Time','Haematology','laboratory','BT',12),('Clotting Time','Haematology','laboratory','CT',13),
  ('Fasting Blood Sugar (FBS)','Chemical Pathology','laboratory','FBS',20),('Random Blood Sugar (RBS)','Chemical Pathology','laboratory','RBS',21),('HbA1c','Chemical Pathology','laboratory','HBA1C',22),('Oral Glucose Tolerance Test (OGTT)','Chemical Pathology','laboratory','OGTT',23),('Liver Function Test (LFT)','Chemical Pathology','laboratory','LFT',24),('Kidney Function Test (KFT)','Chemical Pathology','laboratory','KFT',25),('Lipid Profile','Chemical Pathology','laboratory','LIPID',26),('Uric Acid','Chemical Pathology','laboratory','URIC',27),('Calcium','Chemical Pathology','laboratory','CA',28),('Magnesium','Chemical Pathology','laboratory','MG',29),('Phosphate','Chemical Pathology','laboratory','PHOS',30),('Electrolytes','Chemical Pathology','laboratory','ELECTROLYTES',31),('Creatinine','Chemical Pathology','laboratory','CREAT',32),('Urea','Chemical Pathology','laboratory','UREA',33),('Total Protein','Chemical Pathology','laboratory','TP',34),('Albumin','Chemical Pathology','laboratory','ALB',35),('Bilirubin','Chemical Pathology','laboratory','BILI',36),('Amylase','Chemical Pathology','laboratory','AMYLASE',37),('Lipase','Chemical Pathology','laboratory','LIPASE',38),('CRP','Chemical Pathology','laboratory','CRP',39),('Troponin','Chemical Pathology','laboratory','TROPONIN',40),
  ('Urinalysis','Microbiology','laboratory','URINALYSIS',50),('Urine MCS','Microbiology','laboratory','URINE-MCS',51),('Blood Culture','Microbiology','laboratory','BLOOD-CULTURE',52),('Stool MCS','Microbiology','laboratory','STOOL-MCS',53),('Sputum MCS','Microbiology','laboratory','SPUTUM-MCS',54),('Semen Analysis','Microbiology','laboratory','SEMEN',55),('Semen MCS','Microbiology','laboratory','SEMEN-MCS',56),('High Vaginal Swab (HVS)','Microbiology','laboratory','HVS',57),('Endocervical Swab (ECS)','Microbiology','laboratory','ECS',58),('Wound Swab MCS','Microbiology','laboratory','WOUND-MCS',59),('Urethral Swab','Microbiology','laboratory','URETHRAL-SWAB',60),('Throat Swab','Microbiology','laboratory','THROAT-SWAB',61),('Ear Swab','Microbiology','laboratory','EAR-SWAB',62),('Eye Swab','Microbiology','laboratory','EYE-SWAB',63),
  ('Widal Test','Serology / Immunology','laboratory','WIDAL',70),('HIV 1 & 2','Serology / Immunology','laboratory','HIV',71),('HBsAg','Serology / Immunology','laboratory','HBSAG',72),('HCV','Serology / Immunology','laboratory','HCV',73),('VDRL','Serology / Immunology','laboratory','VDRL',74),('RPR','Serology / Immunology','laboratory','RPR',75),('ASO Titre','Serology / Immunology','laboratory','ASO',76),('Rheumatoid Factor (RF)','Serology / Immunology','laboratory','RF',77),('ANA','Serology / Immunology','laboratory','ANA',78),('Anti-dsDNA','Serology / Immunology','laboratory','ANTI-DSDNA',79),('H. pylori Test','Serology / Immunology','laboratory','HPYLORI',80),('Dengue Test','Serology / Immunology','laboratory','DENGUE',81),('Typhoid IgG/IgM','Serology / Immunology','laboratory','TYPHOID-IGG-IGM',82),
  ('TSH','Hormonal / Endocrinology','laboratory','TSH',90),('T3','Hormonal / Endocrinology','laboratory','T3',91),('T4','Hormonal / Endocrinology','laboratory','T4',92),('Free T3','Hormonal / Endocrinology','laboratory','FT3',93),('Free T4','Hormonal / Endocrinology','laboratory','FT4',94),('FSH','Hormonal / Endocrinology','laboratory','FSH',95),('LH','Hormonal / Endocrinology','laboratory','LH',96),('Prolactin','Hormonal / Endocrinology','laboratory','PROLACTIN',97),('Progesterone','Hormonal / Endocrinology','laboratory','PROGESTERONE',98),('Oestradiol','Hormonal / Endocrinology','laboratory','E2',99),('Testosterone','Hormonal / Endocrinology','laboratory','TESTOSTERONE',100),('SHBG','Hormonal / Endocrinology','laboratory','SHBG',101),('DHEA-S','Hormonal / Endocrinology','laboratory','DHEAS',102),('Cortisol','Hormonal / Endocrinology','laboratory','CORTISOL',103),('Insulin','Hormonal / Endocrinology','laboratory','INSULIN',104),('AMH','Hormonal / Endocrinology','laboratory','AMH',105),('β-hCG','Hormonal / Endocrinology','laboratory','BHCG',106),
  ('Pregnancy Test','Fertility / Obstetrics','laboratory','PREGNANCY',110),('Serum β-hCG','Fertility / Obstetrics','laboratory','SERUM-BHCG',111),('Semen Analysis','Fertility / Obstetrics','laboratory','SEMEN-FERTILITY',112),
  ('Malaria Parasite (MP)','Parasitology','laboratory','MP',120),('Malaria Rapid Diagnostic Test','Parasitology','laboratory','MALARIA-RDT',121),('Stool Ova & Parasites','Parasitology','laboratory','STOOL-O-P',122),('Occult Blood','Parasitology','laboratory','OCCULT-BLOOD',123),('Microfilaria','Parasitology','laboratory','MICROFILARIA',124),('Schistosoma Test','Parasitology','laboratory','SCHISTOSOMA',125),('Giardia Test','Parasitology','laboratory','GIARDIA',126),
  ('PSA','Tumour Markers','laboratory','PSA',130),('AFP','Tumour Markers','laboratory','AFP',131),('CEA','Tumour Markers','laboratory','CEA',132),('CA-125','Tumour Markers','laboratory','CA125',133),('CA 15-3','Tumour Markers','laboratory','CA153',134),('CA 19-9','Tumour Markers','laboratory','CA199',135),
  ('Vitamin D','Other / Specialised Tests','laboratory','VITD',140),('Vitamin B12','Other / Specialised Tests','laboratory','VITB12',141),('Folate','Other / Specialised Tests','laboratory','FOLATE',142),('Iron Studies','Other / Specialised Tests','laboratory','IRON',143),('Thyroid Function Test','Other / Specialised Tests','laboratory','TFT',144),('ANA Profile','Other / Specialised Tests','laboratory','ANA-PROFILE',145),('Autoimmune Panel','Other / Specialised Tests','laboratory','AUTOIMMUNE',146),('Allergy Testing','Other / Specialised Tests','laboratory','ALLERGY',147),('Drug Screening','Other / Specialised Tests','laboratory','DRUG-SCREEN',148),('Toxicology Screening','Other / Specialised Tests','laboratory','TOXICOLOGY',149),('Genetic Testing','Other / Specialised Tests','laboratory','GENETIC',150),('HPV Test','Other / Specialised Tests','laboratory','HPV',151),('Pap Smear','Other / Specialised Tests','laboratory','PAP',152),('Cervical Cancer Screening','Other / Specialised Tests','laboratory','CERVICAL-SCREEN',153),
  ('Pelvic Scan','Ultrasound / Scanning','ultrasound','PELVIC-SCAN',160),('Transvaginal Scan (TVS)','Ultrasound / Scanning','ultrasound','TVS',161),('Pregnancy / Obstetric Scan','Ultrasound / Scanning','ultrasound','OBSTETRIC',162),('Early Pregnancy Scan','Ultrasound / Scanning','ultrasound','EARLY-PREGNANCY',163),('Dating Scan','Ultrasound / Scanning','ultrasound','DATING',164),('Viability Scan','Ultrasound / Scanning','ultrasound','VIABILITY',165),('First Trimester Scan','Ultrasound / Scanning','ultrasound','FIRST-TRIMESTER',166),('Second Trimester Scan','Ultrasound / Scanning','ultrasound','SECOND-TRIMESTER',167),('Third Trimester Scan','Ultrasound / Scanning','ultrasound','THIRD-TRIMESTER',168),('Anomaly Scan','Ultrasound / Scanning','ultrasound','ANOMALY',169),('Fetal Wellbeing Scan','Ultrasound / Scanning','ultrasound','FETAL-WELLBEING',170),('Fetal Growth Scan','Ultrasound / Scanning','ultrasound','FETAL-GROWTH',171),('Follicular Tracking Scan','Ultrasound / Scanning','ultrasound','FOLLICULAR',172),('Ovulation Monitoring','Ultrasound / Scanning','ultrasound','OVULATION',173),('Abdominopelvic Scan','Ultrasound / Scanning','ultrasound','ABDOMINOPELVIC',174),('Abdominal Scan','Ultrasound / Scanning','ultrasound','ABDOMINAL',175),('Renal / Kidney Scan','Ultrasound / Scanning','ultrasound','RENAL',176),('Urinary Tract Scan','Ultrasound / Scanning','ultrasound','URINARY-TRACT',177),('Hepatobiliary Scan','Ultrasound / Scanning','ultrasound','HEPATOBILIARY',178),('Thyroid Scan','Ultrasound / Scanning','ultrasound','THYROID-SCAN',179),('Breast Scan','Ultrasound / Scanning','ultrasound','BREAST-SCAN',180),('Scrotal / Testicular Scan','Ultrasound / Scanning','ultrasound','SCROTAL',181),('Prostate Scan','Ultrasound / Scanning','ultrasound','PROSTATE-SCAN',182),('Soft Tissue Scan','Ultrasound / Scanning','ultrasound','SOFT-TISSUE',183),('Neck Scan','Ultrasound / Scanning','ultrasound','NECK-SCAN',184),('Doppler Ultrasound','Ultrasound / Scanning','ultrasound','DOPPLER',185),('Obstetric Doppler','Ultrasound / Scanning','ultrasound','OBSTETRIC-DOPPLER',186),('Vascular Doppler','Ultrasound / Scanning','ultrasound','VASCULAR-DOPPLER',187),('Carotid Doppler','Ultrasound / Scanning','ultrasound','CAROTID-DOPPLER',188),
  ('Resting 12-Lead ECG','ECG / Cardiac Services','cardiac','ECG-12',200),('Pre-employment ECG','ECG / Cardiac Services','cardiac','ECG-PREEMP',201),('Pre-operative ECG','ECG / Cardiac Services','cardiac','ECG-PREOP',202),('Exercise Stress ECG','ECG / Cardiac Services','cardiac','ECG-STRESS',203)
), resolved as (
  select c.*, tc.id category_id, tt.id template_id
  from catalogue c
  join public.test_categories tc on tc.name = c.category
  cross join lateral (select id from public.test_templates where name = 'General Diagnostic Result' limit 1) tt
)
insert into public.tests (category_id, template_id, name, code, is_active, sort_order, slug, public_description, service_type, content_status)
select r.category_id, r.template_id, r.name, null, true, r.sort_order,
  regexp_replace(regexp_replace(lower(trim(r.name)), '[^a-z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'),
  'Available at Salem Medical Laboratories. Contact our team for current preparation requirements, turnaround time and pricing.',
  r.service_type::service_type, 'published'::service_status
from resolved r
on conflict (name) do update set
  category_id = excluded.category_id,
  service_type = excluded.service_type,
  is_active = true,
  content_status = case when public.tests.content_status = 'archived' then 'published'::service_status else public.tests.content_status end;

-- Avoid duplicate-slug failures from any existing data while keeping the new catalogue deterministic.
with duplicates as (
  select id, slug, row_number() over (partition by slug order by id) rn
  from public.tests
)
update public.tests t
set slug = t.slug || '-' || left(t.id::text, 8)
from duplicates d
where t.id = d.id and d.rn > 1;

-- Home-collection location/payment readiness. Coordinates are optional: address remains required.
alter table public.home_collection_requests
  add column if not exists landmark text,
  add column if not exists latitude numeric(9,6),
  add column if not exists longitude numeric(9,6),
  add column if not exists map_url text;

alter table public.home_collection_requests
  add constraint home_collection_latitude_range check (latitude is null or latitude between -90 and 90),
  add constraint home_collection_longitude_range check (longitude is null or longitude between -180 and 180);

create index home_collection_location_idx on public.home_collection_requests(latitude, longitude) where latitude is not null and longitude is not null;

alter table public.site_settings
  add column if not exists home_collection_payment_required boolean not null default true,
  add column if not exists home_collection_payment_message text,
  add column if not exists home_collection_bank_name text,
  add column if not exists home_collection_account_name text,
  add column if not exists home_collection_account_number text,
  add column if not exists home_collection_payment_phone text;

comment on column public.site_settings.home_collection_payment_required is 'If true, customers must be shown the configured payment instruction after a home-collection request is submitted. No gateway is implied.';
comment on column public.site_settings.home_collection_account_number is 'Business account number for manual home-collection payment. Never store card details here.';

-- Safe defaults only for the explanatory text; actual bank/account values remain blank until Salem configures them.
update public.site_settings
set home_collection_payment_message = coalesce(home_collection_payment_message,
  'Home collection is confirmed only after the required payment is completed and verified by Salem Medical Laboratories. Our team will contact you using the phone number you provided.'),
    home_collection_payment_required = coalesce(home_collection_payment_required, true)
where id = true;

-- General appointment booking can also request a home visit. Keep the same
-- location data there so no home request can be submitted without a usable address.
alter table public.appointment_requests
  add column if not exists address text,
  add column if not exists landmark text,
  add column if not exists latitude numeric(9,6),
  add column if not exists longitude numeric(9,6),
  add column if not exists map_url text;

alter table public.appointment_requests
  add constraint appointment_latitude_range check (latitude is null or latitude between -90 and 90),
  add constraint appointment_longitude_range check (longitude is null or longitude between -180 and 180);

create index appointment_location_idx on public.appointment_requests(latitude, longitude) where latitude is not null and longitude is not null;
