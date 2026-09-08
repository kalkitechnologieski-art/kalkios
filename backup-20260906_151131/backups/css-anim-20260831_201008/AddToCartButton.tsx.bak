'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { LuxuryButton } from './ui/LuxuryButton'
import { ShoppingCart, Check } from 'lucide-react'

interface AddToCartButtonProps {
  service: {
    id: string
    name: string
    price: number
    category: string
    slug: string
    icon?: string | null
    image_url?: string | null
  }
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export default function AddToCartButton({
  service,
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
}: AddToCartButtonProps) {
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const handleAdd = () => {
    const item: any = {
      id: service.id,
      name: service.name,
      price: service.price,
      category: service.category,
      slug: service.slug,
    }
    if (service.icon) item.icon = service.icon
    if (service.image_url) item.image_url = service.image_url

    addItem(item)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <LuxuryButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      onClick={handleAdd}
      label={added ? 'Added to Cart ✓' : 'Add to Cart'}
      icon={added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
      iconPosition="left"
    />
  )
}
