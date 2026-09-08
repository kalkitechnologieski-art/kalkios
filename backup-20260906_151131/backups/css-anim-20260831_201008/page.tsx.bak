import Link from 'next/link'
import { Shield, Home } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
        <Shield className="w-10 h-10 text-red-400" />
      </div>
      <h1 className="text-3xl font-bold text-white font-mono">Access Denied</h1>
      <p className="text-cyan-400/40 text-sm max-w-md mt-2">
        You don't have permission to access this page.
      </p>
      <Link href="/" className="mt-6 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition">
        <Home className="w-4 h-4" /> Return Home
      </Link>
    </div>
  )
}
