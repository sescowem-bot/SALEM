-- Expand the website CMS without duplicating operational data.
-- FAQ/packages are editable marketing content. Booking/results contain only
-- page copy/configuration here; appointment submissions and patient reports
-- remain in their existing structured tables.
alter type website_page_key add value if not exists 'faq';
alter type website_page_key add value if not exists 'packages';
alter type website_page_key add value if not exists 'booking';
alter type website_page_key add value if not exists 'results';

