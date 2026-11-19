// == KALKI SITE FOOTER ==
// Server-rendered internal-linking hub. Crawlers get real, descriptive anchor
// text to every category, top service and legal/company page from every page.
// -----------------------------------------------------------------------------

import Link from 'next/link';
import { fetchAllCategories } from '@/lib/services';
import { categoryHref, serviceHref } from '@/lib/services/href';

const PRACTICES: { label: string; href: string }[] = [
  { label: 'Astrology websites', href: serviceHref({ category: 'Web Development', slug: 'astrology-website-development' }) },
  { label: 'SEO for astrologers', href: serviceHref({ category: 'Marketing', slug: 'seo-for-astrologers' }) },
  { label: 'Vastu websites', href: serviceHref({ category: 'Web Development', slug: 'vastu-consultant-website' }) },
  { label: 'Vastu marketing', href: serviceHref({ category: 'Marketing', slug: 'vastu-consultant-marketing' }) },
  { label: 'WhatsApp API setup', href: serviceHref({ category: 'AI Automation', slug: 'whatsapp-business-api-setup' }) },
  { label: 'Omnichannel CRM', href: serviceHref({ category: 'Development', slug: 'omnichannel-dm-crm' }) },
  { label: 'AEO and GEO', href: serviceHref({ category: 'Marketing', slug: 'aeo-geo-services' }) },
  { label: 'YouTube for astrologers', href: serviceHref({ category: 'Media', slug: 'youtube-content-for-astrologers' }) },
  { label: 'Astrology apps', href: serviceHref({ category: 'App Development', slug: 'astrology-app-development' }) },
  { label: 'WhatsApp chatbot', href: serviceHref({ category: 'AI Chatbots', slug: 'whatsapp-chatbot-for-business' }) },
  { label: 'n8n automation', href: serviceHref({ category: 'AI Automation', slug: 'n8n-workflow-automation' }) },
  { label: 'Custom AI agents', href: serviceHref({ category: 'AI', slug: 'custom-ai-development' }) },
  { label: 'Notes', href: '/insights' },
];

async function getFooterData(): Promise<{ categories: string[] }> {
  try {
    return { categories: await fetchAllCategories() };
  } catch {
    return {
      categories: ['Web Development', 'App Development', 'Marketing', 'Design', 'Media', 'AI Automation', 'AI Chatbots', 'Development'],
    };
  }
}

const COMPANY = [
  { label: 'About KALKI Intelligence', href: '/about' },
  { label: 'Notes', href: '/insights' },
  { label: 'Contact', href: '/contact' },
  { label: 'Careers', href: '/careers' },
  { label: 'Support', href: '/support' },
  { label: 'Marketplace', href: '/marketplace' },
];

const LEGAL = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'llms.txt', href: '/llms.txt' },
  { label: 'llms-full.txt', href: '/llms-full.txt' },
  { label: 'Sitemap', href: '/sitemap.xml' },
];

export async function SiteFooter() {
  const { categories } = await getFooterData();

  return (
    <footer className="mt-16 border-t border-white/10 pt-12 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Categories */}
          <nav aria-label="Service categories">
            <h3 className="text-white/80 font-semibold text-sm mb-3 uppercase tracking-wider">Services</h3>
            <ul className="space-y-2">
              {categories.map((c) => (
                <li key={c}>
                  <Link href={categoryHref(c)} className="text-white/50 hover:text-cyan-300 text-sm transition">
                    {c} Services
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Practices and industries">
            <h3 className="text-white/80 font-semibold text-sm mb-3 uppercase tracking-wider">Practices</h3>
            <ul className="space-y-2">
              {PRACTICES.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-white/50 hover:text-cyan-300 text-sm transition">{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company">
            <h3 className="text-white/80 font-semibold text-sm mb-3 uppercase tracking-wider">Company</h3>
            <ul className="space-y-2">
              {COMPANY.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/50 hover:text-cyan-300 text-sm transition">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Get started */}
          <nav aria-label="Get started">
            <h3 className="text-white/80 font-semibold text-sm mb-3 uppercase tracking-wider">Get Started</h3>
            <ul className="space-y-2">
              <li><Link href="/request" className="text-white/50 hover:text-cyan-300 text-sm transition">Request a service</Link></li>
              <li><Link href="/chat" className="text-white/50 hover:text-cyan-300 text-sm transition">Ask Siddhi AI</Link></li>
              <li><Link href="/explore" className="text-white/50 hover:text-cyan-300 text-sm transition">Explore</Link></li>
              <li><Link href="/register" className="text-white/50 hover:text-cyan-300 text-sm transition">Create account</Link></li>
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal and resources">
            <h3 className="text-white/80 font-semibold text-sm mb-3 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2">
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/50 hover:text-cyan-300 text-sm transition">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>© {new Date().getFullYear()} KALKI Intelligence LLP · Temple of technology</p>
          <p>Office: 52, MOG Lines, Swastik Nagar, Indore 452002 · Clients worldwide · <a href="mailto:team@kalki-intelligence.in" className="hover:text-cyan-300 transition">team@kalki-intelligence.in</a></p>
        </div>
      </div>
    </footer>
  );
}
