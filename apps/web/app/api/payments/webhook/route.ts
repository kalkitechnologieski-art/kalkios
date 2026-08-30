import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'

const INSTAMOJO_PRIVATE_SALT = process.env.INSTAMOJO_PRIVATE_SALT

export async function GET(req: NextRequest) {
  // Handle redirect after payment (GET)
  const searchParams = req.nextUrl.searchParams
  const orderId = searchParams.get('order_id')
  const paymentId = searchParams.get('payment_id')
  const paymentStatus = searchParams.get('payment_status')

  if (!orderId) {
    console.warn('Webhook GET: No order_id provided')
    return NextResponse.redirect(new URL('/payment-failed', req.url))
  }

  const supabase = await createClient()

  try {
    // Verify the order exists
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      console.warn(`Order ${orderId} not found`)
      return NextResponse.redirect(new URL('/payment-failed', req.url))
    }

    if (paymentStatus === 'Credit' || paymentStatus === 'Paid') {
      await handleSuccessfulPayment(orderId, paymentId || '', supabase)
      return NextResponse.redirect(new URL('/client?payment=success', req.url))
    } else {
      // Update order status to failed
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', orderId)
      return NextResponse.redirect(new URL('/payment-failed', req.url))
    }
  } catch (error) {
    console.error('Webhook GET error:', error)
    return NextResponse.redirect(new URL('/payment-failed', req.url))
  }
}

export async function POST(req: NextRequest) {
  // Webhook POST from Instamojo
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('X-Instamojo-Signature') || ''

    // Verify signature (optional but recommended)
    if (INSTAMOJO_PRIVATE_SALT) {
      const expectedSignature = createHmac('sha256', INSTAMOJO_PRIVATE_SALT)
        .update(rawBody)
        .digest('hex')
      if (signature !== expectedSignature) {
        console.warn('Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const data = JSON.parse(rawBody)
    const paymentId = data.payment_id || data.id
    const orderId = data.custom_field_order_id || data.purpose?.match(/order_([a-f0-9-]+)/)?.[1]

    if (!orderId) {
      console.warn('No order ID found in webhook payload')
      return NextResponse.json({ error: 'Order ID missing' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch order
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status === 'paid') {
      return NextResponse.json({ message: 'Order already paid' })
    }

    const paymentStatus = data.payment_status || data.status
    if (paymentStatus === 'Credit' || paymentStatus === 'Paid') {
      await handleSuccessfulPayment(orderId, paymentId, supabase)
      return NextResponse.json({ success: true })
    } else {
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', orderId)
      return NextResponse.json({ success: false, status: 'failed' })
    }
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handleSuccessfulPayment(orderId: string, paymentId: string, supabase: any) {
  // Update order status to paid
  await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_id: paymentId,
    })
    .eq('id', orderId)

  // Fetch order details
  const { data: order } = await supabase
    .from('orders')
    .select('service_id, buyer_name, buyer_email, amount')
    .eq('id', orderId)
    .single()

  if (!order) return

  // Fetch service details
  const { data: service } = await supabase
    .from('services')
    .select('name, category')
    .eq('id', order.service_id)
    .single()

  // Create a project for this order
  const projectName = service?.name || `Project #${orderId.slice(0, 8)}`
  const { data: project } = await supabase
    .from('projects')
    .insert({
      order_id: orderId,
      name: projectName,
      description: `Project for ${order.buyer_name}`,
      status: 'not_started',
      client_id: null, // We'll link later if user is logged in
      estimated_delivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    })
    .select()
    .single()

  // Add default milestones
  if (project) {
    const milestones = [
      { title: 'Project Kickoff', description: 'Initial meeting and requirements gathering', status: 'pending' },
      { title: 'Design Phase', description: 'UI/UX design and prototyping', status: 'pending' },
      { title: 'Development', description: 'Full development and implementation', status: 'pending' },
      { title: 'Testing & QA', description: 'Quality assurance and bug fixing', status: 'pending' },
      { title: 'Launch', description: 'Final delivery and deployment', status: 'pending' },
    ]
    for (const m of milestones) {
      await supabase
        .from('milestones')
        .insert({
          project_id: project.id,
          title: m.title,
          description: m.description,
          status: m.status,
          order_index: milestones.indexOf(m),
        })
    }

    // Generate invoice
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`
    await supabase
      .from('invoices')
      .insert({
        order_id: orderId,
        invoice_number: invoiceNumber,
        total: order.amount,
        gst: order.amount * 0.18,
        status: 'paid',
        generated_at: new Date().toISOString(),
      })
  }
}
