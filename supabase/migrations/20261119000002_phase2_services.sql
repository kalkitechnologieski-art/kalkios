-- Phase 2 catalog rows. The app also merges these slugs if the database
-- does not have them yet. ON CONFLICT leaves an admin edit in place.

insert into public.services
  (name, slug, category, sub_category, description, price, duration_days, features, image_url, is_active, meta_title, meta_description, aeo_summary)
values
  (
    'WhatsApp Chatbot for Business',
    'whatsapp-chatbot-for-business',
    'AI Chatbots',
    'Messaging',
    'A chatbot that replies on WhatsApp for the flows named in the quote. From ₹5,999. The Business API connection is a separate service.',
    5999,
    21,
    '["Conversation flows named in the quote","One WhatsApp number named in the quote","Handover notes for the bot","A test conversation"]'::jsonb,
    '/images/services/ai-automation.jpg',
    true,
    'WhatsApp Chatbot for Business',
    'WhatsApp chatbot for business worldwide. Flows from ₹5,999. API setup is separate. Written quote, ₹0 advance.',
    'A chatbot that replies on WhatsApp for the flows named in the quote. From ₹5,999. The Business API connection is a separate service.'
  ),
  (
    'n8n Workflow Automation',
    'n8n-workflow-automation',
    'AI Automation',
    'Workflows',
    'Workflows built in n8n for the apps and steps named in the quote. From ₹14,999. Not an n8n partnership or licence.',
    14999,
    21,
    '["Workflows named in the quote","Connections to the apps named in the quote","A written runbook","Handover of the workflow access"]'::jsonb,
    '/images/services/ai-automation.jpg',
    true,
    'n8n Automation',
    'n8n automation for the workflows named in a written quote. From ₹14,999. Not a partner badge. ₹0 advance.',
    'Workflows built in n8n for the apps and steps named in the quote. From ₹14,999. Not an n8n partnership or licence.'
  ),
  (
    'Astrology App Development',
    'astrology-app-development',
    'App Development',
    'Practice apps',
    'A mobile app for an astrology practice, with the screens named in the quote. From ₹12,000. Store approval is not included as a promise.',
    12000,
    30,
    '["Screens named in the quote","A way for a client to request a consultation","iOS, Android, or both, as the quote states","Handover notes"]'::jsonb,
    '/images/services/software-development.jpg',
    true,
    'Astrology App Development',
    'Astrology app development worldwide. From ₹12,000, written scope, ₹0 advance. Store approval is the store’s decision.',
    'A mobile app for an astrology practice, with the screens named in the quote. From ₹12,000. Store approval is not included as a promise.'
  )
on conflict (slug) do nothing;
