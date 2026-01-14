-- TransitPulse Row Level Security Policies
-- Run this after schema.sql

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read and update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Agencies: public read
CREATE POLICY "Agencies are publicly readable"
  ON agencies FOR SELECT
  TO authenticated, anon
  USING (true);

-- Routes: public read
CREATE POLICY "Routes are publicly readable"
  ON routes FOR SELECT
  TO authenticated, anon
  USING (true);

-- Stops: public read
CREATE POLICY "Stops are publicly readable"
  ON stops FOR SELECT
  TO authenticated, anon
  USING (true);

-- Route stops: public read
CREATE POLICY "Route stops are publicly readable"
  ON route_stops FOR SELECT
  TO authenticated, anon
  USING (true);

-- Subscriptions: users can read own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Subscriptions: no direct user updates (server-side only via service role)

-- Commutes: users can CRUD own commutes
CREATE POLICY "Users can view own commutes"
  ON commutes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commutes"
  ON commutes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commutes"
  ON commutes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own commutes"
  ON commutes FOR DELETE
  USING (auth.uid() = user_id);

-- Rider reports: no direct client inserts (API uses service role)
-- Read access for users to see their own reports
CREATE POLICY "Users can view own reports"
  ON rider_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Incidents: public read
CREATE POLICY "Incidents are publicly readable"
  ON incidents FOR SELECT
  TO authenticated, anon
  USING (true);

-- No direct incident updates from clients (service role only)

-- Operator broadcasts: public read, operator/admin insert/update
CREATE POLICY "Broadcasts are publicly readable"
  ON operator_broadcasts FOR SELECT
  TO authenticated, anon
  USING (true);

-- Operator insert/update handled via service role in API
-- This policy allows operators to insert if we check role in app
CREATE POLICY "Operators can insert broadcasts"
  ON operator_broadcasts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('operator', 'admin')
    )
  );

CREATE POLICY "Operators can update broadcasts"
  ON operator_broadcasts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('operator', 'admin')
    )
  );

-- Alerts: users can read own alerts
CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts (mark read)"
  ON alerts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No direct client alert inserts (service role only)
