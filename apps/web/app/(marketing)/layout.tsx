// The root layout's AppLayout already renders the top bar and bottom nav;
// this group must not re-render them or the shell appears twice.

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
