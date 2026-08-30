export function formatSourceCitation(source: any): string {
  return `[${source.title || "Source"}](${source.link})`;
}
