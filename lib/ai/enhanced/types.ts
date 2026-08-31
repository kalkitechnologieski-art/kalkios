// lib/ai/enhanced/types.ts
// All TypeScript interfaces for enhanced modules

// ─── Cross-platform UUID generator ───
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback using crypto.getRandomValues (works in all browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    arr[6] = (arr[6] & 0x0f) | 0x40;
    arr[8] = (arr[8] & 0x3f) | 0x80;
    return Array.from(arr)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
  }
  // Final fallback: timestamp + random
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// ─── Memory Types ───
export interface Memory {
  id: string;
  content: string;
  embedding: Float32Array;
  timestamp: number;
  importance: number;
  type: 'short' | 'long';
  metadata?: Record<string, unknown>;
}

export interface Identity {
  name: string;
  job: string;
  preferences: string[];
  lastUpdated: number;
}

export interface Neurochemicals {
  dopamine: number;
  serotonin: number;
  cortisol: number;
  oxytocin: number;
}

export interface BrainState {
  mood: 'happy' | 'neutral' | 'sad' | 'anxious';
  valence: number;
  neurochemicals: Neurochemicals;
  memoryCount: number;
  identity: Identity;
}

// ─── Enhanced Image Types ───
export interface ImageGenerationOptions {
  prompt: string;
  size?: '1K' | '2K' | '3K' | '4K';
  ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9';
  quality?: 'low' | 'standard' | 'high' | 'ultra';
  style?: string;
  negative_prompt?: string;
  steps?: number;
  image?: string | File;
  n?: number;
  cache?: boolean;
}

export interface ImageGenerationResult {
  url: string;
  provider: string;
  size: string;
  ratio: string;
  quality: string;
  steps: number;
  cache_hit: boolean;
  time_ms: number;
}

// ─── Enhanced Video Types ───
export interface VideoGenerationOptions {
  prompt: string;
  duration?: 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  resolution?: '720P' | '1080P' | '4K';
  aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9';
  mode?: 'text' | 'keyframe' | 'reference';
  first_frame?: string;
  last_frame?: string;
  images?: string[];
  audios?: string[];
  image?: string | File;
  seed?: number;
  quality?: 'speed' | 'balanced' | 'quality';
  cache?: boolean;
}

export interface VideoGenerationResult {
  url: string;
  taskId: string;
  provider: string;
  resolution: string;
  duration: number;
  quality: string;
  cache_hit: boolean;
  time_ms: number;
  progress: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

// ─── DeepThink Types ───
export interface ReasoningPath {
  id: string;
  provider: string;
  reasoning: string;
  answer: string;
  confidence: number;
  tokens: number;
  timeMs: number;
}

export interface ConsensusResult {
  final_answer: string;
  reasoning: string;
  paths: ReasoningPath[];
  consensus_score: number;
  tokens: number;
  provider: string;
}

// ─── SETU Types ───
export interface LeadEnrichment {
  company_size?: string;
  revenue?: string;
  industry?: string;
  founded_year?: number;
  key_people?: string[];
  technologies?: string[];
  social_links?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

export interface EnhancedLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website: string | null;
  enrichment: LeadEnrichment;
  confidence: number;
  source_urls: string[];
  verified: boolean;
  created_at: Date;
}

export interface ResearchPlan {
  main_query: string;
  sub_questions: string[];
  search_queries: string[];
  target_industries: string[];
  target_locations: string[];
  keywords: string[];
}
