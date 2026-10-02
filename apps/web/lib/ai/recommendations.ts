/**
 * SIDDHI v4.0 — Smart Recommendations Engine
 * 
 * AI-powered service suggestions based on:
 * - User conversation context
 * - Similar project patterns
 * - Seasonal trends
 * - Collaborative filtering
 */

import { createClient } from '@/lib/supabase/client';

export interface ServiceRecommendation {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl?: string;
  relevanceScore: number; // 0-1, how relevant to current context
  reason: string; // Why this is recommended
}

export interface UserProfile {
  userId: string;
  pastOrders: Array<{ serviceId: string; category: string }>;
  viewedServices: string[];
  industry?: string;
  companySize?: 'small' | 'medium' | 'enterprise';
}

class RecommendationsEngine {
  private static instance: RecommendationsEngine | null = null;
  private cache: Map<string, { data: ServiceRecommendation[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): RecommendationsEngine {
    if (!RecommendationsEngine.instance) {
      RecommendationsEngine.instance = new RecommendationsEngine();
    }
    return RecommendationsEngine.instance;
  }

  /**
   * Get contextual recommendations based on conversation
   */
  async getContextualRecommendations(
    conversationContext: string,
    userId?: string,
    limit: number = 5
  ): Promise<ServiceRecommendation[]> {
    const cacheKey = `context:${conversationContext.slice(0, 50)}:${userId || 'anon'}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      // Extract keywords from conversation
      const keywords = this.extractKeywords(conversationContext);
      
      // Get user profile for personalization
      const userProfile = userId ? await this.getUserProfile(userId) : null;
      
      // Query services matching context
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: services } = await (supabase as any)
        .from('services')
        .select('id, name, category, description, price, image_url, tags')
        .eq('status', 'active')
        .limit(50);

      if (!services) {
        return [];
      }

      // Score each service based on relevance
      const scored = services.map((service: any) => {
        const score = this.calculateRelevanceScore(
          service,
          keywords,
          userProfile,
          conversationContext
        );
        
        return {
          id: service.id,
          name: service.name,
          category: service.category,
          description: service.description,
          price: service.price,
          imageUrl: service.image_url,
          relevanceScore: score,
          reason: this.generateReason(service, keywords, userProfile),
        };
      });

      // Sort by relevance and return top N
      const recommendations: ServiceRecommendation[] = scored
        .sort((a: ServiceRecommendation, b: ServiceRecommendation) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      // Cache results
      this.cache.set(cacheKey, { data: recommendations, timestamp: Date.now() });

      return recommendations;
    } catch (error) {
      console.error('[Recommendations] Failed to get contextual recommendations:', error);
      return [];
    }
  }

  /**
   * Get personalized recommendations based on user history
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<ServiceRecommendation[]> {
    const cacheKey = `personal:${userId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        return [];
      }

      // Find similar users using collaborative filtering
      const similarUserIds = await this.findSimilarUsers(userId, userProfile);
      
      // Get services popular among similar users
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: popularServices } = await (supabase as any)
        .from('orders')
        .select('service_id, services(id, name, category, description, price, image_url)')
        .in('client_id', similarUserIds)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(20);

      // Aggregate and deduplicate
      const serviceCounts = new Map<string, number>();
      const serviceMap = new Map<string, any>();

      popularServices?.forEach((order: any) => {
        const service = order.services;
        if (service) {
          serviceCounts.set(service.id, (serviceCounts.get(service.id) || 0) + 1);
          serviceMap.set(service.id, service);
        }
      });

      // Convert to recommendations
      const recommendations: ServiceRecommendation[] = Array.from(serviceMap.entries())
        .map(([id, service]) => ({
          id,
          name: service.name,
          category: service.category,
          description: service.description,
          price: service.price,
          imageUrl: service.image_url,
          relevanceScore: (serviceCounts.get(id) || 0) / Math.max(popularServices?.length || 1, 1),
          reason: `Popular among similar businesses in ${userProfile.industry || 'your industry'}`,
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      this.cache.set(cacheKey, { data: recommendations, timestamp: Date.now() });

      return recommendations;
    } catch (error) {
      console.error('[Recommendations] Failed to get personalized recommendations:', error);
      return [];
    }
  }

  /**
   * Get trending services based on recent orders
   */
  async getTrendingServices(limit: number = 5): Promise<ServiceRecommendation[]> {
    const cacheKey = 'trending';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: trending } = await (supabase as any)
        .from('admin_top_services')
        .select('*')
        .order('revenue', { ascending: false })
        .limit(limit);

      const recommendations = (trending || []).map((service: any) => ({
        id: service.id,
        name: service.name,
        category: service.category,
        description: '',
        price: 0,
        relevanceScore: 1,
        reason: `🔥 Trending this week (${service.paid_count} orders)`,
      }));

      this.cache.set(cacheKey, { data: recommendations, timestamp: Date.now() });

      return recommendations;
    } catch (error) {
      console.error('[Recommendations] Failed to get trending services:', error);
      return [];
    }
  }

  /**
   * Clear recommendation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  // Private helper methods

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'shall',
    ]);

    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const filtered = words.filter(w => !stopWords.has(w));
    const unique = [...new Set(filtered)];
    
    return unique.slice(0, 10);
  }

  private calculateRelevanceScore(
    service: any,
    keywords: string[],
    userProfile: UserProfile | null,
    context: string
  ): number {
    let score = 0;

    // Keyword matching in title/description
    const searchText = `${service.name} ${service.description}`.toLowerCase();
    const keywordMatches = keywords.filter(k => searchText.includes(k)).length;
    score += (keywordMatches / Math.max(keywords.length, 1)) * 0.4;

    // Category relevance from user history
    if (userProfile) {
      const categoryMatches = userProfile.pastOrders.filter(
        o => o.category === service.category
      ).length;
      score += Math.min(categoryMatches / 5, 1) * 0.3;
    }

    // Tag matching
    if (service.tags) {
      const tagMatches = keywords.filter(k => service.tags.includes(k)).length;
      score += (tagMatches / Math.max(keywords.length, 1)) * 0.2;
    }

    // Recency boost (newer services get slight preference)
    score += 0.1;

    return Math.min(score, 1);
  }

  private generateReason(
    service: any,
    keywords: string[],
    userProfile: UserProfile | null
  ): string {
    const reasons = [];

    // Check keyword matches
    const searchText = `${service.name} ${service.description}`.toLowerCase();
    const matchedKeywords = keywords.filter(k => searchText.includes(k));
    if (matchedKeywords.length > 0) {
      reasons.push(`Matches your interest in ${matchedKeywords.slice(0, 2).join(', ')}`);
    }

    // Check category from history
    if (userProfile) {
      const categoryMatch = userProfile.pastOrders.some(o => o.category === service.category);
      if (categoryMatch) {
        reasons.push(`You've ordered from ${service.category} before`);
      }
    }

    return reasons.length > 0 ? reasons.join(' • ') : 'Recommended for you';
  }

  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: orders } = await (supabase as any)
        .from('orders')
        .select('service_id, services(category)')
        .eq('client_id', userId)
        .eq('status', 'paid');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('industry, company_size')
        .eq('id', userId)
        .single();

      return {
        userId,
        pastOrders: (orders || []).map((o: any) => ({
          serviceId: o.service_id,
          category: o.services?.category || 'unknown',
        })),
        viewedServices: [],
        industry: profile?.industry,
        companySize: profile?.company_size,
      };
    } catch (error) {
      console.error('[Recommendations] Failed to get user profile:', error);
      return null;
    }
  }

  private async findSimilarUsers(
    userId: string,
    userProfile: UserProfile
  ): Promise<string[]> {
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: similar } = await (supabase as any)
        .from('profiles')
        .select('id')
        .neq('id', userId)
        .eq('industry', userProfile.industry)
        .limit(10);

      return (similar || []).map((p: any) => p.id);
    } catch (error) {
      console.error('[Recommendations] Failed to find similar users:', error);
      return [];
    }
  }
}

export const recommendationsEngine = RecommendationsEngine.getInstance();
