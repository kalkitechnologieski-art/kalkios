// == KALKI B2 ENGINES ==
// Referral email templates.
// -----------------------------------------------------------------------------

export function renderWelcomeReferralHtml(args: {
  name: string;
  code: string;
  shareLink: string;
}): string {
  return `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:16px">
      <h1 style="color:#00ffff;font-size:20px;margin:0 0 16px 0">Your referral code is ready</h1>
      <p style="color:#ccc;line-height:1.6">Hi ${args.name}, share your code and earn rewards for every successful referral.</p>
      <div style="background:#111;border:1px solid #00ffff33;border-radius:12px;padding:16px;margin:20px 0;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#00ffff;font-family:monospace;letter-spacing:2px">${args.code}</div>
      </div>
      <a href="${args.shareLink}" style="display:inline-block;background:#00ffff;color:#000;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600">Share your link</a>
      <p style="color:#666;font-size:12px;margin-top:32px">KALKI OS · Temple of Technology</p>
    </div>`;
}

export function renderRewardEarnedHtml(args: {
  name: string;
  amount: number;
  reason: string;
}): string {
  return `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:16px">
      <h1 style="color:#00ffff;font-size:20px;margin:0 0 16px 0">🎁 You earned ₹${args.amount}</h1>
      <p style="color:#ccc;line-height:1.6">Hi ${args.name}, ${args.reason}</p>
      <p style="color:#ccc;line-height:1.6">Your wallet has been credited. Use it at your next checkout.</p>
      <p style="color:#666;font-size:12px;margin-top:32px">KALKI OS · Temple of Technology</p>
    </div>`;
}

export function renderPayoutProcessedHtml(args: {
  name: string;
  amount: number;
  reference: string;
}): string {
  return `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:16px">
      <h1 style="color:#00ff88;font-size:20px;margin:0 0 16px 0">Payout processed</h1>
      <p style="color:#ccc;line-height:1.6">Hi ${args.name}, your referral payout of ₹${args.amount} has been sent.</p>
      <p style="color:#888;font-size:12px;margin-top:16px">Reference: ${args.reference}</p>
      <p style="color:#666;font-size:12px;margin-top:32px">KALKI OS · Temple of Technology</p>
    </div>`;
}
