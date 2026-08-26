export type Database = {
  public: {
    Tables: {
      services: { Row: any; Insert: any; Update: any }
      orders: { Row: any; Insert: any; Update: any }
      projects: { Row: any; Insert: any; Update: any }
      milestones: { Row: any; Insert: any; Update: any }
      messages: { Row: any; Insert: any; Update: any }
      invoices: { Row: any; Insert: any; Update: any }
      leads: { Row: any; Insert: any; Update: any }
      audit_logs: { Row: any; Insert: any; Update: any }
      profiles: { Row: any; Insert: any; Update: any }
      faqs: { Row: any; Insert: any; Update: any }
    }
  }
}
