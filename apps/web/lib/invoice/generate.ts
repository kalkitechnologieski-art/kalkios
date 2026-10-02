// == KALKI B1 SPINE ==
// Generates a browser-printable HTML invoice.
// No external deps. User can "Print to PDF" from any browser.
// -----------------------------------------------------------------------------

import { formatINR } from '@/lib/commerce/currency';

export interface InvoiceData {
  invoiceNumber: string;
  generatedAt: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerGstin?: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    gstRate: number;
  }>;
  subtotal: number;
  discountTotal: number;
  taxBreakdown: Array<{ rate: number; taxableAmount: number; taxAmount: number }>;
  totalTax: number;
  grandTotal: number;
  paid: boolean;
  paymentReference?: string;
}

export function renderInvoiceHtml(data: InvoiceData): string {
  const itemsHtml = data.items.map((it) => `
    <tr>
      <td>${escapeHtml(it.name)}</td>
      <td class="num">${it.quantity}</td>
      <td class="num">${formatINR(it.price)}</td>
      <td class="num">${it.gstRate}%</td>
      <td class="num">${formatINR(it.price * it.quantity)}</td>
    </tr>`).join('');

  const taxHtml = data.taxBreakdown.map((t) => `
    <tr>
      <td>GST @ ${t.rate}%</td>
      <td class="num">${formatINR(t.taxableAmount)}</td>
      <td class="num">${formatINR(t.taxAmount)}</td>
    </tr>`).join('');

  const paidBadge = data.paid
    ? `<span class="badge paid">PAID</span>`
    : `<span class="badge unpaid">UNPAID</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(data.invoiceNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Inter, system-ui, sans-serif; background: #f7f7f9; color: #111; padding: 40px; margin: 0; }
    .invoice { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 20px rgba(0,0,0,0.06); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .brand { font-weight: 700; font-size: 20px; letter-spacing: 0.5px; }
    .brand-sub { color: #888; font-size: 12px; margin-top: 4px; }
    .meta { text-align: right; font-size: 13px; color: #444; }
    .meta strong { color: #111; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
    .badge.paid { background: #d1fadf; color: #027a48; }
    .badge.unpaid { background: #fee4e2; color: #b42318; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 13px; }
    .parties h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #888; margin: 0 0 6px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
    thead { background: #fafafa; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { font-weight: 600; color: #555; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .totals { margin-left: auto; width: 300px; font-size: 13px; }
    .totals tr td { border: none; padding: 6px 12px; }
    .totals tr td.num { text-align: right; }
    .totals tr.grand td { font-weight: 700; font-size: 16px; border-top: 2px solid #111; padding-top: 12px; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #888; text-align: center; }
    @media print { body { padding: 0; background: #fff; } .invoice { box-shadow: none; border-radius: 0; } }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="brand">KALKI INTELLIGENCE</div>
        <div class="brand-sub">Temple of Technology · Indore, India</div>
      </div>
      <div class="meta">
        <div><strong>Invoice</strong> ${escapeHtml(data.invoiceNumber)}</div>
        <div>Date: ${new Date(data.generatedAt).toLocaleDateString('en-IN')}</div>
        <div style="margin-top:8px">${paidBadge}</div>
      </div>
    </div>

    <div class="parties">
      <div>
        <h4>Billed to</h4>
        <div><strong>${escapeHtml(data.buyerName)}</strong></div>
        <div>${escapeHtml(data.buyerEmail)}</div>
        ${data.buyerPhone ? `<div>${escapeHtml(data.buyerPhone)}</div>` : ''}
        ${data.buyerGstin ? `<div>GSTIN: ${escapeHtml(data.buyerGstin)}</div>` : ''}
      </div>
      <div style="text-align:right">
        <h4>From</h4>
        <div><strong>KALKI Intelligence LLP</strong></div>
        <div>51, MOG Lines, Swastik Nagar</div>
        <div>Indore, MP 452002</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="num">Qty</th>
          <th class="num">Price</th>
          <th class="num">GST</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <table class="totals">
      <tr><td>Subtotal</td><td class="num">${formatINR(data.subtotal)}</td></tr>
      ${data.discountTotal > 0 ? `<tr><td>Discount</td><td class="num">−${formatINR(data.discountTotal)}</td></tr>` : ''}
      ${taxHtml}
      <tr class="grand"><td>Total paid</td><td class="num">${formatINR(data.grandTotal)}</td></tr>
    </table>

    ${data.paymentReference ? `<div style="margin-top:16px;font-size:11px;color:#888">Payment reference: ${escapeHtml(data.paymentReference)}</div>` : ''}

    <div class="footer">
      Thank you for your business. · kalki-intelligence.in · team@kalki-intelligence.in
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
