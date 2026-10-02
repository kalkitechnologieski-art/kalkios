// == KALKI B4 EXPERIENCE ==
'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { LuxuryButton } from './ui/LuxuryButton';
import { ShoppingCart, Check } from 'lucide-react';

interface Props {
  service: {
    id: string;
    name: string;
    price: number;
    category: string;
    slug: string;
    icon?: string | null;
    image_url?: string | null;
  };
  variant?: { id: string; name: string; price: number } | null;
  variant2?: 'primary' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  fullWidth?: boolean;
}

export default function AddToCartButton({
  service,
  variant = null,
  size = 'default',
  fullWidth = false,
}: Props) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    addItem({
      id: service.id,
      variantId: variant?.id ?? null,
      variantName: variant?.name,
      name: service.name,
      price: variant?.price ?? service.price,
      category: service.category,
      slug: service.slug,
      ...(service.icon ? { icon: service.icon } : {}),
      ...(service.image_url ? { image_url: service.image_url } : {}),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <LuxuryButton
      variant="outline"
      size={size}
      fullWidth={fullWidth}
      onClick={handleAdd}
      label={added ? 'Added ✓' : 'Add to Cart'}
      icon={added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
      iconPosition="left"
    />
  );
}
