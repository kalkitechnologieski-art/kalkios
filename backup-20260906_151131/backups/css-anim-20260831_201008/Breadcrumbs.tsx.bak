import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type BreadcrumbItem = { label: string; href: string }

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-white/40 mb-4">
      <Link href="/" className="hover:text-white transition">Home</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <ChevronRight className="w-3 h-3" />
          {i === items.length - 1 ? (
            <span className="text-white/80">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-white transition">{item.label}</Link>
          )}
        </span>
      ))}
    </nav>
  )
}
