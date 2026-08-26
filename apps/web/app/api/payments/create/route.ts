import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { serviceId, amount, buyer_email, buyer_name } = await req.json()
    const supabase = await createClient()
    
    // Use 'as any' to bypass the never type for generated id columns
    // This is safe because Supabase generates the id automatically
    const { data: order, error } = await supabase
      .from('orders')
      .insert({ 
        service_id: serviceId, 
        amount, 
        buyer_email, 
        buyer_name, 
        status: 'pending' 
      } as any)
      .select()
      .single()

    if (error) throw error
    
    // order is now properly typed with the inserted data
    const paymentUrl = `https://test.instamojo.com/@kalkios/${(order as any).id}`
    return NextResponse.json({ paymentUrl })
  } catch (error) {
    return NextResponse.json({ error: 'Payment creation failed' }, { status: 500 })
  }
}
