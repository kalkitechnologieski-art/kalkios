import { ZhipuClient } from "@/lib/providers/zhipu/client";
import { AgnesClient } from "@/lib/providers/agnes/client";
import { Socratic } from "@/lib/reasoning/socratic";

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
  }

  async executeSearch() {
    const zhipu = new ZhipuClient();
    const searchResults = await zhipu.webSearch({
      search_query: this.refinedQuery,
      count: 20,
    });

    // Limit to first 5 results for speed (Vercel Hobby 60s limit)
    const pages = [];
    for (const result of (searchResults.search_result || []).slice(0, 5)) {
      try {
        const reader = await zhipu.webReader({
          url: result.link,
          return_format: "markdown",
          retain_images: false,
        });
        pages.push({ ...result, content: reader.reader_result?.content || "" });
      } catch (_) {}
    }

    const agnes = new AgnesClient();
    for (const page of pages) {
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
      try {
        const extracted = JSON.parse(extraction.choices?.[0]?.message?.content || "[]");
        for (const item of extracted) {
          this.leads.push({
            ...item,
            source_url: page.link,
            confidence: this.calculateConfidence(item),
            verified: false,
          });
        }
      } catch (_) {}
    }

    this.leads = this.leads.filter((lead) => !!(lead.email || lead.phone || lead.name));
    this.leads = this.deduplicateLeads(this.leads);
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
    const seen = new Map<string, any>();
    for (const lead of leads) {
      const key = lead.email || lead.phone || lead.name || "unknown";
      if (!seen.has(key) || seen.get(key).confidence < lead.confidence) {
        seen.set(key, lead);
      }
    }
    return Array.from(seen.values());
  }

  getLeads() {
    return this.leads;
  }

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
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join(
      "\n"
    );
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
