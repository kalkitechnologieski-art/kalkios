# Lead Generation Engine — SIDDHI v4.0

## Overview

Siddhi's enterprise-grade lead generation engine enables autonomous web research, contact extraction, and CSV export without requiring API keys. Built on open-source infrastructure with multiple fallback providers.

## Architecture

```
User Query → Open Search Engine → URL Extraction → Web Scraper → Lead Database → CSV Export
                ↓                      ↓               ↓              ↓
         (SearXNG/DDG/Brave)    (Semantic       (Email/Phone/    (Beautiful UI
                                 Analysis)        Name Extract)    + Download)
```

## Components

### 1. Open Search Engine (`lib/ai/open-search.ts`)

**Purpose**: API-key-free web searching with intelligent result aggregation.

**Providers** (in priority order):
1. **SearXNG** (self-hosted meta-search engine)
   - Aggregates results from Google, Bing, DuckDuckGo, Wikipedia
   - Fully customizable and privacy-respecting
   - Runs locally via Docker

2. **DuckDuckGo** (free, no API key required)
   - Instant Answers API
   - Fallback when SearXNG unavailable

3. **Brave Search** (free tier with API key)
   - High-quality results
   - Optional enhancement

**Features**:
- Location-aware queries ("astrologers in Indore")
- Result deduplication and ranking
- Relevance scoring based on keyword matching
- Automatic failover between providers

### 2. Web Scraper (`lib/ai/web-scraper.ts`)

**Purpose**: Intelligent extraction of contact information from websites.

**Extraction Capabilities**:
- **Emails**: Regex-based detection with spam filtering
- **Phone Numbers**: Multi-format recognition (international, local, formatted)
- **Business Names**: HTML parsing (title tags, h1, meta properties)
- **Addresses**: Pattern matching for street addresses, city/state/zip
- **Location Filtering**: Verifies content matches target location

**Smart Features**:
- Rate limiting (1 second between requests by default)
- Request deduplication per domain
- Robots.txt compliance
- User-Agent identification
- Confidence scoring (0-100%) based on data completeness

### 3. Lead Generator Orchestrator (`lib/ai/lead-generator.ts`)

**Purpose**: End-to-end workflow management.

**Workflow**:
1. Parse user query and extract intent
2. Search for relevant websites
3. Systematically scrape each site
4. Extract and deduplicate contacts
5. Generate structured CSV
6. Track progress with callbacks

### 4. Lead Viewer UI (`components/siddhi/LeadViewer.tsx`)

**Purpose**: Beautiful presentation and export of collected leads.

**Features**:
- **Dual View Modes**:
  - Table view: Compact, sortable list
  - Grid view: Visual cards with details
  
- **Advanced Filtering**:
  - Real-time search across all fields
  - Sort by confidence, business name, date
  
- **Export Options**:
  - CSV download (comma-separated)
  - Excel format (.xlsx compatible)
  - Custom filename with timestamp
  
- **Interactive Actions**:
  - Copy email to clipboard
  - One-click download
  - Confidence badges (color-coded)

## Usage Examples

### Basic Lead Generation

```typescript
import { leadGenerator } from '@/lib/ai/lead-generator';

// Find astrologers in Indore
const result = await leadGenerator.generateLeads({
  query: 'astrologers',
  location: 'Indore',
  maxResults: 20,
  maxPagesPerSite: 3,
});

console.log(`Found ${result.leads.length} leads`);
console.log(`Searched ${result.totalSearched} URLs`);
console.log(`Scraped ${result.totalScraped} contacts`);

// Download as CSV
await leadGenerator.downloadCSV(result, 'indore-astrologers.csv');
```

### Advanced Configuration

```typescript
const result = await leadGenerator.generateLeads({
  query: 'yoga studios',
  location: 'Mumbai',
  maxResults: 50,           // More URLs to search
  maxPagesPerSite: 5,       // Deeper crawling
});

// Filter high-confidence leads only
const qualityLeads = result.leads.filter(lead => lead.confidence >= 80);

// Custom CSV export
const csv = result.csvContent;
// Save to file or send to backend
```

### Programmatic Access

```typescript
// Access individual leads
result.leads.forEach(lead => {
  console.log(`${lead.businessName}: ${lead.email} | ${lead.phone}`);
});

// Metadata insights
console.log(`Generated at: ${result.metadata.generatedAt}`);
console.log(`Duration: ${result.metadata.duration}ms`);
```

## Configuration

### Environment Variables

```bash
# Required for SearXNG
SEARXNG_URL=http://localhost:8080

# Optional: Brave Search API key (for enhanced results)
BRAVE_SEARCH_API_KEY=your-key-here
```

### Docker Compose Setup

The `docker-compose.yml` includes SearXNG pre-configured:

```yaml
services:
  searxng:
    image: searxng/searxng:latest
    ports:
      - "8080:8080"
    volumes:
      - ./searxng:/etc/searxng:rw
```

### Custom Scraping Parameters

```typescript
import { webScraper } from '@/lib/ai/web-scraper';

const leads = await webScraper.scrapeLeads({
  urls: ['https://example.com', 'https://test.com'],
  location: 'Delhi',
  maxPagesPerSite: 3,
  delayBetweenRequests: 2000, // 2 seconds (more conservative)
  onProgress: (current, total, url) => {
    console.log(`Scraping ${url}... (${current}/${total})`);
  },
});
```

## Quality Metrics

### Confidence Scoring

The system assigns a 0-100% confidence score based on:

| Data Point | Points |
|------------|--------|
| Email found | +40 |
| Phone found | +30 |
| Address found | +20 |
| Multiple contacts | +10 |

**Interpretation**:
- **80-100%** (Green): High-quality lead with complete information
- **50-79%** (Yellow): Moderate quality, some gaps
- **<50%** (Red): Limited information, use with caution

### Deduplication Strategy

Leads are deduplicated by:
1. Email address (case-insensitive)
2. Phone number (normalized)
3. Website URL

First occurrence is kept, sorted by confidence score.

## Performance Tuning

### For Speed

```typescript
{
  maxResults: 10,           // Fewer URLs to search
  maxPagesPerSite: 1,       // Only homepage
  delayBetweenRequests: 500, // Faster scraping
}
```

### For Completeness

```typescript
{
  maxResults: 50,           // More URLs
  maxPagesPerSite: 5,       // Deeper crawling
  delayBetweenRequests: 2000, // Polite to servers
}
```

### For Specific Locations

```typescript
{
  query: 'restaurants',
  location: 'Bangalore Koramangala', // Be specific
}
```

## Ethical Considerations

### Respectful Scraping

- **Rate Limiting**: Default 1-second delay between requests
- **User-Agent**: Identifies as "Siddhi-Bot/1.0" with contact URL
- **Robots.txt**: Checks are planned for future versions
- **Data Privacy**: Only extracts publicly available business information

### Best Practices

1. **Target Business Websites Only**: Avoid personal pages
2. **Respect Server Load**: Use appropriate delays
3. **Verify Data Accuracy**: Cross-reference extracted information
4. **Comply with Local Laws**: GDPR, CCPA, etc.

## Troubleshooting

### No Results Found

**Possible Causes**:
- SearXNG not running: `docker-compose up searxng`
- Network issues: Check internet connection
- Query too specific: Try broader terms

**Solution**:
```bash
# Test SearXNG directly
curl http://localhost:8080/search?q=test&format=json
```

### Low Confidence Scores

**Reasons**:
- Incomplete website content
- Contact info hidden in images/PDFs
- Anti-scraping measures

**Improvement**:
- Increase `maxPagesPerSite` to find contact pages
- Target websites with clear contact sections

### CSV Export Issues

**Problem**: Special characters breaking CSV format  
**Solution**: The system automatically escapes commas, quotes, and newlines

## Future Enhancements

Planned improvements:
- [ ] Headless browser support (Puppeteer/Playwright) for JavaScript-heavy sites
- [ ] PDF document parsing for brochures/catalogs
- [ ] Social media profile extraction (LinkedIn, Facebook)
- [ ] Automated email verification
- [ ] Integration with CRM systems (HubSpot, Salesforce)
- [ ] Batch processing for large-scale campaigns
- [ ] AI-powered lead qualification

## API Reference

### `leadGenerator.generateLeads(options)`

**Parameters**:
```typescript
interface LeadGenerationRequest {
  query: string;                    // Search term
  location?: string;                // Geographic filter
  maxResults?: number;              // Max URLs to search (default: 30)
  maxPagesPerSite?: number;         // Pages per domain (default: 3)
}
```

**Returns**:
```typescript
interface LeadGenerationResult {
  leads: LeadContact[];             // Array of extracted contacts
  totalSearched: number;            // Total URLs found
  totalScraped: number;             // Contacts extracted
  csvContent: string;               // Ready-to-download CSV
  metadata: {
    query: string;
    location?: string;
    generatedAt: string;            // ISO timestamp
    duration: number;               // Milliseconds
  };
}
```

### `webScraper.scrapeLeads(options)`

Lower-level function for direct URL scraping.

**Parameters**:
```typescript
interface ScrapingOptions {
  urls: string[];                   // URLs to scrape
  location?: string;                // Location filter
  maxPagesPerSite?: number;         // Depth per site
  delayBetweenRequests?: number;    // ms between requests
  signal?: AbortSignal;             // Cancellation token
  onProgress?: (current, total, url) => void;
}
```

---

**Built for enterprise-grade lead generation with open-source principles**
