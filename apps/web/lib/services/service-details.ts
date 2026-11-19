import { serviceHref } from '@/lib/services/href'

export interface ServiceFacts {
  name: string
  slug: string
  category: string
  description?: string | null
  price?: number | null
  duration_days?: number | null
  features?: unknown
}

export interface PageSection {
  heading: string
  paragraphs: string[]
}

export interface PageLink {
  href: string
  label: string
}

export interface ServicePageContent {
  sections: PageSection[]
  deliverables: string[]
  prerequisites: string[]
  process: { name: string; text: string }[]
  faqs: { question: string; answer: string }[]
  links: PageLink[]
}

const QUOTE =
  'You send a brief and pay nothing. KALKI Intelligence replies within 24 hours with a written scope, a fixed price and a delivery date. Work is scheduled after you approve that quote. ₹0 to start means the enquiry is free, not that the work is free.'

function inr(price: number | null | undefined): string {
  if (price == null) return 'a starting price on this page'
  return `₹${price.toLocaleString('en-IN')}`
}

function featureList(features: unknown): string[] {
  if (!Array.isArray(features)) return []
  return features.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function standardProcess(name: string, days: number | null | undefined): { name: string; text: string }[] {
  const typical = days ? `${days} days is the listed typical duration` : 'The quote states the duration'
  return [
    {
      name: 'Send the brief',
      text: `Tell us the goal for ${name}, what already exists, and what “done” looks like. No payment is taken with the brief.`,
    },
    {
      name: 'Receive the quote',
      text: 'Within 24 hours you get a written scope, a fixed price and a delivery date. If a deliverable is not in that document, it is not part of the price.',
    },
    {
      name: 'Approve, then we start',
      text: 'You approve the quote in writing. Work is scheduled after that approval. There is no checkout step and no advance to open the conversation.',
    },
    {
      name: 'Delivery against the list',
      text: `${typical}. You review the work against the written list. A change that is outside the list is a new quote.`,
    },
  ]
}

const STANDARD_PREREQUISITES = [
  'A short brief: what you offer, who it is for, and what the finished work must include.',
  'The person who can approve the quote.',
  'Logins, brand files, or an existing site only when the work changes something you already have.',
]

function standardFaqs(service: ServiceFacts, deliverables: string[]): { question: string; answer: string }[] {
  const included = deliverables.length
    ? deliverables.join('; ')
    : 'The items written in the quote. This page is the starting point, and the quote is the list you approve.'
  return [
    {
      question: `How long does ${service.name} take?`,
      answer: service.duration_days
        ? `${service.duration_days} days is the listed typical duration for ${service.name}. The quote states the date for your brief.`
        : `The quote states the delivery date for ${service.name}.`,
    },
    {
      question: 'What happens after I request this?',
      answer: QUOTE,
    },
    {
      question: 'What is included?',
      answer: included,
    },
    {
      question: 'What do I need to provide before work starts?',
      answer: STANDARD_PREREQUISITES.join(' '),
    },
    {
      question: 'Can the scope change after I approve?',
      answer: 'Yes, as a new written quote. The approved list is the work that the fixed price covers.',
    },
    {
      question: 'Do you guarantee rankings, traffic, views, or revenue?',
      answer:
        'No. A report can include numbers that were measured. A ranking, a traffic total, a view count, a citation in an AI answer, or revenue is not part of the quote.',
    },
  ]
}

function link(category: string, slug: string, label: string): PageLink {
  return { href: serviceHref({ category, slug }), label }
}

const DETAILS: Record<string, Omit<ServicePageContent, 'faqs'> & { faqs?: ServicePageContent['faqs'] }> = {
  'astrology-website-development': {
    sections: [
      {
        heading: 'What this website can include',
        paragraphs: [
          'The starting point is the Landing Page package already in the catalog: five mobile-responsive pages, a contact form, basic on-page setup, social links, and hosting when the quote includes it. For an astrology practice those pages are typically a home page, an about page, a services page, a booking or contact page, and one content page. The quote names the actual set.',
          'The listed starting price is ₹5,000. Most practices are quoted individually once the page list and any extra tools are known.',
        ],
      },
      {
        heading: 'Kundli and horoscope tools',
        paragraphs: [
          'Kundli or horoscope features are not included in the ₹5,000 page package. They can be scoped from the AI Horoscope & Kundali API, which lists daily horoscope, kundali generation, compatibility matching and muhurta APIs, and is described as white-label ready. That service starts at ₹29,999.',
          'This page does not claim that a finished astrology website has already shipped. The quote is the record of what will be built.',
        ],
      },
      {
        heading: 'Booking, chat and contact',
        paragraphs: [
          'The page package includes a contact form. An AI chatbot for questions or appointment requests is the separate AI Chatbot Automation service, from ₹5,999, or AI Chatbot Development when the brief needs a custom bot. WhatsApp can be added from the WhatsApp Business API service. Each of those is its own line in the quote.',
        ],
      },
      {
        heading: 'Who it is for',
        paragraphs: [
          'The same website scope is used for vastu consultants and other spiritual practitioners. Businesses outside those fields use the same five-page package and the rest of the catalog. Delivery is remote and worldwide. The studio address is in Indore, and the quote can include Hindi or English copy.',
        ],
      },
    ],
    deliverables: [],
    prerequisites: [
      'The services you want listed, and whether the site is in Hindi, English, or both.',
      'A decision on whether kundli tools, a chatbot, or WhatsApp are in this quote or a later one.',
      'Logo and any text you already use, if you have them. We can write the page copy from a brief if the quote says so.',
    ],
    process: [],
    links: [
      link('Web Development', 'landing-page-5-pages', 'Landing Page (5 Pages)'),
      link('Web Development', 'vastu-consultant-website', 'Vastu consultant website'),
      link('AI Automation', 'ai-horoscope-kundali-api', 'AI Horoscope & Kundali API'),
      link('AI Automation', 'ai-chatbot-automation', 'AI automation for astrologers and businesses'),
      link('AI', 'ai-chatbot-development', 'AI chatbot development'),
      link('Marketing', 'seo-for-astrologers', 'SEO for astrologers'),
      link('AI Automation', 'whatsapp-business-api-setup', 'WhatsApp Business API setup'),
      { href: '/insights/what-an-astrology-website-includes', label: 'What an astrology website includes' },
      { href: '/about', label: 'About KALKI Intelligence' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  'vastu-consultant-website': {
    sections: [
      {
        heading: 'What this website can include',
        paragraphs: [
          'A vastu consultancy site starts from the same five-page package as any other practice site, listed at ₹5,000. The quote names the pages, usually home, about, consultation types, a contact or booking page, and one explanatory page.',
          'Floor plans, calculators, or client portals are not part of that package. If you need them, they are described and priced in the same quote or in a follow-up quote.',
        ],
      },
      {
        heading: 'Marketing beside the site',
        paragraphs: [
          'The website and the marketing are separate lines. Vastu consultant marketing covers content and on-page work from ₹19,999. A larger search engagement uses SEO for the same kind of practice, or Enterprise SEO from ₹49,999. Neither line promises a ranking.',
        ],
      },
    ],
    deliverables: [],
    prerequisites: [
      'The consultation types you want on the site, and the languages of the pages.',
      'Whether the first quote is the site only, or the site plus a marketing line.',
      'Photographs or a logo if you want them used. Stock decisions are written in the quote.',
    ],
    process: [],
    links: [
      link('Marketing', 'vastu-consultant-marketing', 'Vastu consultant marketing'),
      link('Web Development', 'astrology-website-development', 'Astrology website development'),
      link('Web Development', 'landing-page-5-pages', 'Landing Page (5 Pages)'),
      link('Marketing', 'aeo-geo-services', 'AEO and GEO services'),
      { href: '/contact', label: 'Contact' },
    ],
  },
  'seo-for-astrologers': {
    sections: [
      {
        heading: 'What the SEO work covers',
        paragraphs: [
          'The work is the Enterprise SEO list: competitor analysis, on-page SEO, link building and a monthly report. That list is what can be put in a written scope for an astrology practice. Rankings, traffic gains and AI-search citations are not in the offer.',
        ],
      },
      {
        heading: 'How progress is reported',
        paragraphs: [
          'Monthly reporting is a listed deliverable. The report can include rankings, enquiries and traffic sources that were actually measured. A measured number is a record. It is not a promise of the next month’s position.',
        ],
      },
      {
        heading: 'Website and content',
        paragraphs: [
          'SEO assumes there is a site to improve. If you need the site as well, astrology website development is a separate scope and can be written at the same time. Content pages, including Hindi or English articles about consultations, are included only when the quote lists them.',
          'The same SEO scope can be written for a vastu consultancy. See Vastu consultant marketing for the smaller content package.',
        ],
      },
      {
        heading: 'Price and timing',
        paragraphs: [
          'Enterprise SEO, and this astrology scope, lists a starting price of ₹49,999 and a typical duration of 30 days. Both depend on the written quote. ₹0 advance means you can send the brief before paying.',
        ],
      },
    ],
    deliverables: [],
    prerequisites: [
      'The site address, or a decision to scope a new site at the same time.',
      'The services and cities or countries you want the pages to mention. Mentioning a place is not a ranking promise for that place.',
      'Access to the site or the analytics account when the work is on an existing property.',
    ],
    process: [],
    faqs: [
      {
        question: 'What does the SEO work include?',
        answer: 'Competitor analysis, on-page SEO, link building and a monthly report, each confirmed in the written quote before work starts.',
      },
      {
        question: 'Do you guarantee rankings?',
        answer: 'No. We do not promise rankings, traffic gains, or citations in AI answers. The monthly report shares the numbers that were measured.',
      },
      {
        question: 'How much does it cost and when do I pay?',
        answer: 'The starting price is ₹49,999, pending a written quote. Nothing is paid to receive the quote. A written quote comes within 24 hours. The listed duration is 30 days and the quote states your date.',
      },
      {
        question: 'Can this be combined with a new astrology website?',
        answer: 'Yes. The website and the SEO are separate lines and can be in one quote. Kundli tools and chatbots are further lines, taken from those service pages.',
      },
    ],
    links: [
      link('Marketing', 'enterprise-seo', 'Enterprise SEO'),
      link('Web Development', 'astrology-website-development', 'Astrology website development'),
      link('Web Development', 'landing-page-5-pages', 'Landing Page (5 Pages)'),
      link('Marketing', 'aeo-geo-services', 'AEO and GEO services'),
      link('Marketing', 'vastu-consultant-marketing', 'Vastu consultant marketing'),
      { href: '/insights/seo-for-astrologers-without-a-ranking-promise', label: 'SEO for astrologers, without a ranking promise' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  'vastu-consultant-marketing': {
    sections: [
      {
        heading: 'What this marketing includes',
        paragraphs: [
          'The starting scope follows the published content-marketing package at ₹19,999: pages or articles named in the quote, on-page titles and headings, and a written report of the work. It is the right floor for a consultancy that needs clear service pages.',
          'Competitor analysis, link building and a fuller monthly search report are the Enterprise SEO service, from ₹49,999. That work is added as its own line. It still does not include a ranking promise.',
        ],
      },
      {
        heading: 'The website',
        paragraphs: [
          'Marketing needs a site, or a site scoped at the same time. The vastu consultant website starts at ₹5,000 for the five-page package. The two quotes can be written together.',
        ],
      },
    ],
    deliverables: [],
    prerequisites: [
      'The consultation types and the questions clients already ask.',
      'A site, or agreement to scope one.',
      'Any city or country you want named on the pages. Naming a place describes where you work. It is not a local-ranking promise.',
    ],
    process: [],
    links: [
      link('Web Development', 'vastu-consultant-website', 'Vastu consultant website'),
      link('Marketing', 'content-marketing', 'Content marketing'),
      link('Marketing', 'enterprise-seo', 'Enterprise SEO'),
      link('Marketing', 'seo-for-astrologers', 'SEO for astrologers'),
      { href: '/contact', label: 'Contact' },
    ],
  },
  'aeo-geo-services': {
    sections: [
      {
        heading: 'What AEO means here',
        paragraphs: [
          'Answer-engine work means the page states the answer in the opening sentences, uses headings that match the question, and shows an FAQ whose text is the same text in the FAQ structured data. We do not add a FAQ schema for questions the page does not show.',
        ],
      },
      {
        heading: 'What GEO means here',
        paragraphs: [
          'Generative-engine work means a consistent, specific description of the business: legal name, what it sells, the studio address, and that delivery is worldwide. The same facts appear on the page and in the Organization structured data. A citation in ChatGPT, Perplexity, Google AI Overviews, or any other system is not part of the offer.',
        ],
      },
      {
        heading: 'How this differs from SEO',
        paragraphs: [
          'Enterprise SEO is competitor analysis, on-page SEO, link building and monthly reporting, from ₹49,999. AEO and GEO use that same starting price because the effort is a structured audit and a rewrite, not a blog post. The quote says which pages are in scope. Traditional SEO can be a second line. Neither line promises a position or a citation.',
        ],
      },
    ],
    deliverables: [],
    prerequisites: [
      'The pages you want rewritten, or agreement that we propose the list in the quote.',
      'The facts we are allowed to publish: name, services, and service area.',
      'Access to the site when the work edits an existing property.',
    ],
    process: [],
    links: [
      link('Marketing', 'enterprise-seo', 'Enterprise SEO'),
      link('Marketing', 'seo-for-astrologers', 'SEO for astrologers'),
      link('Web Development', 'astrology-website-development', 'Astrology website development'),
      { href: '/insights/what-aeo-and-geo-mean', label: 'What AEO and GEO mean' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  'whatsapp-business-api-setup': {
    sections: [
      {
        heading: 'What the setup includes',
        paragraphs: [
          'The service connects WhatsApp Business API to the site or inbox named in the quote. The work is the Meta app configuration we control, the webhook, a template list drafted with you, one test conversation, and handover notes. The starting price is ₹14,999, in the same band as the published email-automation setup, and above the ₹5,999 chatbot package because the API connection is a separate piece of work.',
        ],
      },
      {
        heading: 'What Meta still has to approve',
        paragraphs: [
          'Meta approves the business account, the display name and the message templates. KALKI Intelligence can prepare the submission. Meta’s decision is not a deliverable we can promise. If Meta refuses an account or a template, the quote covers the setup work already described, and a resubmission is written as a change if it was not included.',
        ],
      },
      {
        heading: 'Inbox and automation',
        paragraphs: [
          'This service ends at a working API connection and the test flow. A shared inbox for WhatsApp, Instagram and Messenger is the Omnichannel DM CRM. Automated replies are AI Chatbot Automation or AI Chatbot Development. Each is quoted on its own page.',
        ],
      },
    ],
    deliverables: [],
    prerequisites: [
      'A Meta Business account, or a willingness to create one before build starts.',
      'A phone number you control that can receive the verification code.',
      'The destination: an existing site, a new site, or the omnichannel inbox.',
      'The messages you actually want to send. Templates are drafted from that list.',
    ],
    process: [],
    links: [
      link('Development', 'omnichannel-dm-crm', 'Omnichannel DM CRM'),
      link('AI Automation', 'ai-chatbot-automation', 'AI chatbot automation'),
      link('AI', 'ai-chatbot-development', 'AI chatbot development'),
      link('Marketing', 'email-marketing-automation', 'Email marketing automation'),
      { href: '/insights/whatsapp-business-api-before-a-quote', label: 'What to prepare before a WhatsApp API quote' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  'omnichannel-dm-crm': {
    sections: [
      {
        heading: 'What the CRM is',
        paragraphs: [
          'Omnichannel DM CRM development is one inbox and one contact record for the channels the quote names. The usual set is WhatsApp, Instagram and Facebook Messenger. A further channel is included only when the quote names it. A person on your team replies from that inbox. The starting price is ₹79,999, between the published admin dashboard at ₹19,999 and custom software at ₹1,99,999, because this is a focused product rather than a blank-slate system. The listed duration is 45 days.',
        ],
      },
      {
        heading: 'What it is not',
        paragraphs: [
          'It is not a chatbot. Automated replies can be added from AI Chatbot Automation, from ₹5,999, or from a custom bot. WhatsApp Business API setup is a separate line when the number is not already connected. Putting those lines in one quote is normal. Leaving them out is also normal.',
        ],
      },
      {
        heading: 'Who it is for',
        paragraphs: [
          'Astrology practices, vastu consultancies and other businesses use the same inbox when more than one messaging app is how clients write in. The quote names the channels. Delivery is remote and worldwide.',
        ],
      },
    ],
    deliverables: [],
    prerequisites: [
      'The channel list. A channel we cannot access with your accounts cannot be in the build.',
      'The people who will reply, and whether conversations are assigned.',
      'WhatsApp Business API access if WhatsApp is on the list. That setup can be a line in the same quote.',
    ],
    process: [],
    links: [
      link('AI Automation', 'whatsapp-business-api-setup', 'WhatsApp Business API setup'),
      link('AI Automation', 'ai-chatbot-automation', 'AI chatbot automation'),
      link('Development', 'standard-admin-dashboard', 'Standard admin dashboard'),
      link('Development', 'custom-software-development', 'Custom software development'),
      { href: '/insights/omnichannel-inbox-and-a-chatbot', label: 'Inbox and chatbot, compared' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  'youtube-content-for-astrologers': {
    sections: [
      {
        heading: 'What a video package includes',
        paragraphs: [
          'The package is a planned number of YouTube or short-form videos: a content plan, a script or shot list, an edit, a title and a description, and the exported files. The starting price is ₹9,999, the same floor as the published cinematic and motion-graphics package. The quote states the video count. A monthly retainer is a different quote, and this page does not invent a retainer price.',
        ],
      },
      {
        heading: 'Filming and footage',
        paragraphs: [
          'The default is an edit of footage you provide. A shoot, a presenter, or motion graphics beyond a straightforward edit are in the quote only when they are written there. The cinematic package on the Media page is the reference for a heavier edit.',
        ],
      },
      {
        heading: 'Views are not a deliverable',
        paragraphs: [
          'People ask for this work when they want videos that travel. The deliverable is the video and the metadata in the quote. A view count, a subscriber count, or a viral outcome is not in the quote. Social posting can be scoped from SMO and social marketing, which is also reported in writing and also has no view promise.',
        ],
      },
    ],
    deliverables: [],
    prerequisites: [
      'The number of videos and the language.',
      'Footage, or a decision that filming is part of the quote.',
      'The claims you are willing to say on camera. We will not script a result you cannot stand behind, and we will not invent a client story.',
    ],
    process: [],
    links: [
      link('Media', 'cinematic-motion-graphics', 'Cinematic and motion graphics'),
      link('Media', 'basic-video-editing', 'Basic video editing'),
      link('Marketing', 'smo-viral-marketing', 'Social marketing'),
      link('Web Development', 'astrology-website-development', 'Astrology website development'),
      { href: '/insights/youtube-content-for-astrologers', label: 'YouTube content for astrologers' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  'custom-ai-development': {
    sections: [
      {
        heading: 'What hiring an AI developer means here',
        paragraphs: [
          'Custom AI agent development is a written list of what the agent does, which systems it may call, and what a person still approves. It is not a promise of unnamed staff hours. If the quote is a block of days, the quote says how many days and what those days produce.',
          'The starting price is the figure on this page. KALKI Intelligence publishes it as a floor for a scoped agent, not as a day rate you can multiply in your head.',
        ],
      },
      {
        heading: 'What is in the scope',
        paragraphs: [
          'A typical scope names the job of the agent, the data it may read, the action it may take, and how a person reviews the result. A chatbot that only answers questions is the separate AI chatbot service. A workflow in n8n is the separate n8n service. Those are different pages so the price matches the job.',
        ],
      },
    ],
    deliverables: [],
    prerequisites: [
      'The task the agent should perform, and the task it must not perform.',
      'Access to the systems it needs, or a decision that those connections are out of scope.',
      'The person who approves the quote and the person who reviews the agent’s output.',
    ],
    process: [],
    links: [
      link('AI', 'ai-chatbot-development', 'AI chatbot development'),
      link('AI Automation', 'n8n-workflow-automation', 'n8n workflow automation'),
      link('AI Automation', 'ai-chatbot-automation', 'AI automation services'),
      { href: '/insights/how-to-hire-an-ai-developer', label: 'How to hire an AI developer' },
      { href: '/about', label: 'Facts about KALKI Intelligence' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  'ai-chatbot-development': {
    sections: [
      {
        heading: 'What this chatbot is',
        paragraphs: [
          'AI chatbot development is a custom bot for the channels the quote names: a site widget, an app, or another channel written down. The starting point is a list of questions it may answer and the point where it hands the conversation to a person.',
          'A WhatsApp-only bot is a separate page, WhatsApp Chatbot for Business, from ₹5,999. The WhatsApp Business API connection is a third page, from ₹14,999. Buying this custom bot does not buy those two.',
        ],
      },
    ],
    deliverables: [],
    prerequisites: [
      'The questions the bot should answer, and the questions it should refuse.',
      'The channel. If it is WhatsApp, say so, and we will point the quote at the WhatsApp pages if that is the smaller fit.',
      'Sample answers you are willing to stand behind. We will not invent a client story for the bot to repeat.',
    ],
    process: [],
    links: [
      link('AI Chatbots', 'whatsapp-chatbot-for-business', 'WhatsApp chatbot for business'),
      link('AI Automation', 'whatsapp-business-api-setup', 'WhatsApp API integration'),
      link('AI', 'custom-ai-development', 'Custom AI agent development'),
      { href: '/contact', label: 'Contact' },
    ],
  },
  'ai-horoscope-kundali-api': {
    sections: [
      {
        heading: 'What kundali software development means here',
        paragraphs: [
          'This service is an API: daily horoscope, kundli generation, compatibility matching, and muhurta, for a website or app you already have or that we scope separately. It is described as white-label ready. The published starting price is ₹29,999.',
          'It is not an astrology website and it is not an astrology app. Those are separate products, from ₹5,000 and ₹12,000. The API is added only when the quote names it.',
        ],
      },
    ],
    deliverables: [],
    prerequisites: [
      'The calculations you want: horoscope, kundli, compatibility, muhurta, or a subset.',
      'The site or app that will call the API, or a decision to scope that product as well.',
      'The language of any text the API returns, if text is in scope.',
    ],
    process: [],
    links: [
      link('Web Development', 'astrology-website-development', 'Astrology website development'),
      link('App Development', 'astrology-app-development', 'Astrology app development'),
      { href: '/insights/what-kundali-software-includes', label: 'What kundali software includes' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  'whatsapp-chatbot-for-business': {
    sections: [
      {
        heading: 'The bot, not the API',
        paragraphs: [
          'A WhatsApp chatbot for business is the set of replies named in the quote, on one WhatsApp number. The starting price is ₹5,999, the same floor as AI chatbot automation, because the job is the conversation, not the Meta connection.',
          'If the number is not already on the WhatsApp Business API, that connection is the WhatsApp API integration service, from ₹14,999. Meta approves the account and the templates. That approval is not something either service can promise.',
        ],
      },
      {
        heading: 'How this differs from a custom bot',
        paragraphs: [
          'AI chatbot development is the custom bot when the channel is not only WhatsApp, or when the logic is larger than a defined reply flow. Use this page when the brief is WhatsApp replies. Use the other page when the brief is a bot you will also put on a site or an app.',
        ],
      },
    ],
    deliverables: [],
    prerequisites: [
      'The flows: what the person asks, and what the bot may reply.',
      'The WhatsApp number, and whether it is already on the Business API.',
      'A person who will take over when the bot cannot answer.',
    ],
    process: [],
    links: [
      link('AI Automation', 'whatsapp-business-api-setup', 'WhatsApp API integration'),
      link('AI', 'ai-chatbot-development', 'AI chatbot development'),
      link('Development', 'omnichannel-dm-crm', 'Unified inbox and omnichannel CRM'),
      { href: '/insights/whatsapp-chatbot-versus-the-api', label: 'WhatsApp chatbot versus the API' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  'n8n-workflow-automation': {
    sections: [
      {
        heading: 'What the n8n work is',
        paragraphs: [
          'n8n automation here means the workflows named in the quote, built in n8n, connecting the apps the quote names. The starting price is ₹14,999, the same floor as the published email-automation setup. The listed duration is 21 days.',
          'KALKI Intelligence is not an n8n partner. We do not sell n8n licences, and a badge is not part of the delivery. If the quote names a different tool, this is the wrong page. General lead and booking automation is the AI automation service, from ₹5,999.',
        ],
      },
      {
        heading: 'What you still operate',
        paragraphs: [
          'You keep the n8n account, the app credentials, and the decision about where it is hosted. We hand over a runbook that says what each workflow does and how to turn it off. A workflow that is not in the quote is a new quote.',
        ],
      },
    ],
    deliverables: [],
    prerequisites: [
      'The steps, in order, and the apps at each step.',
      'An n8n account, or a decision that creating one is part of the quote.',
      'Credentials you are willing to store in that account.',
    ],
    process: [],
    links: [
      link('AI Automation', 'ai-chatbot-automation', 'AI automation services'),
      link('Marketing', 'email-marketing-automation', 'Email marketing automation'),
      link('AI', 'custom-ai-development', 'Custom AI agent development'),
      { href: '/insights/what-an-n8n-automation-scope-includes', label: 'What an n8n scope includes' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  'astrology-app-development': {
    sections: [
      {
        heading: 'What the app includes',
        paragraphs: [
          'Astrology app development starts from the same floor as the simple business app, ₹12,000. The quote names the screens. A usual first set is a home screen, a services screen, and a way to request a consultation. iOS, Android, or both is a line in the quote.',
          'Kundli generation is not inside ₹12,000. That is the kundali software API, from ₹29,999. A website is the five-page package, from ₹5,000. Store listing is included only when the quote says so. Apple and Google decide whether a build is approved.',
        ],
      },
    ],
    deliverables: [],
    prerequisites: [
      'The screens and the language.',
      'Whether the first release is iOS, Android, or both.',
      'Whether kundli tools or a website are in this quote or a later one.',
    ],
    process: [],
    links: [
      link('App Development', 'simple-business-app', 'Simple business app'),
      link('Web Development', 'astrology-website-development', 'Astrology website development'),
      link('AI Automation', 'ai-horoscope-kundali-api', 'Kundali software'),
      { href: '/insights/astrology-app-or-website', label: 'App or website for a practice' },
      { href: '/contact', label: 'Contact' },
    ],
  },
}

export function buildServicePageContent(service: ServiceFacts): ServicePageContent {
  const fromCatalog = featureList(service.features)
  const custom = DETAILS[service.slug]
  const deliverables = fromCatalog.length ? fromCatalog : custom?.deliverables ?? []
  const process = custom?.process?.length ? custom.process : standardProcess(service.name, service.duration_days)
  const prerequisites = custom?.prerequisites?.length ? custom.prerequisites : STANDARD_PREREQUISITES
  const sections = custom?.sections ?? [
    {
      heading: 'How a project is priced',
      paragraphs: [
        `${service.name} is listed from ${inr(service.price)}. That figure is a starting price. The written quote is the price you approve, and it names the deliverables, the revisions included, and the date.`,
        QUOTE,
      ],
    },
  ]
  const faqs = custom?.faqs ?? standardFaqs(service, deliverables)
  const links = custom?.links ?? [
    { href: '/marketplace', label: 'All services' },
    { href: '/insights', label: 'Notes and articles' },
    { href: '/request', label: 'Request a quote' },
    { href: '/contact', label: 'Contact' },
  ]

  return { sections, deliverables, prerequisites, process, faqs, links }
}
