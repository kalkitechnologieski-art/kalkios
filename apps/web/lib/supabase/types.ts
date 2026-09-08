// lib/supabase/types.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; avatar_url: string | null; phone: string | null; company: string | null; role: string; created_at: string; updated_at: string };
        Insert: { id: string; full_name?: string | null; avatar_url?: string | null; phone?: string | null; company?: string | null; role?: string; created_at?: string; updated_at?: string };
        Update: { id?: string; full_name?: string | null; avatar_url?: string | null; phone?: string | null; company?: string | null; role?: string; created_at?: string; updated_at?: string };
      };
      services: {
        Row: { id: string; name: string; slug: string; category: string; sub_category: string | null; description: string | null; price: number | null; duration_days: number | null; features: Json | null; icon: string | null; image_url: string | null; video_url: string | null; rating: number | null; review_count: number | null; is_active: boolean; meta_title: string | null; meta_description: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; slug: string; category: string; sub_category?: string | null; description?: string | null; price?: number | null; duration_days?: number | null; features?: Json | null; icon?: string | null; image_url?: string | null; video_url?: string | null; rating?: number | null; review_count?: number | null; is_active?: boolean; meta_title?: string | null; meta_description?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string; slug?: string; category?: string; sub_category?: string | null; description?: string | null; price?: number | null; duration_days?: number | null; features?: Json | null; icon?: string | null; image_url?: string | null; video_url?: string | null; rating?: number | null; review_count?: number | null; is_active?: boolean; meta_title?: string | null; meta_description?: string | null; created_at?: string; updated_at?: string };
      };
      orders: {
        Row: { id: string; client_id: string | null; service_id: string | null; amount: number; status: string; payment_id: string | null; payment_request_id: string | null; invoice_url: string | null; buyer_name: string | null; buyer_email: string | null; buyer_phone: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; client_id?: string | null; service_id?: string | null; amount: number; status?: string; payment_id?: string | null; payment_request_id?: string | null; invoice_url?: string | null; buyer_name?: string | null; buyer_email?: string | null; buyer_phone?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; client_id?: string | null; service_id?: string | null; amount?: number; status?: string; payment_id?: string | null; payment_request_id?: string | null; invoice_url?: string | null; buyer_name?: string | null; buyer_email?: string | null; buyer_phone?: string | null; created_at?: string; updated_at?: string };
      };
      projects: {
        Row: { id: string; order_id: string | null; name: string; description: string | null; status: string; project_manager_id: string | null; timeline: Json | null; estimated_delivery: string | null; client_id: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; order_id?: string | null; name: string; description?: string | null; status?: string; project_manager_id?: string | null; timeline?: Json | null; estimated_delivery?: string | null; client_id?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; order_id?: string | null; name?: string; description?: string | null; status?: string; project_manager_id?: string | null; timeline?: Json | null; estimated_delivery?: string | null; client_id?: string | null; created_at?: string; updated_at?: string };
      };
      milestones: {
        Row: { id: string; project_id: string | null; title: string; description: string | null; due_date: string | null; status: string; completed_at: string | null; order_index: number | null; created_at: string };
        Insert: { id?: string; project_id?: string | null; title: string; description?: string | null; due_date?: string | null; status?: string; completed_at?: string | null; order_index?: number | null; created_at?: string };
        Update: { id?: string; project_id?: string | null; title?: string; description?: string | null; due_date?: string | null; status?: string; completed_at?: string | null; order_index?: number | null; created_at?: string };
      };
      messages: {
        Row: { id: string; project_id: string | null; sender_id: string | null; content: string; is_read: boolean; attachments: Json | null; created_at: string };
        Insert: { id?: string; project_id?: string | null; sender_id?: string | null; content: string; is_read?: boolean; attachments?: Json | null; created_at?: string };
        Update: { id?: string; project_id?: string | null; sender_id?: string | null; content?: string; is_read?: boolean; attachments?: Json | null; created_at?: string };
      };
      invoices: {
        Row: { id: string; order_id: string | null; invoice_number: string; total: number; gst: number | null; pdf_url: string | null; status: string; generated_at: string };
        Insert: { id?: string; order_id?: string | null; invoice_number: string; total: number; gst?: number | null; pdf_url?: string | null; status?: string; generated_at?: string };
        Update: { id?: string; order_id?: string | null; invoice_number?: string; total?: number; gst?: number | null; pdf_url?: string | null; status?: string; generated_at?: string };
      };
      leads: {
        Row: { id: string; email: string | null; phone: string | null; first_name: string | null; last_name: string | null; company: string | null; industry: string | null; website: string | null; source: string | null; score: number | null; intent: string | null; budget: string | null; timeline: string | null; notes: string | null; tags: string[] | null; created_at: string; updated_at: string };
        Insert: { id?: string; email?: string | null; phone?: string | null; first_name?: string | null; last_name?: string | null; company?: string | null; industry?: string | null; website?: string | null; source?: string | null; score?: number | null; intent?: string | null; budget?: string | null; timeline?: string | null; notes?: string | null; tags?: string[] | null; created_at?: string; updated_at?: string };
        Update: { id?: string; email?: string | null; phone?: string | null; first_name?: string | null; last_name?: string | null; company?: string | null; industry?: string | null; website?: string | null; source?: string | null; score?: number | null; intent?: string | null; budget?: string | null; timeline?: string | null; notes?: string | null; tags?: string[] | null; created_at?: string; updated_at?: string };
      };
      audit_logs: {
        Row: { id: string; actor_id: string | null; action: string; target_id: string | null; details: Json | null; created_at: string };
        Insert: { id?: string; actor_id?: string | null; action: string; target_id?: string | null; details?: Json | null; created_at?: string };
        Update: { id?: string; actor_id?: string | null; action?: string; target_id?: string | null; details?: Json | null; created_at?: string };
      };
      faqs: {
        Row: { id: string; service_id: string | null; question: string; answer: string; order_index: number | null; created_at: string };
        Insert: { id?: string; service_id?: string | null; question: string; answer: string; order_index?: number | null; created_at?: string };
        Update: { id?: string; service_id?: string | null; question?: string; answer?: string; order_index?: number | null; created_at?: string };
      };
      // Additional tables
      lead_search_sessions: {
        Row: { id: string; query: string; target_count: number; status: string; leads_found: number; created_at: string; completed_at: string | null };
        Insert: { id?: string; query: string; target_count: number; status?: string; leads_found?: number; created_at?: string; completed_at?: string | null };
        Update: { id?: string; query?: string; target_count?: number; status?: string; leads_found?: number; created_at?: string; completed_at?: string | null };
      };
      user_presence: {
        Row: { user_id: string; status: string; last_seen: string; current_page: string | null; updated_at: string };
        Insert: { user_id: string; status?: string; last_seen?: string; current_page?: string | null; updated_at?: string };
        Update: { user_id?: string; status?: string; last_seen?: string; current_page?: string | null; updated_at?: string };
      };
      notification_preferences: {
        Row: { user_id: string; email_enabled: boolean; push_enabled: boolean; in_app_enabled: boolean; chat_notifications: boolean; token_milestones: boolean; project_updates: boolean; system_notifications: boolean };
        Insert: { user_id: string; email_enabled?: boolean; push_enabled?: boolean; in_app_enabled?: boolean; chat_notifications?: boolean; token_milestones?: boolean; project_updates?: boolean; system_notifications?: boolean };
        Update: { user_id?: string; email_enabled?: boolean; push_enabled?: boolean; in_app_enabled?: boolean; chat_notifications?: boolean; token_milestones?: boolean; project_updates?: boolean; system_notifications?: boolean };
      };
      user_token_usage: {
        Row: { user_id: string; tokens_used: number; last_milestone: number; updated_at: string };
        Insert: { user_id: string; tokens_used?: number; last_milestone?: number; updated_at?: string };
        Update: { user_id?: string; tokens_used?: number; last_milestone?: number; updated_at?: string };
      };
      job_applications: {
        Row: { id: string; job_posting_id: string | null; applicant_name: string; applicant_email: string; applicant_phone: string | null; cover_letter: string | null; resume_url: string | null; status: string; created_at: string };
        Insert: { id?: string; job_posting_id?: string | null; applicant_name: string; applicant_email: string; applicant_phone?: string | null; cover_letter?: string | null; resume_url?: string | null; status?: string; created_at?: string };
        Update: { id?: string; job_posting_id?: string | null; applicant_name?: string; applicant_email?: string; applicant_phone?: string | null; cover_letter?: string | null; resume_url?: string | null; status?: string; created_at?: string };
      };
      job_postings: {
        Row: { id: string; title: string; location: string | null; employment_type: string | null; salary_range: string | null; description: string | null; requirements: string[] | null; status: string; created_at: string; updated_at: string };
        Insert: { id?: string; title: string; location?: string | null; employment_type?: string | null; salary_range?: string | null; description?: string | null; requirements?: string[] | null; status?: string; created_at?: string; updated_at?: string };
        Update: { id?: string; title?: string; location?: string | null; employment_type?: string | null; salary_range?: string | null; description?: string | null; requirements?: string[] | null; status?: string; created_at?: string; updated_at?: string };
      };
      notifications: {
        Row: { id: string; user_id: string; title: string; message: string; type: string; priority: string; link: string | null; metadata: Json | null; sender_id: string | null; read: boolean; created_at: string };
        Insert: { id?: string; user_id: string; title: string; message: string; type?: string; priority?: string; link?: string | null; metadata?: Json | null; sender_id?: string | null; read?: boolean; created_at?: string };
        Update: { id?: string; user_id?: string; title?: string; message?: string; type?: string; priority?: string; link?: string | null; metadata?: Json | null; sender_id?: string | null; read?: boolean; created_at?: string };
      };
      ai_audit_logs: {
        Row: { id: string; user_id: string | null; action: string; provider: string | null; details: Json | null; created_at: string };
        Insert: { id?: string; user_id?: string | null; action: string; provider?: string | null; details?: Json | null; created_at?: string };
        Update: { id?: string; user_id?: string | null; action?: string; provider?: string | null; details?: Json | null; created_at?: string };
      };
    };
    Views: { [key: string]: never };
    Functions: { [key: string]: never };
    Enums: { [key: string]: never };
  };
}
