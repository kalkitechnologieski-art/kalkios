-- Fix infinite recursion in profiles RLS policy
-- Drop the problematic policy if it exists
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- Create a new policy that uses auth.jwt() to check role
-- Note: This assumes the role is stored in the JWT via custom claims.
-- If not, you need to set up custom claims or use a different approach.
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    (SELECT auth.jwt() ->> 'role') IN ('ceo', 'admin', 'manager')
  );

-- If the above doesn't work because role is not in JWT, use this fallback:
-- (but it may still cause recursion)
-- CREATE POLICY "Admins can read all profiles" ON profiles
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('ceo', 'admin', 'manager')
--     )
--   );

-- Alternatively, if you want to temporarily disable RLS for profiles:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- Remember to re-enable later: ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
