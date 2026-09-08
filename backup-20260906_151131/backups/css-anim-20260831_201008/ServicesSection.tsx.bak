'use client'

import { useEffect, useState } from 'react'
import { createPublicClient } from '@/lib/supabase/public-client'
import ServiceCard from '@/components/ui/ServiceCard'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']

export default function ServicesSection() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const supabase = createPublicClient()
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .limit(6)
        if (error) throw error
        setServices(data || [])
      } catch (err) {
        console.error('Error fetching services:', err)
        setServices([])
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (services.length === 0) {
    return <p className="text-white/40 text-center">No services available.</p>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  )
}
