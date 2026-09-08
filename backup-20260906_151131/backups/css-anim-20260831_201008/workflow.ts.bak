import { SocraticOrchestrator } from './socratic-orchestrator';
import { WebResearchAgent } from './web-research-agent';
import { LeadAggregator } from './lead-aggregator';
import { EnhancedLead } from '@/lib/ai/enhanced/types';

export interface SETUProgressEvent {
  type: 'status' | 'question' | 'retry' | 'lead' | 'complete' | 'error';
  message: string;
  progress?: number; // 0-100
  details?: any;
  questions?: string[];
  leads?: EnhancedLead[];
}

export class SETUWorkflow {
  private socratic: SocraticOrchestrator;
  private webResearch: WebResearchAgent;
  private aggregator: LeadAggregator;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    this.socratic = new SocraticOrchestrator();
    this.webResearch = new WebResearchAgent();
    this.aggregator = new LeadAggregator();
  }

  async execute(
    query: string,
    onProgress: (event: SETUProgressEvent) => void
  ): Promise<EnhancedLead[]> {
    // ─── Phase 1: Socratic Questioning ──────────────────────────────────
    onProgress({
      type: 'status',
      message: '🧠 Generating clarifying questions...',
      progress: 5,
    });

    const questions = await this.socratic.decomposeQuery(query);
    if (questions.length > 0) {
      onProgress({
        type: 'question',
        message: 'Please answer the following questions to refine your search:',
        questions,
        progress: 10,
      });
      // Wait for answers (handled by caller)
      // We'll use a separate method for answer submission
      return [];
    }

    // ─── Phase 2: Research Plan ──────────────────────────────────────────
    onProgress({
      type: 'status',
      message: '📋 Creating research plan...',
      progress: 15,
    });

    const plan = await this.socratic.createPlan(query);

    // ─── Phase 3: Search with Retries ──────────────────────────────────
    onProgress({
      type: 'status',
      message: '🔍 Searching the web...',
      progress: 20,
    });

    let rawLeads: Partial<EnhancedLead>[] = [];
    let searchAttempt = 0;
    let searchSuccess = false;

    while (searchAttempt < this.maxRetries && !searchSuccess) {
      try {
        onProgress({
          type: 'status',
          message: `🌐 Web search attempt ${searchAttempt + 1}/${this.maxRetries}...`,
          progress: 20 + (searchAttempt * 10),
        });
        rawLeads = await this.webResearch.search(plan);
        searchSuccess = true;
        onProgress({
          type: 'status',
          message: `✅ Found ${rawLeads.length} raw leads.`,
          progress: 40,
        });
      } catch (error) {
        searchAttempt++;
        onProgress({
          type: 'retry',
          message: `⚠️ Search failed (attempt ${searchAttempt}/${this.maxRetries}): ${(error as Error).message}`,
          details: error,
          progress: 20 + (searchAttempt * 5),
        });
        if (searchAttempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, searchAttempt);
          await this.sleep(delay);
        }
      }
    }

    if (!searchSuccess) {
      onProgress({
        type: 'error',
        message: '❌ Search failed after multiple retries.',
        progress: 0,
      });
      return [];
    }

    // ─── Phase 4: Aggregation & Deduplication ──────────────────────────
    onProgress({
      type: 'status',
      message: '📊 Aggregating and deduplicating leads...',
      progress: 50,
    });

    const aggregated = this.aggregator.merge(rawLeads);
    const scored = this.aggregator.score(aggregated);
    const deduped = this.aggregator.deduplicate(scored);

    onProgress({
      type: 'status',
      message: `📊 ${deduped.length} unique leads identified.`,
      progress: 60,
    });

    // ─── Phase 5: Enrichment with Retries ──────────────────────────────
    onProgress({
      type: 'status',
      message: '🔧 Enriching leads with company data...',
      progress: 65,
    });

    const enriched: EnhancedLead[] = [];
    let enrichIndex = 0;
    for (const lead of deduped) {
      let enrichAttempt = 0;
      let enrichedLead = lead;
      while (enrichAttempt < this.maxRetries) {
        try {
          enrichedLead = await this.aggregator.enrich(lead);
          break;
        } catch (error) {
          enrichAttempt++;
          onProgress({
            type: 'retry',
            message: `⚠️ Enrichment failed for ${lead.name || 'lead'} (attempt ${enrichAttempt}/${this.maxRetries})`,
            details: error,
            progress: 65 + (enrichIndex / deduped.length) * 20,
          });
          if (enrichAttempt < this.maxRetries) {
            await this.sleep(this.retryDelay * Math.pow(2, enrichAttempt));
          }
        }
      }
      enriched.push(enrichedLead);
      enrichIndex++;
      // Report individual lead progress
      onProgress({
        type: 'lead',
        message: `✅ Found lead: ${enrichedLead.name || 'Unknown'}`,
        details: enrichedLead,
        progress: 65 + (enrichIndex / deduped.length) * 20,
        leads: [enrichedLead],
      });
    }

    // ─── Phase 6: Final Summary ─────────────────────────────────────────
    onProgress({
      type: 'status',
      message: `🎯 SETU complete: ${enriched.length} leads enriched and ready.`,
      progress: 100,
    });

    onProgress({
      type: 'complete',
      message: 'All leads ready for export.',
      leads: enriched,
      progress: 100,
    });

    return enriched;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
