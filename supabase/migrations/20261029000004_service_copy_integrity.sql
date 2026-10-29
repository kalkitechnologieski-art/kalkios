-- ═══ KALKI OS — Remove unverifiable promises from live service copy ═══
-- Two seeded descriptions promise outcomes no studio can guarantee. Clients read
-- them as a trust signal in reverse, and Google's product-review policies treat
-- "guaranteed" growth claims as misleading. Exact-phrase replaces only, so any row
-- that was already edited in admin is left untouched.
-- ─────────────────────────────────────────────────────────────────────────────

update public.services
   set description = replace(
         description,
         '10x your brand visibility within 90 days',
         'measurable brand growth, reported to you in writing every month'
       )
 where description ilike '%10x your brand visibility within 90 days%';

update public.services
   set description = replace(
         description,
         'Guaranteed viral growth',
         'Built for shareable, high-retention content'
       )
 where description ilike '%Guaranteed viral growth%';

-- The same two phrases live in short_description on some rows.
update public.services
   set short_description = replace(
         short_description,
         '10x your brand visibility within 90 days',
         'measurable brand growth, reported in writing'
       )
 where short_description ilike '%10x your brand visibility within 90 days%';

update public.services
   set short_description = replace(
         short_description,
         'Guaranteed viral growth',
         'Built for shareable, high-retention content'
       )
 where short_description ilike '%Guaranteed viral growth%';

-- Ratings and review counts on these rows were seeded, not collected. Clearing
-- them stops the catalog from rendering proof we cannot point to; the real
-- numbers return the moment approved rows exist in public.reviews.
update public.services
   set rating = null, review_count = null
 where rating is not null or review_count is not null;
