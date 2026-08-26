import { ReactNode } from 'react'

// Force dynamic rendering to skip prerendering
// The admin page uses Supabase client which needs environment variables

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
