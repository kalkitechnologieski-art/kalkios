'use client'
import { useCartStore } from '@/store/cartStore'
import { LuxuryButton } from './ui/LuxuryButton'
import { ShoppingCart } from 'lucide-react'

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
}

export function AddToCartButton({ service }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem)

  const handleAdd = () => {
    // Only include fields that are defined (to satisfy exactOptionalPropertyTypes)
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
  }

  return (
    <LuxuryButton
      variant="secondary"
      size="md"
      label="Add to Cart"
      icon={<ShoppingCart className="w-4 h-4" />}
      iconPosition="left"
      onClick={handleAdd}
    />
  )
}
