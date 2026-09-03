'use client'
export function AdminProjectList({ projects, onSelect }: any) {
  return (
    <div className="space-y-2">
      {projects.map((p: any) => (
        <button
          key={p.id}
          onClick={() => onSelect(p)}
          className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/5"
        >
          <p className="text-white font-medium text-sm">{p.name}</p>
          <p className="text-white/40 text-xs">Client: {p.profiles?.full_name || 'Unknown'}</p>
          <p className={`text-xs mt-1 ${
            p.status === 'completed' ? 'text-green-400' :
            p.status === 'in_progress' ? 'text-yellow-400' : 'text-white/40'
          }`}>
            {p.status}
          </p>
        </button>
      ))}
    </div>
  )
}
