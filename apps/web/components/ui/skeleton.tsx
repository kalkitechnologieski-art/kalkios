import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "text" | "circular" | "card";
}

export function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  if (variant === "circular") {
    return (
      <div
        className={cn("animate-pulse rounded-full bg-white/5", className)}
        {...props}
      />
    );
  }

  if (variant === "text") {
    return (
      <div
        className={cn(
          "h-4 w-full animate-pulse rounded bg-white/5",
          className
        )}
        {...props}
      />
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "animate-pulse rounded-xl bg-white/5 p-6",
          className
        )}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn("animate-pulse rounded-md bg-white/5", className)}
      {...props}
    />
  );
}

export function PageSkeleton({
  titleLines = 1,
  cardCount = 0,
  gridCols = 3,
  className,
}: {
  titleLines?: number;
  cardCount?: number;
  gridCols?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[gridCols];

  return (
    <div className={cn("max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12", className)}>
      {/* Title skeleton */}
      <div className="space-y-2 mb-6">
        {Array.from({ length: titleLines }).map((_, i) => (
          <Skeleton key={i} variant="text" className={`w-${i === 0 ? "1/2" : "1/3"}`} />
        ))}
      </div>

      {/* Card grid skeleton */}
      {cardCount > 0 && (
        <div className={`grid ${gridClass} gap-4 md:gap-6`}>
          {Array.from({ length: cardCount }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-48" />
          ))}
        </div>
      )}
    </div>
  );
}
