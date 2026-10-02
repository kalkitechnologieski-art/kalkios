import { PageSkeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return <PageSkeleton titleLines={1} cardCount={3} gridCols={3} />;
}
