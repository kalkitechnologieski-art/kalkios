'use client'
import { ReactNode } from 'react'
import { EmployeeLayout } from '@/components/employee/EmployeeLayout'

export default function EmployeePanelLayout({ children }: { children: ReactNode }) {
  return <EmployeeLayout>{children}</EmployeeLayout>
}
