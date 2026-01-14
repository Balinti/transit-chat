import { ReportType, Confidence, Incident } from '@/types';
import { getServiceSupabase } from './supabase';

// Time windows for aggregation (in minutes)
const AGGREGATION_WINDOWS: Record<string, number> = {
  CROWDING_LOW: 15,
  CROWDING_MED: 15,
  CROWDING_HIGH: 15,
  DEFAULT: 30,
};

function getTimeWindow(type: ReportType): number {
  return AGGREGATION_WINDOWS[type] || AGGREGATION_WINDOWS.DEFAULT;
}

// Calculate confidence level based on score
function calculateConfidence(score: number): Confidence {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

// Calculate score based on confirmations, recency, and account age
export function calculateScore(
  confirmations: number,
  lastReportAt: Date,
  hasLoggedInReports: boolean
): { score: number; confidence: Confidence } {
  // Base score from confirmations (max 50 points)
  const confirmationScore = Math.min(confirmations * 15, 50);

  // Recency decay (max 40 points, decays over time)
  const minutesAgo = (Date.now() - lastReportAt.getTime()) / (1000 * 60);
  const recencyScore = Math.max(0, 40 - minutesAgo * 0.5);

  // Reputation bonus for logged-in users (max 10 points)
  const reputationBonus = hasLoggedInReports ? 10 : 0;

  const totalScore = Math.min(
    100,
    confirmationScore + recencyScore + reputationBonus
  );

  return {
    score: Math.round(totalScore * 100) / 100,
    confidence: calculateConfidence(totalScore),
  };
}

// Find or create incident for a report
export async function aggregateReport(report: {
  id: string;
  agency_id: string;
  route_id: string;
  direction_id: number;
  stop_id: string;
  type: ReportType;
  user_id: string | null;
  anon_id: string | null;
  created_at: string;
}): Promise<Incident | null> {
  const supabase = getServiceSupabase();
  const windowMinutes = getTimeWindow(report.type);
  const windowStart = new Date(
    Date.now() - windowMinutes * 60 * 1000
  ).toISOString();

  // Find existing incident within time window
  const { data: existingIncidents, error: findError } = await supabase
    .from('incidents')
    .select('*')
    .eq('agency_id', report.agency_id)
    .eq('route_id', report.route_id)
    .eq('direction_id', report.direction_id)
    .eq('stop_id', report.stop_id)
    .eq('type', report.type)
    .gte('last_report_at', windowStart)
    .in('status', ['UNVERIFIED', 'VERIFIED'])
    .order('last_report_at', { ascending: false })
    .limit(1);

  if (findError) {
    console.error('Error finding incident:', findError);
    return null;
  }

  // Count unique reporters within window
  const { data: reports, error: countError } = await supabase
    .from('rider_reports')
    .select('user_id, anon_id')
    .eq('agency_id', report.agency_id)
    .eq('route_id', report.route_id)
    .eq('direction_id', report.direction_id)
    .eq('stop_id', report.stop_id)
    .eq('type', report.type)
    .gte('created_at', windowStart);

  if (countError) {
    console.error('Error counting reports:', countError);
    return null;
  }

  // Get unique reporters
  const reporters = new Set<string>();
  let hasLoggedIn = false;
  reports?.forEach((r) => {
    if (r.user_id) {
      reporters.add(`user:${r.user_id}`);
      hasLoggedIn = true;
    } else if (r.anon_id) {
      reporters.add(`anon:${r.anon_id}`);
    }
  });

  const confirmations = reporters.size;
  const { score, confidence } = calculateScore(
    confirmations,
    new Date(report.created_at),
    hasLoggedIn
  );

  if (existingIncidents && existingIncidents.length > 0) {
    // Update existing incident
    const incident = existingIncidents[0];
    const reportIds = [...(incident.report_ids || []), report.id];

    const { data: updated, error: updateError } = await supabase
      .from('incidents')
      .update({
        confirmations_count: confirmations,
        last_report_at: report.created_at,
        score,
        confidence,
        report_ids: reportIds,
      })
      .eq('id', incident.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating incident:', updateError);
      return null;
    }

    return updated;
  } else {
    // Create new incident
    const { data: newIncident, error: createError } = await supabase
      .from('incidents')
      .insert({
        agency_id: report.agency_id,
        route_id: report.route_id,
        direction_id: report.direction_id,
        stop_id: report.stop_id,
        type: report.type,
        status: 'UNVERIFIED',
        score,
        confidence,
        confirmations_count: confirmations,
        last_report_at: report.created_at,
        report_ids: [report.id],
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating incident:', createError);
      return null;
    }

    return newIncident;
  }
}
