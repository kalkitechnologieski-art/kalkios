'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, Star, Sparkles, 
  ShoppingBag, TrendingUp, Award, Clock, X,
  SlidersHorizontal, Grid3x3, LayoutGrid
} from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']

// --- Enterprise Service Card ---
function ServiceCard({ service, featured }: { service: Service; featured?: boolean }) {
  const discount = Math.floor(Math.random() * 35) + 15
  
  return (
    <Link
      href={`/services/${service.category}/${service.slug}`}
      className={`group bg-white/5 border border-white/5 hover:border-purple-500/30 rounded-xl overflow-hidden transition hover:bg-white/10 ${
        featured ? 'md:col-span-2 md:row-span-2' : ''
      }`}
    >
      <div className={`relative ${featured ? 'aspect-[4/3]' : 'aspect-square'} bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center`}>
        <span className="text-6xl opacity-30">{service.icon || '📦'}</span>
        {discount && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            {discount}% off
          </span>
        )}
        {service.rating && (
          <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white/90 text-xs px-3 py-1.5 rounded-full flex items-center gap-1 border border-white/10">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {service.rating}
            <span className="text-white/40 ml-1">({service.review_count || 0})</span>
          </span>
        )}
        {featured && (
          <span className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-purple-500/30">
            Featured
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-white/40 uppercase tracking-wider">{service.category}</p>
        <h3 className={`text-white font-medium ${featured ? 'text-lg' : 'text-sm'} mt-1 line-clamp-2 group-hover:text-purple-400 transition`}>
          {service.name}
        </h3>
        <p className="text-white/40 text-xs mt-1 line-clamp-2">{service.description}</p>
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-white font-bold">₹{service.price?.toLocaleString()}</span>
            <span className="text-white/30 text-sm line-through ml-2">
              ₹{service.price ? Math.round(service.price * 1.35).toLocaleString() : ''}
            </span>
          </div>
          <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">In Stock</span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 30-60 days</span>
          <span className="flex items-center gap-1"><Award className="w-3 h-3" /> Verified</span>
        </div>
      </div>
    </Link>
  )
}

// --- Enterprise Category Filter ---
function CategoryFilter({ 
  categories, 
  selected, 
  onChange 
}: { 
  categories: string[] 
  selected: string 
  onChange: (cat: string) => void 
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange('All')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
          selected === 'All'
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
            : 'bg-white/5 text-white/60 hover:bg-white/10'
        }`}
      >
        All Services
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            selected === cat
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}

// --- Main Marketplace ---
export default function MarketplacePage() {
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const supabase = createClient()

  const categories = useMemo(() => {
    return [...new Set(services.map(s => s.category))]
  }, [services])

  const featuredServices = useMemo(() => {
    return services.filter(s => s.rating && s.rating >= 4.7).slice(0, 2)
  }, [services])

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
        setServices((data || []) as Service[])
      } catch (e) {
        // Fallback demo data
        setServices([
          { id: '1', name: 'Enterprise SEO', slug: 'enterprise-seo', category: 'Marketing', description: 'Rank #1 on Google', price: 50000, icon: '📈', rating: 4.8, review_count: 120, is_active: true },
          { id: '2', name: 'AI Chatbot Development', slug: 'ai-chatbot', category: 'AI', description: 'Custom LLM chatbot', price: 75000, icon: '🤖', rating: 4.9, review_count: 85, is_active: true },
          { id: '3', name: 'E-commerce Website', slug: 'ecommerce-website', category: 'Development', description: 'Full online store', price: 100000, icon: '🛒', rating: 4.7, review_count: 210, is_active: true },
          { id: '4', name: 'Social Media Marketing', slug: 'social-media-marketing', category: 'Marketing', description: 'Dominate social media', price: 30000, icon: '📢', rating: 4.6, review_count: 95, is_active: true },
          { id: '5', name: 'Predictive Analytics', slug: 'predictive-analytics', category: 'AI', description: 'Data-driven forecasts', price: 90000, icon: '📊', rating: 4.8, review_count: 67, is_active: true },
          { id: '6', name: 'Mobile App Development', slug: 'mobile-app-development', category: 'Development', description: 'iOS & Android apps', price: 150000, icon: '📱', rating: 4.9, review_count: 143, is_active: true },
        ] as Service[])
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [supabase])

  // Filter services
  useEffect(() => {
    let result = services
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      )
    }
    if (selectedCategory !== 'All') {
      result = result.filter(s => s.category === selectedCategory)
    }
    setFilteredServices(result)
  }, [services, searchQuery, selectedCategory])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 animate-pulse">
        <div className="h-12 w-64 bg-white/5 rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-purple-400" />
            Marketplace
          </h1>
          <p className="text-white/40 text-sm">
            {filteredServices.length} premium {filteredServices.length === 1 ? 'service' : 'services'} available
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-white placeholder-white/30 outline-none focus:border-purple-500/50 transition text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 border rounded-xl transition ${
              showFilters 
                ? 'bg-purple-600/20 border-purple-500/30 text-purple-400' 
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-purple-600/20 text-purple-400' : 'text-white/30 hover:text-white/60'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list' ? 'bg-purple-600/20 text-purple-400' : 'text-white/30 hover:text-white/60'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
          <CategoryFilter 
            categories={categories} 
            selected={selectedCategory} 
            onChange={setSelectedCategory} 
          />
        </div>
      )}

      {/* Category pills (always visible) */}
      <div className="mb-6 overflow-x-auto hide-scrollbar">
        <CategoryFilter 
          categories={categories} 
          selected={selectedCategory} 
          onChange={setSelectedCategory} 
        />
      </div>

      {/* Featured Section */}
      {featuredServices.length > 0 && selectedCategory === 'All' && !searchQuery && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Featured Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredServices.map((service) => (
              <ServiceCard key={service.id} service={service} featured />
            ))}
          </div>
        </div>
      )}

      {/* All Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-lg">No services found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('All') }}
            className="mt-4 text-purple-400 hover:text-purple-300 transition text-sm"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className={`grid ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        } gap-4`}>
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}

      {/* Enterprise Trust Section */}
      <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-8 text-sm text-white/30">
        <span className="flex items-center gap-2"><Award className="w-4 h-4 text-purple-400" /> Curated by experts</span>
        <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-purple-400" /> 30-60 day delivery</span>
        <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-purple-400" /> 500+ satisfied clients</span>
        <span className="flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-purple-400" /> Enterprise-grade</span>
      </div>
    </div>
  )
}
