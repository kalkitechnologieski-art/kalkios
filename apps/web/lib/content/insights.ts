import { serviceHref } from '@/lib/services/href'

export interface InsightArticle {
  slug: string
  title: string
  description: string
  datePublished: string
  dateModified: string
  sections: { heading: string; paragraphs: string[] }[]
  faqs: { question: string; answer: string }[]
  links: { href: string; label: string }[]
}

const PUBLISHED = '2026-11-19T00:00:00.000Z'

function svc(category: string, slug: string, label: string) {
  return { href: serviceHref({ category, slug }), label }
}

export const INSIGHTS: InsightArticle[] = [
  {
    slug: 'what-an-astrology-website-includes',
    title: 'What an astrology website development project includes',
    description:
      'An astrology website at KALKI Intelligence is a written page list, priced before work starts. The five-page floor is ₹5,000. Kundli tools are a separate service.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'An astrology website development project is the set of pages and functions named in a written quote. The catalog floor is the five-page website at ₹5,000: a mobile-responsive layout, a contact form, basic on-page titles and headings, and hosting when the quote includes hosting. You pay nothing to receive the quote. Work starts after you approve it.',
          'Kundli generation, daily horoscopes, compatibility and muhurta are not inside that ₹5,000. They are the AI Horoscope & Kundali API, listed from ₹29,999, and only if the quote adds that line. This article does not describe a site we claim to have already launched. It describes the scope you can buy.',
        ],
      },
      {
        heading: 'A practical page list',
        paragraphs: [
          'Five pages is enough for many practices: home, about, services, booking or contact, and one article or language page. Hindi, English, or both is a line in the quote, not an assumption. If you want a client login, a payment gateway, or a multi-astrologer directory, say so in the brief. Those are extra scope, and the quote either includes them or it does not.',
          'The same page pattern is what we use for a vastu consultant website. A business that is not a spiritual practice uses the same five-page product. The catalog is one studio, two audiences: practitioners, and everyone else.',
        ],
      },
      {
        heading: 'What to send with the brief',
        paragraphs: [
          'Send the services you offer, the language, and whether tools or WhatsApp belong in the first quote. A logo and any text you already trust are useful. If you have neither, the quote can include writing the pages from the brief. The delivery date is whatever the quote states. The listed typical duration for the practice website is 30 days.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the starting price for an astrology website?',
        answer: '₹5,000 for the five-page package, pending a written quote. Tools such as kundli are priced separately, from ₹29,999 for the horoscope and kundali API.',
      },
      {
        question: 'Do I pay to get the quote?',
        answer: 'No. ₹0 advance means you approve the written quote before any payment. It does not mean the build is free.',
      },
    ],
    links: [
      svc('Web Development', 'astrology-website-development', 'Astrology website development'),
      svc('Web Development', 'vastu-consultant-website', 'Vastu consultant website'),
      svc('AI Automation', 'ai-horoscope-kundali-api', 'AI Horoscope & Kundali API'),
      svc('Web Development', 'landing-page-5-pages', 'Landing Page (5 Pages)'),
    ],
  },
  {
    slug: 'seo-for-astrologers-without-a-ranking-promise',
    title: 'SEO for astrologers, without a ranking promise',
    description:
      'SEO for an astrology practice is competitor analysis, on-page work, link building and a monthly report. From ₹49,999. A Google position is not included.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'SEO for astrologers at KALKI Intelligence is the Enterprise SEO scope written for a practice: competitor analysis, on-page SEO, link building, and a monthly report. The published starting price is ₹49,999. The report may show rankings that were measured. A number-one position, a page of traffic, or a mention inside an AI answer is not something the quote sells.',
          'That boundary is the whole point of the page. A studio can do the work and show the measurements. It cannot honestly sell the algorithm’s next decision.',
        ],
      },
      {
        heading: 'What has to exist first',
        paragraphs: [
          'There has to be a website, or a website in the same quote. Astrology website development starts at ₹5,000 for five pages and includes basic on-page setup. Basic setup is not a substitute for the SEO engagement. They are different lines so you can buy one without the other.',
          'Content pages about consultations, in Hindi or English, are part of SEO only when the quote lists them. Naming a city on a page describes where you are willing to work. It is not a local-ranking product, and the studio does not sell “SEO in Indore” as the offer. Clients are worldwide. The office happens to be in Indore.',
        ],
      },
      {
        heading: 'How you read the monthly report',
        paragraphs: [
          'The report lists the work done and the numbers available from the tools you gave us access to: rankings checked, enquiries, traffic sources. If a number is missing because there is no analytics access, the report says that. The next month is still not guaranteed to match a target. Vastu consultancies can use the same reporting rule. Their smaller starting package is content and on-page work from ₹19,999.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Will you promise the first page of Google?',
        answer: 'No. The quote lists analysis, on-page work, links and a report. It does not list a position.',
      },
      {
        question: 'What is the starting price?',
        answer: '₹49,999, which is the published Enterprise SEO floor. The written quote can be higher once the page count and the link work are known. Nothing is paid to receive it.',
      },
    ],
    links: [
      svc('Marketing', 'seo-for-astrologers', 'SEO for astrologers'),
      svc('Marketing', 'enterprise-seo', 'Enterprise SEO'),
      svc('Marketing', 'vastu-consultant-marketing', 'Vastu consultant marketing'),
      svc('Web Development', 'astrology-website-development', 'Astrology website development'),
    ],
  },
  {
    slug: 'whatsapp-business-api-before-a-quote',
    title: 'What to have ready before a WhatsApp Business API setup',
    description:
      'WhatsApp Business API setup needs a Meta business account, a phone number you control, and a message list. KALKI Intelligence quotes the connection from ₹14,999.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'WhatsApp Business API setup and integration is the connection between a Meta business account and the site or inbox in the quote. KALKI Intelligence lists it from ₹14,999. You need three things before that quote can be specific: a Meta Business account, a phone number you control, and the messages you actually want to send. Meta, not the studio, approves the account and the templates.',
        ],
      },
      {
        heading: 'What the price covers',
        paragraphs: [
          'The floor sits next to the published email-automation setup at ₹14,999, and above chatbot automation at ₹5,999, because the API app, webhook and template draft are a different job from a chat widget. The quote includes a setup checklist, the webhook, a template list drafted with you, one test conversation, and handover notes. A resubmission after a Meta refusal is included only if the quote says so.',
          'The WhatsApp Business app on a phone and the Business API are different products. This service is the API. If you only need a click-to-chat button on a website, say that. It may be a smaller line on the website quote rather than this one.',
        ],
      },
      {
        heading: 'Where the messages go',
        paragraphs: [
          'The API has to land somewhere. That destination is an existing site, a site we are also building, or the omnichannel inbox. The inbox is a separate product from ₹79,999 and holds WhatsApp, Instagram and Messenger on one contact record. A bot that replies by itself is a third line. Buying the API does not buy the inbox or the bot.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can you guarantee Meta will approve the account?',
        answer: 'No. We prepare the setup and the templates. Meta approves or refuses them.',
      },
      {
        question: 'What does ₹14,999 buy?',
        answer: 'It is the starting price for the API connection, webhook, template draft, one test flow and handover. The written quote is the price you approve.',
      },
    ],
    links: [
      svc('AI Automation', 'whatsapp-business-api-setup', 'WhatsApp Business API setup'),
      svc('Development', 'omnichannel-dm-crm', 'Omnichannel DM CRM'),
      svc('AI Automation', 'ai-chatbot-automation', 'AI chatbot automation'),
    ],
  },
  {
    slug: 'what-aeo-and-geo-mean',
    title: 'What AEO and GEO mean for a service business',
    description:
      'AEO is answer-first pages with FAQs that match the schema. GEO is a consistent description of the business. Neither is a promise that an AI will cite you.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'AEO, answer-engine optimization, means a person and a crawler can find the answer in the first sentences, in a heading, and in an FAQ that is visible on the page. GEO, generative-engine optimization, means the business is described the same way everywhere we control: name, services, studio address, and where delivery happens. KALKI Intelligence sells that work as AEO and GEO services from ₹49,999. A citation in an AI product is not included.',
        ],
      },
      {
        heading: 'What we change on a page',
        paragraphs: [
          'We read the page and list the questions it is trying to answer. The opening paragraph should answer one of them without a preamble. The FAQ structured data is generated from those visible questions, not from a second list that mentions checkout buttons or claims the page does not make. If a page says the work starts with a written quote, the schema says that too.',
          'For GEO, we write a short factual description and use it on the page and in the organization data. KALKI Intelligence’s own version is: an AI and development tech partner for astrologers, vastu consultants, other spiritual practitioners, and businesses in every industry, with a studio in Indore and delivery worldwide. That sentence is specific. “Best AI company” is not a fact we will publish about you or about us.',
        ],
      },
      {
        heading: 'What this does not do',
        paragraphs: [
          'It does not buy mentions in ChatGPT, Gemini, Perplexity, or Google AI Overviews. Those products choose their sources. The monthly value of the work is the pages and the report of what changed, which is why the price sits with Enterprise SEO rather than with a single blog post. Traditional SEO, link building included, remains a separate line and has the same rule: no ranking promise.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is AEO the same as SEO?',
        answer: 'No. SEO here is competitor analysis, on-page work, links and a report. AEO is the answer structure and the matching FAQ data. A quote can include one or both.',
      },
      {
        question: 'Will this make ChatGPT recommend my business?',
        answer: 'That is not a deliverable. The deliverable is the pages, the visible FAQs, the matching structured data, and a written description of the business.',
      },
    ],
    links: [
      svc('Marketing', 'aeo-geo-services', 'AEO and GEO services'),
      svc('Marketing', 'enterprise-seo', 'Enterprise SEO'),
      svc('Marketing', 'seo-for-astrologers', 'SEO for astrologers'),
    ],
  },
  {
    slug: 'omnichannel-inbox-and-a-chatbot',
    title: 'How an omnichannel inbox differs from a chatbot',
    description:
      'An omnichannel DM CRM is one inbox for WhatsApp, Instagram and Messenger. A chatbot sends automated replies. They are separate products with separate prices.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'An omnichannel DM CRM is a shared inbox. Messages from the channels in the quote, usually WhatsApp, Instagram and Facebook Messenger, land on one contact record that a person replies to. A chatbot sends replies without that person. KALKI Intelligence builds them as different products. The inbox starts at ₹79,999. Chatbot automation starts at ₹5,999. WhatsApp Business API setup, from ₹14,999, is the connection the inbox needs when WhatsApp is one of the channels.',
        ],
      },
      {
        heading: 'What the inbox contains',
        paragraphs: [
          'The quote lists the channels, a contact record, assignment to a person, a status field, export, and admin access. A channel we cannot reach with your accounts is not in the build. Adding email, Telegram, or a website chat widget is possible only as a named line. The listed duration is 45 days. The price sits between a standard admin dashboard at ₹19,999 and custom software at ₹1,99,999 because the inbox is a defined product, not an open-ended system.',
        ],
      },
      {
        heading: 'When you want both',
        paragraphs: [
          'A practice that wants after-hours answers and a human inbox buys both lines. The bot does not replace the CRM, and the CRM does not include the bot. Astrology and vastu businesses use this the same way a shop or a clinic does: the channel list changes, the product does not. Delivery is remote. Nothing is paid until the quote is approved.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does the CRM reply automatically?',
        answer: 'No. Replies are written by your team. Automated replies are the chatbot service, quoted separately.',
      },
      {
        question: 'Which channels are included?',
        answer: 'The ones the quote names. WhatsApp, Instagram and Messenger are the usual set. Any other channel has to be written down.',
      },
    ],
    links: [
      svc('Development', 'omnichannel-dm-crm', 'Omnichannel DM CRM development'),
      svc('AI Automation', 'whatsapp-business-api-setup', 'WhatsApp Business API setup'),
      svc('AI Automation', 'ai-chatbot-automation', 'AI chatbot automation'),
      svc('AI', 'ai-chatbot-development', 'AI chatbot development'),
    ],
  },
  {
    slug: 'youtube-content-for-astrologers',
    title: 'YouTube content for astrologers: a production scope, not a view count',
    description:
      'A YouTube package for an astrology practice is a planned set of videos, scripts and edits. From ₹9,999. Views and virality are not deliverables.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'YouTube content for astrologers is a production scope: how many videos, a script or shot list, an edit, titles and descriptions, and the exported files. The starting price is ₹9,999, the same floor as the cinematic and motion-graphics package. People request this when they want films that travel. The quote still sells the films, not the travel. A view count, a subscriber count, or a viral result is not a line item.',
        ],
      },
      {
        heading: 'Footage, language and claims',
        paragraphs: [
          'The default edit uses footage you supply. A shoot is in the quote only when it is written there. Language is part of the brief. We will not write a script that invents a client, a rating, or a result. If a sentence cannot be sourced, it does not go in the video. That rule is the same one used on the rest of the site: no fabricated reviews and no fabricated case studies.',
          'Posting the videos on a schedule can be discussed with the social marketing service. That service is also reported in writing and also does not promise reach. A website to send viewers to is the astrology website package, from ₹5,000, if you do not already have one.',
        ],
      },
      {
        heading: 'How to read the price',
        paragraphs: [
          '₹9,999 is a floor for the scope in the quote, not a price per viral hit and not a monthly retainer. If you want a video every week, the quote will say how many videos and what each one includes. The listed typical duration for a small package is 14 days. Heavier motion work points at the cinematic package on the Media page rather than at a guessed add-on.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you guarantee views or a viral video?',
        answer: 'No. The deliverables are the plan, the script or shot list, the edit, the titles and the files named in the quote.',
      },
      {
        question: 'What is the starting price?',
        answer: '₹9,999, matching the cinematic edit floor. The quote sets the video count and whether filming is included.',
      },
    ],
    links: [
      svc('Media', 'youtube-content-for-astrologers', 'YouTube content for astrologers'),
      svc('Media', 'cinematic-motion-graphics', 'Cinematic and motion graphics'),
      svc('Marketing', 'smo-viral-marketing', 'Social marketing'),
      svc('Web Development', 'astrology-website-development', 'Astrology website development'),
    ],
  },
  {
    slug: 'how-to-hire-an-ai-developer',
    title: 'How to hire an AI developer without buying unnamed hours',
    description:
      'Hiring an AI developer should start with the task, the data, and what a person still approves. KALKI Intelligence quotes custom agents from the price on that service page.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'Hire an AI developer by writing the job first: what the agent may do, what it must not do, and who reviews the output. KALKI Intelligence treats custom AI agent development as that written scope. The starting price is the figure on the service page, not a day rate. You pay nothing to receive the quote.',
          'A chatbot that answers a fixed list of questions is a smaller product. A workflow in n8n is a different product. Putting all three on one page would hide the price. They are separate so you can buy one.',
        ],
      },
      {
        heading: 'What to send',
        paragraphs: [
          'Send one task, the systems it needs, and an example of a good result and a bad result. If you do not have the example, say so. The quote can include writing the acceptance checks. It cannot include a claim that the agent will replace a team, because that is not a deliverable we can point at.',
        ],
      },
      {
        heading: 'What “best AI developer” usually hides',
        paragraphs: [
          'A page that ranks vendors is only honest if it shows the method and the sources. This one does not rank anyone, including KALKI Intelligence. The useful comparison is the written list: task, data, human review, price, and date. If a proposal does not have those five, you do not yet know what you are buying.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is the starting price a day rate?',
        answer: 'No. The figure on the custom AI development page is a floor for a scoped agent. The quote states the price for your brief.',
      },
      {
        question: 'Do you staff a developer into our team?',
        answer: 'Only if the quote says so, with the days and the output written down. The default offer is a scoped build, not unnamed hours.',
      },
    ],
    links: [
      svc('AI', 'custom-ai-development', 'Custom AI agent development'),
      svc('AI', 'ai-chatbot-development', 'AI chatbot development'),
      svc('AI Automation', 'n8n-workflow-automation', 'n8n workflow automation'),
    ],
  },
  {
    slug: 'whatsapp-chatbot-versus-the-api',
    title: 'WhatsApp chatbot versus WhatsApp API setup',
    description:
      'A WhatsApp chatbot is the replies, from ₹5,999. WhatsApp API integration is the Meta connection, from ₹14,999. They are different quotes.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'A WhatsApp chatbot for business is the conversation: the questions and the replies, from ₹5,999. WhatsApp API integration is the connection of that number to the WhatsApp Business API, from ₹14,999. You need the second only if the number is not already connected. Meta approves the account and the templates. Neither quote can promise that approval.',
        ],
      },
      {
        heading: 'Which brief is which',
        paragraphs: [
          'If you can already send template messages from a provider and you want replies for appointment questions, buy the chatbot. If you have a phone number and no API, buy the API setup, and add the chatbot only if you also want automated replies. A shared inbox for WhatsApp, Instagram, and Messenger is a third product, the omnichannel CRM, from ₹79,999.',
          'A custom bot that also lives on a website is AI chatbot development, not this WhatsApp page. The first paragraph of each service page says which job it is.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does the chatbot price include the API?',
        answer: 'No. The chatbot starts at ₹5,999. The API connection starts at ₹14,999. The quote lists the one you need, or both.',
      },
      {
        question: 'Can you guarantee WhatsApp will approve the templates?',
        answer: 'No. We prepare the setup and the template list. Meta approves or refuses them.',
      },
    ],
    links: [
      svc('AI Chatbots', 'whatsapp-chatbot-for-business', 'WhatsApp chatbot for business'),
      svc('AI Automation', 'whatsapp-business-api-setup', 'WhatsApp API integration'),
      svc('Development', 'omnichannel-dm-crm', 'Omnichannel CRM'),
    ],
  },
  {
    slug: 'what-kundali-software-includes',
    title: 'What kundali software development includes',
    description:
      'Kundali software at KALKI Intelligence is an API for horoscope, kundli, compatibility, and muhurta. From ₹29,999. A website or app is separate.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'Kundali software development on this site is the AI Horoscope and Kundali API: daily horoscope, kundli generation, compatibility matching, and muhurta, built to be called by a website or an app. The published starting price is ₹29,999. It is described as white-label ready. The quote names which of those four calls you want.',
          'The API does not include the website, from ₹5,000, or the app, from ₹12,000. Those products can call the API when the same quote, or a later quote, says so.',
        ],
      },
      {
        heading: 'What to decide first',
        paragraphs: [
          'Decide the calculations, the language of any text, and where the API will be called. If you do not have a site or an app yet, say that in the brief. We will not describe a finished kundli product we have not scoped, and this article does not claim one has already shipped.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is ₹29,999 the website as well?',
        answer: 'No. That figure is the API floor. The astrology website starts at ₹5,000 and the astrology app at ₹12,000.',
      },
      {
        question: 'Which calculations can be in the quote?',
        answer: 'Daily horoscope, kundli generation, compatibility matching, and muhurta. The quote can include a subset.',
      },
    ],
    links: [
      svc('AI Automation', 'ai-horoscope-kundali-api', 'Kundali software and horoscope API'),
      svc('Web Development', 'astrology-website-development', 'Astrology website development'),
      svc('App Development', 'astrology-app-development', 'Astrology app development'),
    ],
  },
  {
    slug: 'astrology-app-or-website',
    title: 'Astrology app or astrology website: which quote to start with',
    description:
      'Start with a website at ₹5,000 when people find you in a browser. Start with an app at ₹12,000 when the brief is a home screen. Kundli tools are a third line.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'Choose the astrology website, from ₹5,000, when the brief is pages in a browser: home, services, and a way to request a consultation. Choose the astrology app, from ₹12,000, when the brief is screens on a phone and the quote says iOS, Android, or both. Choose both only when the quote lists both. Kundli generation is neither of those prices. It is the API, from ₹29,999.',
        ],
      },
      {
        heading: 'What neither price includes',
        paragraphs: [
          'Store approval is Apple’s or Google’s decision. The app quote includes a store listing only when it says so. The website quote includes hosting only when it says so. Hindi or English is a line in the quote, not an assumption. A vastu consultancy uses the same split: a site from ₹5,000, and marketing from ₹19,999 if the brief is content rather than an app.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can one quote include the site and the app?',
        answer: 'Yes. They stay separate lines so each price is visible. The quote names both.',
      },
      {
        question: 'Does the app price include kundli charts?',
        answer: 'No. Charts and horoscope calls are the kundali API, from ₹29,999, if the quote adds that line.',
      },
    ],
    links: [
      svc('App Development', 'astrology-app-development', 'Astrology app development'),
      svc('Web Development', 'astrology-website-development', 'Astrology website development'),
      svc('AI Automation', 'ai-horoscope-kundali-api', 'Kundali software'),
    ],
  },
  {
    slug: 'what-to-ask-an-aeo-agency',
    title: 'What to ask an AEO agency before you buy AI search optimization',
    description:
      'Ask what will change on the page, whether the FAQ schema matches the visible FAQ, and whether a citation is promised. KALKI Intelligence does not promise citations.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'An AEO agency should be able to show the page that will change, the question it answers in the first sentences, and the FAQ whose visible text is the same text in the structured data. GEO, or generative engine optimization, should be a consistent description of who you are. AI search optimization is those two jobs together on this site, from ₹49,999. A citation in ChatGPT, Perplexity, or Google AI Overviews is not included.',
        ],
      },
      {
        heading: 'Questions that expose a weak offer',
        paragraphs: [
          'Ask which pages are in the quote. Ask whether the schema mentions a checkout step the page does not have. Ask what the monthly report contains if nobody cites you. A useful report lists the edits. A report that promises a mention in an AI product is selling a decision that product makes, not the work.',
          'This is not a ranking of agencies. KALKI Intelligence is one vendor with that boundary written down. Enterprise SEO, with links and a ranking report that still does not promise a position, is a different URL at the same starting price.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Will AI search optimization make an assistant recommend us?',
        answer: 'That is not a deliverable. The deliverable is the pages, the matching FAQs and schema, and a written description of the business.',
      },
      {
        question: 'Is this the same as SEO?',
        answer: 'No. SEO here is analysis, on-page work, links, and a report. AEO and GEO are the answer structure and the entity facts. A quote can include one or both.',
      },
    ],
    links: [
      svc('Marketing', 'aeo-geo-services', 'AEO and GEO services'),
      svc('Marketing', 'enterprise-seo', 'Enterprise SEO'),
      { href: '/about', label: 'Facts about KALKI Intelligence' },
    ],
  },
  {
    slug: 'what-an-n8n-automation-scope-includes',
    title: 'What an n8n automation scope includes',
    description:
      'An n8n scope is the workflows, the apps, and a runbook. From ₹14,999. KALKI Intelligence does not sell n8n licences or a partner badge.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'An n8n automation scope names each workflow, the apps it touches, and how you turn it off. KALKI Intelligence quotes that work from ₹14,999, the same floor as email-automation setup, with a listed duration of 21 days. We are not an n8n partner. The licence, if n8n charges one for your hosting, is yours.',
        ],
      },
      {
        heading: 'What to have ready',
        paragraphs: [
          'Write the steps in order. Name the account that will own the n8n instance. Say which credentials we may store. If a step needs an AI model, say what the model may see. General booking automation that is not an n8n workflow belongs on the AI automation page, from ₹5,999, not here.',
          'A workflow that messages clients on WhatsApp still needs the WhatsApp API if the number is not connected. That connection is a separate line. The n8n quote does not silently include it.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Are you an n8n partner?',
        answer: 'No. The delivery is the workflows in the quote and a runbook. A partner badge is not part of the offer.',
      },
      {
        question: 'What does ₹14,999 buy?',
        answer: 'It is the starting price for the workflows named in the quote. The written quote is the price you approve. Nothing is paid to receive it.',
      },
    ],
    links: [
      svc('AI Automation', 'n8n-workflow-automation', 'n8n workflow automation'),
      svc('AI Automation', 'ai-chatbot-automation', 'AI automation services'),
      svc('AI Automation', 'whatsapp-business-api-setup', 'WhatsApp API integration'),
    ],
  },
]

export function findInsight(slug: string): InsightArticle | null {
  return INSIGHTS.find((article) => article.slug === slug) ?? null
}
