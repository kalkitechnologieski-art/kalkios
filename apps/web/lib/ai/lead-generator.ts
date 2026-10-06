/**
 * SIDDHI v4.0 — Lead Generation Orchestrator
 * 
 * End-to-end lead generation workflow:
 * 1. Semantic search for relevant websites
 * 2. Intelligent scraping with location filtering
 * 3. Contact extraction and deduplication
 * 4. CSV/Excel export
 */

import { openSearch } from './open-search';
import { webScraper, type LeadContact } from './web-scraper';
import { logger } from '@/lib/utils/logger';

export interface LeadGenerationRequest {
  query: string;
  location?: string;
  maxResults?: number;
  maxPagesPerSite?: number;
}

export interface LeadGenerationResult {
  leads: LeadContact[];
  totalSearched: number;
  totalScraped: number;
  csvContent: string;
  metadata: {
    query: string;
    location?: string;
    generatedAt: string;
    duration: number;
  };
}

class LeadGenerator {
  private static instance: LeadGenerator | null = null;
  
  static getInstance(): LeadGenerator {
    if (!LeadGenerator.instance) {
      LeadGenerator.instance = new LeadGenerator();
    }
    return LeadGenerator.instance;
  }

  async generateLeads(request: LeadGenerationRequest): Promise<LeadGenerationResult> {
    const startTime = Date.now();
    const { query, location, maxResults = 50, maxPagesPerSite = 3 } = request;

    logger.info(`[LeadGenerator] Starting lead generation for "${query}" in ${location || 'any location'}`);

    // Step 1: Search for relevant websites - increased from 30 to 50 for more coverage
    const urls = await openSearch.extractUrlsFromSearch(query, location);
    
    // Take top URLs but ensure we have enough for good coverage
    const limitedUrls = urls.slice(0, Math.min(maxResults, urls.length));

    logger.info(`[LeadGenerator] Found ${limitedUrls.length} URLs to scrape`);

    // Step 2: Scrape leads from websites with improved extraction
    let progressCurrent = 0;
    const progressTotal = limitedUrls.length * maxPagesPerSite;

    const leads = await webScraper.scrapeLeads({
      urls: limitedUrls,
      location,
      maxPagesPerSite,
      onProgress: (current, total, url) => {
        progressCurrent = current;
        logger.info(`[LeadGenerator] Progress: ${current}/${total} - ${url}`);
      },
    });

    // Step 3: Filter and deduplicate leads
    const uniqueLeads = this.deduplicateLeads(leads);
    logger.info(`[LeadGenerator] Deduplicated: ${leads.length} → ${uniqueLeads.length} leads`);

    // Step 4: Generate CSV
    const csvContent = webScraper.generateCSV(uniqueLeads);

    const duration = Date.now() - startTime;

    const result: LeadGenerationResult = {
      leads: uniqueLeads,
      totalSearched: urls.length,
      totalScraped: uniqueLeads.length,
      csvContent,
      metadata: {
        query,
        location,
        generatedAt: new Date().toISOString(),
        duration,
      },
    };

    logger.info(`[LeadGenerator] Completed in ${duration}ms: ${uniqueLeads.length} leads from ${urls.length} URLs`);

    return result;
  }

  /**
   * Remove duplicate leads based on email or business name
   */
  private deduplicateLeads(leads: LeadContact[]): LeadContact[] {
    const seen = new Set<string>();
    const unique: LeadContact[] = [];

    for (const lead of leads) {
      // Create a unique key from email or business name
      const key = lead.email 
        ? `email:${lead.email.toLowerCase()}`
        : `business:${(lead.businessName || '').toLowerCase()}:${(lead.name || '').toLowerCase()}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(lead);
      }
    }

    return unique;
  }

  async downloadCSV(result: LeadGenerationResult, filename?: string): Promise<void> {
    const blob = new Blob([result.csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `leads-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const leadGenerator = LeadGenerator.getInstance();
