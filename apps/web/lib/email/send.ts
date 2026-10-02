// == KALKI B1 SPINE ==
// Unified email sender. Uses Resend if RESEND_API_KEY present.
// Falls back to structured logging so dev environments never fail.
// -----------------------------------------------------------------------------

import { logger } from '@/lib/utils/logger';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.EMAIL_FROM || 'KALKI OS <noreply@kalkios.com>';

export interface OrderConfirmationArgs {
  to: string;
  orderId: string;
  projectId: string;
  amount: number;
  invoiceNumber: string;
  buyerName: string;
  serviceName: string;
}

export async function sendOrderConfirmation(args: OrderConfirmationArgs): Promise<void> {
  if (!args.to || !args.to.includes('@')) {
    logger.warn('[Email] Skipping order confirmation — invalid recipient', { to: args.to });
    return;
  }

  const subject = `Order confirmed · ${args.invoiceNumber}`;
  const html = renderOrderConfirmationHtml(args);

  await send({ to: args.to, subject, html });
}

export interface RewardEmailArgs {
  to: string;
  amount: number;
  reason: string;
  code?: string;
}

export async function sendRewardEmail(args: RewardEmailArgs): Promise<void> {
  if (!args.to || !args.to.includes('@')) return;
  const subject = `🎁 You earned ₹${args.amount}`;
  const html = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:16px">
      <h1 style="color:#00ffff;font-size:20px;margin:0 0 16px 0">You earned ₹${args.amount}</h1>
      <p style="color:#ccc;line-height:1.6">${args.reason}</p>
      ${args.code ? `<p style="color:#ccc;line-height:1.6">Your code: <strong>${args.code}</strong></p>` : ''}
      <p style="color:#888;font-size:12px;margin-top:24px">KALKI OS · Temple of Technology</p>
    </div>`;
  await send({ to: args.to, subject, html });
}

async function send(args: { to: string; subject: string; html: string }): Promise<void> {
  if (!RESEND_API_KEY) {
    logger.info('[Email] (dev) would send', { to: args.to, subject: args.subject });
    return;
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [args.to],
        subject: args.subject,
        html: args.html,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      logger.warn('[Email] Resend failed', { status: response.status, text: text.slice(0, 200) });
    }
  } catch (error) {
    logger.warn('[Email] Send failed', error);
  }
}

function renderOrderConfirmationHtml(a: OrderConfirmationArgs): string {
  return `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:16px">
      <h1 style="color:#00ffff;font-size:20px;margin:0 0 16px 0">Order confirmed</h1>
      <p style="color:#ccc;line-height:1.6">Hi ${a.buyerName},</p>
      <p style="color:#ccc;line-height:1.6">Thank you for your purchase. Your project is now live on KALKI OS.</p>
      <table style="width:100%;margin:20px 0;color:#eee;font-size:14px">
        <tr><td style="padding:6px 0;color:#888">Service</td><td>${a.serviceName}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Invoice</td><td>${a.invoiceNumber}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Amount</td><td>₹${a.amount.toLocaleString('en-IN')}</td></tr>
      </table>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com'}/client" style="display:inline-block;background:#00ffff;color:#000;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600">View your project</a>
      <p style="color:#666;font-size:12px;margin-top:32px">KALKI OS · Temple of Technology</p>
    </div>`;
}
