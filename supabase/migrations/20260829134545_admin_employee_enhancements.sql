-- ============================================================
-- KALKI OS – Admin & Employee Panel Enhancements
-- Migration: ${TIMESTAMP}
-- Idempotent – safe to run multiple times
-- ============================================================

-- 1. Add `last_login` and `status` to `profiles` (if missing)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
  CHECK (status IN ('active', 'suspended', 'inactive'));

-- 2. Add `assigned_employee_id` to `orders` for task assignment
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS assigned_employee_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. Add `department` and `position` to `users` (already in profiles, so just index)
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 4. Create `notifications` table (if missing)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('welcome', 'token_milestone', 'chat', 'project_update', 'system', 'task')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON notifications 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications 
  FOR INSERT WITH CHECK (true);

-- 5. Create `notification_preferences` (if missing)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  chat_notifications BOOLEAN DEFAULT true,
  token_milestones BOOLEAN DEFAULT true,
  project_updates BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences" ON notification_preferences 
  FOR ALL USING (auth.uid() = user_id);

-- 6. Create `tasks` table for employee task management
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','review','completed','blocked')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can view their tasks" ON tasks 
  FOR SELECT USING (auth.uid() = assigned_to);
CREATE POLICY "Managers can view all tasks" ON tasks 
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager','admin','ceo')));
CREATE POLICY "Employees can update their tasks" ON tasks 
  FOR UPDATE USING (auth.uid() = assigned_to);
CREATE POLICY "Managers can manage all tasks" ON tasks 
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager','admin','ceo')));

-- 7. Create `time_entries` for employee timesheets
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  date DATE DEFAULT CURRENT_DATE,
  hours NUMERIC(5,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can manage their own time entries" ON time_entries 
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Managers can view all time entries" ON time_entries 
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager','admin','ceo')));

-- 8. Add `realtime` enabled for notifications and tasks
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE time_entries;

-- 9. Add helpful indexes for admin panels
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_employee_id ON orders(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- 10. Create `activity_log` for admin audit (extends audit_logs)
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 11. Add `slug` to `services` if missing (already present)
-- Ensure `category` is indexed for marketplace filtering
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- 12. Add `team` and `lead_source` to `projects`
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS team UUID[],
ADD COLUMN IF NOT EXISTS lead_source TEXT;

-- 13. Add `priority` to `messages` for support triage
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' 
  CHECK (priority IN ('low','normal','high','urgent'));

-- 14. Create `invites` table for employee onboarding
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage invites" ON invites 
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','ceo','manager')));

-- 15. Add `agent_id` to `tasks` for AI assignment
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL;

-- 16. Enable RLS on all new tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 17. Grant permissions (for Supabase)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
