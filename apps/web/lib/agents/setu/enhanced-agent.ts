import { EnhancedLead, ResearchPlan } from '@/lib/ai/enhanced/types';
import { SocraticOrchestrator } from './socratic-orchestrator';
import { WebResearchAgent } from './web-research-agent';
import { LeadAggregator } from './lead-aggregator';

export class EnhancedSETUAgent {
  private socraticOrchestrator: SocraticOrchestrator;
  private webResearch: WebResearchAgent;
  private aggregator: LeadAggregator;

  constructor() {
    this.socraticOrchestrator = new SocraticOrchestrator();
    this.webResearch = new WebResearchAgent();
    this.aggregator = new LeadAggregator();
  }

  async generateLeads(query: string): Promise<EnhancedLead[]> {
    const researchPlan = await this.socraticOrchestrator.createPlan(query);
    const rawLeads = await this.webResearch.search(researchPlan);
    const aggregated = this.aggregator.merge(rawLeads);
    const scored = this.aggregator.score(aggregated);
    const deduped = this.aggregator.deduplicate(scored);
    const enriched = await Promise.all(
      deduped.map(lead => this.aggregator.enrich(lead))
    );
    return enriched;
  }

  async *streamLeads(query: string): AsyncGenerator<EnhancedLead> {
    const researchPlan = await this.socraticOrchestrator.createPlan(query);
    for await (const rawLead of this.webResearch.streamSearch(researchPlan)) {
      const aggregated = this.aggregator.merge([rawLead]);
      if (aggregated.length > 0) {
        const scored = this.aggregator.score(aggregated);
        const enriched = await this.aggregator.enrich(scored[0]!);
        yield enriched;
      }
    }
  }
}
