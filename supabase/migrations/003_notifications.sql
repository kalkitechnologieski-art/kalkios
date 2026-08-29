-- ============================================================================
-- KALKI OS — Notifications & Preferences
-- ============================================================================

-- Notifications table
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

-- Notification preferences table
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

-- User token usage tracking
CREATE TABLE IF NOT EXISTS user_token_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tokens_used INT DEFAULT 0,
  last_milestone INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_user_token_usage_user_id ON user_token_usage(user_id);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_token_usage ENABLE ROW LEVEL SECURITY;

-- Notifications: Users can read their own
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Notifications: System can insert
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Notifications: Users can update their own (mark read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Preferences: Users can read/update their own
CREATE POLICY "Users can manage own preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- User token usage: Users can read their own
CREATE POLICY "Users can read own token usage" ON user_token_usage
  FOR SELECT USING (auth.uid() = user_id);

-- User token usage: System can insert/update
CREATE POLICY "System can manage token usage" ON user_token_usage
  FOR ALL USING (true);

-- Enable realtime
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Function: handle token milestone notifications
CREATE OR REPLACE FUNCTION check_token_milestone()
RETURNS TRIGGER AS $$
DECLARE
  milestone INT;
  current_milestone INT;
  user_prefs BOOLEAN;
BEGIN
  -- Get current milestone
  SELECT last_milestone INTO current_milestone
  FROM user_token_usage
  WHERE user_id = NEW.user_id;
  
  IF current_milestone IS NULL THEN
    current_milestone := 0;
  END IF;
  
  -- Check if user crossed a milestone (every 1000 tokens)
  IF NEW.tokens_used >= current_milestone + 1000 THEN
    -- Calculate the milestone number
    milestone := floor(NEW.tokens_used / 1000) * 1000;
    
    -- Check if user wants token milestone notifications
    SELECT token_milestones INTO user_prefs
    FROM notification_preferences
    WHERE user_id = NEW.user_id;
    
    IF user_prefs IS NULL OR user_prefs = true THEN
      -- Insert notification
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        NEW.user_id,
        'token_milestone',
        '🎯 Token Milestone Reached!',
        'You have used ' || NEW.tokens_used || ' tokens. Keep up the great work!',
        jsonb_build_object('tokens_used', NEW.tokens_used, 'milestone', milestone)
      );
    END IF;
    
    -- Update last milestone
    UPDATE user_token_usage
    SET last_milestone = milestone
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for token milestone
DROP TRIGGER IF EXISTS check_token_milestone_trigger ON user_token_usage;
CREATE TRIGGER check_token_milestone_trigger
  AFTER INSERT OR UPDATE OF tokens_used ON user_token_usage
  FOR EACH ROW
  EXECUTE FUNCTION check_token_milestone();

-- Function: create welcome notification on profile creation
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert welcome notification
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    NEW.id,
    'welcome',
    '👋 Welcome to KALKI OS!',
    'Welcome to the Temple of Technology! Explore our services, chat with Siddhi, and start building the future.'
  );
  
  -- Create notification preferences
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create token usage record
  INSERT INTO user_token_usage (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for welcome notification
DROP TRIGGER IF EXISTS create_welcome_notification_trigger ON profiles;
CREATE TRIGGER create_welcome_notification_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_welcome_notification();
