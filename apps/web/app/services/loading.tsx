export default function ServicesLoading() {
  return (
    <div className="max-w-6xl mx-auto py-6 animate-pulse">
      <div className="h-8 w-48 bg-white/5 rounded mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-white/5 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
