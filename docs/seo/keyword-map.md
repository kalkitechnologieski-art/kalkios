# Keyword map

The catalog is for businesses in every industry. Astrology and vastu are the spiritual-practices hub, not the homepage. One primary URL per cluster. Prices are starting floors beside an existing catalog price. The written quote is the price. No ranking, view, or citation promise.

Demand notes cite a public source only when that source printed a figure. Otherwise the note says no volume is claimed. Sources used for the 62 newer services:

- nextbig.io, “The next big thing” (November 2026): AI agent +152% year over year, AI coding assistant +94% year over year, cold email listed as rising.
- Rising Trends, “Top 48 AI Trends” (November 2026): ai voice agents about 135,000 monthly searches (~56× year over year), ai receptionist about 301,000 (~68×), ai call centers about 165,000 (~103×). Those are that site’s estimates, not official Google volumes.
- EM360, “What Internet Trends Reveal About Data & Analytics”: data quality index 100, data privacy 99.5, AI agents 98.9, business intelligence 57.0. RAG described as real but low mainstream search. Index scores, not search volumes.
- Shopify, “AI-referred shoppers convert better and spend more” (Q1 2026 commerce data): AI-referred sessions on Shopify grew more than 8× year over year.

The 62 services and the source line for each are in `apps/web/lib/services/phase3-services.ts` (`demand` and `source`). Together with the 46 services already live, the product-page count is 108.

## Commercial and transactional clusters

| Cluster | Primary queries | Primary page | Why this page |
|---|---|---|---|
| AI development company | AI development company, hire AI developer, custom AI agent development | `/marketplace/ai/custom-ai-development` | One engagement: a written scope for an agent or model integration. The category page only lists the AI catalog. |
| AI chatbot development | AI chatbot development | `/marketplace/ai/ai-chatbot-development` | Custom bot for the channels named in the quote. WhatsApp-only work is a different URL. |
| WhatsApp chatbot | WhatsApp chatbot for business | `/marketplace/ai-chatbots/whatsapp-chatbot-for-business` | The bot itself, from ₹5,999. The API connection is not included. |
| WhatsApp API | WhatsApp API integration service, WhatsApp Business API setup | `/marketplace/ai-automation/whatsapp-business-api-setup` | The Meta API connection, from ₹14,999. Meta approval is not a deliverable. |
| Unified inbox | omnichannel CRM development, unified inbox software development | `/marketplace/development/omnichannel-dm-crm` | One product, from ₹79,999. No second URL for “unified inbox”. |
| AI automation | AI automation services, AI automation for astrologers | `/marketplace/ai-automation/ai-chatbot-automation` | Lead questions and booking flows, from ₹5,999, for practices and other businesses. |
| n8n automation | n8n automation agency | `/marketplace/ai-automation/n8n-workflow-automation` | Workflows in n8n when the quote names n8n. Not a partner badge. From ₹14,999. |
| Astrology websites | website development for astrologers, astrology website development | `/marketplace/web-development/astrology-website-development` | Five-page floor ₹5,000. Apps and kundli tools are other URLs. |
| Astrology apps | astrology app development | `/marketplace/app-development/astrology-app-development` | App floor ₹12,000, same as the simple business app. A website is the other URL. |
| Kundali software | kundali software development, horoscope API | `/marketplace/ai-automation/ai-horoscope-kundali-api` | API for horoscope, kundli, compatibility, and muhurta. From ₹29,999. |
| AEO and GEO | AEO agency, GEO services, generative engine optimization, AI search optimization | `/marketplace/marketing/aeo-geo-services` | One search-visibility engagement, from ₹49,999. No citation promise. |
| SEO for astrologers | SEO for astrologers | `/marketplace/marketing/seo-for-astrologers` | Practice SEO, from ₹49,999. No ranking promise. Enterprise SEO for other industries stays on `/marketplace/marketing/enterprise-seo`. |
| Vastu websites | vastu consultant website | `/marketplace/web-development/vastu-consultant-website` | From ₹5,000. |
| Vastu marketing | vastu consultant marketing | `/marketplace/marketing/vastu-consultant-marketing` | From ₹19,999. |
| YouTube for astrologers | YouTube content for astrologers | `/marketplace/media/youtube-content-for-astrologers` | From ₹9,999. No view promise. |

## Informational queries

These articles answer the question and link to the primary service. They are not case studies.

| Query | Article | Leads to |
|---|---|---|
| What an astrology website includes | `/insights/what-an-astrology-website-includes` | Astrology website |
| SEO without a ranking promise | `/insights/seo-for-astrologers-without-a-ranking-promise` | SEO for astrologers |
| What to prepare for WhatsApp API | `/insights/whatsapp-business-api-before-a-quote` | WhatsApp API |
| What AEO and GEO mean | `/insights/what-aeo-and-geo-mean` | AEO and GEO |
| Inbox versus chatbot | `/insights/omnichannel-inbox-and-a-chatbot` | Omnichannel CRM, chatbot |
| YouTube production, not views | `/insights/youtube-content-for-astrologers` | YouTube package |
| How to hire an AI developer | `/insights/how-to-hire-an-ai-developer` | Custom AI development |
| WhatsApp chatbot versus the API | `/insights/whatsapp-chatbot-versus-the-api` | WhatsApp chatbot, WhatsApp API |
| What kundali software includes | `/insights/what-kundali-software-includes` | Kundali API |
| App or website for an astrology practice | `/insights/astrology-app-or-website` | Astrology app, astrology website |
| What to ask an AEO agency | `/insights/what-to-ask-an-aeo-agency` | AEO and GEO |
| What an n8n scope includes | `/insights/what-an-n8n-automation-scope-includes` | n8n automation |

## Citeable facts

The facts block on `/about` is the page an answer engine should cite for who the company is. It matches the Organization JSON-LD: legal name KALKI Intelligence LLP, founded 2025, Founder & CEO Nikhil Singh, office in Indore, `areaServed` worldwide.

## Pages that must not compete

- `/marketplace/ai` is the category list, not the “AI development company” landing page.
- `/marketplace/marketing/enterprise-seo` is general SEO. Astrology SEO stays on its own URL.
- `/marketplace/app-development/simple-business-app` is the generic app. Astrology apps stay on their own URL.
- `/marketplace/ai-automation/ai-chatbot-automation` is general automation. n8n stays on its own URL.

## The 62 newer services

Each row is one primary keyword, the service name, on one URL. Prices are starting floors. The written quote is the price.

| Service | URL | Floor (INR) | Primary keyword | Demand rationale | Source |
|---|---|---:|---|---|---|
| Voice AI Agent Development | `/marketplace/ai-automation/voice-ai-agent-development` | 79,999 | Voice AI Agent Development | Buyers are searching for voice agents as a product, not only for chatbots. | Rising Trends, November 2026: “ai voice agents” listed at about 135,000 monthly searches, roughly 56× the prior year. That figure is their estimate, not an official Google volume. |
| AI Receptionist Setup | `/marketplace/ai-automation/ai-receptionist-setup` | 49,999 | AI Receptionist Setup | Receptionist and call-center queries are among the fastest-growing practical AI searches in 2026. | Rising Trends, November 2026: “ai receptionist” about 301,000 monthly searches (~68× year over year) and “ai call centers” about 165,000 (~103×). Estimates from that database. |
| RAG Chatbot Development | `/marketplace/ai/rag-chatbot-development` | 149,999 | RAG Chatbot Development | Practitioners treat RAG as a real build, even though mainstream search interest is still small. | EM360 trend index: RAG is described as a real practitioner category with low mainstream search. No search volume is claimed here. |
| AI Coding Assistant Integration | `/marketplace/ai/ai-coding-assistant-integration` | 79,999 | AI Coding Assistant Integration | Search interest in AI coding assistants rose sharply through 2026. | nextbig.io, November 2026: “AI coding assistant” listed at +94% year over year. |
| LLM Application Integration | `/marketplace/ai/llm-application-integration` | 99,999 | LLM Application Integration | Teams are buying integrations into existing software, not only standalone chatbots. | nextbig.io, November 2026, lists “AI agent” at +152% year over year. This service is the integration slice of that demand. No separate volume is claimed. |
| AI Knowledge Base Development | `/marketplace/ai/ai-knowledge-base-development` | 79,999 | AI Knowledge Base Development | Knowledge bases are the practical layer under agents and RAG. | EM360 trend index: AI agents sit near the top of awareness. This page is the document layer those agents need. No separate volume is claimed. |
| AI Document Processing | `/marketplace/ai/ai-document-processing` | 69,999 | AI Document Processing | Document work is a standard operations purchase beside NLP, which this catalog already sells separately. | Distinct from the existing NLP and sentiment service. No search volume is claimed. |
| WordPress Website Development | `/marketplace/web-development/wordpress-website-development` | 14,999 | WordPress Website Development | WordPress remains a standard name buyers use when they want a site they can edit. | No search volume is claimed. Floor sits above the five-page landing page at ₹5,000 because the deliverable is a WordPress install with an admin. |
| Local SEO Services | `/marketplace/marketing/local-seo-services` | 19,999 | Local SEO Services | Local SEO is a different purchase from national enterprise SEO, which stays on its own page. | No search volume is claimed. Floor matches content marketing at ₹19,999. |
| WhatsApp Commerce Catalog | `/marketplace/ai-automation/whatsapp-commerce-catalog` | 24,999 | WhatsApp Commerce Catalog | Commerce on chat is a buying job separate from a support bot. | Shopify’s Q1 2026 commerce note describes shoppers moving into conversational and AI surfaces. No WhatsApp-specific volume is claimed. |
| Technical SEO Audit | `/marketplace/marketing/technical-seo-audit` | 14,999 | Technical SEO Audit | An audit is a fixed document. Ongoing SEO is a different page. | No search volume is claimed. Floor matches a short engagement, below Enterprise SEO at ₹49,999. |
| Shopify Store Development | `/marketplace/web-development/shopify-store-development` | 49,999 | Shopify Store Development | Shopify remains a primary place brands ask for a store to be built. | Shopify’s Q1 2026 commerce note is about merchant traffic on Shopify. No “Shopify development” search volume is claimed. |
| Headless Commerce Development | `/marketplace/web-development/headless-commerce-development` | 199,999 | Headless Commerce Development | Headless builds are a different job from a theme-based Shopify store. | No search volume is claimed. Priced at the same floor as custom software because it is a product build. |
| Subscription Commerce Setup | `/marketplace/web-development/subscription-commerce-setup` | 79,999 | Subscription Commerce Setup | Subscriptions are a different checkout from a single-product store. | No search volume is claimed. |
| Payment Gateway Integration | `/marketplace/development/payment-gateway-integration` | 19,999 | Payment Gateway Integration | Gateway work is a fixed integration, smaller than a new store. | No search volume is claimed. Floor matches a short integration, beside the admin dashboard at ₹19,999. |
| Product Feed Management | `/marketplace/development/product-feed-management` | 29,999 | Product Feed Management | Shopify’s 2026 notes describe AI platforms reading merchant catalog data. This is the feed, not a promise of placement. | Shopify Q1 2026 commerce note on catalog data used by AI platforms. No feed-specific search volume is claimed. |
| CRM Integration (HubSpot/Zoho) | `/marketplace/development/crm-integration-hubspot-zoho` | 29,999 | CRM Integration (HubSpot/Zoho) | Buyers name HubSpot and Zoho when they want a CRM connection, which is narrower than a custom inbox. | No search volume is claimed. Floor matches API integration at ₹29,999. |
| Meta Ads Management | `/marketplace/marketing/meta-ads-management` | 24,999 | Meta Ads Management | Meta ads are a standard buying channel beside Google Ads, which this catalog already sells separately. | No search volume is claimed. Floor matches the existing PPC / Google Ads service at ₹24,999. |
| LinkedIn Ads Management | `/marketplace/marketing/linkedin-ads-management` | 29,999 | LinkedIn Ads Management | A distinct channel from Meta and Google, which already have their own pages. | No search volume is claimed. |
| Conversion Rate Optimization | `/marketplace/marketing/conversion-rate-optimization` | 39,999 | Conversion Rate Optimization | CRO is a different engagement from building a new landing page, which stays on its own URL. | No search volume is claimed. Floor sits beside UI/UX design at ₹39,999. |
| Marketing Analytics Setup | `/marketplace/marketing/marketing-analytics-setup` | 29,999 | Marketing Analytics Setup | Measurement is the prerequisite for the ads services, and it is sold separately so it can be bought alone. | No search volume is claimed. |
| Instagram DM Automation | `/marketplace/ai-automation/instagram-dm-automation` | 14,999 | Instagram DM Automation | Instagram messages are a different channel from WhatsApp, which already has its own chatbot and API pages. | No search volume is claimed. Floor matches the WhatsApp API setup at ₹14,999. |
| Lead Generation Services | `/marketplace/marketing/lead-generation-services` | 24,999 | Lead Generation Services | “Lead generation services” is the phrase buyers use. This page is the system, not a list of people. | No search volume is claimed. Floor matches Meta and Google ads management at ₹24,999 because the work is a campaign-sized setup, not a contact export. |
| SaaS MVP Development | `/marketplace/development/saas-mvp-development` | 199,999 | SaaS MVP Development | An MVP is a fixed first release, distinct from custom software with an open scope. | No search volume is claimed. Floor matches custom software at ₹1,99,999. |
| SaaS Billing Integration | `/marketplace/development/saas-billing-integration` | 79,999 | SaaS Billing Integration | Billing is a separate integration from building the MVP itself. | No search volume is claimed. |
| Multi-Tenant SaaS Architecture | `/marketplace/development/multi-tenant-saas-architecture` | 199,999 | Multi-Tenant SaaS Architecture | Multi-tenant separation is an architecture job, not a feature on the MVP page. | No search volume is claimed. |
| Website Maintenance | `/marketplace/web-development/website-maintenance` | 4,999 | Website Maintenance | Maintenance is a recurring operations purchase, distinct from building the site. | No search volume is claimed. Floor is ₹4,999, under the five-page site, because the month is a bounded list of upkeep. |
| Business Intelligence Dashboard | `/marketplace/development/business-intelligence-dashboard` | 79,999 | Business Intelligence Dashboard | Business intelligence remains a high-interest category even as newer data terms rise. | EM360 trend index: business intelligence scored 57.0 on their index, described as still in active use. That is an index, not a search volume. |
| Data Pipeline Development | `/marketplace/development/data-pipeline-development` | 99,999 | Data Pipeline Development | Pipelines are the plumbing under a dashboard, sold separately so a team can buy one. | No search volume is claimed. |
| Customer Data Platform | `/marketplace/development/customer-data-platform` | 149,999 | Customer Data Platform | A CDP is a different object from a dashboard. | EM360 notes data products as a rising theme. No CDP search volume is claimed. |
| Online Puja Booking System | `/marketplace/web-development/online-puja-booking-system` | 29,999 | Online Puja Booking System | Practitioners search for a booking system, which is a different build from a brochure website. | No search volume is claimed. Floor matches the clinic booking website at ₹29,999. |
| Kubernetes Platform Setup | `/marketplace/development/kubernetes-platform-setup` | 99,999 | Kubernetes Platform Setup | Kubernetes setup is more specific than the existing cloud-migration service. | No search volume is claimed. |
| Tarot Reading Website | `/marketplace/web-development/tarot-reading-website` | 5,000 | Tarot Reading Website | A tarot site is a practice website with its own content, separate from astrology and vastu pages. | No search volume is claimed. Floor matches the five-page landing page at ₹5,000. |
| Observability Setup | `/marketplace/development/observability-setup` | 59,999 | Observability Setup | Observability is the operating layer beside the existing DevOps automation service. | EM360 notes data observability as rising from a small base. No volume is claimed. |
| Cloud Landing Zone | `/marketplace/development/cloud-landing-zone` | 149,999 | Cloud Landing Zone | A landing zone is the foundation, not the migration of an app. | No search volume is claimed. |
| Web Application Security Review | `/marketplace/consulting/web-application-security-review` | 49,999 | Web Application Security Review | A review is a document and a method, not a security certificate. | No search volume is claimed. Basic security is a separate buying job from feature development. |
| Vulnerability Assessment | `/marketplace/consulting/vulnerability-assessment` | 29,999 | Vulnerability Assessment | A scan is smaller and cheaper than a full application review, so it has its own page. | No search volume is claimed. |
| Backup and Recovery Setup | `/marketplace/development/backup-and-recovery-setup` | 39,999 | Backup and Recovery Setup | Recovery is an operations control, not a feature of a new app. | No search volume is claimed. |
| SSO and Access Setup | `/marketplace/development/sso-access-setup` | 49,999 | SSO and Access Setup | Single sign-on is a specific integration, often bought with a security review but not the same job. | No search volume is claimed. |
| Numerology Software | `/marketplace/ai-automation/numerology-software` | 19,999 | Numerology Software | Numerology is a different calculation from kundli matching, so it is not folded into that page. | No search volume is claimed. Floor is ₹19,999, under the kundali API at ₹29,999, because the scope is one calculation. |
| Design System Development | `/marketplace/design/design-system-development` | 49,999 | Design System Development | A system is a different deliverable from a single UX audit or a one-off UI project. | No search volume is claimed. |
| Vastu Consultation App | `/marketplace/app-development/vastu-consultation-app` | 12,000 | Vastu Consultation App | An app for consultations is a different deliverable from the vastu website already in the catalog. | No search volume is claimed. Floor matches the astrology app at ₹12,000. |
| Clinic Booking Website | `/marketplace/web-development/clinic-booking-website` | 29,999 | Clinic Booking Website | A clinic site has booking and practitioner pages a generic five-page site does not assume. | No search volume is claimed. The page is an industry deliverable, not a generic website with the word clinic added. |
| Real Estate Listing Website | `/marketplace/web-development/real-estate-listing-website` | 79,999 | Real Estate Listing Website | Search and filters make this a different product from a five-page brochure. | No search volume is claimed. |
| Coaching Membership Platform | `/marketplace/web-development/coaching-membership-platform` | 99,999 | Coaching Membership Platform | Membership access is different from a coaching brochure and from a school LMS. | No search volume is claimed. |
| Restaurant Ordering Website | `/marketplace/web-development/restaurant-ordering-website` | 49,999 | Restaurant Ordering Website | Ordering is a transaction, not a brochure page. | No search volume is claimed. |
| Hotel Booking Website | `/marketplace/web-development/hotel-booking-website` | 99,999 | Hotel Booking Website | Availability and rooms make this different from a restaurant site or a brochure. | No search volume is claimed. |
| Legal Practice Website | `/marketplace/web-development/legal-practice-website` | 29,999 | Legal Practice Website | The content and the disclaimer are specific to a practice, which a generic landing page does not carry. | No search volume is claimed. |
| Finance Client Portal | `/marketplace/development/finance-client-portal` | 149,999 | Finance Client Portal | A client portal with separation of records is a product, not a brochure. | No search volume is claimed. |
| Manufacturer Product Catalog | `/marketplace/web-development/manufacturer-product-catalog` | 79,999 | Manufacturer Product Catalog | Specification catalogs are a different information architecture from a D2C store. | No search volume is claimed. |
| Coaching LMS | `/marketplace/development/coaching-lms` | 149,999 | Coaching LMS | Progress tracking makes an LMS different from a membership platform. | No search volume is claimed. |
| Field Service App | `/marketplace/app-development/field-service-app` | 149,999 | Field Service App | Dispatch is a workflow app, not a marketing site and not a generic business app. | No search volume is claimed. Floor matches the existing mobile app development service at ₹1,49,999. |
| AI Sales Assistant | `/marketplace/ai-automation/ai-sales-assistant` | 59,999 | AI Sales Assistant | A sales draft assistant is a different job from a public chatbot. | nextbig.io, November 2026, lists AI agent interest at +152% year over year. This is one buyer-shaped agent. No volume is claimed for this name. |
| Helpdesk AI Agent | `/marketplace/ai-automation/helpdesk-ai-agent` | 49,999 | Helpdesk AI Agent | A helpdesk agent is attached to a ticket queue, unlike the website chatbot already in the catalog. | Rising Trends describes the shift from chatbots to software that does a defined job. No volume is claimed for this name. |
| Shopify App Integration | `/marketplace/development/shopify-app-integration` | 39,999 | Shopify App Integration | A single integration is smaller than a new Shopify store. | No search volume is claimed. |
| Inventory Sync | `/marketplace/development/inventory-sync` | 49,999 | Inventory Sync | Sync is an operations integration, not a storefront design. | No search volume is claimed. |
| Retail POS Integration | `/marketplace/development/retail-pos-integration` | 59,999 | Retail POS Integration | Counter systems are a different endpoint from a Shopify app. | No search volume is claimed. |
| Logistics Tracking Portal | `/marketplace/development/logistics-tracking-portal` | 99,999 | Logistics Tracking Portal | Tracking is a portal with statuses, not a catalog website. | No search volume is claimed. |
| Kundali Matching Software | `/marketplace/ai-automation/kundali-matching-software` | 19,999 | Kundali Matching Software | Matching is a narrower product than the horoscope and kundli API, which remains the broader platform. | No search volume is claimed. Floor is ₹19,999, below the API at ₹29,999. |
| API Integration Services | `/marketplace/development/api-integration-services` | 29,999 | API Integration Services | A single integration is the smallest development engagement in this set. | No search volume is claimed. Floor is above payment-gateway integration because the systems are unknown until the quote. |
| Privacy and Consent Implementation | `/marketplace/development/privacy-consent-implementation` | 29,999 | Privacy and Consent Implementation | Data privacy is a mainstream concern in practitioner indexes, and the work is an implementation. | EM360 trend index: data privacy scored 99.5. An index score, not a search volume. |
| Private LLM Deployment | `/marketplace/ai/private-llm-deployment` | 199,999 | Private LLM Deployment | Private deployment is a different purchase from calling a public LLM API. | Rising Trends, November 2026, mentions sovereign compute and local models as a practical theme. No volume is claimed for this service name. |

## Existing URLs that already own the buyer query

These names are the title and H1 of a page that was already in the catalog. A second URL was not added.

| Buyer query | URL | Note |
|---|---|---|
| Google Ads Management | `/marketplace/marketing/ppc-google-ads` | Same engagement as the existing PPC page. No ranking or lead-count promise. |
| Email Marketing Automation | `/marketplace/marketing/email-marketing-automation` | Already in the catalog, from ₹14,999. |
| UI/UX Design | `/marketplace/development/ui-ux-design` | Already in the catalog. A coded build of the screens is a separate quote. |
| Logo & Brand Identity Design | `/marketplace/design/premium-logo-design` | The existing logo engagement, with the name buyers use. |
| Landing Page Design | `/marketplace/web-development/landing-page-5-pages` | The five-page site, from ₹5,000. WordPress and maintenance are other URLs. |
| Mobile App Development (Flutter / React Native) | `/marketplace/development/mobile-app-development` | The existing app build. Flutter or React Native is named in the quote. |
| SaaS MVP Development | `/marketplace/development/saas-mvp-development` | Already one of the 62. |
| AI Voice Calling Agent | `/marketplace/ai-automation/voice-ai-agent-development` | Same product as Voice AI Agent Development. Not a second page. |
| Shopify Store Development | `/marketplace/web-development/shopify-store-development` | Already one of the 62. |
| Meta Ads Management | `/marketplace/marketing/meta-ads-management` | Already one of the 62. Google Ads stays on its own URL. |

## Queries that stay on one page

- Kundali matching software is the matching result only. Horoscope, full kundli, and muhurta stay on `/marketplace/ai-automation/ai-horoscope-kundali-api`.
- Local SEO and a technical SEO audit are not Enterprise SEO and not SEO for astrologers.
- A tarot site, numerology software, a vastu consultation app, and an online puja booking system are not the astrology website or the vastu website.
- Instagram DM automation is not the WhatsApp chatbot and not the omnichannel inbox.
- CRM integration (HubSpot/Zoho) is not the custom omnichannel inbox.
- Website maintenance is a month of upkeep, not a new site.
- Retired slugs redirect with HTTP 301: meeting notes, multimodal, WhatsApp broadcasts, agentic storefront, cold email, lifecycle automation, product analytics, data quality, cloud cost review, UX audit, mobile UI, HR onboarding, the previous RAG slug, and the previous custom API slug.
