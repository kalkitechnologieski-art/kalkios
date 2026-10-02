/**
 * SIDDHI v4.0 — Lead Viewer & Export Component
 * 
 * Beautiful presentation of collected leads with:
 * - Table and grid view modes
 * - Advanced filtering and sorting
 * - CSV/Excel export
 * - Copy-to-clipboard for contact details
 * - Confidence scoring visualization
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Copy, 
  Filter, 
  SortAsc, 
  Grid3X3, 
  List, 
  Search,
  Mail,
  Phone,
  MapPin,
  Globe,
  CheckCircle2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LeadContact } from '@/lib/ai/web-scraper';

interface LeadViewerProps {
  leads: LeadContact[];
  onExport?: (format: 'csv' | 'excel') => void;
}

type ViewMode = 'table' | 'grid';
type SortField = 'confidence' | 'businessName' | 'extractedAt';
type SortOrder = 'asc' | 'desc';

export function LeadViewer({ leads, onExport }: LeadViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('confidence');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredAndSortedLeads = useMemo(() => {
    let filtered = leads;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = leads.filter(lead =>
        lead.businessName?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query) ||
        lead.city?.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortOrder === 'asc' 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [leads, searchQuery, sortField, sortOrder]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const csv = generateCSVFromLeads(filteredAndSortedLeads);
    downloadFile(csv, 'leads.csv', 'text/csv');
    onExport?.('csv');
  };

  const handleExportExcel = () => {
    const csv = generateCSVFromLeads(filteredAndSortedLeads);
    downloadFile(csv, 'leads.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    onExport?.('excel');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 bg-white/5 border border-cyan-500/10 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-white/40" />
          <input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            className="text-white/60 hover:text-white"
          >
            {viewMode === 'table' ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-white/60 px-2">
        <span>{filteredAndSortedLeads.length} leads found</span>
        {searchQuery && <Badge variant="secondary">{searchQuery}</Badge>}
      </div>

      {/* Leads Display */}
      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <TableView 
            key="table"
            leads={filteredAndSortedLeads}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={toggleSort}
            onCopy={handleCopy}
            copiedId={copiedId}
          />
        ) : (
          <GridView 
            key="grid"
            leads={filteredAndSortedLeads}
            onCopy={handleCopy}
            copiedId={copiedId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Table View Component
function TableView({ 
  leads, 
  sortField, 
  sortOrder, 
  onSort, 
  onCopy, 
  copiedId 
}: {
  leads: LeadContact[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            <th className="p-3 text-xs font-medium text-white/40 uppercase tracking-wider">Business</th>
            <th className="p-3 text-xs font-medium text-white/40 uppercase tracking-wider">Contact</th>
            <th 
              className="p-3 text-xs font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60"
              onClick={() => onSort('confidence')}
            >
              <div className="flex items-center gap-1">
                Confidence
                {sortField === 'confidence' && <SortAsc className={`w-3 h-3 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />}
              </div>
            </th>
            <th className="p-3 text-xs font-medium text-white/40 uppercase tracking-wider">Location</th>
            <th className="p-3 text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, index) => (
            <motion.tr
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <td className="p-3">
                <div className="font-medium text-white/90">{lead.businessName || 'Unknown'}</div>
                <div className="text-xs text-white/40 truncate max-w-[200px]">{lead.website}</div>
              </td>
              <td className="p-3">
                <div className="space-y-1">
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm text-cyan-400">
                      <Mail className="w-3 h-3" />
                      {lead.email}
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-sm text-purple-400">
                      <Phone className="w-3 h-3" />
                      {lead.phone}
                    </div>
                  )}
                </div>
              </td>
              <td className="p-3">
                <ConfidenceBadge score={lead.confidence} />
              </td>
              <td className="p-3">
                {lead.city && (
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <MapPin className="w-3 h-3" />
                    {lead.city}
                  </div>
                )}
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  {lead.email && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCopy(lead.email!, `email-${index}`)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedId === `email-${index}` ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Grid View Component
function GridView({ 
  leads, 
  onCopy, 
  copiedId 
}: {
  leads: LeadContact[];
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {leads.map((lead, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="bg-white/5 border-white/10 hover:border-cyan-500/30 transition-colors">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white/90">{lead.businessName || 'Unknown Business'}</h3>
                  <div className="flex items-center gap-1 text-xs text-white/40 mt-1">
                    <Globe className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{lead.website}</span>
                  </div>
                </div>
                <ConfidenceBadge score={lead.confidence} />
              </div>

              <div className="space-y-2 text-sm">
                {lead.email && (
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCopy(lead.email!, `email-grid-${index}`)}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                    >
                      {copiedId === `email-grid-${index}` ? (
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                )}

                {lead.phone && (
                  <div className="flex items-center gap-2 text-purple-400">
                    <Phone className="w-4 h-4" />
                    <span>{lead.phone}</span>
                  </div>
                )}

                {lead.address && (
                  <div className="flex items-start gap-2 text-white/60">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span className="text-xs">{lead.address}</span>
                  </div>
                )}
              </div>

              {lead.city && (
                <Badge variant="secondary" className="text-xs">
                  {lead.city}
                </Badge>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Confidence Badge Component
function ConfidenceBadge({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 50) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <Badge className={`${getColor(score)} border`}>
      {score}%
    </Badge>
  );
}

// Utility Functions
function generateCSVFromLeads(leads: LeadContact[]): string {
  const headers = ['Business Name', 'Contact Name', 'Email', 'Phone', 'Address', 'City', 'Website', 'Source URL', 'Confidence', 'Extracted At'];
  
  const rows = leads.map(lead => [
    escapeCSV(lead.businessName || ''),
    escapeCSV(lead.name || ''),
    escapeCSV(lead.email || ''),
    escapeCSV(lead.phone || ''),
    escapeCSV(lead.address || ''),
    escapeCSV(lead.city || ''),
    escapeCSV(lead.website || ''),
    escapeCSV(lead.sourceUrl || ''),
    lead.confidence.toString(),
    lead.extractedAt,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
