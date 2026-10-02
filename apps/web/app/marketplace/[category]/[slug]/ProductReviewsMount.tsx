// == KALKI B4 EXPERIENCE ==
'use client';

import { useServiceReviews } from '@/hooks/useReviews';
import { ReviewList } from '@/components/reviews/ReviewList';

export function ProductReviewsMount({ serviceId }: { serviceId: string }) {
  const { reviews, stats, loading } = useServiceReviews(serviceId);
  return <ReviewList reviews={reviews} stats={stats} loading={loading} />;
}
