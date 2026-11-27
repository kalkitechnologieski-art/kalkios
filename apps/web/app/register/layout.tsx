import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create an account',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
