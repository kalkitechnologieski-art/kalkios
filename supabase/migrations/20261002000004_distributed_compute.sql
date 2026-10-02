-- SIDDHI v4.0: Add distributed compute consent tracking to profiles

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS distributed_compute_consent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS distributed_compute_tier TEXT CHECK (distributed_compute_tier IN ('compact', 'fast', 'deep')),
  ADD COLUMN IF NOT EXISTS distributed_compute_last_active TIMESTAMPTZ;

-- Index for querying opted-in users
CREATE INDEX IF NOT EXISTS idx_profiles_distributed_consent 
  ON profiles (distributed_compute_consent) 
  WHERE distributed_compute_consent = TRUE;

COMMENT ON COLUMN profiles.distributed_compute_consent IS 'User has opted in to run local AI models';
COMMENT ON COLUMN profiles.distributed_compute_tier IS 'Preferred model tier: compact (~500MB), fast (~1.1GB), deep (~2.2GB)';
COMMENT ON COLUMN profiles.distributed_compute_last_active IS 'Last time user contributed compute power';
