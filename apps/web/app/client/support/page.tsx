// == KALKI B4 EXPERIENCE ==
'use client';

import Link from 'next/link';
import { MessageSquare, Mail, BookOpen, ArrowLeft } from 'lucide-react';
import { LuxuryButton } from '@/components/ui/LuxuryButton';

export default function ClientSupportPage() {
  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <Link href="/client" className="inline-flex items-center gap-2 text-cyan-400/60 hover:text-cyan-400 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold text-white font-mono">Support</h1>
      <p className="text-white/60">We usually respond within 24 hours.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card icon={<MessageSquare className="w-6 h-6 text-cyan-400" />} title="Chat with Siddhi" desc="Get instant AI-powered help" href="/chat" cta="Open chat" />
        <Card icon={<Mail className="w-6 h-6 text-purple-400" />} title="Email us" desc="team@kalki-intelligence.in" href="mailto:team@kalki-intelligence.in" cta="Send email" />
        <Card icon={<BookOpen className="w-6 h-6 text-pink-400" />} title="Knowledge base" desc="Guides and FAQs" href="/support" cta="Browse" />
      </div>
    </div>
  );
}

function Card({ icon, title, desc, href, cta }: { icon: React.ReactNode; title: string; desc: string; href: string; cta: string }) {
  return (
    <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
      <div className="mb-3">{icon}</div>
      <h3 className="text-white font-medium">{title}</h3>
      <p className="text-white/40 text-sm mt-1">{desc}</p>
      <Link href={href} className="inline-block mt-4">
        <LuxuryButton variant="outline" size="sm" label={cta} />
      </Link>
    </div>
  );
}
