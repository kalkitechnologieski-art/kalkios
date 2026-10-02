// == KALKI B4 EXPERIENCE ==
'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';

interface Props {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  projectName?: string;
}

export function ClientOrderCard({ id, amount, status, createdAt, projectName }: Props) {
  return (
    <Link
      href={`/client/order/${id}`}
      className="flex items-center justify-between bg-white/5 border border-cyan-500/10 hover:border-cyan-500/30 rounded-xl p-4 transition group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">
          {projectName ?? `Order #${id.slice(0, 8)}`}
        </p>
        <p className="text-white/40 text-xs mt-0.5">
          {new Date(createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-white font-bold text-sm">₹{amount.toLocaleString('en-IN')}</p>
          <Badge variant={status === 'paid' ? 'default' : 'secondary'}>{status}</Badge>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition" />
      </div>
    </Link>
  );
}
