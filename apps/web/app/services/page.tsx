import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Filter } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('services').select('*').eq('is_active', true).order('category')
  const services = (data || []) as Service[]
  const categories = [...new Set(services.map(s => s.category))]

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6"><h1 className="text-3xl font-bold text-white">All Services</h1><button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-white/60 text-sm hover:bg-white/10 transition"><Filter className="w-4 h-4" />Filter</button></div>
      {categories.length === 0 ? <div className="text-center py-20 text-white/40"><p className="text-lg">No services available</p></div> :
      <div className="space-y-8">{categories.map(cat => { const catServices = services.filter(s => s.category === cat); return <div key={cat}><div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold text-white/80 capitalize">{cat}</h2><span className="text-sm text-white/30">{catServices.length} services</span></div><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{catServices.map(s => <Link key={s.id} href={`/services/${s.category}/${s.slug}`} className="group bg-white/5 border border-white/5 hover:border-purple-500/30 rounded-xl overflow-hidden transition hover:bg-white/10"><div className="aspect-square bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center">{s.image_url ? <Image src={s.image_url} alt={s.name} width={200} height={200} className="object-cover w-full h-full" /> : <span className="text-5xl opacity-30">{s.icon || '📦'}</span>}</div><div className="p-4"><p className="text-xs text-white/40 uppercase tracking-wider">{s.category}</p><h3 className="text-white font-medium text-sm mt-1 line-clamp-2 group-hover:text-purple-400 transition">{s.name}</h3><div className="flex items-center gap-2 mt-2"><span className="text-white font-bold">₹{s.price?.toLocaleString()}</span>{s.rating && <span className="flex items-center gap-1 text-xs text-white/40 ml-auto"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{s.rating}</span>}</div></div></Link>)}</div></div>})}</div>}
    </div>
  )
}
