export default function AdminLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-pulse">
      <div className="h-8 w-48 bg-white/5 rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 h-96 bg-white/5 rounded-xl" />
        <div className="md:col-span-2 h-96 bg-white/5 rounded-xl" />
      </div>
    </div>
  )
}
