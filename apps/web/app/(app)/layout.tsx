// The root layout already renders AppLayout (sidebar + top bar + bottom nav);
// wrapping again here duplicated the entire shell.

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
