// == KALKI B5 LAUNCH ==
// Entity graph: connects Organization ↔ Product ↔ Location ↔ Author
// with @id references so LLMs can traverse the graph deterministically.
// -----------------------------------------------------------------------------

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com';

export const ENTITY_IDS = {
  organization: `${SITE}/#organization`,
  localBusiness: `${SITE}/#localbusiness`,
  website: `${SITE}/#website`,
  siddhi: `${SITE}/#siddhi`,
} as const;

export function productEntityId(category: string, slug: string): string {
  return `${SITE}/marketplace/${encodeURIComponent(category)}/${encodeURIComponent(slug)}#product`;
}

export function articleEntityId(slug: string): string {
  return `${SITE}/timeline/${encodeURIComponent(slug)}#article`;
}

export interface GraphNode {
  '@type': string;
  '@id': string;
  [key: string]: unknown;
}

export function buildEntityGraph(input: {
  organization: GraphNode;
  localBusiness: GraphNode;
  product?: GraphNode;
  breadcrumb?: GraphNode;
}): { '@context': string; '@graph': GraphNode[] } {
  const graph: GraphNode[] = [input.organization, input.localBusiness];
  if (input.product) graph.push(input.product);
  if (input.breadcrumb) graph.push(input.breadcrumb);
  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

export function linkProductToOrg(product: Record<string, unknown>): Record<string, unknown> {
  return {
    ...product,
    brand: { '@id': ENTITY_IDS.organization },
    manufacturer: { '@id': ENTITY_IDS.organization },
  };
}
