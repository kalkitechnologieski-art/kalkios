// lib/agents/setu/web-research-agent.ts
import { ResearchPlan, EnhancedLead, generateUUID } from '@/lib/ai/enhanced/types';
import { zhipuClient } from '@/lib/providers/zhipu/client';
import { agnesClient } from '@/lib/providers/agnes/client';

export class WebResearchAgent {
  async search(plan: ResearchPlan): Promise<Partial<EnhancedLead>[]> {
    const allResults: Partial<EnhancedLead>[] = [];

    for (const query of plan.search_queries.slice(0, 3)) {
      try {
        const searchResults = await zhipuClient.webSearch({
          search_query: query,
          count: 10,
          search_engine: 'search_pro',
        });

        const urls = (searchResults.search_result || [])
          .slice(0, 8)
          .map((r: any) => r.link)
          .filter(Boolean);

        const contents = await Promise.all(
          urls.map(async (url: string) => {
            try {
              const reader = await zhipuClient.webReader({
                url,
                return_format: 'markdown',
                retain_images: false,
              });
              return { url, content: reader.reader_result?.content || '' };
            } catch {
              return { url, content: '' };
            }
          })
        );

        for (const { url, content } of contents) {
          if (content.length < 100) continue;
          const extracted = await this.extractLeads(content, url);
          allResults.push(...extracted);
        }
      } catch (error) {
        console.warn('[WebResearch] Search failed:', error);
      }
    }

    return allResults;
  }

  async *streamSearch(plan: ResearchPlan): AsyncGenerator<Partial<EnhancedLead>> {
    for (const query of plan.search_queries.slice(0, 2)) {
      try {
        const results = await zhipuClient.webSearch({
          search_query: query,
          count: 5,
        });

        for (const result of (results.search_result || [])) {
          const url = result.link;
          if (!url) continue;

          try {
            const reader = await zhipuClient.webReader({
              url,
              return_format: 'markdown',
            });
            const content = reader.reader_result?.content || '';
            if (content.length > 100) {
              const leads = await this.extractLeads(content, url);
              for (const lead of leads) {
                yield lead;
              }
            }
          } catch {
            continue;
          }
        }
      } catch (error) {
        console.warn('[WebResearch] Stream search failed:', error);
      }
    }
  }

  private async extractLeads(content: string, sourceUrl: string): Promise<Partial<EnhancedLead>[]> {
    const prompt = `Extract contact information from this text. Return JSON array with objects containing: name, email, phone, company, jobTitle, linkedinUrl. Return only valid JSON.

Text: ${content.slice(0, 6000)}`;

    try {
      const response = await agnesClient.chat({
        messages: [
          { role: 'system', content: 'You are a lead extraction specialist. Return only valid JSON array.' },
          { role: 'user', content: prompt },
        ],
        model: 'agnes-2.0-flash',
        temperature: 0.1,
        max_tokens: 2000,
      });

      const rawContent = response.choices?.[0]?.message?.content || '[]';
      const cleanContent = rawContent
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const extracted = JSON.parse(cleanContent);

      if (!Array.isArray(extracted)) return [];

      return extracted.map((item: any) => ({
        id: generateUUID(),
        name: item.name || null,
        email: item.email || null,
        phone: item.phone || null,
        company: item.company || null,
        job_title: item.jobTitle || null,
        linkedin_url: item.linkedinUrl || null,
        website: sourceUrl,
        source_urls: [sourceUrl],
        confidence: 0.5,
        verified: false,
        enrichment: {},
        created_at: new Date(),
      }));
    } catch (error) {
      console.warn('[WebResearch] Lead extraction failed:', error);
      return this.fallbackExtract(content, sourceUrl);
    }
  }

  private fallbackExtract(content: string, sourceUrl: string): Partial<EnhancedLead>[] {
    const results: Partial<EnhancedLead>[] = [];
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = [...new Set(content.match(emailRegex) || [])];

    for (const email of emails) {
      results.push({
        id: generateUUID(),
        email,
        source_urls: [sourceUrl],
        confidence: 0.3,
        verified: false,
        enrichment: {},
        created_at: new Date(),
      });
    }

    return results;
  }
}
