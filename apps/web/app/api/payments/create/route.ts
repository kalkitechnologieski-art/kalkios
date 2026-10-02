// == KALKI B1 HOTFIX v2 ==
// Payment creation — auth, client_id, multi-item, idempotency, tax snapshot.
// Supabase client is cast to `any` because chain inference on this schema is
// impractical; runtime behavior is validated by explicit checks below.
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generateIdempotencyKey, isValidIdempotencyKey } from '@/lib/commerce/idempotency';
import { getGstRate } from '@/lib/commerce/tax';
import { round2 } from '@/lib/commerce/currency';
import { logger } from '@/lib/utils/logger';

const INSTAMOJO_API_KEY = process.env.INSTAMOJO_API_KEY;
const INSTAMOJO_AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN;
const INSTAMOJO_BASE = process.env.INSTAMOJO_BASE_URL || 'https://api.instamojo.com/v2';

interface CreateBody {
  serviceIds: string[];
  variantIds?: Array<string | null>;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  code?: string;
}

interface ServiceRow {
  id: string;
  name: string;
  price: number;
  category: string;
  duration_days: number | null;
}

interface OrderRow {
  id: string;
  status: string;
  amount: number;
  payment_request_id: string | null;
}

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user as
      | { id: string; email?: string; user_metadata?: { full_name?: string } }
      | null;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as CreateBody;
    const { serviceIds, variantIds, code } = body;

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json({ error: 'serviceIds required' }, { status: 400 });
    }
    if (serviceIds.length > 20) {
      return NextResponse.json({ error: 'Too many items' }, { status: 400 });
    }

    // Idempotency
    const idemKey = generateIdempotencyKey(user.id, serviceIds);
    if (!isValidIdempotencyKey(idemKey)) {
      return NextResponse.json({ error: 'Invalid idempotency' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('orders')
      .select('id, status, amount, payment_request_id')
      .like('idempotency_key', `${idemKey}:%`);

    const existingRows = (existing ?? []) as OrderRow[];
    if (existingRows.length > 0) {
      logger.info('[Payments] Idempotent order replay', { id: existingRows[0]?.id });
      return NextResponse.json({
        orderIds: existingRows.map((r) => r.id),
        idempotent: true,
        total: existingRows.reduce((s, r) => s + (r.amount ?? 0), 0),
        paymentUrl: null,
      });
    }

    // Load services
    const { data: svcData } = await supabase
      .from('services')
      .select('id, name, price, category, duration_days')
      .in('id', serviceIds);

    const services = (svcData ?? []) as ServiceRow[];
    if (services.length === 0) {
      return NextResponse.json({ error: 'Services not found' }, { status: 404 });
    }

    for (const s of services) {
      if (!s.price || s.price <= 0) {
        return NextResponse.json({ error: `Invalid price for ${s.name}` }, { status: 400 });
      }
    }

    // Server-side discount resolution — the gateway is always charged computed
    // amounts; the client-supplied code is only a lookup key.
    let codeRow: { id: string; discount_type: string; discount_value: number } | null = null;
    if (code) {
      const { data } = await supabase
        .from('codes')
        .select('id, discount_type, discount_value, status')
        .eq('code', code)
        .maybeSingle();
      const found = data as
        | { id: string; discount_type: string; discount_value: number | null; status: string }
        | null;
      if (!found || found.status !== 'active') {
        return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
      }
      if (found.discount_type !== 'percentage' && found.discount_type !== 'fixed') {
        return NextResponse.json({ error: 'Code type not supported at checkout' }, { status: 400 });
      }
      codeRow = {
        id: found.id,
        discount_type: found.discount_type,
        discount_value: Number(found.discount_value ?? 0),
      };
    }

    const subtotal = round2(services.reduce((sum, s) => sum + s.price, 0));
    const lineAmounts = new Map<string, { net: number; discount: number; tax: number }>();
    let discountApplied = 0;
    let totalTax = 0;
    let grandTotal = 0;

    for (const [i, s] of services.entries()) {
      const gstRate = getGstRate(s.category);
      const share = subtotal > 0 ? s.price / subtotal : 0;
      const intended = codeRow
        ? codeRow.discount_type === 'percentage'
          ? round2(subtotal * (codeRow.discount_value / 100))
          : round2(Math.min(codeRow.discount_value, subtotal))
        : 0;

      let discount = codeRow ? round2(intended * share) : 0;
      if (codeRow && i === services.length - 1) {
        // Last line absorbs rounding drift so line discounts sum to the code value.
        discount = round2(Math.max(0, Math.min(s.price, intended - discountApplied)));
      }
      discount = Math.min(discount, round2(s.price));

      const net = round2(s.price - discount);
      const tax = round2(net * (gstRate / 100));
      lineAmounts.set(s.id, { net, discount, tax });
      discountApplied = round2(discountApplied + discount);
      totalTax = round2(totalTax + tax);
      grandTotal = round2(grandTotal + net + tax);
    }

    const buyerName =
      (user.user_metadata?.full_name as string | undefined) || body.buyerName || 'Guest';
    const buyerEmail = user.email || body.buyerEmail || 'guest@example.com';
    const buyerPhone = body.buyerPhone || '';

    // Create one order per service
    const createdOrderIds: string[] = [];

    for (let i = 0; i < services.length; i++) {
      const s = services[i]!;
      const variantId = variantIds?.[i] ?? null;
      const line = lineAmounts.get(s.id)!;

      const { data: created, error: insertError } = await supabase
        .from('orders')
        .insert({
          service_id: s.id,
          client_id: user.id,
          amount: line.net,
          subtotal: s.price,
          discount_amount: line.discount,
          discount_code: code ?? null,
          code_id: codeRow?.id ?? null,
          tax_amount: line.tax,
          status: 'pending',
          buyer_name: buyerName,
          buyer_email: buyerEmail,
          buyer_phone: buyerPhone,
          payment_request_id: null,
          payment_id: null,
          idempotency_key: `${idemKey}:${i}`,
        })
        .select()
        .single();

      const createdRow = created as { id: string } | null;
      if (!createdRow?.id) {
        logger.error('[Payments] Failed to create order for service', {
          id: s.id,
          error: insertError?.message,
        });
        continue;
      }
      createdOrderIds.push(createdRow.id);
      void variantId;
    }

    if (createdOrderIds.length === 0) {
      return NextResponse.json({ error: 'Failed to create orders' }, { status: 500 });
    }

    if (!INSTAMOJO_API_KEY || !INSTAMOJO_AUTH_TOKEN) {
      logger.warn('[Payments] Instamojo not configured; returning order IDs only');
      return NextResponse.json({
        orderIds: createdOrderIds,
        total: grandTotal,
        paymentUrl: null,
        idempotent: false,
      });
    }

    const firstOrderId = createdOrderIds[0]!;
    const purpose = `KALKI OS order ${firstOrderId.slice(0, 8)} (${services.length} item${services.length > 1 ? 's' : ''})`;

    const paymentPayload = {
      purpose,
      amount: grandTotal,
      buyer_name: buyerName,
      email: buyerEmail,
      phone: buyerPhone,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?order=${firstOrderId}`,
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
      allow_repeated_payments: false,
      send_email: true,
      send_sms: false,
      custom_field_order_id: firstOrderId,
    };

    const response = await fetch(`${INSTAMOJO_BASE}/payment_requests/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${INSTAMOJO_AUTH_TOKEN}`,
        'X-Api-Key': INSTAMOJO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('[Payments] Instamojo error', errorData);
      for (const id of createdOrderIds) {
        // Owner sessions cannot flip status (orders_guard_columns trigger);
        // roll back with the service client.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = (await createAdminClient()) as any;
        await admin.from('orders').update({ status: 'failed' }).eq('id', id);
      }
      return NextResponse.json({ error: 'Payment gateway error' }, { status: 500 });
    }

    const data = (await response.json()) as {
      payment_request?: { id?: string; longurl?: string; url?: string };
    };
    const paymentUrl = data.payment_request?.longurl ?? data.payment_request?.url;
    const paymentRequestId = data.payment_request?.id;

    if (!paymentUrl || !paymentRequestId) {
      for (const id of createdOrderIds) {
        // Owner sessions cannot flip status (orders_guard_columns trigger);
        // roll back with the service client.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = (await createAdminClient()) as any;
        await admin.from('orders').update({ status: 'failed' }).eq('id', id);
      }
      return NextResponse.json({ error: 'No payment URL returned' }, { status: 500 });
    }

    // The webhook fulfills the whole batch by payment_request_id; orders that
    // can't be linked would never be marked paid.
    const { error: linkError } = await supabase
      .from('orders')
      .update({ payment_request_id: paymentRequestId })
      .in('id', createdOrderIds);

    if (linkError) {
      logger.error('[Payments] Failed to link payment_request_id', linkError);
      for (const id of createdOrderIds) {
        // Owner sessions cannot flip status (orders_guard_columns trigger);
        // roll back with the service client.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = (await createAdminClient()) as any;
        await admin.from('orders').update({ status: 'failed' }).eq('id', id);
      }
      return NextResponse.json({ error: 'Payment linkage failed' }, { status: 500 });
    }

    logger.info('[Payments] Created', { orderIds: createdOrderIds, total: grandTotal, paymentRequestId });

    return NextResponse.json({
      orderIds: createdOrderIds,
      total: grandTotal,
      paymentUrl,
      idempotent: false,
    });
  } catch (error) {
    logger.error('[Payments] Unhandled', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
