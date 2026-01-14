// TransitPulse Type Definitions

export type ReportType =
  | 'DELAY'
  | 'CROWDING_LOW'
  | 'CROWDING_MED'
  | 'CROWDING_HIGH'
  | 'ELEVATOR_OUT'
  | 'POLICE_ACTIVITY'
  | 'PLATFORM_CHANGE'
  | 'VEHICLE_ISSUE'
  | 'SUSPENSION';

export type IncidentStatus = 'UNVERIFIED' | 'VERIFIED' | 'HANDLED' | 'DISMISSED';

export type Confidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type BroadcastCategory =
  | 'SERVICE_ALERT'
  | 'DELAY'
  | 'SUSPENSION'
  | 'DETOUR'
  | 'PLANNED_WORK'
  | 'ELEVATOR_ESCALATOR'
  | 'GENERAL';

export type BroadcastStatus = 'ACTIVE' | 'RESOLVED' | 'EXPIRED';

export type UserRole = 'rider' | 'operator' | 'admin';

export type SubscriptionPlan = 'free' | 'plus' | 'pro';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'inactive';

export interface Agency {
  id: string;
  name: string;
  short_name: string | null;
  timezone: string;
  created_at: string;
}

export interface Route {
  id: string;
  agency_id: string;
  route_short_name: string;
  route_long_name: string | null;
  route_type: string;
  route_color: string | null;
  created_at: string;
}

export interface Stop {
  id: string;
  agency_id: string;
  stop_name: string;
  stop_code: string | null;
  parent_station_id: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface RouteStop {
  id: string;
  route_id: string;
  stop_id: string;
  direction_id: number;
  stop_sequence: number;
  stop?: Stop;
}

export interface Profile {
  user_id: string;
  email: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
}

export interface Commute {
  id: string;
  user_id: string;
  name: string;
  agency_id: string;
  route_id: string;
  direction_id: number;
  stop_id: string;
  days_of_week: number[];
  start_time: string | null;
  end_time: string | null;
  categories: string[];
  created_at: string;
  updated_at: string;
  route?: Route;
  stop?: Stop;
}

export interface RiderReport {
  id: string;
  created_at: string;
  agency_id: string;
  route_id: string;
  direction_id: number;
  stop_id: string;
  type: ReportType;
  severity: number;
  user_id: string | null;
  anon_id: string | null;
  source: string;
  expires_at: string;
  details: string | null;
}

export interface Incident {
  id: string;
  created_at: string;
  updated_at: string;
  agency_id: string;
  route_id: string;
  direction_id: number;
  stop_id: string;
  type: ReportType;
  status: IncidentStatus;
  score: number;
  confidence: Confidence;
  confirmations_count: number;
  last_report_at: string;
  report_ids: string[];
  route?: Route;
  stop?: Stop;
}

export interface OperatorBroadcast {
  id: string;
  created_at: string;
  agency_id: string;
  route_id: string | null;
  stop_id: string | null;
  category: BroadcastCategory;
  title: string;
  message: string;
  status: BroadcastStatus;
  starts_at: string;
  ends_at: string | null;
  created_by: string | null;
  route?: Route;
  stop?: Stop;
}

export interface Alert {
  id: string;
  created_at: string;
  user_id: string;
  commute_id: string | null;
  incident_id: string | null;
  broadcast_id: string | null;
  title: string;
  body: string | null;
  read_at: string | null;
}

export interface Entitlements {
  plan: SubscriptionPlan;
  commutes_limit: number;
  categories_limited: boolean;
  early_warning: boolean;
  confidence_breakdown: boolean;
  reliability_history: boolean;
}

export interface LocalStorageData {
  anon_id: string;
  anon_commutes: AnonCommute[];
  anon_alert_prefs: AlertPrefs;
  anon_reports: AnonReport[];
  meaningful_action_done: boolean;
}

export interface AnonCommute {
  id: string;
  name: string;
  agency_id: string;
  route_id: string;
  direction_id: number;
  stop_id: string;
  categories: string[];
}

export interface AlertPrefs {
  enabled: boolean;
  categories: string[];
}

export interface AnonReport {
  id: string;
  created_at: string;
  type: ReportType;
  route_id: string;
  stop_id: string;
}

// Report type labels and icons
export const REPORT_TYPE_INFO: Record<
  ReportType,
  { label: string; icon: string; description: string; color: string }
> = {
  DELAY: {
    label: 'Delay',
    icon: '⏱️',
    description: 'Train/bus is delayed',
    color: 'bg-yellow-500',
  },
  CROWDING_LOW: {
    label: 'Low Crowding',
    icon: '👤',
    description: 'Plenty of space',
    color: 'bg-green-500',
  },
  CROWDING_MED: {
    label: 'Medium Crowding',
    icon: '👥',
    description: 'Some crowding',
    color: 'bg-yellow-500',
  },
  CROWDING_HIGH: {
    label: 'High Crowding',
    icon: '👥',
    description: 'Very crowded',
    color: 'bg-red-500',
  },
  ELEVATOR_OUT: {
    label: 'Elevator Out',
    icon: '🛗',
    description: 'Elevator not working',
    color: 'bg-orange-500',
  },
  POLICE_ACTIVITY: {
    label: 'Police Activity',
    icon: '🚔',
    description: 'Police presence',
    color: 'bg-blue-500',
  },
  PLATFORM_CHANGE: {
    label: 'Platform Change',
    icon: '🔄',
    description: 'Platform has changed',
    color: 'bg-purple-500',
  },
  VEHICLE_ISSUE: {
    label: 'Vehicle Issue',
    icon: '🚇',
    description: 'Problem with vehicle',
    color: 'bg-orange-500',
  },
  SUSPENSION: {
    label: 'Suspension',
    icon: '⛔',
    description: 'Service suspended',
    color: 'bg-red-600',
  },
};

export const BROADCAST_CATEGORY_INFO: Record<
  BroadcastCategory,
  { label: string; color: string }
> = {
  SERVICE_ALERT: { label: 'Service Alert', color: 'bg-red-500' },
  DELAY: { label: 'Delay', color: 'bg-yellow-500' },
  SUSPENSION: { label: 'Suspension', color: 'bg-red-600' },
  DETOUR: { label: 'Detour', color: 'bg-orange-500' },
  PLANNED_WORK: { label: 'Planned Work', color: 'bg-blue-500' },
  ELEVATOR_ESCALATOR: { label: 'Elevator/Escalator', color: 'bg-purple-500' },
  GENERAL: { label: 'General', color: 'bg-gray-500' },
};

// Free tier allowed categories (major disruptions only)
export const FREE_TIER_CATEGORIES: ReportType[] = [
  'DELAY',
  'SUSPENSION',
  'POLICE_ACTIVITY',
];

export const ALL_CATEGORIES: ReportType[] = [
  'DELAY',
  'CROWDING_LOW',
  'CROWDING_MED',
  'CROWDING_HIGH',
  'ELEVATOR_OUT',
  'POLICE_ACTIVITY',
  'PLATFORM_CHANGE',
  'VEHICLE_ISSUE',
  'SUSPENSION',
];
