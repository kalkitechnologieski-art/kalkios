-- == KALKI B6 HARDENING ==
-- Add missing indexes, foreign keys, and constraints for performance and data integrity
-- -----------------------------------------------------------------------------

-- 1. Add indexes on high-query columns
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_session_id ON leads(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_posting ON job_applications(job_posting_id);

-- 2. Add unique constraints
ALTER TABLE profiles ADD CONSTRAINT uq_profiles_id UNIQUE (id);
ALTER TABLE services ADD CONSTRAINT uq_services_slug UNIQUE (slug);
ALTER TABLE invoices ADD CONSTRAINT uq_invoices_invoice_number UNIQUE (invoice_number);

-- 3. Add foreign key constraints with appropriate cascade behavior
ALTER TABLE orders 
  ADD CONSTRAINT fk_orders_client FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_orders_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;

ALTER TABLE projects 
  ADD CONSTRAINT fk_projects_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_projects_client FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_projects_manager FOREIGN KEY (project_manager_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE milestones 
  ADD CONSTRAINT fk_milestones_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE messages 
  ADD CONSTRAINT fk_messages_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE invoices 
  ADD CONSTRAINT fk_invoices_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE audit_logs 
  ADD CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE faqs 
  ADD CONSTRAINT fk_faqs_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;

ALTER TABLE lead_search_sessions 
  ADD CONSTRAINT uq_lead_search_sessions_id UNIQUE (id);

ALTER TABLE user_presence 
  ADD CONSTRAINT fk_user_presence_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE notification_preferences 
  ADD CONSTRAINT fk_notification_preferences_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE user_token_usage 
  ADD CONSTRAINT fk_user_token_usage_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE job_applications 
  ADD CONSTRAINT fk_job_applications_posting FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) ON DELETE CASCADE;

ALTER TABLE notifications 
  ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_notifications_sender FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE ai_audit_logs 
  ADD CONSTRAINT fk_ai_audit_logs_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE leads 
  ADD CONSTRAINT fk_leads_session FOREIGN KEY (session_id) REFERENCES lead_search_sessions(id) ON DELETE SET NULL;

-- 4. Add check constraints for data validation
ALTER TABLE orders 
  ADD CONSTRAINT chk_orders_amount_positive CHECK (amount >= 0);

ALTER TABLE services 
  ADD CONSTRAINT chk_services_price_non_negative CHECK (price >= 0),
  ADD CONSTRAINT chk_services_rating_range CHECK (rating >= 0 AND rating <= 5);

ALTER TABLE leads 
  ADD CONSTRAINT chk_leads_score_range CHECK (score >= 0 AND score <= 1);

-- 5. Create trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
