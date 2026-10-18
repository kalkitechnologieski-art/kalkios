// == KALKI SITE FOOTER ==
// Server-rendered internal-linking hub. Crawlers get real, descriptive anchor
// text to every category, top service and legal/company page from every page.
// -----------------------------------------------------------------------------

import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase/public-client';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com';

interface Row { name: string; slug: string; category: string }

async function getFooterData(): Promise<{ categories: string[]; popular: Row[] }> {
  try {
    const supabase = createPublicClient();
    // @ts-ignore - runtime table
    const { data } = await supabase
      .from('services')
      .select('name, slug, category, review_count')
      .eq('is_active', true as any)
      .order('review_count', { ascending: false })
      .limit(60);
    const rows = (data ?? []) as Row[];
    const categories = Array.from(new Set(rows.map((r) => r.category))).sort();
    return { categories, popular: rows.slice(0, 8) };
  } catch {
    return {
      categories: ['Web Development', 'App Development', 'Marketing', 'Design', 'Media', 'AI Automation', 'AI Chatbots', 'Development'],
      popular: [],
    };
  }
}

const COMPANY = [
  { label: 'About KALKI', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Careers', href: '/careers' },
  { label: 'Support', href: '/support' },
  { label: 'Marketplace', href: '/marketplace' },
];

const LEGAL = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'llms.txt', href: '/llms.txt' },
  { label: 'Sitemap', href: '/sitemap.xml' },
];

export async function SiteFooter() {
  const { categories, popular } = await getFooterData();

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
                  <Link href={`/marketplace/${encodeURIComponent(c)}`} className="text-white/50 hover:text-cyan-300 text-sm transition">
                    {c} Services
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Popular services */}
          {popular.length > 0 && (
            <nav aria-label="Popular services">
              <h3 className="text-white/80 font-semibold text-sm mb-3 uppercase tracking-wider">Popular</h3>
              <ul className="space-y-2">
                {popular.map((p) => (
                  <li key={`${p.category}-${p.slug}`}>
                    <Link href={`/marketplace/${encodeURIComponent(p.category)}/${encodeURIComponent(p.slug)}`} className="text-white/50 hover:text-cyan-300 text-sm transition line-clamp-1">
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

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
          <p>© {new Date().getFullYear()} KALKI Intelligence LLP · AI &amp; digital services, Indore (MP), India</p>
          <p>Serving businesses across India · <a href={`mailto:team@kalki-intelligence.in`} className="hover:text-cyan-300 transition">team@kalki-intelligence.in</a></p>
        </div>
      </div>
    </footer>
  );
}
