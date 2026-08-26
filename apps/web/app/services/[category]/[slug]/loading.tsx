export default function ServiceLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-pulse">
      <div className="h-8 w-48 bg-white/5 rounded mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="aspect-square bg-white/5 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 bg-white/5 rounded" />
          <div className="h-4 w-1/2 bg-white/5 rounded" />
          <div className="h-12 w-1/3 bg-white/5 rounded" />
          <div className="h-32 w-full bg-white/5 rounded" />
          <div className="h-12 w-full bg-white/5 rounded" />
        </div>
      </div>
    </div>
  )
}
