// Payment webhook — signature-verified (fail-closed), batch-fulfilled via the
// fulfill_paid_orders() RPC (row locks + status guard make it idempotent).
// The old unauthenticated GET handler (payment-forgery vector) is removed;
// buyers land on /checkout/success via the gateway redirect_url instead.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from '@/lib/utils/logger';

const INSTAMOJO_PRIVATE_SALT = process.env.INSTAMOJO_PRIVATE_SALT;

interface FulfillmentRow {
  order_id: string;
  status: 'paid' | 'already_paid';
  project_id?: string;
  invoice_number?: string;
  amount?: number;
  gst?: number;
  total?: number;
  service_name?: string;
  buyer_name?: string | null;
  buyer_email?: string | null;
}

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

// InstaMojo v2 webhooks are application/x-www-form-urlencoded POSTs whose raw
// body carries a trailing `sig` field = hex HMAC-MD5 of the body with the
// sig parameter removed, keyed with the webhook salt. A header-based
// HMAC-SHA256 scheme is kept as a fallback for the newer JSON webhooks.
function verifySignature(rawBody: string, contentType: string, headerSignature: string): boolean {
  if (!INSTAMOJO_PRIVATE_SALT) return false;

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const sig = new URLSearchParams(rawBody).get('sig') ?? '';
    if (!/^[0-9a-f]{32}$/i.test(sig)) return false;
    const bodyWithoutSig = rawBody.replace(/&sig=[0-9a-f]{32}/i, '').replace(/^sig=[0-9a-f]{32}&?/i, '');
    const expected = createHmac('md5', INSTAMOJO_PRIVATE_SALT).update(bodyWithoutSig).digest('hex');
    return safeEqualHex(expected, sig);
  }

  if (headerSignature) {
    const expected = createHmac('sha256', INSTAMOJO_PRIVATE_SALT).update(rawBody).digest('hex');
    return safeEqualHex(expected, headerSignature);
  }
  return false;
}

function parsePayload(contentType: string, rawBody: string): Record<string, unknown> | null {
  try {
    if (contentType.includes('application/x-www-form-urlencoded')) {
      return Object.fromEntries(new URLSearchParams(rawBody).entries());
    }
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractPaymentId(data: Record<string, unknown>): string {
  const payments = data.payments;
  if (typeof payments === 'string') {
    try {
      const parsed = JSON.parse(payments) as Array<{ payment_id?: string; id?: string }>;
      const first = parsed[0];
      if (first?.payment_id || first?.id) return String(first.payment_id ?? first.id);
    } catch {
      /* fall through */
    }
  } else if (Array.isArray(payments) && payments.length > 0) {
    const first = payments[0] as { payment_id?: string; id?: string };
    if (first?.payment_id || first?.id) return String(first.payment_id ?? first.id);
  }
  return String(data.payment_id ?? '');
}

export async function POST(req: NextRequest) {
  if (!INSTAMOJO_PRIVATE_SALT) {
    logger.error('[Webhook] INSTAMOJO_PRIVATE_SALT is not configured — refusing to process payment');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const rawBody = await req.text();
  const contentType = req.headers.get('content-type') ?? '';
  const headerSignature = req.headers.get('x-instamojo-signature') || '';
  if (!verifySignature(rawBody, contentType, headerSignature)) {
    logger.warn('[Webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const data = parsePayload(contentType, rawBody);
  if (!data) {
    return NextResponse.json({ error: 'Unparseable payload' }, { status: 400 });
  }

  const paymentRequestId = data.id ? String(data.id) : null;
  const orderId =
    (data.custom_field_order_id as string | undefined) ||
    (typeof data.purpose === 'string'
      ? data.purpose.match(/order[_\s]([a-f0-9-]+)/i)?.[1] ?? ''
      : '');

  if (!paymentRequestId && !orderId) {
    await logWebhookFailure('order_id_missing', data, 'No payment request id or order id in payload');
    return NextResponse.json({ error: 'Order ID missing' }, { status: 400 });
  }

  // Supabase cast to `any` — generated Database types predate the
  // fulfill_paid_orders RPC; regenerate types after applying the migration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;
  const paymentStatus = String(data.payment_status ?? '');
  const eventAction = String(data.event_action ?? data.event ?? '');
  const requestStatus = String(data.status ?? '');

  const isSuccess =
    paymentStatus === 'Credit' || paymentStatus === 'Paid' ||
    eventAction === 'payment.success' || requestStatus === 'completed';
  const isFailure =
    ['Failed', 'Declined', 'Cancelled'].includes(paymentStatus) ||
    eventAction === 'payment.failed' ||
    requestStatus === 'failed' || requestStatus === 'expired';

  // Pending/created events carry no money movement — acknowledge and ignore
  // so InstaMojo does not retry them.
  if (!isSuccess && !isFailure) {
    return NextResponse.json({ success: true, ignored: true });
  }

  if (!isSuccess) {
    const filter = paymentRequestId
      ? orderId
        ? `payment_request_id.eq.${paymentRequestId},id.eq.${orderId}`
        : `payment_request_id.eq.${paymentRequestId}`
      : `id.eq.${orderId}`;
    const { error } = await supabase
      .from('orders')
      .update({ status: 'failed' })
      .neq('status', 'paid')
      .or(filter);
    if (error) logger.error('[Webhook] Failed to mark orders failed', error);
    return NextResponse.json({ success: false, status: 'failed' });
  }

  const paymentId = extractPaymentId(data);
  const { data: result, error } = await supabase.rpc('fulfill_paid_orders', {
    p_payment_request_id: paymentRequestId,
    p_payment_id: paymentId,
    p_order_id: orderId || null,
  });

  if (error) {
    await logWebhookFailure('handler_error', data, error.message);
    logger.error('[Webhook] Fulfillment failed', error);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  const fulfilled = ((result as { fulfilled?: FulfillmentRow[] })?.fulfilled ?? []).filter(
    (r) => r.status === 'paid'
  );

  for (const row of fulfilled) {
    if (!row.buyer_email || !row.invoice_number) continue;
    try {
      const { sendOrderConfirmation } = await import('@/lib/email/send');
      await sendOrderConfirmation({
        to: row.buyer_email,
        orderId: row.order_id,
        projectId: row.project_id ?? '',
        amount: row.total ?? 0,
        invoiceNumber: row.invoice_number,
        buyerName: row.buyer_name ?? 'Client',
        serviceName: row.service_name ?? 'Project',
      });
    } catch (emailError) {
      logger.warn('[Webhook] Email failed', emailError);
    }
  }

  logger.info('[Webhook] Payment handled', {
    paymentRequestId,
    orderId,
    newlyPaid: fulfilled.length,
  });
  return NextResponse.json({ success: true, fulfilled: result });
}

async function logWebhookFailure(
  source: string,
  payload: unknown,
  error: string
): Promise<void> {
  try {
    // Supabase cast to `any` — generated Database types predate the
    // fulfill_paid_orders RPC; regenerate types after applying the migration.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;
    await supabase.from('webhook_failures').insert({
      source,
      payload,
      error,
      attempts: 0,
      next_retry_at: new Date(Date.now() + 60_000).toISOString(),
    });
  } catch (e) {
    logger.warn('[Webhook] Failed to log failure', e);
  }
}
