// lib/agents/setu/agent.ts
// ──────────────────────────────────────────────────────────────────
// EXPERT IMPLEMENTATION – Socratic questioning, web search,
// extraction, deduplication, and CSV export with progress streaming.
// ──────────────────────────────────────────────────────────────────

import { ZhipuClient } from "@/lib/providers/zhipu/client";
import { AgnesClient } from "@/lib/providers/agnes/client";
import { Socratic } from "@/lib/reasoning/socratic";
import { logger } from "@/lib/utils/logger";

export class SETUAgent {
  private socratic = new Socratic();
  private originalQuery: string;
  private refinedQuery = "";
  private questions: string[] = [];
  private answers: string[] = [];
  private leads: any[] = [];

  constructor(query: string) {
    this.originalQuery = query;
  }

  async generateQuestions(): Promise<string[]> {
    this.questions = await this.socratic.generateQuestions(this.originalQuery);
    return this.questions;
  }

  async answerQuestions(answers: string[]) {
    this.answers = answers;
    await this.refineSearch();
  }

  private async refineSearch() {
    const agnes = new AgnesClient();
    try {
      const response = await agnes.chat({
        messages: [
          { role: "system", content: "Combine the original query and user answers into a refined search query." },
          { role: "user", content: `Original: ${this.originalQuery}\nAnswers: ${this.answers.join("\n")}` },
        ],
        model: "agnes-2.0-flash",
        temperature: 0.3,
        max_tokens: 1024,
        stream: false,
      });
      this.refinedQuery = response.choices?.[0]?.message?.content || this.originalQuery;
    } catch (error) {
      logger.warn('[SETU] Refine search failed, using original query:', error);
      this.refinedQuery = this.originalQuery;
    }
  }

  async executeSearch(onProgress?: (event: any) => void) {
    onProgress?.({ type: 'status', message: 'Refining search query...' });
    await this.refineSearch();

    onProgress?.({ type: 'status', message: 'Searching the web...' });
    const zhipu = new ZhipuClient();
    let searchResults: any = { search_result: [] };
    try {
      searchResults = await zhipu.webSearch({
        search_query: this.refinedQuery,
        count: 20,
      });
    } catch (error) {
      logger.warn('[SETU] Web search failed:', error);
      onProgress?.({ type: 'error', message: 'Web search failed' });
      return;
    }

    // Read top pages (parallel)
    const pages: any[] = [];
    const urls = (searchResults.search_result || []).slice(0, 5).map((r: any) => r.link).filter(Boolean);
    const readTasks = urls.map(async (url: string) => {
      try {
        onProgress?.({ type: 'status', message: `Reading: ${url}` });
        const reader = await zhipu.webReader({
          url,
          return_format: "markdown",
          retain_images: false,
        });
        const content = (reader as any).reader_result?.content || "";
        return { url, content };
      } catch (error) {
        logger.warn('[SETU] Failed to read', url, error);
        return null;
      }
    });
    const readResults = await Promise.all(readTasks);
    for (const result of readResults) {
      if (result) pages.push(result);
    }

    // Extract leads using Agnes (parallel extraction for each page)
    const agnes = new AgnesClient();
    const extractTasks = pages.map(async (page) => {
      try {
        onProgress?.({ type: 'status', message: `Extracting leads from ${page.url}...` });
        const extraction = await agnes.chat({
          messages: [
            { role: "system", content: "Extract contact information (name, email, phone, company, job_title) from the text. Return JSON array." },
            { role: "user", content: page.content.slice(0, 6000) },
          ],
          model: "agnes-2.0-flash",
          temperature: 0.1,
          max_tokens: 4096,
          stream: false,
        });
        const raw = extraction.choices?.[0]?.message?.content || "[]";
        const extracted = JSON.parse(raw);
        if (!Array.isArray(extracted)) return [];
        return extracted.map((item: any) => ({
          ...item,
          source_url: page.url,
          confidence: this.calculateConfidence(item),
          verified: false,
        }));
      } catch (error) {
        logger.warn('[SETU] Extraction failed for', page.url, error);
        return [];
      }
    });
    const extractedResults = await Promise.all(extractTasks);
    for (const leads of extractedResults) {
      this.leads.push(...leads);
      for (const lead of leads) {
        onProgress?.({ type: 'lead', lead });
      }
    }

    // Filter and deduplicate
    this.leads = this.leads.filter((lead) => !!(lead.email || lead.phone || lead.name));
    this.leads = this.deduplicateLeads(this.leads);

    onProgress?.({ type: 'complete', leads: this.leads, csv: this.getCSV() });
  }

  private calculateConfidence(item: any): number {
    let conf = 0;
    if (item.email) conf += 0.3;
    if (item.phone) conf += 0.2;
    if (item.name) conf += 0.15;
    if (item.company) conf += 0.15;
    if (item.job_title) conf += 0.1;
    return Math.min(conf, 1);
  }

  private deduplicateLeads(leads: any[]): any[] {
    const result: any[] = [];
    for (const lead of leads) {
      const key = (lead.email || lead.phone || lead.name || '').toLowerCase();
      let duplicate = false;
      for (const existing of result) {
        const existingKey = (existing.email || existing.phone || existing.name || '').toLowerCase();
        if (this.isSimilar(key, existingKey)) {
          duplicate = true;
          break;
        }
      }
      if (!duplicate) result.push(lead);
    }
    return result;
  }

  private isSimilar(a: string, b: string, threshold: number = 0.8): boolean {
    if (!a || !b) return false;
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    return intersection.size / union.size > threshold;
  }

  getLeads() { return this.leads; }

  getCSV(): string {
    if (!this.leads.length) return "No leads found.";
    const headers = ["Name", "Email", "Phone", "Company", "Job Title", "Source URL", "Confidence"];
    const rows = this.leads.map((l) => [
      l.name || "",
      l.email || "",
      l.phone || "",
      l.company || "",
      l.job_title || "",
      l.source_url || "",
      `${Math.round(l.confidence * 100)}%`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    return "\uFEFF" + csv;
  }

  getSummary() {
    return {
      total: this.leads.length,
      verified: this.leads.filter((l) => l.verified).length,
      averageConfidence: this.leads.reduce((acc, l) => acc + l.confidence, 0) / (this.leads.length || 1),
    };
  }
}
