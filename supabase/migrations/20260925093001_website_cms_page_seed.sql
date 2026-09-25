-- Create CMS rows for the expanded public pages.
insert into public.website_pages (page_key) values
  ('faq'), ('packages'), ('booking'), ('results')
on conflict (page_key) do nothing;
