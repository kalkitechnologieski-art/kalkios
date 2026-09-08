export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; avatar_url: string | null; phone: string | null; company: string | null; role: string; created_at: string; updated_at: string }
        Insert: { id: string; full_name?: string | null; avatar_url?: string | null; phone?: string | null; company?: string | null; role?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; full_name?: string | null; avatar_url?: string | null; phone?: string | null; company?: string | null; role?: string; created_at?: string; updated_at?: string }
      }
      services: {
        Row: { id: string; name: string; slug: string; category: string; sub_category: string | null; description: string | null; price: number | null; duration_days: number | null; features: Json | null; icon: string | null; image_url: string | null; video_url: string | null; rating: number | null; review_count: number | null; is_active: boolean; meta_title: string | null; meta_description: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; slug: string; category: string; sub_category?: string | null; description?: string | null; price?: number | null; duration_days?: number | null; features?: Json | null; icon?: string | null; image_url?: string | null; video_url?: string | null; rating?: number | null; review_count?: number | null; is_active?: boolean; meta_title?: string | null; meta_description?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; name?: string; slug?: string; category?: string; sub_category?: string | null; description?: string | null; price?: number | null; duration_days?: number | null; features?: Json | null; icon?: string | null; image_url?: string | null; video_url?: string | null; rating?: number | null; review_count?: number | null; is_active?: boolean; meta_title?: string | null; meta_description?: string | null; created_at?: string; updated_at?: string }
      }
      orders: {
        Row: { id: string; client_id: string | null; service_id: string | null; amount: number; status: string; payment_id: string | null; payment_request_id: string | null; invoice_url: string | null; buyer_name: string | null; buyer_email: string | null; buyer_phone: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; client_id?: string | null; service_id?: string | null; amount: number; status?: string; payment_id?: string | null; payment_request_id?: string | null; invoice_url?: string | null; buyer_name?: string | null; buyer_email?: string | null; buyer_phone?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; client_id?: string | null; service_id?: string | null; amount?: number; status?: string; payment_id?: string | null; payment_request_id?: string | null; invoice_url?: string | null; buyer_name?: string | null; buyer_email?: string | null; buyer_phone?: string | null; created_at?: string; updated_at?: string }
      }
      projects: {
        Row: { id: string; order_id: string | null; name: string; description: string | null; status: string; project_manager_id: string | null; timeline: Json | null; estimated_delivery: string | null; client_id: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; order_id?: string | null; name: string; description?: string | null; status?: string; project_manager_id?: string | null; timeline?: Json | null; estimated_delivery?: string | null; client_id?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; order_id?: string | null; name?: string; description?: string | null; status?: string; project_manager_id?: string | null; timeline?: Json | null; estimated_delivery?: string | null; client_id?: string | null; created_at?: string; updated_at?: string }
      }
      milestones: {
        Row: { id: string; project_id: string | null; title: string; description: string | null; due_date: string | null; status: string; completed_at: string | null; order_index: number | null; created_at: string }
        Insert: { id?: string; project_id?: string | null; title: string; description?: string | null; due_date?: string | null; status?: string; completed_at?: string | null; order_index?: number | null; created_at?: string }
        Update: { id?: string; project_id?: string | null; title?: string; description?: string | null; due_date?: string | null; status?: string; completed_at?: string | null; order_index?: number | null; created_at?: string }
      }
      messages: {
        Row: { id: string; project_id: string | null; sender_id: string | null; content: string; is_read: boolean; attachments: Json | null; created_at: string }
        Insert: { id?: string; project_id?: string | null; sender_id?: string | null; content: string; is_read?: boolean; attachments?: Json | null; created_at?: string }
        Update: { id?: string; project_id?: string | null; sender_id?: string | null; content?: string; is_read?: boolean; attachments?: Json | null; created_at?: string }
      }
      invoices: {
        Row: { id: string; order_id: string | null; invoice_number: string; total: number; gst: number | null; pdf_url: string | null; status: string; generated_at: string }
        Insert: { id?: string; order_id?: string | null; invoice_number: string; total: number; gst?: number | null; pdf_url?: string | null; status?: string; generated_at?: string }
        Update: { id?: string; order_id?: string | null; invoice_number?: string; total?: number; gst?: number | null; pdf_url?: string | null; status?: string; generated_at?: string }
      }
      leads: {
        Row: { id: string; email: string | null; phone: string | null; first_name: string | null; last_name: string | null; company: string | null; industry: string | null; website: string | null; source: string | null; score: number | null; intent: string | null; budget: string | null; timeline: string | null; notes: string | null; tags: string[] | null; created_at: string; updated_at: string }
        Insert: { id?: string; email?: string | null; phone?: string | null; first_name?: string | null; last_name?: string | null; company?: string | null; industry?: string | null; website?: string | null; source?: string | null; score?: number | null; intent?: string | null; budget?: string | null; timeline?: string | null; notes?: string | null; tags?: string[] | null; created_at?: string; updated_at?: string }
        Update: { id?: string; email?: string | null; phone?: string | null; first_name?: string | null; last_name?: string | null; company?: string | null; industry?: string | null; website?: string | null; source?: string | null; score?: number | null; intent?: string | null; budget?: string | null; timeline?: string | null; notes?: string | null; tags?: string[] | null; created_at?: string; updated_at?: string }
      }
      audit_logs: {
        Row: { id: string; actor_id: string | null; action: string; target_id: string | null; details: Json | null; created_at: string }
        Insert: { id?: string; actor_id?: string | null; action: string; target_id?: string | null; details?: Json | null; created_at?: string }
        Update: { id?: string; actor_id?: string | null; action?: string; target_id?: string | null; details?: Json | null; created_at?: string }
      }
      faqs: {
        Row: { id: string; service_id: string | null; question: string; answer: string; order_index: number | null; created_at: string }
        Insert: { id?: string; service_id?: string | null; question: string; answer: string; order_index?: number | null; created_at?: string }
        Update: { id?: string; service_id?: string | null; question?: string; answer?: string; order_index?: number | null; created_at?: string }
      }
    }
    Views: { [key: string]: never }
    Functions: { [key: string]: never }
    Enums: { [key: string]: never }
  }
}
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
