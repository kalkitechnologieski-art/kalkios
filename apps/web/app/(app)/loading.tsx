import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Skeleton variant="circular" className="w-12 h-12 border-4 border-cyan-500 border-t-transparent" />
        <p className="text-white/40 text-sm font-mono animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
