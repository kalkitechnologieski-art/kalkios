// lib/agents/setu/agent.ts
// ──────────────────────────────────────────────────────────────────
// SETU intent → LEADGEN v3 aggregator. Delegates all lead work to
// the enterprise parallel pipeline (11 search engines + 7 business
// directories + query expansion) and adapts the events for Siddhi.
// Socratic hooks (generateQuestions / answerQuestions) are preserved
// so /api/ai/setu keeps working; the answers are folded into the
// query before fanout.
// ──────────────────────────────────────────────────────────────────

import { logger } from "@/lib/utils/logger";
import { Socratic } from "@/lib/reasoning/socratic";
import { generateLeads, LeadAggregatorResult, LeadOutput } from "@/lib/leads/aggregator";

export class SETUAgent {
  private socratic = new Socratic();
  private query: string;
  private refinedQuery: string;
  private location?: string;
  private leads: LeadOutput[] = [];
  private lastResult: LeadAggregatorResult | null = null;

  constructor(query: string, location?: string) {
    this.query = query;
    this.refinedQuery = query;
    if (location !== undefined) this.location = location;
  }

  async generateQuestions(): Promise<string[]> {
    try {
      return await this.socratic.generateQuestions(this.query);
    } catch (err) {
      logger.warn("[SETU] Socratic question generation failed:", err);
      return [];
    }
  }

  async answerQuestions(answers: string[]) {
    const extra = answers.filter((a) => a && a.trim()).join(", ");
    this.refinedQuery = extra ? `${this.query} ${extra}` : this.query;
  }

  async executeSearch(onProgress?: (event: unknown) => void) {
    const started = Date.now();
    try {
      const result = await generateLeads({
        query: this.refinedQuery,
        location: this.location,
        maxResults: 50,
        expandQueries: true,
        onProgress: (event) => {
          onProgress?.(adaptEvent(event));
        },
      });
      this.leads = result.leads;
      this.lastResult = result;
      logger.info(`[SETU] query="${this.refinedQuery}" leads=${result.leads.length} engines=${result.enginesUsed.length} dirs=${result.directoriesUsed.length} passes=${result.passesRun} duration=${Date.now() - started}ms`);
    } catch (err) {
      logger.warn("[SETU] Aggregator failed:", err);
      onProgress?.({ type: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  getLeads() { return this.leads; }

  getCSV(): string {
    return this.lastResult?.csvContent ?? "No leads found.";
  }

  getSummary() {
    if (!this.lastResult) {
      return { total: this.leads.length, message: "No search executed yet" };
    }
    return {
      total: this.leads.length,
      structured: this.lastResult.totalStructured,
      scraped: this.lastResult.totalScraped,
      engines: this.lastResult.enginesUsed,
      directories: this.lastResult.directoriesUsed,
      passes: this.lastResult.passesRun,
      durationMs: this.lastResult.durationMs,
    };
  }
}

function adaptEvent(ev: { type: string; [k: string]: unknown }): Record<string, unknown> {
  switch (ev.type) {
    case "started":
      return { type: "status", message: `Siddhi: launching ${((ev.engines as string[]) ?? []).length + ((ev.directories as string[]) ?? []).length} lead sources…` };
    case "engine_ok":
      return { type: "status", message: `engine ${ev.engine} → ${ev.count} URLs (${ev.durationMs}ms)` };
    case "engine_failed":
      return { type: "status", message: `engine ${ev.engine} blocked (${ev.code})` };
    case "directory_ok":
      return { type: "status", message: `${ev.directory} → ${ev.count} structured businesses (${ev.durationMs}ms)` };
    case "directory_failed":
      return { type: "status", message: `${ev.directory} unavailable (${ev.code})` };
    case "structured_ready":
      return { type: "status", message: `${ev.count} structured leads locked in` };
    case "search_done":
      return { type: "status", message: `found ${ev.urls} URLs — scraping top candidates…` };
    case "expansion":
      return { type: "status", message: `underfilled → expanding to ${(ev.queries as string[])?.length ?? 0} variant queries` };
    case "lead":
      return { type: "lead", lead: ev.lead };
    case "aborted":
      return { type: "status", message: "aborted by user" };
    case "complete":
      return { type: "complete", leads: ev.leads, csv: null, durationMs: ev.durationMs };
    default:
      return ev as unknown as Record<string, unknown>;
  }
}
