// Enquiry intake emails: one acknowledgement to the sender with their reference
// code, one alert to the founder inbox so a lead never waits on a dashboard login.
import { sendEmail } from './send';
import { logger } from '@/lib/utils/logger';

const FOUNDER_INBOX = process.env.LEAD_ALERT_EMAIL || 'ceo@kalki-intelligence.in';

const escape = (value: string | null | undefined): string =>
  value == null
    ? ''
    : String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const WRAP = 'font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:16px';

export async function sendInquiryAck(args: {
  to: string;
  name: string;
  refCode: string | null;
  serviceInterest: string | null;
}): Promise<void> {
  if (!args.to.includes('@')) return;
  const subject = args.refCode ? `Enquiry received · ${args.refCode}` : 'Enquiry received';
  const html = `
    <div style="${WRAP}">
      <h1 style="color:#00ffff;font-size:20px;margin:0 0 16px 0">We have your enquiry</h1>
      <p style="color:#ccc;line-height:1.6">Hi ${escape(args.name)},</p>
      <p style="color:#ccc;line-height:1.6">Thank you for writing to KALKI Intelligence.${
        args.serviceInterest ? ` We have noted your interest in <strong>${escape(args.serviceInterest)}</strong>.` : ''
      }</p>
      <p style="color:#ccc;line-height:1.6">A human reads every enquiry. You will get a written scope and a fixed price
      within 24 hours — no payment is needed to start, and no bot will reply to you.</p>
      ${args.refCode ? `<p style="color:#888;font-size:13px">Reference: <strong style="color:#fff">${escape(args.refCode)}</strong></p>` : ''}
      <p style="color:#666;font-size:12px;margin-top:32px">KALKI Intelligence · Indore, Madhya Pradesh · kalki-intelligence.in</p>
    </div>`;
  await sendEmail({ to: args.to, subject, html });
}

export async function sendInquiryToFounder(args: {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  serviceInterest: string | null;
  budgetRange: string | null;
  timeline: string | null;
  message: string;
  source: string;
  refCode: string | null;
}): Promise<void> {
  if (!FOUNDER_INBOX.includes('@')) {
    logger.warn('[Inquiry] no founder inbox configured');
    return;
  }
  const subject = `New enquiry · ${args.refCode ?? ''} ${args.serviceInterest ?? args.company ?? args.name}`.trim();
  const row = (label: string, value: string | null) =>
    value ? `<tr><td style="padding:6px 0;color:#888;white-space:nowrap">${label}</td><td style="color:#eee">${escape(value)}</td></tr>` : '';
  const html = `
    <div style="${WRAP}">
      <h1 style="color:#00ffff;font-size:20px;margin:0 0 16px 0">New lead captured</h1>
      <table style="width:100%;margin:12px 0;font-size:14px;border-collapse:collapse">
        ${row('Name', args.name)}
        ${row('Email', args.email)}
        ${row('Phone', args.phone)}
        ${row('Company', args.company)}
        ${row('Interest', args.serviceInterest)}
        ${row('Budget', args.budgetRange)}
        ${row('Timeline', args.timeline)}
        ${row('Source', args.source)}
        ${row('Ref', args.refCode)}
      </table>
      <p style="background:#151515;border:1px solid #262626;border-radius:12px;padding:14px;color:#ddd;line-height:1.6;white-space:pre-wrap">${escape(args.message)}</p>
      <a href="mailto:${escape(args.email)}" style="display:inline-block;margin-top:8px;background:#00ffff;color:#000;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600">Reply to this lead</a>
      <p style="color:#666;font-size:12px;margin-top:24px">Admin inbox: /admin/inquiries</p>
    </div>`;
  await sendEmail({ to: FOUNDER_INBOX, subject, html });
}
