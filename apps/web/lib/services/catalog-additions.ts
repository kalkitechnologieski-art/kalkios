import type { Database } from '@/lib/supabase/types'
import { PHASE3_SERVICES, phase3Image } from '@/lib/services/phase3-services'

export type CatalogService = Database['public']['Tables']['services']['Row'] & {
  target_industries?: string[]
  long_description?: string | null
  aeo_summary?: string | null
}

const STAMP = '2026-11-19T00:00:00.000Z'

function service(
  input: Pick<CatalogService, 'name' | 'slug' | 'category' | 'description' | 'price' | 'duration_days' | 'features' | 'meta_title' | 'meta_description' | 'image_url' | 'sub_category' | 'target_industries' | 'long_description'>,
): CatalogService {
  return {
    id: `catalog-${input.slug}`,
    name: input.name,
    slug: input.slug,
    category: input.category,
    sub_category: input.sub_category,
    description: input.description,
    long_description: input.long_description,
    aeo_summary: input.description,
    price: input.price,
    duration_days: input.duration_days,
    features: input.features,
    icon: null,
    image_url: input.image_url,
    video_url: null,
    rating: null,
    review_count: 0,
    is_active: true,
    meta_title: input.meta_title,
    meta_description: input.meta_description,
    target_industries: input.target_industries,
    created_at: STAMP,
    updated_at: STAMP,
  }
}

// Starting prices follow a published catalog price for the closest existing
// package. Each figure is a floor pending a written quote, not a case result.
const CORE_ADDITIONS: CatalogService[] = [
  service({
    name: 'Astrology Website Development',
    slug: 'astrology-website-development',
    category: 'Web Development',
    sub_category: 'Practice websites',
    description:
      'A website for an astrology practice, with the pages and functions listed in a written quote before work starts. From ₹5,000.',
    long_description:
      'The starting package is the same five-page website already listed at ₹5,000. Kundli tools, chatbots and booking channels are separate services and are quoted only when the brief includes them.',
    price: 5000,
    duration_days: 30,
    features: [
      'Pages agreed in the written quote',
      'Mobile-responsive layout',
      'Contact or booking form',
      'Basic on-page titles, descriptions and headings',
      'Hindi or English copy when the quote specifies the language',
      'Handover notes, including hosting when hosting is in the quote',
    ],
    target_industries: ['Astrology', 'Spiritual practices', 'All industries'],
    image_url: '/images/services/web-development.jpg',
    meta_title: 'Astrology Website Development',
    meta_description:
      'Astrology website development for practices worldwide. From ₹5,000, written scope, ₹0 advance, quote in 24 hours. KALKI Intelligence.',
  }),
  service({
    name: 'Vastu Consultant Website',
    slug: 'vastu-consultant-website',
    category: 'Web Development',
    sub_category: 'Practice websites',
    description:
      'A website for a vastu consultancy, scoped and priced in writing before work starts. From ₹5,000.',
    long_description:
      'The floor is the published five-page website package. Consultation types, languages and any booking tool are fixed in the quote.',
    price: 5000,
    duration_days: 30,
    features: [
      'Pages agreed in the written quote',
      'Mobile-responsive layout',
      'Contact or enquiry form',
      'Basic on-page titles, descriptions and headings',
      'Service descriptions for the consultation types you name',
      'Handover notes, including hosting when hosting is in the quote',
    ],
    target_industries: ['Vastu', 'Spiritual practices', 'All industries'],
    image_url: '/images/services/web-development.jpg',
    meta_title: 'Vastu Consultant Website',
    meta_description:
      'Vastu consultant website development worldwide. From ₹5,000, written scope, ₹0 advance, quote in 24 hours. KALKI Intelligence.',
  }),
  service({
    name: 'SEO for Astrologers',
    slug: 'seo-for-astrologers',
    category: 'Marketing',
    sub_category: 'Search',
    description:
      'Competitor analysis, on-page SEO, link building and monthly reporting for an astrology practice. From ₹49,999. No ranking promise.',
    long_description:
      'This is the Enterprise SEO scope applied to an astrology practice. The monthly report can include measured rankings. A position is not part of the offer.',
    price: 49999,
    duration_days: 30,
    features: [
      'Competitor analysis',
      'On-page SEO',
      'Link building listed in the quote',
      'Monthly written report',
      'Content pages only when the quote includes them',
    ],
    target_industries: ['Astrology', 'Spiritual practices'],
    image_url: '/images/services/digital-marketing.jpg',
    meta_title: 'SEO for Astrologers',
    meta_description:
      'SEO for astrologers worldwide: on-page work, links and monthly reporting. From ₹49,999. No ranking promise. KALKI Intelligence.',
  }),
  service({
    name: 'Vastu Consultant Marketing',
    slug: 'vastu-consultant-marketing',
    category: 'Marketing',
    sub_category: 'Practice marketing',
    description:
      'Content and search marketing for a vastu consultancy, reported in writing. From ₹19,999. No ranking promise.',
    long_description:
      'The floor matches the published content-marketing package. A fuller SEO scope uses the Enterprise SEO service from ₹49,999 when the brief needs it.',
    price: 19999,
    duration_days: 30,
    features: [
      'Content pages or articles listed in the quote',
      'On-page titles, descriptions and headings',
      'A monthly written report of the work done',
      'Search work beyond this list quoted from Enterprise SEO',
    ],
    target_industries: ['Vastu', 'Spiritual practices'],
    image_url: '/images/services/digital-marketing.jpg',
    meta_title: 'Vastu Consultant Marketing',
    meta_description:
      'Vastu consultant marketing worldwide. Content and on-page work from ₹19,999. No ranking promise. Written quote. KALKI Intelligence.',
  }),
  service({
    name: 'AEO and GEO Services',
    slug: 'aeo-geo-services',
    category: 'Marketing',
    sub_category: 'Search',
    description:
      'Answer-first pages and clear business facts for AI search visibility. From ₹49,999. No citation or ranking promise.',
    long_description:
      'AEO is the writing and structure of the page. GEO is a consistent description of who you are and what you offer. Being cited by an AI answer engine is not part of the offer.',
    price: 49999,
    duration_days: 30,
    features: [
      'Audit of titles, headings and opening answers',
      'FAQ copy that matches the visible page',
      'JSON-LD that matches the visible page',
      'A written description of the business, services and service area',
      'A report of what changed',
    ],
    target_industries: ['Astrology', 'Vastu', 'All industries'],
    image_url: '/images/services/digital-marketing.jpg',
    meta_title: 'AEO and GEO Services',
    meta_description:
      'AEO agency and GEO services for AI search optimization. From ₹49,999. Pages and schema only. No citation promise.',
  }),
  service({
    name: 'WhatsApp Business API Setup',
    slug: 'whatsapp-business-api-setup',
    category: 'AI Automation',
    sub_category: 'Messaging',
    description:
      'WhatsApp Business API setup and integration for the inbox or site named in the quote. From ₹14,999.',
    long_description:
      'KALKI Intelligence connects the API, webhook and the templates you approve. Meta approves the business account and the templates. Approval is not something this service can promise.',
    price: 14999,
    duration_days: 21,
    features: [
      'Setup checklist for the Meta business account',
      'WhatsApp Business API app and webhook',
      'Template list drafted with you',
      'One test conversation flow named in the quote',
      'Handover notes for the number and access',
    ],
    target_industries: ['Astrology', 'Vastu', 'All industries'],
    image_url: '/images/services/ai-automation.jpg',
    meta_title: 'WhatsApp Business API Setup',
    meta_description:
      'WhatsApp API integration service worldwide. From ₹14,999, written scope, ₹0 advance. Meta approval is separate. KALKI Intelligence.',
  }),
  service({
    name: 'Omnichannel DM CRM Development',
    slug: 'omnichannel-dm-crm',
    category: 'Development',
    sub_category: 'CRM',
    description:
      'Omnichannel CRM and unified inbox development for the channels named in the quote, including WhatsApp, Instagram and Facebook Messenger. From ₹79,999.',
    long_description:
      'A shared inbox with a contact record and a status. It is not a chatbot. Automated replies are a separate service and are quoted only when the brief includes them.',
    price: 79999,
    duration_days: 45,
    features: [
      'One inbox for the channels named in the quote',
      'A contact record per conversation',
      'Assignment of a conversation to a person',
      'A status or pipeline field',
      'Contact export',
      'Admin access and handover notes',
    ],
    target_industries: ['Astrology', 'Vastu', 'All industries'],
    image_url: '/images/services/software-development.jpg',
    meta_title: 'Omnichannel CRM and Unified Inbox',
    meta_description:
      'Omnichannel CRM development and unified inbox software for WhatsApp, Instagram and Messenger. From ₹79,999. KALKI Intelligence.',
  }),
  service({
    name: 'YouTube Content for Astrologers',
    slug: 'youtube-content-for-astrologers',
    category: 'Media',
    sub_category: 'Video',
    description:
      'A planned set of YouTube or short-form videos for an astrology practice. From ₹9,999. No view or viral promise.',
    long_description:
      'The floor matches the published cinematic and motion-graphics package. The quote states how many videos, who films, and whether the edit uses footage you supply.',
    price: 9999,
    duration_days: 14,
    features: [
      'A content plan for the videos named in the quote',
      'Script or shot list',
      'Edit of the agreed footage',
      'Title and description for each video in the quote',
      'Export and handover of the files',
    ],
    target_industries: ['Astrology', 'Spiritual practices'],
    image_url: '/images/services/video-media.jpg',
    meta_title: 'YouTube Content for Astrologers',
    meta_description:
      'YouTube content for astrologers worldwide. Scripts, edits and titles from ₹9,999. No view or viral promise. KALKI Intelligence.',
  }),
  service({
    name: 'WhatsApp Chatbot for Business',
    slug: 'whatsapp-chatbot-for-business',
    category: 'AI Chatbots',
    sub_category: 'Messaging',
    description:
      'A chatbot that replies on WhatsApp for the flows named in the quote. From ₹5,999. The Business API connection is a separate service.',
    long_description:
      'This is the bot. If the number is not already on the WhatsApp Business API, that connection is quoted from the API setup service at ₹14,999. Meta still approves templates.',
    price: 5999,
    duration_days: 21,
    features: [
      'Conversation flows named in the quote',
      'One WhatsApp number named in the quote',
      'Handover notes for the bot',
      'A test conversation',
    ],
    target_industries: ['Astrology', 'Vastu', 'All industries'],
    image_url: '/images/services/ai-automation.jpg',
    meta_title: 'WhatsApp Chatbot for Business',
    meta_description:
      'WhatsApp chatbot for business worldwide. Flows from ₹5,999. API setup is separate. Written quote, ₹0 advance.',
  }),
  service({
    name: 'n8n Workflow Automation',
    slug: 'n8n-workflow-automation',
    category: 'AI Automation',
    sub_category: 'Workflows',
    description:
      'Workflows built in n8n for the apps and steps named in the quote. From ₹14,999. Not an n8n partnership or licence.',
    long_description:
      'n8n is the tool when the quote says so. Hosting, credentials, and which apps connect are decided before build. We do not sell n8n licences and we do not claim a partner badge.',
    price: 14999,
    duration_days: 21,
    features: [
      'Workflows named in the quote',
      'Connections to the apps named in the quote',
      'A written runbook',
      'Handover of the workflow access',
    ],
    target_industries: ['Astrology', 'Vastu', 'All industries'],
    image_url: '/images/services/ai-automation.jpg',
    meta_title: 'n8n Automation',
    meta_description:
      'n8n automation for the workflows named in a written quote. From ₹14,999. Not a partner badge. ₹0 advance.',
  }),
  service({
    name: 'Astrology App Development',
    slug: 'astrology-app-development',
    category: 'App Development',
    sub_category: 'Practice apps',
    description:
      'A mobile app for an astrology practice, with the screens named in the quote. From ₹12,000. Store approval is not included as a promise.',
    long_description:
      'The floor matches the published simple business app. Kundli features are the separate horoscope API. A website is the separate five-page package.',
    price: 12000,
    duration_days: 30,
    features: [
      'Screens named in the quote',
      'A way for a client to request a consultation',
      'iOS, Android, or both, as the quote states',
      'Handover notes',
    ],
    target_industries: ['Astrology', 'Spiritual practices'],
    image_url: '/images/services/software-development.jpg',
    meta_title: 'Astrology App Development',
    meta_description:
      'Astrology app development worldwide. From ₹12,000, written scope, ₹0 advance. Store approval is the store’s decision.',
  }),
]

export const CATALOG_ADDITIONS: CatalogService[] = [
  ...CORE_ADDITIONS,
  ...PHASE3_SERVICES.map((row) => service({
    name: row.name,
    slug: row.slug,
    category: row.category,
    sub_category: 'Demand catalog',
    description: row.lede,
    long_description: row.notIncluded,
    price: row.price,
    duration_days: row.days,
    features: row.features,
    image_url: phase3Image(row.category),
    meta_title: row.name,
    meta_description: row.lede.length > 155 ? `${row.lede.slice(0, 152)}...` : row.lede,
    target_industries: ['All industries'],
  })),
]
