'use client'

import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import Link from 'next/link'
import { 
  Trash2, Plus, Minus, ShoppingBag, ArrowRight, 
  Sparkles, TrendingUp, Clock, Award, Shield,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']

// --- Enterprise Empty State with Recommendations ---
function EmptyCartState({ recommendations }: { recommendations: Service[] }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center mb-6">
          <ShoppingBag className="w-12 h-12 text-purple-400/50" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center animate-pulse">
          <span className="text-sm">✨</span>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2">Your cart is waiting</h2>
      <p className="text-white/40 text-sm max-w-md mb-8">
        Discover premium digital services curated for enterprise excellence.
      </p>

      {/* Enterprise: Show recommendations instead of dead empty state */}
      {recommendations.length > 0 && (
        <div className="w-full max-w-2xl mb-8">
          <p className="text-xs text-white/30 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Popular Services
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {recommendations.slice(0, 3).map((service) => (
              <Link
                key={service.id}
                href={`/services/${service.category}/${service.slug}`}
                className="group bg-white/5 border border-white/5 hover:border-purple-500/30 rounded-xl p-4 transition hover:bg-white/10 text-left"
              >
                <div className="text-2xl mb-2">{service.icon || '📦'}</div>
                <h4 className="text-white text-sm font-medium truncate group-hover:text-purple-400 transition">
                  {service.name}
                </h4>
                <p className="text-white/40 text-xs mt-1">₹{service.price?.toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/marketplace">
          <LuxuryButton
            variant="primary"
            size="lg"
            label="Explore Marketplace"
            icon={<Sparkles className="w-4 h-4" />}
            iconPosition="right"
          />
        </Link>
        <Link href="/explore">
          <LuxuryButton
            variant="secondary"
            size="lg"
            label="Discover Services"
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          />
        </Link>
      </div>

      {/* Trust badges */}
      <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-white/20">
        <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure checkout</span>
        <span className="flex items-center gap-1"><Award className="w-3 h-3" /> Verified services</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 30-day delivery</span>
      </div>
    </div>
  )
}

// --- Enterprise Cart Item Component ---
function CartItem({ 
  item, 
  onUpdate, 
  onRemove 
}: { 
  item: any
  onUpdate: (id: string, qty: number) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="group bg-white/5 border border-white/5 hover:border-purple-500/30 rounded-xl p-4 transition hover:bg-white/10">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center text-3xl flex-shrink-0">
          {item.icon || '📦'}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/services/${item.category}/${item.slug}`}>
            <h3 className="text-white font-medium text-sm truncate hover:text-purple-400 transition">
              {item.name}
            </h3>
          </Link>
          <p className="text-white/40 text-xs">{item.category}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-white font-bold">₹{item.price.toLocaleString()}</span>
            <span className="text-white/20 text-xs">× {item.quantity}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate(item.id, item.quantity - 1)}
            className="p-1.5 rounded-full hover:bg-white/10 transition text-white/40 hover:text-white"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-white font-medium w-8 text-center text-sm">{item.quantity}</span>
          <button
            onClick={() => onUpdate(item.id, item.quantity + 1)}
            className="p-1.5 rounded-full hover:bg-white/10 transition text-white/40 hover:text-white"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="p-2 rounded-full hover:bg-red-500/20 transition text-red-400/50 hover:text-red-400"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// --- Main Cart Page ---
export default function CartPage() {
  const { items, totalItems, totalPrice, removeItem, updateQuantity } = useCartStore()
  const [recommendations, setRecommendations] = useState<Service[]>([])
  const supabase = createClient()

  // Fetch recommendations for empty state
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .limit(6)
        setRecommendations((data || []) as Service[])
      } catch (e) {
        // Use fallback demo data
        setRecommendations([
          { id: '1', name: 'Enterprise SEO', slug: 'enterprise-seo', category: 'Marketing', price: 50000, icon: '📈', rating: 4.8 } as any,
          { id: '2', name: 'AI Chatbot', slug: 'ai-chatbot', category: 'AI', price: 75000, icon: '🤖', rating: 4.9 } as any,
          { id: '3', name: 'E-commerce Website', slug: 'ecommerce-website', category: 'Development', price: 100000, icon: '🛒', rating: 4.7 } as any,
        ])
      } finally {
      }
    }
    fetchRecommendations()
  }, [supabase])

  // Empty state with recommendations
  if (items.length === 0) {
    return <EmptyCartState recommendations={recommendations} />
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-purple-400" />
            Your Cart
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        <button
          onClick={() => {
            items.forEach(item => removeItem(item.id))
          }}
          className="text-sm text-red-400/60 hover:text-red-400 transition flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>

      {/* Cart Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            onUpdate={updateQuantity}
            onRemove={removeItem}
          />
        ))}
      </div>

      {/* Enterprise Checkout Summary */}
      <div className="mt-8 p-6 bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-white/40 text-sm">Subtotal ({totalItems} items)</p>
            <p className="text-2xl font-bold text-white">₹{totalPrice.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-green-400">✓ Free delivery</span>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-xs text-white/30">Taxes included</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/marketplace">
              <LuxuryButton
                variant="secondary"
                size="md"
                label="Continue Shopping"
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="left"
              />
            </Link>
            <Link href="/checkout">
              <LuxuryButton
                variant="primary"
                size="md"
                label="Proceed to Checkout"
                icon={<Sparkles className="w-4 h-4" />}
                iconPosition="right"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Enterprise: Related services cross-sell */}
      {recommendations.length > 0 && (
        <div className="mt-8">
          <p className="text-xs text-white/30 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            You may also like
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recommendations.slice(0, 4).map((service) => (
              <Link
                key={service.id}
                href={`/services/${service.category}/${service.slug}`}
                className="group bg-white/5 border border-white/5 hover:border-purple-500/30 rounded-xl p-4 transition hover:bg-white/10 text-center"
              >
                <div className="text-3xl mb-2">{service.icon || '📦'}</div>
                <h4 className="text-white text-xs font-medium truncate group-hover:text-purple-400 transition">
                  {service.name}
                </h4>
                <p className="text-white/40 text-xs mt-1">₹{service.price?.toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
