import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

const INSTAMOJO_API_KEY = process.env.INSTAMOJO_API_KEY
const INSTAMOJO_AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN
const INSTAMOJO_PRIVATE_SALT = process.env.INSTAMOJO_PRIVATE_SALT
const INSTAMOJO_BASE = process.env.INSTAMOJO_BASE_URL || 'https://api.instamojo.com/v2'

export async function POST(req: NextRequest) {
  try {
    const { serviceId, buyerName, buyerEmail, buyerPhone } = await req.json()
    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID required' }, { status: 400 })
    }

    if (!INSTAMOJO_API_KEY || !INSTAMOJO_AUTH_TOKEN) {
      console.error('Instamojo credentials missing')
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 })
    }

    const supabase = await createClient() as any

    const { data: service, error: serviceError } = await supabase
// @ts-ignore
      .from('services')
      .select('name, price')
      .eq('id', serviceId as any as any)
// @ts-ignore
      .single()

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const { data: order, error: orderError } = await supabase
// @ts-ignore
      .from('orders')
// @ts-ignore
      // @ts-ignore
.insert({  
        service_id: serviceId,
        amount: service?.price,
        status: 'pending',
        buyer_name: buyerName || 'Guest',
        buyer_email: buyerEmail || 'guest@example.com',
        buyer_phone: buyerPhone || '',
        payment_request_id: null,
        payment_id: null,
      } as any)
      .select()
// @ts-ignore
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    const orderId = order.id

    const paymentPayload = {
      purpose: `KALKI OS - ${service?.name}`,
      amount: service?.price,
      buyer_name: buyerName || 'Guest',
      email: buyerEmail || 'guest@example.com',
      phone: buyerPhone || '',
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook?order_id=${orderId}`,
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
      allow_repeated_payments: false,
      send_email: true,
      send_sms: true,
      custom_field_order_id: orderId,
    }

    const response = await fetch(`${INSTAMOJO_BASE}/payment_requests/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INSTAMOJO_AUTH_TOKEN}`,
        'X-Api-Key': INSTAMOJO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentPayload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Instamojo error:', errorData)
      await supabase
// @ts-ignore
        .from('orders')
// @ts-ignore
        .update({  status: 'failed' } as any)
        .eq('id', orderId as any as any)
      return NextResponse.json(
        { error: errorData.message || 'Payment gateway error' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const paymentUrl = data.payment_request?.longurl || data.payment_request?.url

    if (!paymentUrl) {
      throw new Error('No payment URL returned from Instamojo')
    }

    await supabase
// @ts-ignore
      .from('orders')
// @ts-ignore
      .update({ 
        payment_request_id: data.payment_request?.id,
        payment_id: data.payment_request?.id,
      } as any)
      .eq('id', orderId as any as any)

    return NextResponse.json({
      paymentUrl,
      orderId,
    })
  } catch (error: any) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Payment creation failed' },
      { status: 500 }
    )
  }
}
