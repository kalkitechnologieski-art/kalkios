-- ============================================================
-- KALKI OS – Admin & Employee Panel Enhancements
-- Migration: ${TIMESTAMP}
-- Idempotent – safe to run multiple times
-- ============================================================

-- 1. Extend `profiles` table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('active', 'suspended', 'inactive'));

-- Index on role for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);

-- 2. Extend `orders` table with assignment
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS assigned_employee_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_assigned_employee_id ON orders(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 3. Extend `projects` table with team and lead source
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS team UUID[],
ADD COLUMN IF NOT EXISTS lead_source TEXT;

-- 4. Extend `messages` with priority
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- 5. Extend `audit_logs` with additional metadata
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ============================================================
-- 6. Notifications & Preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('welcome', 'token_milestone', 'chat', 'project_update', 'system', 'task')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 7. Notification Preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  chat_notifications BOOLEAN DEFAULT true,
  token_milestones BOOLEAN DEFAULT true,
  project_updates BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences_manage_own" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 8. Tasks Management
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'blocked')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Employees can view and update their own tasks
CREATE POLICY "tasks_select_own" ON tasks
  FOR SELECT USING (auth.uid() = assigned_to);

CREATE POLICY "tasks_update_own" ON tasks
  FOR UPDATE USING (auth.uid() = assigned_to);

-- Managers and Admins can manage all tasks
CREATE POLICY "tasks_manage_all" ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('manager', 'admin', 'ceo')
    )
  );

-- ============================================================
-- 9. Time Entries (Timesheet)
-- ============================================================
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  date DATE DEFAULT CURRENT_DATE,
  hours NUMERIC(5,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Employees manage their own time entries
CREATE POLICY "time_entries_manage_own" ON time_entries
  FOR ALL USING (auth.uid() = user_id);

-- Managers can view all entries
CREATE POLICY "time_entries_view_all" ON time_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('manager', 'admin', 'ceo')
    )
  );

-- ============================================================
-- 10. Employee Invites
-- ============================================================
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_expires_at ON invites(expires_at);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Only admins/managers/ceo can manage invites
CREATE POLICY "invites_manage_all" ON invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ceo', 'manager')
    )
  );

-- ============================================================
-- 11. Additional Indexes for Admin Panels
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- ============================================================
-- 12. Realtime Publication
-- ============================================================
-- Add tables to the publication if they are not already included
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'time_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE time_entries;
  END IF;
END
$$;

-- ============================================================
-- 13. Grant Permissions (for Supabase)
-- ============================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
