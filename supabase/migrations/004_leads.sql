-- Lead generation tables
CREATE TABLE IF NOT EXISTS lead_search_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  target_count INT DEFAULT 100,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  leads_found INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES lead_search_sessions(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  company TEXT,
  job_title TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  city TEXT,
  country TEXT,
  data_source TEXT,
  verified BOOLEAN DEFAULT false,
  score FLOAT DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_session_id ON leads(session_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_verified ON leads(verified);

ALTER TABLE lead_search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON lead_search_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON lead_search_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view leads from their sessions" ON leads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM lead_search_sessions WHERE id = session_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert leads to their sessions" ON leads
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM lead_search_sessions WHERE id = session_id AND user_id = auth.uid())
  );
