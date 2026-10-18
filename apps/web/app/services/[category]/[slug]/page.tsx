import { redirect } from 'next/navigation';

type PageProps = { params: Promise<{ category: string; slug: string }> };

export default async function ServicesDetailRedirect({ params }: PageProps) {
  const { category, slug } = await params;
  redirect(
    `/marketplace/${encodeURIComponent(decodeURIComponent(category))}/${encodeURIComponent(decodeURIComponent(slug))}`
  );
}
