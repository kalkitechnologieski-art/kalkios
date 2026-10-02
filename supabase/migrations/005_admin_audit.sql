CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ceo', 'admin', 'manager')
    )
  );

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- === SIDDHI v4.0 BATCH 3 - LAYER HEALTH VIEW ===

CREATE OR REPLACE VIEW siddhi_layer_health AS
SELECT
  layer,
  COUNT(*)::INT AS total_requests,
  COALESCE(AVG(duration_ms), 0)::INT AS avg_latency_ms,
  COALESCE(SUM(CASE WHEN success THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0), 1) AS success_rate,
  MAX(created_at) AS last_seen
FROM siddhi_telemetry
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY layer;

GRANT SELECT ON siddhi_layer_health TO authenticated;
