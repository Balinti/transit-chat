-- TransitPulse Database Schema
-- Run this first before rls.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'rider' CHECK (role IN ('rider', 'operator', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agencies table (transit agencies)
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  route_short_name TEXT NOT NULL,
  route_long_name TEXT,
  route_type TEXT DEFAULT 'rail',
  route_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stops table
CREATE TABLE IF NOT EXISTS stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  stop_name TEXT NOT NULL,
  stop_code TEXT,
  parent_station_id UUID REFERENCES stops(id),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Route stops (many-to-many with direction)
CREATE TABLE IF NOT EXISTS route_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
  direction_id INTEGER NOT NULL CHECK (direction_id IN (0, 1)),
  stop_sequence INTEGER NOT NULL,
  UNIQUE(route_id, stop_id, direction_id)
);

-- Subscriptions table (Stripe)
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'plus', 'pro')),
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'inactive')),
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commutes table (saved user commutes)
CREATE TABLE IF NOT EXISTS commutes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  route_id UUID NOT NULL REFERENCES routes(id),
  direction_id INTEGER NOT NULL CHECK (direction_id IN (0, 1)),
  stop_id UUID NOT NULL REFERENCES stops(id),
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}',
  start_time TIME,
  end_time TIME,
  categories JSONB DEFAULT '["DELAY", "SUSPENSION"]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rider reports table
CREATE TABLE IF NOT EXISTS rider_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  route_id UUID NOT NULL REFERENCES routes(id),
  direction_id INTEGER NOT NULL CHECK (direction_id IN (0, 1)),
  stop_id UUID NOT NULL REFERENCES stops(id),
  type TEXT NOT NULL CHECK (type IN (
    'DELAY', 'CROWDING_LOW', 'CROWDING_MED', 'CROWDING_HIGH',
    'ELEVATOR_OUT', 'POLICE_ACTIVITY', 'PLATFORM_CHANGE',
    'VEHICLE_ISSUE', 'SUSPENSION'
  )),
  severity INTEGER DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_id TEXT,
  source TEXT DEFAULT 'app' CHECK (source IN ('app', 'web', 'api')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 hours'),
  details TEXT
);

-- Incidents table (aggregated from reports)
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  route_id UUID NOT NULL REFERENCES routes(id),
  direction_id INTEGER NOT NULL CHECK (direction_id IN (0, 1)),
  stop_id UUID NOT NULL REFERENCES stops(id),
  type TEXT NOT NULL CHECK (type IN (
    'DELAY', 'CROWDING_LOW', 'CROWDING_MED', 'CROWDING_HIGH',
    'ELEVATOR_OUT', 'POLICE_ACTIVITY', 'PLATFORM_CHANGE',
    'VEHICLE_ISSUE', 'SUSPENSION'
  )),
  status TEXT DEFAULT 'UNVERIFIED' CHECK (status IN ('UNVERIFIED', 'VERIFIED', 'HANDLED', 'DISMISSED')),
  score DECIMAL(5, 2) DEFAULT 0,
  confidence TEXT DEFAULT 'LOW' CHECK (confidence IN ('LOW', 'MEDIUM', 'HIGH')),
  confirmations_count INTEGER DEFAULT 1,
  last_report_at TIMESTAMPTZ DEFAULT NOW(),
  report_ids UUID[] DEFAULT '{}'
);

-- Index for incident lookup/aggregation
CREATE INDEX IF NOT EXISTS idx_incidents_lookup ON incidents (agency_id, route_id, direction_id, stop_id, type, last_report_at);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents (status, updated_at);

-- Index for reports lookup
CREATE INDEX IF NOT EXISTS idx_reports_lookup ON rider_reports (agency_id, route_id, direction_id, stop_id, type, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_user ON rider_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_anon ON rider_reports (anon_id);

-- Operator broadcasts table
CREATE TABLE IF NOT EXISTS operator_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  route_id UUID REFERENCES routes(id),
  stop_id UUID REFERENCES stops(id),
  category TEXT NOT NULL CHECK (category IN (
    'SERVICE_ALERT', 'DELAY', 'SUSPENSION', 'DETOUR',
    'PLANNED_WORK', 'ELEVATOR_ESCALATOR', 'GENERAL'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'EXPIRED')),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_active ON operator_broadcasts (agency_id, status, starts_at, ends_at);

-- Alerts table (user notifications)
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commute_id UUID REFERENCES commutes(id) ON DELETE SET NULL,
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  broadcast_id UUID REFERENCES operator_broadcasts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON alerts (user_id, read_at) WHERE read_at IS NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commutes_updated_at
  BEFORE UPDATE ON commutes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
