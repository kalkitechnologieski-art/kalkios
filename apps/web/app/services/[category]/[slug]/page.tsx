import { redirect } from 'next/navigation';
import { decodeSegment, serviceHref } from '@/lib/services/href';

type PageProps = { params: Promise<{ category: string; slug: string }> };

export default async function ServicesDetailRedirect({ params }: PageProps) {
  const routeParams = await params;
  // serviceHref encodes once itself; passing the raw encoded segment would turn
  // "AI Chatbots" into "AI%2520Chatbots" and land on a 404.
  redirect(serviceHref({
    category: decodeSegment(routeParams.category),
    slug: decodeSegment(routeParams.slug),
  }));
}
