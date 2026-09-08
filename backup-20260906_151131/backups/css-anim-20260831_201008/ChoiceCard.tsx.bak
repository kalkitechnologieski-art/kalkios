import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function ChoiceCard({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="group flex-1 max-w-[140px] p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition hover:bg-white/10 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="text-white font-bold text-sm">{title}</h3>
      <p className="text-white/40 text-xs mt-1">{desc}</p>
      <ArrowRight className="w-4 h-4 mx-auto mt-2 text-white/20 group-hover:text-purple-400 transition" />
    </Link>
  )
}
