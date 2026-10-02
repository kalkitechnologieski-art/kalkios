import { PageSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return <PageSkeleton titleLines={1} cardCount={4} gridCols={4} />;
}
