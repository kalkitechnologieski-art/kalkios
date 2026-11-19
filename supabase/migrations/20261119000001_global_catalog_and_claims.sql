-- Publish the practice and messaging services, and remove ranking / viral promises
-- from live catalog copy. Safe to re-run: inserts ignore existing slugs, and the
-- copy updates match the old phrases only.

update public.services
   set description = 'Competitor analysis, on-page SEO, link building and monthly reporting. The written quote fixes the scope and price. No ranking promise.',
       aeo_summary = 'Competitor analysis, on-page SEO, link building and monthly reporting. The written quote fixes the scope and price. No ranking promise.',
       meta_description = 'Enterprise SEO: competitor analysis, on-page SEO, link building and monthly reporting. From ₹49,999. No ranking promise.',
       updated_at = now()
 where slug = 'enterprise-seo'
   and coalesce(description, '') ~* 'rank[[:space:]]*#[[:space:]]*1';

update public.services
   set description = 'Social content for Instagram, Facebook and YouTube, reported in writing. No view or viral guarantee.',
       aeo_summary = 'Social content for Instagram, Facebook and YouTube, reported in writing. No view or viral guarantee.',
       meta_description = 'Social marketing reported in writing. No view or viral guarantee.',
       updated_at = now()
 where slug = 'smo-viral-marketing'
   and coalesce(description, '') ~* 'guaranteed[[:space:]]+viral';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'services' and column_name = 'short_description'
  ) then
    update public.services
       set short_description = 'Search visibility work with monthly reporting. No ranking promise.'
     where short_description ilike '%rank #1%';
    update public.services
       set short_description = 'Social content reported in writing. No view or viral guarantee.'
     where short_description ilike '%guaranteed viral%';
  end if;
end $$;

update public.services
   set features = (
     select jsonb_agg(
       case
         when jsonb_typeof(elem) = 'string' and elem::text ~* 'rank #1|guaranteed viral'
           then to_jsonb('Work listed in the written quote. No ranking or viral guarantee.'::text)
         else elem
       end
     )
     from jsonb_array_elements(features) as elem
   ),
   updated_at = now()
 where jsonb_typeof(features) = 'array'
   and features::text ~* 'rank #1|guaranteed viral';

insert into public.services
  (name, slug, category, sub_category, description, price, duration_days, features, image_url, is_active, meta_title, meta_description, aeo_summary)
values
  (
    'Astrology Website Development',
    'astrology-website-development',
    'Web Development',
    'Practice websites',
    'A website for an astrology practice, with the pages and functions listed in a written quote before work starts. From ₹5,000.',
    5000,
    30,
    '["Pages agreed in the written quote","Mobile-responsive layout","Contact or booking form","Basic on-page titles, descriptions and headings","Hindi or English copy when the quote specifies the language","Handover notes, including hosting when hosting is in the quote"]'::jsonb,
    '/images/services/web-development.jpg',
    true,
    'Astrology Website Development',
    'Astrology website development for practices worldwide. From ₹5,000, written scope, ₹0 advance, quote in 24 hours. KALKI Intelligence.',
    'A website for an astrology practice, with the pages and functions listed in a written quote before work starts. From ₹5,000.'
  ),
  (
    'Vastu Consultant Website',
    'vastu-consultant-website',
    'Web Development',
    'Practice websites',
    'A website for a vastu consultancy, scoped and priced in writing before work starts. From ₹5,000.',
    5000,
    30,
    '["Pages agreed in the written quote","Mobile-responsive layout","Contact or enquiry form","Basic on-page titles, descriptions and headings","Service descriptions for the consultation types you name","Handover notes, including hosting when hosting is in the quote"]'::jsonb,
    '/images/services/web-development.jpg',
    true,
    'Vastu Consultant Website',
    'Vastu consultant website development worldwide. From ₹5,000, written scope, ₹0 advance, quote in 24 hours. KALKI Intelligence.',
    'A website for a vastu consultancy, scoped and priced in writing before work starts. From ₹5,000.'
  ),
  (
    'SEO for Astrologers',
    'seo-for-astrologers',
    'Marketing',
    'Search',
    'Competitor analysis, on-page SEO, link building and monthly reporting for an astrology practice. From ₹49,999. No ranking promise.',
    49999,
    30,
    '["Competitor analysis","On-page SEO","Link building listed in the quote","Monthly written report","Content pages only when the quote includes them"]'::jsonb,
    '/images/services/digital-marketing.jpg',
    true,
    'SEO for Astrologers',
    'SEO for astrologers worldwide: on-page work, links and monthly reporting. From ₹49,999. No ranking promise. KALKI Intelligence.',
    'Competitor analysis, on-page SEO, link building and monthly reporting for an astrology practice. From ₹49,999. No ranking promise.'
  ),
  (
    'Vastu Consultant Marketing',
    'vastu-consultant-marketing',
    'Marketing',
    'Practice marketing',
    'Content and search marketing for a vastu consultancy, reported in writing. From ₹19,999. No ranking promise.',
    19999,
    30,
    '["Content pages or articles listed in the quote","On-page titles, descriptions and headings","A monthly written report of the work done","Search work beyond this list quoted from Enterprise SEO"]'::jsonb,
    '/images/services/digital-marketing.jpg',
    true,
    'Vastu Consultant Marketing',
    'Vastu consultant marketing worldwide. Content and on-page work from ₹19,999. No ranking promise. Written quote. KALKI Intelligence.',
    'Content and search marketing for a vastu consultancy, reported in writing. From ₹19,999. No ranking promise.'
  ),
  (
    'AEO and GEO Services',
    'aeo-geo-services',
    'Marketing',
    'Search',
    'Answer-first pages and clear business facts for AI search visibility. From ₹49,999. No citation or ranking promise.',
    49999,
    30,
    '["Audit of titles, headings and opening answers","FAQ copy that matches the visible page","JSON-LD that matches the visible page","A written description of the business, services and service area","A report of what changed"]'::jsonb,
    '/images/services/digital-marketing.jpg',
    true,
    'AEO and GEO Services',
    'AEO and GEO services for AI search visibility. From ₹49,999. Pages and schema only. No citation promise. KALKI Intelligence.',
    'Answer-first pages and clear business facts for AI search visibility. From ₹49,999. No citation or ranking promise.'
  ),
  (
    'WhatsApp Business API Setup',
    'whatsapp-business-api-setup',
    'AI Automation',
    'Messaging',
    'WhatsApp Business API setup and integration for the inbox or site named in the quote. From ₹14,999.',
    14999,
    21,
    '["Setup checklist for the Meta business account","WhatsApp Business API app and webhook","Template list drafted with you","One test conversation flow named in the quote","Handover notes for the number and access"]'::jsonb,
    '/images/services/ai-automation.jpg',
    true,
    'WhatsApp Business API Setup',
    'WhatsApp Business API setup and integration worldwide. From ₹14,999, written scope, ₹0 advance. Meta approval is separate. KALKI Intelligence.',
    'WhatsApp Business API setup and integration for the inbox or site named in the quote. From ₹14,999.'
  ),
  (
    'Omnichannel DM CRM Development',
    'omnichannel-dm-crm',
    'Development',
    'CRM',
    'One inbox and CRM for the messaging channels named in the quote, including WhatsApp, Instagram and Facebook Messenger. From ₹79,999.',
    79999,
    45,
    '["One inbox for the channels named in the quote","A contact record per conversation","Assignment of a conversation to a person","A status or pipeline field","Contact export","Admin access and handover notes"]'::jsonb,
    '/images/services/software-development.jpg',
    true,
    'Omnichannel DM CRM Development',
    'Omnichannel CRM development: one inbox for WhatsApp, Instagram and Messenger. From ₹79,999, written scope, ₹0 advance. KALKI Intelligence.',
    'One inbox and CRM for the messaging channels named in the quote, including WhatsApp, Instagram and Facebook Messenger. From ₹79,999.'
  ),
  (
    'YouTube Content for Astrologers',
    'youtube-content-for-astrologers',
    'Media',
    'Video',
    'A planned set of YouTube or short-form videos for an astrology practice. From ₹9,999. No view or viral promise.',
    9999,
    14,
    '["A content plan for the videos named in the quote","Script or shot list","Edit of the agreed footage","Title and description for each video in the quote","Export and handover of the files"]'::jsonb,
    '/images/services/video-media.jpg',
    true,
    'YouTube Content for Astrologers',
    'YouTube content for astrologers worldwide. Scripts, edits and titles from ₹9,999. No view or viral promise. KALKI Intelligence.',
    'A planned set of YouTube or short-form videos for an astrology practice. From ₹9,999. No view or viral promise.'
  )
on conflict (slug) do nothing;
