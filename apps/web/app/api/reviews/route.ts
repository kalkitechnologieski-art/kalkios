// == KALKI B4 EXPERIENCE ==
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId, serviceId, rating, title, text } = await req.json();
    if (!orderId || !serviceId || !rating || !text) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const numericRating = Number(rating);
    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5 ||
      text.length < 20 ||
      text.length > 5000 ||
      (title && String(title).length > 200)
    ) {
      return NextResponse.json({ error: 'Invalid rating or text too short' }, { status: 400 });
    }

    // Verify ownership: this user must have a completed order for this service
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, client_id, service_id')
      .eq('id', orderId)
      .single();

    if (!order || order.client_id !== auth.user.id || order.status !== 'paid') {
      return NextResponse.json({ error: 'Not eligible to review' }, { status: 403 });
    }
    if (order.service_id !== serviceId) {
      return NextResponse.json({ error: 'Service does not match order' }, { status: 400 });
    }

    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_id', orderId)
      .eq('user_id', auth.user.id)
      .maybeSingle();
    if (existingReview) {
      return NextResponse.json({ error: 'Already reviewed this order' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        order_id: orderId,
        service_id: serviceId,
        user_id: auth.user.id,
        rating: numericRating,
        title: title || null,
        text,
        status: 'pending',
        verified: true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, review: data });
  } catch (e) {
    logger.error('[Reviews] POST failed', e);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const serviceId = url.searchParams.get('service_id');
  if (!serviceId) return NextResponse.json({ error: 'service_id required' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('service_id', serviceId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ reviews: data ?? [] });
}
