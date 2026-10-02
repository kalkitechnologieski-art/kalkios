/**
 * SIDDHI v4.0 — Enterprise Lead Viewer & Analytics Dashboard
 * 
 * Professional-grade lead management with:
 * - Advanced multi-field filtering
 * - Bulk operations (select, export, delete)
 * - Real-time analytics dashboard
 * - CRM-ready export formats
 * - Data visualization
 * - Quality scoring insights
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
  X,
  BarChart3,
  FileDown,
  Trash2,
  CheckSquare,
  Square,
  TrendingUp,
  Users,
  Target,
  Award,
  Calendar,
  ChevronDown,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadContact } from '@/lib/ai/web-scraper';

interface LeadViewerProps {
  leads: LeadContact[];
  onExport?: (format: 'csv' | 'excel' | 'json') => void;
  onDelete?: (leads: LeadContact[]) => void;
}

type ViewMode = 'table' | 'grid' | 'analytics';
type SortField = 'confidence' | 'businessName' | 'extractedAt' | 'city';
type SortOrder = 'asc' | 'desc';

interface Filters {
  searchQuery: string;
  minConfidence: number;
  maxConfidence: number;
  hasEmail: boolean;
  hasPhone: boolean;
  city: string | null;
  dateRange: 'all' | 'today' | 'week' | 'month';
}

export function EnterpriseLeadViewer({ leads, onExport, onDelete }: LeadViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('analytics');
  const [sortField, setSortField] = useState<SortField>('confidence');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    searchQuery: '',
    minConfidence: 0,
    maxConfidence: 100,
    hasEmail: false,
    hasPhone: false,
    city: null,
    dateRange: 'all',
  });

  // Extract unique cities for filter
  const uniqueCities = useMemo(() => {
    const cities = leads.map(l => l.city).filter(Boolean) as string[];
    return [...new Set(cities)].sort();
  }, [leads]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const total = leads.length;
    const withEmail = leads.filter(l => l.email).length;
    const withPhone = leads.filter(l => l.phone).length;
    const highQuality = leads.filter(l => l.confidence >= 80).length;
    const mediumQuality = leads.filter(l => l.confidence >= 50 && l.confidence < 80).length;
    const lowQuality = leads.filter(l => l.confidence < 50).length;
    const avgConfidence = total > 0 ? Math.round(leads.reduce((sum, l) => sum + l.confidence, 0) / total) : 0;
    
    const cityDistribution: Record<string, number> = {};
    leads.forEach(l => {
      if (l.city) {
        cityDistribution[l.city] = (cityDistribution[l.city] || 0) + 1;
      }
    });

    return {
      total,
      withEmail,
      withPhone,
      highQuality,
      mediumQuality,
      lowQuality,
      avgConfidence,
      cityDistribution,
      emailRate: total > 0 ? Math.round((withEmail / total) * 100) : 0,
      phoneRate: total > 0 ? Math.round((withPhone / total) * 100) : 0,
    };
  }, [leads]);

  // Apply filters and sorting
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = leads;

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.businessName?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query) ||
        lead.city?.toLowerCase().includes(query) ||
        lead.address?.toLowerCase().includes(query)
      );
    }

    // Confidence range
    filtered = filtered.filter(lead =>
      lead.confidence >= filters.minConfidence &&
      lead.confidence <= filters.maxConfidence
    );

    // Has email/phone
    if (filters.hasEmail) filtered = filtered.filter(l => l.email);
    if (filters.hasPhone) filtered = filtered.filter(l => l.phone);

    // City filter
    if (filters.city) {
      filtered = filtered.filter(l => l.city === filters.city);
    }

    // Date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      if (filters.dateRange === 'today') cutoff.setHours(0, 0, 0, 0);
      else if (filters.dateRange === 'week') cutoff.setDate(now.getDate() - 7);
      else if (filters.dateRange === 'month') cutoff.setMonth(now.getMonth() - 1);

      filtered = filtered.filter(l => {
        const extractedAt = new Date(l.extractedAt);
        return extractedAt >= cutoff;
      });
    }

    // Sorting
    return filtered.sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortOrder === 'asc' 
        ? Number(aVal) - Number(bVal)
        : Number(bVal) - Number(aVal);
    });
  }, [leads, filters, sortField, sortOrder]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredAndSortedLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredAndSortedLeads.map((_, i) => i.toString())));
    }
  };

  const toggleSelectLead = (index: number) => {
    const key = index.toString();
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedLeads(newSelected);
  };

  const handleBulkDelete = () => {
    const selectedData = Array.from(selectedLeads).map(i => filteredAndSortedLeads[parseInt(i)]);
    onDelete?.(selectedData);
    setSelectedLeads(new Set());
  };

  const handleExportSelected = () => {
    const selectedData = Array.from(selectedLeads).map(i => filteredAndSortedLeads[parseInt(i)]);
    const csv = generateCSVFromLeads(selectedData);
    downloadFile(csv, `leads-selected-${Date.now()}.csv`, 'text/csv');
    onExport?.('csv');
  };

  const handleExportAll = () => {
    const csv = generateCSVFromLeads(filteredAndSortedLeads);
    downloadFile(csv, `leads-all-${Date.now()}.csv`, 'text/csv');
    onExport?.('csv');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(filteredAndSortedLeads, null, 2);
    downloadFile(json, `leads-${Date.now()}.json`, 'application/json');
    onExport?.('json');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      minConfidence: 0,
      maxConfidence: 100,
      hasEmail: false,
      hasPhone: false,
      city: null,
      dateRange: 'all',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 bg-gradient-to-r from-cyan-950/30 via-purple-950/30 to-pink-950/30 border border-cyan-500/20 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-white/40" />
          <input
            placeholder="Search leads by name, email, phone, city..."
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`text-white/60 hover:text-white ${showFilters ? 'bg-cyan-500/20 text-cyan-400' : ''}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {(filters.hasEmail || filters.hasPhone || filters.city || filters.dateRange !== 'all') && (
              <span className="ml-2 w-2 h-2 rounded-full bg-cyan-400" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'analytics' ? 'table' : viewMode === 'table' ? 'grid' : 'analytics')}
            className="text-white/60 hover:text-white"
          >
            {viewMode === 'analytics' ? <List className="w-4 h-4" /> : viewMode === 'table' ? <Grid3X3 className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
            <span className="ml-2 hidden sm:inline">{viewMode === 'analytics' ? 'Table' : viewMode === 'table' ? 'Grid' : 'Analytics'}</span>
          </Button>

          {selectedLeads.size > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSelected}
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Selected ({selectedLeads.size})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}

          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export All
              <ChevronDown className="w-3 h-3 ml-2" />
            </Button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-black/95 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button onClick={handleExportAll} className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/5 first:rounded-t-lg">
                Export as CSV
              </button>
              <button onClick={handleExportJSON} className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/5 last:rounded-b-lg">
                Export as JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                <Filter className="w-4 h-4 text-cyan-400" />
                Advanced Filters
              </h3>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-white/40 hover:text-white">
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Confidence Range */}
              <div>
                <label className="text-[10px] text-white/40 font-mono block mb-2">Min Confidence: {filters.minConfidence}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minConfidence}
                  onChange={(e) => setFilters(prev => ({ ...prev, minConfidence: parseInt(e.target.value) }))}
                  className="w-full accent-cyan-500"
                />
              </div>

              {/* Has Email */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasEmail"
                  checked={filters.hasEmail}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasEmail: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500/50"
                />
                <label htmlFor="hasEmail" className="text-xs text-white/60 cursor-pointer">Has Email Only</label>
              </div>

              {/* Has Phone */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasPhone"
                  checked={filters.hasPhone}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasPhone: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500/50"
                />
                <label htmlFor="hasPhone" className="text-xs text-white/60 cursor-pointer">Has Phone Only</label>
              </div>

              {/* City Filter */}
              <div>
                <label className="text-[10px] text-white/40 font-mono block mb-1">City</label>
                <select
                  value={filters.city || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value || null }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-cyan-500/50"
                >
                  <option value="">All Cities</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-[10px] text-white/40 font-mono block mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-cyan-500/50"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard icon={Users} label="Total Leads" value={filteredAndSortedLeads.length} color="cyan" />
        <StatCard icon={Mail} label="With Email" value={analytics.withEmail} subtext={`${analytics.emailRate}%`} color="purple" />
        <StatCard icon={Phone} label="With Phone" value={analytics.withPhone} subtext={`${analytics.phoneRate}%`} color="pink" />
        <StatCard icon={Award} label="Avg Confidence" value={`${analytics.avgConfidence}%`} color="green" />
        <StatCard icon={Target} label="High Quality" value={analytics.highQuality} subtext="80%+" color="emerald" />
        <StatCard icon={TrendingUp} label="Medium" value={analytics.mediumQuality} subtext="50-79%" color="yellow" />
        <StatCard icon={X} label="Low Quality" value={analytics.lowQuality} subtext="<50%" color="red" />
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'analytics' ? (
          <AnalyticsDashboard leads={filteredAndSortedLeads} analytics={analytics} />
        ) : viewMode === 'table' ? (
          <TableView 
            key="table"
            leads={filteredAndSortedLeads}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={toggleSort}
            onCopy={handleCopy}
            copiedId={copiedId}
            selectedLeads={selectedLeads}
            onToggleSelect={toggleSelectLead}
            onSelectAll={toggleSelectAll}
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

      {/* Bottom Info */}
      <div className="flex items-center justify-between text-xs text-white/40 px-2">
        <span>Showing {filteredAndSortedLeads.length} of {leads.length} leads</span>
        {selectedLeads.size > 0 && (
          <span className="text-cyan-400">{selectedLeads.size} selected</span>
        )}
      </div>
    </div>
  );
}

// Analytics Dashboard Component
function AnalyticsDashboard({ leads, analytics }: { leads: LeadContact[]; analytics: any }) {
  const topCities = Object.entries(analytics.cityDistribution)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Quality Distribution */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            Lead Quality Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">High Quality (80%+)</span>
              <span className="text-emerald-400">{analytics.highQuality} leads</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
                style={{ width: `${leads.length > 0 ? (analytics.highQuality / leads.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Medium Quality (50-79%)</span>
              <span className="text-yellow-400">{analytics.mediumQuality} leads</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full"
                style={{ width: `${leads.length > 0 ? (analytics.mediumQuality / leads.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Low Quality (&lt;50%)</span>
              <span className="text-red-400">{analytics.lowQuality} leads</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full"
                style={{ width: `${leads.length > 0 ? (analytics.lowQuality / leads.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Cities */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-400" />
            Geographic Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
            {topCities.length > 0 ? (
              topCities.map(([city, count]) => (
                <div key={city} className="flex items-center justify-between text-xs">
                  <span className="text-white/60">{city}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {count as number} leads
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-white/30 text-xs text-center py-8">No location data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Coverage */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <Target className="w-4 h-4 text-pink-400" />
            Contact Information Coverage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Mail className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white/90">{analytics.withEmail}</div>
              <div className="text-[10px] text-white/40">Emails ({analytics.emailRate}%)</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Phone className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white/90">{analytics.withPhone}</div>
              <div className="text-[10px] text-white/40">Phones ({analytics.phoneRate}%)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InsightItem 
            icon={CheckCircle2}
            text={`Average confidence score is ${analytics.avgConfidence}%`}
            color="green"
          />
          <InsightItem 
            icon={Mail}
            text={`${analytics.emailRate}% of leads have email contacts`}
            color="cyan"
          />
          <InsightItem 
            icon={Phone}
            text={`${analytics.phoneRate}% of leads have phone numbers`}
            color="purple"
          />
          <InsightItem 
            icon={Users}
            text={`${analytics.highQuality} high-quality leads ready for outreach`}
            color="emerald"
          />
        </CardContent>
      </Card>
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
  copiedId,
  selectedLeads,
  onToggleSelect,
  onSelectAll,
}: {
  leads: LeadContact[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  selectedLeads: Set<string>;
  onToggleSelect: (index: number) => void;
  onSelectAll: () => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            <th className="p-3 text-xs font-medium text-white/40 uppercase tracking-wider w-12">
              <button onClick={onSelectAll} className="hover:text-white transition-colors">
                {selectedLeads.size === leads.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            </th>
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
            <th 
              className="p-3 text-xs font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60"
              onClick={() => onSort('city')}
            >
              <div className="flex items-center gap-1">
                Location
                {sortField === 'city' && <SortAsc className={`w-3 h-3 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />}
              </div>
            </th>
            <th className="p-3 text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, index) => (
            <motion.tr
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                selectedLeads.has(index.toString()) ? 'bg-cyan-500/10' : ''
              }`}
            >
              <td className="p-3">
                <button onClick={() => onToggleSelect(index)} className="hover:text-white transition-colors">
                  {selectedLeads.has(index.toString()) ? (
                    <CheckSquare className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Square className="w-4 h-4 text-white/30" />
                  )}
                </button>
              </td>
              <td className="p-3">
                <div className="font-medium text-white/90">{lead.businessName || 'Unknown'}</div>
                <div className="text-xs text-white/40 truncate max-w-[200px]">{lead.website}</div>
              </td>
              <td className="p-3">
                <div className="space-y-1">
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm text-cyan-400">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{lead.email}</span>
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
                      onClick={() => handleCopyWrapper(lead.email!, `email-${index}`, onCopy, copiedId)}
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
                      onClick={() => handleCopyWrapper(lead.email!, `email-grid-${index}`, onCopy, copiedId)}
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
                  <MapPin className="w-3 h-3 mr-1" />
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

// Helper Components
function StatCard({ icon: Icon, label, value, subtext, color }: any) {
  const colorClasses: Record<string, string> = {
    cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    pink: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    emerald: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    yellow: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
    red: 'from-red-500/20 to-rose-500/20 border-red-500/30',
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color] || colorClasses.cyan} border backdrop-blur-sm`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className={`w-5 h-5 text-white/60`} />
          {subtext && <span className="text-[10px] text-white/40">{subtext}</span>}
        </div>
        <div className="text-2xl font-bold text-white/90">{value}</div>
        <div className="text-[10px] text-white/40 mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (score >= 50) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <Badge className={`${getColor(score)} border`}>
      {score}%
    </Badge>
  );
}

function InsightItem({ icon: Icon, text, color }: any) {
  const colorClasses: Record<string, string> = {
    green: 'text-green-400',
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    emerald: 'text-emerald-400',
  };

  return (
    <div className="flex items-start gap-3 text-xs">
      <Icon className={`w-4 h-4 ${colorClasses[color] || 'text-white/40'} flex-shrink-0 mt-0.5`} />
      <span className="text-white/60">{text}</span>
    </div>
  );
}

// Utility Functions
function handleCopyWrapper(text: string, id: string, onCopy: (text: string, id: string) => void, copiedId: string | null) {
  onCopy(text, id);
}

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
