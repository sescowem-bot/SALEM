-- Expand the website CMS to cover the public pages that already exist.
-- These values are content pages only; booking records and patient reports remain in their existing tables.
alter type public.website_page_key add value if not exists 'faq';
alter type public.website_page_key add value if not exists 'packages';
alter type public.website_page_key add value if not exists 'booking';
alter type public.website_page_key add value if not exists 'results';
