// == KALKI B4 EXPERIENCE ==
export default function MarketplaceLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="h-8 w-48 bg-white/5 rounded mb-6 animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
