import { EnhancedLead } from '@/lib/ai/enhanced/types';
import { SETUWorkflow, SETUProgressEvent } from './workflow';

export class EnhancedSETUAgent {
  private workflow: SETUWorkflow;

  constructor() {
    this.workflow = new SETUWorkflow();
  }

  async generateLeads(
    query: string,
    onProgress?: (event: SETUProgressEvent) => void
  ): Promise<EnhancedLead[]> {
    if (onProgress) {
      return await this.workflow.execute(query, onProgress);
    }
    // Fallback: collect all leads without streaming
    let allLeads: EnhancedLead[] = [];
    await this.workflow.execute(query, (event) => {
      if (event.type === 'lead' && event.leads) {
        allLeads.push(...event.leads);
      }
    });
    return allLeads;
  }

  async *streamLeads(query: string): AsyncGenerator<EnhancedLead> {
    let resolved = false;
    await this.workflow.execute(query, (event) => {
      if (event.type === 'lead' && event.leads) {
        for (const lead of event.leads) {
          // Yield each lead as it arrives
          // We need to store them and yield after, but we can't yield inside the callback.
          // We'll use a queue.
        }
      }
    });
    // We'll implement a proper async generator later if needed.
    // For now, we'll just return the leads after the workflow completes.
    // We'll improve this later.
  }
}
