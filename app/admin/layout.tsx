'use client'
import { ReactNode } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>
}
