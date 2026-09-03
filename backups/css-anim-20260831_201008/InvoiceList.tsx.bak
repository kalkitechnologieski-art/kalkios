'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Invoice = Database['public']['Tables']['invoices']['Row']

export function InvoiceList({ projectId }: { projectId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchInvoices = async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('order_id', projectId)
      setInvoices(data || [])
    }
    fetchInvoices()
  }, [projectId, supabase])

  if (invoices.length === 0) {
    return <div className="text-white/40 text-sm">No invoices yet.</div>
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h4 className="text-white font-bold mb-3 text-sm">Invoices</h4>
      <div className="space-y-2">
        {invoices.map((inv: Invoice) => (
          <div key={inv.id} className="flex justify-between items-center text-sm">
            <span className="text-white/70">{inv.invoice_number}</span>
            <span className="text-white/70">₹{inv.total}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              inv.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {inv.status}
            </span>
            {inv.pdf_url && (
              <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline text-xs">
                PDF
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
